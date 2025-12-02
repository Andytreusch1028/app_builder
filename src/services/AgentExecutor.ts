/**
 * Agent Executor - Main agent loop for executing plans
 */

import { PlannerService } from './PlannerService.js';
import { ToolRegistry } from './ToolRegistry.js';
import { ProviderOrchestrator } from './ProviderOrchestrator.js';
import { webSocketManager } from './WebSocketManager.js';
import { createBuildProgressMessage } from '../types/websocket.types.js';
import {
  AgentContext,
  AgentExecutionResult,
  ExecutionPlan,
  TaskStep
} from '../types/agent.types.js';

export interface AgentExecutorConfig {
  maxIterations?: number;
  maxRetries?: number;
  workspaceRoot?: string;
  orchestrator?: ProviderOrchestrator;
  projectId?: string; // For WebSocket broadcasting
}

export class AgentExecutor {
  private maxIterations: number;
  private maxRetries: number;
  private workspaceRoot: string;
  private orchestrator?: ProviderOrchestrator;
  private projectId?: string;

  constructor(
    private planner: PlannerService,
    private toolRegistry: ToolRegistry,
    config: AgentExecutorConfig = {}
  ) {
    this.maxIterations = config.maxIterations || 10;
    this.maxRetries = config.maxRetries || 3;
    this.workspaceRoot = config.workspaceRoot || process.cwd();
    this.orchestrator = config.orchestrator;
    this.projectId = config.projectId;
  }

  /**
   * Execute a user task
   */
  async execute(userTask: string, userId?: string): Promise<AgentExecutionResult> {
    const startTime = Date.now();
    const taskId = this.generateTaskId();

    console.log('\n🎯 AgentExecutor.execute() called');
    console.log('   - Task ID:', taskId);
    console.log('   - User ID:', userId);
    console.log('   - Task preview:', userTask.substring(0, 150) + '...');

    // Track Agent Executor technology usage
    if (this.orchestrator) {
      this.orchestrator.trackTechnology('AGENT_EXECUTOR');
    }

    // Create execution context
    const context: AgentContext = {
      taskId,
      userId,
      workspaceRoot: this.workspaceRoot,
      maxIterations: this.maxIterations,
      currentIteration: 0,
      state: {}
    };

    try {
      // Broadcast: Task started
      this.broadcastProgress('planning', 'started', 'Analyzing task and generating plan...');

      console.log('\n📋 Generating execution plan...');
      // Generate execution plan
      const plan = await this.planner.generatePlan(userTask);

      console.log('✅ Plan generated:');
      console.log('   - Steps:', plan.steps.length);
      console.log('   - Step details:');
      plan.steps.forEach((step, i) => {
        console.log(`     ${i + 1}. ${step.description} (tool: ${step.tool})`);
      });

      // Broadcast: Plan generated
      this.broadcastProgress('planning', 'completed', `Generated plan with ${plan.steps.length} steps`);

      // Broadcast: Execution started
      this.broadcastProgress('execution', 'started', 'Executing plan...');

      console.log('\n⚙️  Executing plan...');
      // Execute the plan
      const { completedSteps, failedSteps } = await this.executePlan(plan, context);

      console.log('\n📊 Execution results:');
      console.log('   - Completed steps:', completedSteps.length);
      console.log('   - Failed steps:', failedSteps.length);

      if (completedSteps.length > 0) {
        console.log('   - Completed step details:');
        completedSteps.forEach((step, i) => {
          console.log(`     ${i + 1}. ${step.description}`);
          console.log(`        Tool: ${step.tool}`);
          console.log(`        Success: ${step.result?.success}`);
          console.log(`        Output preview: ${step.result?.output?.substring(0, 100) || 'none'}`);
        });
      }

      if (failedSteps.length > 0) {
        console.log('   - Failed step details:');
        failedSteps.forEach((step, i) => {
          console.log(`     ${i + 1}. ${step.description}`);
          console.log(`        Error: ${step.result?.error}`);
        });
      }

      // Determine success
      const success = failedSteps.length === 0;

      // Collect tools used
      const toolsUsed = [...new Set(completedSteps.map(s => s.tool))];

      // Broadcast: Collecting artifacts
      this.broadcastProgress('artifacts', 'in_progress', 'Collecting created files...');

      // Collect artifacts (created files)
      console.log('\n📦 Collecting artifacts from', completedSteps.length, 'steps');
      const artifacts = await this.collectArtifacts(completedSteps);
      console.log('✅ Collected', artifacts.length, 'artifacts');
      if (artifacts.length > 0) {
        console.log('   - Artifact details:');
        artifacts.forEach((a, i) => {
          console.log(`     ${i + 1}. ${a.name} (${a.path})`);
        });
      }

      // Broadcast: Task completed
      this.broadcastProgress(
        'completion',
        success ? 'completed' : 'failed',
        success ? `Task completed successfully with ${artifacts.length} files created` : `Task failed with ${failedSteps.length} errors`
      );

      const result = {
        success,
        plan,
        completedSteps,
        failedSteps,
        output: success ? this.aggregateOutput(completedSteps) : undefined,
        error: failedSteps.length > 0 ? this.aggregateErrors(failedSteps) : undefined,
        artifacts,
        metadata: {
          totalTime: Date.now() - startTime,
          iterations: context.currentIteration,
          toolsUsed
        }
      };

      console.log('🔍 Final result has artifacts?', !!result.artifacts);
      console.log('🔍 Final result artifacts length:', result.artifacts?.length);

      return result;

    } catch (error) {
      return {
        success: false,
        plan: { steps: [], dependencies: new Map() },
        completedSteps: [],
        failedSteps: [],
        error: error instanceof Error ? error.message : String(error),
        metadata: {
          totalTime: Date.now() - startTime,
          iterations: context.currentIteration,
          toolsUsed: []
        }
      };
    }
  }

  /**
   * Execute an execution plan
   */
  private async executePlan(
    plan: ExecutionPlan, 
    context: AgentContext
  ): Promise<{ completedSteps: TaskStep[], failedSteps: TaskStep[] }> {
    const completedSteps: TaskStep[] = [];
    const failedSteps: TaskStep[] = [];
    const stepResults = new Map<string, any>();

    // Execute steps in dependency order
    const executionOrder = this.getExecutionOrder(plan);

    for (const stepId of executionOrder) {
      context.currentIteration++;

      if (context.currentIteration > context.maxIterations) {
        throw new Error('Maximum iterations exceeded');
      }

      const step = plan.steps.find(s => s.id === stepId)!;

      console.log(`\n  📌 Executing step: ${step.id}`);
      console.log(`     Description: ${step.description}`);
      console.log(`     Tool: ${step.tool}`);
      console.log(`     Dependencies: ${step.dependencies?.join(', ') || 'none'}`);

      // Check if dependencies are satisfied
      const depsCompleted = this.checkDependencies(step, completedSteps);
      if (!depsCompleted) {
        console.log(`     ❌ Dependencies not satisfied`);
        const completedIds = completedSteps.map(s => s.id);
        console.log(`        Completed steps: ${completedIds.join(', ')}`);
        console.log(`        Required: ${step.dependencies?.join(', ')}`);

        step.status = 'failed';
        step.result = {
          success: false,
          error: `Dependencies not satisfied. Required: ${step.dependencies?.join(', ')}, Completed: ${completedIds.join(', ')}`
        };
        failedSteps.push(step);
        continue;
      }

      console.log(`     ✅ Dependencies satisfied`);

      // Execute step with retries
      const result = await this.executeStepWithRetry(step, stepResults);
      step.result = result;

      if (result.success) {
        step.status = 'completed';
        completedSteps.push(step);
        stepResults.set(step.id, result.output);
      } else {
        step.status = 'failed';
        failedSteps.push(step);
        
        // Stop execution on critical failure
        break;
      }
    }

    return { completedSteps, failedSteps };
  }

  /**
   * Execute a step with retry logic
   */
  private async executeStepWithRetry(
    step: TaskStep, 
    stepResults: Map<string, any>
  ): Promise<any> {
    let lastError: string | undefined;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        step.status = 'running';

        // Resolve parameter references to previous step results
        const resolvedParams = this.resolveParameters(step.parameters, stepResults);

        // Execute the tool
        const result = await this.toolRegistry.execute(step.tool, resolvedParams);

        if (result.success) {
          return result;
        }

        lastError = result.error;
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
      }
    }

    return {
      success: false,
      error: `Failed after ${this.maxRetries} attempts: ${lastError}`
    };
  }

  /**
   * Get execution order based on dependencies (topological sort)
   */
  private getExecutionOrder(plan: ExecutionPlan): string[] {
    const order: string[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (stepId: string) => {
      if (visited.has(stepId)) return;
      if (visiting.has(stepId)) {
        throw new Error('Circular dependency detected');
      }

      visiting.add(stepId);

      const deps = plan.dependencies.get(stepId) || [];
      for (const depId of deps) {
        visit(depId);
      }

      visiting.delete(stepId);
      visited.add(stepId);
      order.push(stepId);
    };

    for (const step of plan.steps) {
      visit(step.id);
    }

    return order;
  }

  /**
   * Check if step dependencies are satisfied
   */
  private checkDependencies(step: TaskStep, completedSteps: TaskStep[]): boolean {
    if (!step.dependencies || step.dependencies.length === 0) {
      return true;
    }

    const completedIds = new Set(completedSteps.map(s => s.id));
    return step.dependencies.every(depId => completedIds.has(depId));
  }

  /**
   * Resolve parameter references to previous step results
   */
  private resolveParameters(
    parameters: Record<string, any>,
    stepResults: Map<string, any>
  ): Record<string, any> {
    const resolved: Record<string, any> = {};

    for (const [key, value] of Object.entries(parameters)) {
      if (typeof value === 'string' && value.startsWith('$')) {
        // Reference to previous step result: $step_1
        const stepId = value.substring(1);
        resolved[key] = stepResults.get(stepId);
      } else {
        resolved[key] = value;
      }
    }

    return resolved;
  }

  /**
   * Aggregate output from completed steps
   */
  private aggregateOutput(completedSteps: TaskStep[]): any {
    if (completedSteps.length === 0) {
      return null;
    }

    if (completedSteps.length === 1) {
      return completedSteps[0].result?.output;
    }

    return completedSteps.map(step => ({
      step: step.id,
      description: step.description,
      output: step.result?.output
    }));
  }

  /**
   * Aggregate errors from failed steps
   */
  private aggregateErrors(failedSteps: TaskStep[]): string {
    return failedSteps
      .map(step => `${step.id}: ${step.result?.error || 'Unknown error'}`)
      .join('; ');
  }

  /**
   * Collect artifacts (created files) from completed steps
   */
  private async collectArtifacts(completedSteps: TaskStep[]): Promise<any[]> {
    console.log('🔍 collectArtifacts called');
    console.log('🔍 Total steps:', completedSteps.length);
    console.log('🔍 Steps:', JSON.stringify(completedSteps.map(s => ({
      id: s.id,
      tool: s.tool,
      success: s.result?.success,
      params: s.parameters
    })), null, 2));

    const artifacts: any[] = [];
    const fs = await import('fs/promises');
    const path = await import('path');

    for (const step of completedSteps) {
      console.log(`🔍 Checking step ${step.id}, tool: ${step.tool}`);

      // Check if this step created a file (support multiple tool names)
      const isFileWriteTool = ['file_write', 'write_file', 'create_file'].includes(step.tool);
      console.log(`🔍 Is file write tool? ${isFileWriteTool}`);

      if (isFileWriteTool && step.result?.success) {
        console.log('🔍 Step is a successful file write!');
        try {
          const filePath = step.parameters?.path;
          console.log('🔍 File path:', filePath);

          if (filePath) {
            let content: string;

            // Try to read from disk first
            try {
              const fullPath = path.resolve(this.workspaceRoot, filePath);
              console.log('🔍 Trying to read from:', fullPath);
              content = await fs.readFile(fullPath, 'utf-8');
              console.log('🔍 Read from disk, length:', content.length);
            } catch (readError) {
              // If file doesn't exist on disk, use content from parameters
              // This handles cases where the tool executor is mocked
              console.log('🔍 File not on disk, using parameters');
              content = step.parameters?.content || '';
              console.log('🔍 Content from params, length:', content.length);
            }

            const artifact = {
              path: filePath,
              name: path.basename(filePath),
              content,
              type: this.getFileType(filePath),
              createdBy: step.id
            };

            console.log('🔍 Created artifact:', artifact.name);
            artifacts.push(artifact);
          }
        } catch (error) {
          console.error('🔍 Error collecting artifact:', error);
        }
      }
    }

    console.log('🔍 Total artifacts collected:', artifacts.length);
    return artifacts;
  }

  /**
   * Determine file type from extension
   */
  private getFileType(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase();
    const typeMap: Record<string, string> = {
      'html': 'html',
      'htm': 'html',
      'js': 'javascript',
      'ts': 'typescript',
      'json': 'json',
      'py': 'python',
      'txt': 'text',
      'md': 'markdown',
      'css': 'css',
      'svg': 'svg'
    };
    return typeMap[ext || ''] || 'text';
  }

  /**
   * Generate a unique task ID
   */
  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Broadcast build progress via WebSocket
   */
  private broadcastProgress(
    step: string,
    status: 'started' | 'in_progress' | 'completed' | 'failed',
    message: string,
    progress?: number
  ): void {
    if (!this.projectId) return;

    const wsMessage = createBuildProgressMessage(
      this.projectId,
      step,
      status,
      message,
      progress
    );

    webSocketManager.broadcastToProject(this.projectId, wsMessage);
  }
}
