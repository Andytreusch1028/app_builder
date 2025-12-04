/**
 * Planner Service - Decompose tasks and generate execution plans using cloud AI
 */

import { ICloudProvider } from '../providers/ICloudProvider.js';
import { ToolRegistry } from './ToolRegistry.js';
import { ExecutionPlan, TaskStep } from '../types/agent.types.js';
import { ProviderOrchestrator } from './ProviderOrchestrator.js';
import { analyzeTask } from '../config/workflow-config.js';

export class PlannerService {
  private orchestrator?: ProviderOrchestrator;
  private planningProvider?: ICloudProvider;
  private adaptiveProvider?: any; // AdaptiveProviderService

  constructor(
    private provider: ICloudProvider,
    private toolRegistry: ToolRegistry,
    orchestrator?: ProviderOrchestrator,
    planningProvider?: ICloudProvider,
    adaptiveProvider?: any
  ) {
    this.orchestrator = orchestrator;
    this.planningProvider = planningProvider;
    this.adaptiveProvider = adaptiveProvider;
  }

  /**
   * Generate an execution plan from a user task
   */
  async generatePlan(userTask: string): Promise<ExecutionPlan> {
    console.log('\n🧠 PlannerService.generatePlan() called');

    // Track Task Planner technology usage
    if (this.orchestrator) {
      this.orchestrator.trackTechnology('TASK_PLANNER');
    }

    // Analyze task complexity
    const taskAnalysis = analyzeTask(userTask);
    console.log(`📊 Task Analysis: ${taskAnalysis.complexity} complexity, type: ${taskAnalysis.type}`);
    console.log(`   Reasoning: ${taskAnalysis.reasoning}`);

    // Get available tools
    const tools = this.toolRegistry.listTools();
    console.log(`🔧 Available tools: ${tools.map(t => t.name).join(', ')}`);

    const toolDescriptions = tools.map(t =>
      `- ${t.name}: ${t.description}\n  Parameters: ${JSON.stringify(t.parameters, null, 2)}`
    ).join('\n');

    // Create planning prompt
    let prompt = this.createPlanningPrompt(userTask, toolDescriptions);
    console.log('\n📝 Planning prompt created (length:', prompt.length, 'chars)');

    let response;
    let validationPassed = false;
    let attempt = 0;
    const maxAttempts = 3;

    // Use adaptive provider if available for intelligent selection with fallback
    if (this.adaptiveProvider) {
      console.log('🎯 Using adaptive provider selection...');

      while (attempt < maxAttempts && !validationPassed) {
        attempt++;

        try {
          const adaptiveResponse = await this.adaptiveProvider.generateWithAdaptiveSelection(
            prompt,
            'planning', // Task type
            { temperature: 0.3, maxTokens: 2000 },
            false // Don't force cloud yet
          );

          response = adaptiveResponse;

          // Try to parse and validate the plan
          try {
            const testPlan = this.parsePlan(response.text);
            this.validatePlan(testPlan);
            validationPassed = true;

            // Record quality metrics
            this.adaptiveProvider.recordQuality(100, true);
            console.log(`✅ Plan validated successfully on attempt ${attempt}`);
          } catch (validationError) {
            console.log(`⚠️  Plan validation failed on attempt ${attempt}:`, validationError);

            // Record failure
            this.adaptiveProvider.recordQuality(0, false);

            // If not last attempt, try again (adaptive provider will escalate automatically)
            if (attempt < maxAttempts) {
              console.log(`🔄 Retrying with escalated provider...`);
              continue;
            } else {
              throw validationError;
            }
          }
        } catch (error) {
          if (attempt >= maxAttempts) {
            throw error;
          }
        }
      }
    } else {
      // Fallback to original logic if no adaptive provider
      let selectedProvider = this.planningProvider || this.provider;

      if (this.planningProvider) {
        console.log('⚡ Using fast planning provider:', this.planningProvider.name);
      }

      // Use orchestrator if available (but skip for planning to keep it fast)
      if (this.orchestrator && !this.planningProvider) {
        const enhanced = await this.orchestrator.enhancePrompt(prompt, {
          injectContext: true,
          useLetta: false // Planning uses primary provider for speed
        });
        prompt = enhanced.enhanced;
        selectedProvider = enhanced.provider;

        if (enhanced.contextInjected) {
          console.log('✨ Context: Injected personal context into planning prompt');
        }
      }

      // For planning, always use direct generation (no self-improvement) for speed
      console.log('⚡ Using direct generation for planning (optimized for speed)...');
      response = await selectedProvider.generateText(prompt, {
        temperature: 0.3,
        maxTokens: 2000
      });
    }

    console.log('\n✅ LLM response received (length:', response.text?.length || 0, 'chars)');
    console.log('📄 Response preview:', response.text?.substring(0, 300) || 'empty');

    // Parse the plan
    console.log('\n🔍 Parsing plan from response...');
    const plan = this.parsePlan(response.text);
    console.log('✅ Plan parsed successfully');
    console.log('   - Steps:', plan.steps.length);

    // Validate the plan
    console.log('\n✔️  Validating plan...');
    this.validatePlan(plan);
    console.log('✅ Plan validated successfully');

    return plan;
  }

  /**
   * Create the planning prompt
   */
  private createPlanningPrompt(userTask: string, toolDescriptions: string): string {
    return `You MUST return ONLY valid JSON. NO explanations, NO markdown, NO code blocks.

TASK: ${userTask}

TOOLS: ${toolDescriptions}

CRITICAL RULES:
1. File extensions MUST be .html, .css, or .js ONLY
2. NEVER create .py, .java, .cpp, or ANY other file types
3. Entry point MUST be an HTML file
4. Return ONLY the JSON object below, nothing else
5. Dependencies MUST be step IDs (like "step_1"), NOT file names
6. If a step needs a file created by another step, reference that step's ID in dependencies
7. **CRITICAL**: The "content" parameter MUST contain COMPLETE, WORKING code - NOT placeholders or examples!
8. **CRITICAL**: Generate FULL, PRODUCTION-READY code that implements ALL requested features
9. For HTML: Include complete DOCTYPE, head, body, all elements, and proper structure
10. For CSS: Include complete styling for ALL elements (not just "body { margin: 0; }")
11. For JavaScript: Include ALL functions, event handlers, and complete logic
12. Example: For a calculator, include ALL buttons (0-9, +, -, ×, ÷, =, CE), display, and working calculation logic

REQUIRED JSON FORMAT (copy this structure exactly):
{
  "steps": [
    {
      "id": "step_1",
      "description": "Create complete HTML file with full UI structure",
      "tool": "create_file",
      "parameters": {
        "path": "index.html",
        "content": "FULL HTML CODE HERE - NOT <!DOCTYPE html>... - ACTUAL COMPLETE CODE"
      },
      "dependencies": []
    },
    {
      "id": "step_2",
      "description": "Create complete CSS file with full styling",
      "tool": "create_file",
      "parameters": {
        "path": "styles.css",
        "content": "FULL CSS CODE HERE - NOT body { margin: 0; } - ACTUAL COMPLETE STYLES"
      },
      "dependencies": ["step_1"]
    },
    {
      "id": "step_3",
      "description": "Create complete JavaScript file with full functionality",
      "tool": "create_file",
      "parameters": {
        "path": "script.js",
        "content": "FULL JAVASCRIPT CODE HERE - COMPLETE IMPLEMENTATION WITH ALL FUNCTIONS"
      },
      "dependencies": ["step_2"]
    }
  ],
  "estimatedTime": 5
}

IMPORTANT:
- dependencies array contains step IDs, not file names!
- The "content" field MUST contain COMPLETE, WORKING code - NO placeholders like "..." or "// code here"
- Use \\n for newlines in JSON strings
- Escape quotes with \\"
START YOUR RESPONSE WITH { AND END WITH }. NO OTHER TEXT.`;
  }

  /**
   * Parse the AI response into an ExecutionPlan
   */
  private parsePlan(responseText: string): ExecutionPlan {
    try {
      // Extract JSON from response (handle markdown code blocks)
      let jsonText = responseText.trim();

      // Remove markdown code blocks if present
      if (jsonText.startsWith('```')) {
        const lines = jsonText.split('\n');
        jsonText = lines.slice(1, -1).join('\n');
        if (jsonText.startsWith('json')) {
          jsonText = jsonText.substring(4).trim();
        }
      }

      // Clean up common JSON issues from LLMs
      // Fix invalid escape sequences (e.g., \2 -> \\2)
      jsonText = jsonText.replace(/\\([^"\\\/bfnrtu])/g, '\\\\$1');

      // Remove trailing commas before closing braces/brackets
      jsonText = jsonText.replace(/,(\s*[}\]])/g, '$1');

      const parsed = JSON.parse(jsonText);

      // Convert to ExecutionPlan format
      const steps: TaskStep[] = parsed.steps.map((step: any) => ({
        id: step.id,
        description: step.description,
        tool: step.tool,
        parameters: step.parameters || {},
        status: 'pending' as const,
        dependencies: step.dependencies || []
      }));

      // Build dependency map
      const dependencies = new Map<string, string[]>();
      steps.forEach(step => {
        if (step.dependencies && step.dependencies.length > 0) {
          dependencies.set(step.id, step.dependencies);
        }
      });

      return {
        steps,
        dependencies,
        estimatedTime: parsed.estimatedTime || 0
      };

    } catch (error) {
      throw new Error(`Failed to parse plan: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Validate the execution plan
   */
  private validatePlan(plan: ExecutionPlan): void {
    if (!plan.steps || plan.steps.length === 0) {
      throw new Error('Plan must have at least one step');
    }

    // Auto-correct file name dependencies to step IDs
    this.autoCorrectDependencies(plan);

    // Validate each step
    for (const step of plan.steps) {
      // Check if tool exists
      if (!this.toolRegistry.hasTool(step.tool)) {
        throw new Error(`Step ${step.id}: Tool '${step.tool}' not found in registry`);
      }

      // Check dependencies exist
      if (step.dependencies) {
        for (const depId of step.dependencies) {
          const depExists = plan.steps.some(s => s.id === depId);
          if (!depExists) {
            throw new Error(`Step ${step.id}: Dependency '${depId}' not found`);
          }
        }
      }
    }

    // Check for circular dependencies
    this.checkCircularDependencies(plan);
  }

  /**
   * Auto-correct file name dependencies to step IDs
   *
   * LLMs often generate dependencies as file names (e.g., "index.html") instead of step IDs (e.g., "step_1").
   * This method automatically converts file name dependencies to the correct step IDs.
   */
  private autoCorrectDependencies(plan: ExecutionPlan): void {
    // Build a map of file paths to step IDs
    const fileToStepMap = new Map<string, string>();

    for (const step of plan.steps) {
      // Check if this step creates or writes a file
      const isFileWriteTool = ['file_write', 'write_file', 'create_file'].includes(step.tool);

      if (isFileWriteTool && step.parameters?.path) {
        const filePath = step.parameters.path as string;
        fileToStepMap.set(filePath, step.id);

        // Also map just the filename (without directory)
        const fileName = filePath.split('/').pop() || filePath;
        if (fileName !== filePath) {
          fileToStepMap.set(fileName, step.id);
        }
      }
    }

    // Auto-correct dependencies
    let correctionsMade = 0;

    for (const step of plan.steps) {
      if (step.dependencies && step.dependencies.length > 0) {
        const correctedDeps: string[] = [];

        for (const dep of step.dependencies) {
          // Check if this dependency is a step ID (starts with "step_")
          if (dep.startsWith('step_')) {
            correctedDeps.push(dep);
          } else {
            // Try to find the step that creates this file
            const stepId = fileToStepMap.get(dep);

            if (stepId) {
              console.log(`🔧 Auto-correcting dependency: "${dep}" → "${stepId}" in step ${step.id}`);
              correctedDeps.push(stepId);
              correctionsMade++;
            } else {
              // Keep the original dependency (will fail validation if invalid)
              console.warn(`⚠️  Could not auto-correct dependency "${dep}" in step ${step.id} - no matching file found`);
              correctedDeps.push(dep);
            }
          }
        }

        // Update the step's dependencies
        step.dependencies = correctedDeps;

        // Update the plan's dependency map
        if (correctedDeps.length > 0) {
          plan.dependencies.set(step.id, correctedDeps);
        }
      }
    }

    if (correctionsMade > 0) {
      console.log(`✅ Auto-corrected ${correctionsMade} file name dependencies to step IDs`);
    }
  }

  /**
   * Check for circular dependencies in the plan
   */
  private checkCircularDependencies(plan: ExecutionPlan): void {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (stepId: string): boolean => {
      visited.add(stepId);
      recursionStack.add(stepId);

      const deps = plan.dependencies.get(stepId) || [];
      for (const depId of deps) {
        if (!visited.has(depId)) {
          if (hasCycle(depId)) {
            return true;
          }
        } else if (recursionStack.has(depId)) {
          return true;
        }
      }

      recursionStack.delete(stepId);
      return false;
    };

    for (const step of plan.steps) {
      if (!visited.has(step.id)) {
        if (hasCycle(step.id)) {
          throw new Error('Plan contains circular dependencies');
        }
      }
    }
  }
}

