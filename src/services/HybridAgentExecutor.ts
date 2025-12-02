/**
 * Hybrid Agent Executor - Two-brain architecture
 * 
 * Strategic Brain (Cloud): Planning and complex reasoning
 * Execution Brain (Local): Fast execution of simple tasks
 * 
 * Workflow:
 * 1. Cloud plans the task
 * 2. Local executes the plan
 * 3. Validate quality
 * 4. Escalate to cloud if needed
 */

import { PlannerService } from './PlannerService.js';
import { LocalExecutorService } from './LocalExecutorService.js';
import { EscalationEngine } from './EscalationEngine.js';
import { QualityValidator } from './QualityValidator.js';
import { AgentExecutor } from './AgentExecutor.js';
import { AgentExecutionResult } from '../types/agent.types.js';
import { analyzeTask } from '../config/workflow-config.js';

export interface HybridExecutionResult extends AgentExecutionResult {
  executionMode: 'local' | 'cloud' | 'hybrid';
  escalated: boolean;
  escalationReason?: string;
  localExecutionTime?: number;
  cloudExecutionTime?: number;
  qualityScore?: number;
}

export class HybridAgentExecutor {
  private escalationEngine: EscalationEngine;
  private qualityValidator: QualityValidator;

  constructor(
    private planner: PlannerService,
    private localExecutor: LocalExecutorService,
    private cloudExecutor: AgentExecutor
  ) {
    this.escalationEngine = new EscalationEngine();
    this.qualityValidator = new QualityValidator();
  }

  /**
   * Execute a task using hybrid two-brain system
   */
  async execute(userTask: string, userId?: string): Promise<HybridExecutionResult> {
    const startTime = Date.now();
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    console.log('🧠 Hybrid Agent Executor: Starting two-brain execution');
    console.log(`   Task: ${userTask}`);

    try {
      // PHASE 1: Strategic Brain - Cloud Planning
      console.log('🌩️  Strategic Brain: Planning with cloud...');
      const plan = await this.planner.generatePlan(userTask);
      
      // Analyze task complexity
      const taskAnalysis = analyzeTask(userTask);
      console.log(`📊 Task Complexity: ${taskAnalysis.complexity}`);

      // PHASE 2: Decide execution mode
      const decision = this.escalationEngine.shouldEscalate(
        taskId,
        taskAnalysis.complexity
      );

      // If should escalate immediately (complex task), use cloud
      if (decision.shouldEscalate) {
        console.log(`⬆️  Escalating to cloud: ${decision.reason}`);
        return await this.executeWithCloud(userTask, userId, taskId, startTime);
      }

      // PHASE 3: Execution Brain - Local Execution
      console.log('⚡ Execution Brain: Executing with local model...');
      const localResult = await this.localExecutor.executePlan(plan);

      // Record attempt
      this.escalationEngine.recordAttempt(taskId, {
        startTime,
        endTime: Date.now(),
        success: localResult.success,
        error: localResult.error
      });

      // PHASE 4: Quality Validation
      if (localResult.success) {
        console.log('✅ Local execution successful, validating quality...');
        
        // Validate quality (simplified - just check if we have results)
        const qualityScore = localResult.result ? 0.8 : 0.5;
        
        const validationResult = {
          isValid: qualityScore >= 0.5,
          score: {
            overall: qualityScore,
            syntax: 0.8,
            completeness: 0.8,
            errors: [],
            warnings: [],
            suggestions: []
          },
          shouldEscalate: qualityScore < 0.7,
          reason: qualityScore < 0.7 ? 'Quality score below threshold' : undefined
        };

        // PHASE 5: Escalation Decision
        const escalationDecision = this.escalationEngine.shouldEscalate(
          taskId,
          taskAnalysis.complexity,
          validationResult,
          localResult.executionTime
        );

        if (escalationDecision.shouldEscalate) {
          console.log(`⬆️  Escalating to cloud: ${escalationDecision.reason}`);
          this.escalationEngine.recordEscalation(taskId, true);
          return await this.executeWithCloud(userTask, userId, taskId, startTime, localResult.executionTime);
        }

        // Success with local execution
        console.log('✅ Local execution completed successfully');
        return this.createSuccessResult(
          plan,
          localResult,
          'local',
          false,
          startTime,
          qualityScore
        );
      }

      // Local execution failed, escalate
      console.log(`❌ Local execution failed: ${localResult.error}`);
      this.escalationEngine.recordEscalation(taskId, true);
      return await this.executeWithCloud(userTask, userId, taskId, startTime, localResult.executionTime);

    } catch (error) {
      console.error('❌ Hybrid execution error:', error);
      
      // Fallback to cloud on any error
      return await this.executeWithCloud(userTask, userId, taskId, startTime);
    }
  }

  /**
   * Execute with cloud (fallback)
   */
  private async executeWithCloud(
    userTask: string,
    userId: string | undefined,
    taskId: string,
    startTime: number,
    localExecutionTime?: number
  ): Promise<HybridExecutionResult> {
    const cloudStartTime = Date.now();
    
    const result = await this.cloudExecutor.execute(userTask, userId);
    
    const cloudExecutionTime = Date.now() - cloudStartTime;

    return {
      ...result,
      executionMode: localExecutionTime ? 'hybrid' : 'cloud',
      escalated: localExecutionTime !== undefined,
      escalationReason: localExecutionTime ? 'Local execution failed or low quality' : 'Complex task',
      localExecutionTime,
      cloudExecutionTime,
      metadata: {
        ...result.metadata,
        totalTime: Date.now() - startTime
      }
    };
  }

  /**
   * Create success result
   */
  private createSuccessResult(
    plan: any,
    localResult: any,
    mode: 'local' | 'cloud' | 'hybrid',
    escalated: boolean,
    startTime: number,
    qualityScore: number
  ): HybridExecutionResult {
    return {
      success: true,
      plan,
      completedSteps: plan.steps,
      failedSteps: [],
      executionMode: mode,
      escalated,
      localExecutionTime: localResult.executionTime,
      qualityScore,
      metadata: {
        totalTime: Date.now() - startTime,
        iterations: plan.steps.length,
        toolsUsed: plan.steps.map((s: any) => s.tool)
      }
    };
  }

  /**
   * Get escalation metrics
   */
  getMetrics() {
    return this.escalationEngine.getMetrics();
  }
}

