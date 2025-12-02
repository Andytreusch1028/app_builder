/**
 * Local Executor Service - Fast local execution with Ollama
 * 
 * Executes simple tasks using local models (Gemma 3 1B, Qwen 2.5 Coder 7B)
 * for cost optimization and speed.
 */

import { ICloudProvider } from '../providers/ICloudProvider.js';
import { ToolRegistry } from './ToolRegistry.js';
import { ExecutionPlan, TaskStep } from '../types/agent.types.js';

export interface LocalExecutionResult {
  success: boolean;
  result?: any;
  error?: string;
  executionTime: number;
  model: string;
}

export class LocalExecutorService {
  constructor(
    private localProvider: ICloudProvider,
    private toolRegistry: ToolRegistry
  ) {}

  /**
   * Execute a plan using local model
   */
  async executePlan(plan: ExecutionPlan): Promise<LocalExecutionResult> {
    const startTime = Date.now();

    try {
      const results: any[] = [];
      const stepResults = new Map<string, any>();

      // Execute steps in order
      for (const step of plan.steps) {
        const stepResult = await this.executeStep(step, stepResults);
        
        if (!stepResult.success) {
          return {
            success: false,
            error: stepResult.error,
            executionTime: Date.now() - startTime,
            model: this.localProvider.name
          };
        }

        stepResults.set(step.id, stepResult.result);
        results.push(stepResult.result);
      }

      return {
        success: true,
        result: results,
        executionTime: Date.now() - startTime,
        model: this.localProvider.name
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        executionTime: Date.now() - startTime,
        model: this.localProvider.name
      };
    }
  }

  /**
   * Execute a single step
   */
  private async executeStep(
    step: TaskStep,
    stepResults: Map<string, any>
  ): Promise<{ success: boolean; result?: any; error?: string }> {
    try {
      // Resolve parameter references
      const resolvedParams = this.resolveParameters(step.parameters, stepResults);

      // Execute the tool
      const result = await this.toolRegistry.execute(step.tool, resolvedParams);

      return {
        success: result.success,
        result: result.output,
        error: result.error
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
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
        // Reference to previous step result
        const stepId = value.substring(1);
        resolved[key] = stepResults.get(stepId);
      } else {
        resolved[key] = value;
      }
    }

    return resolved;
  }

  /**
   * Generate code using local model
   */
  async generateCode(
    prompt: string,
    language: string = 'javascript'
  ): Promise<LocalExecutionResult> {
    const startTime = Date.now();

    try {
      const response = await this.localProvider.generateText(prompt, {
        temperature: 0.3,
        maxTokens: 1000
      });

      return {
        success: true,
        result: response.text,
        executionTime: Date.now() - startTime,
        model: this.localProvider.name
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        executionTime: Date.now() - startTime,
        model: this.localProvider.name
      };
    }
  }

  /**
   * Check if local provider is available
   */
  isAvailable(): boolean {
    return this.localProvider.isAvailable();
  }

  /**
   * Get local provider name
   */
  getProviderName(): string {
    return this.localProvider.name;
  }
}

