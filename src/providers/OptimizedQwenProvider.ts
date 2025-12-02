/**
 * Optimized Qwen Provider
 * 
 * Wraps OllamaProvider with Qwen-specific optimizations:
 * - Optimized prompts for different task types
 * - Better parameter tuning
 * - Task type detection
 * - Response post-processing
 */

import { ICloudProvider } from './ICloudProvider.js';
import { OllamaProvider } from './OllamaProvider.js';
import { buildQwenPrompt, QwenPrompts } from '../config/qwen-prompts.js';

export interface QwenOptimizationConfig {
  enableTaskDetection: boolean;
  enablePromptOptimization: boolean;
  enableResponseCleaning: boolean;
  defaultTaskType: keyof typeof QwenPrompts;
}

export class OptimizedQwenProvider implements ICloudProvider {
  readonly name: string = 'qwen-optimized';
  private baseProvider: OllamaProvider;
  private config: QwenOptimizationConfig;

  constructor(
    modelName: string = 'qwen2.5-coder:7b',
    config: Partial<QwenOptimizationConfig> = {}
  ) {
    this.baseProvider = new OllamaProvider(modelName);
    this.config = {
      enableTaskDetection: true,
      enablePromptOptimization: true,
      enableResponseCleaning: true,
      defaultTaskType: 'general',
      ...config
    };
  }

  /**
   * Generate text with Qwen optimizations (ICloudProvider interface)
   */
  async generateText(prompt: string, options?: any): Promise<any> {
    let optimizedPrompt = prompt;

    // Apply prompt optimization if enabled
    if (this.config.enablePromptOptimization) {
      const taskType = this.config.enableTaskDetection
        ? this.detectTaskType(prompt)
        : this.config.defaultTaskType;

      const { system, user } = buildQwenPrompt(taskType, prompt);

      // Combine system and user messages
      optimizedPrompt = `${system}\n\nUSER REQUEST:\n${user}`;
    }

    // Generate response using base provider
    const result = await this.baseProvider.generateText(optimizedPrompt, options);

    // Clean response if enabled
    if (this.config.enableResponseCleaning) {
      result.text = this.cleanResponse(result.text);
    }

    return result;
  }

  /**
   * Stream text generation (pass through to base provider)
   */
  async streamText(prompt: string, options: any, callback: any): Promise<any> {
    return this.baseProvider.streamText(prompt, options, callback);
  }

  /**
   * Get model info (pass through to base provider)
   */
  getModelInfo(): any {
    return this.baseProvider.getModelInfo();
  }

  /**
   * Estimate cost (pass through to base provider)
   */
  estimateCost(inputTokens: number, outputTokens: number): number {
    return this.baseProvider.estimateCost(inputTokens, outputTokens);
  }

  /**
   * Check if provider is available (pass through to base provider)
   */
  isAvailable(): boolean {
    return this.baseProvider.isAvailable();
  }

  /**
   * Detect task type from prompt
   */
  private detectTaskType(prompt: string): keyof typeof QwenPrompts {
    const lowerPrompt = prompt.toLowerCase();

    // Code generation keywords
    if (
      lowerPrompt.includes('create') ||
      lowerPrompt.includes('write') ||
      lowerPrompt.includes('implement') ||
      lowerPrompt.includes('build') ||
      lowerPrompt.includes('generate')
    ) {
      return 'codeGeneration';
    }

    // Debugging keywords
    if (
      lowerPrompt.includes('debug') ||
      lowerPrompt.includes('fix') ||
      lowerPrompt.includes('error') ||
      lowerPrompt.includes('bug') ||
      lowerPrompt.includes('issue')
    ) {
      return 'debugging';
    }

    // Explanation keywords
    if (
      lowerPrompt.includes('explain') ||
      lowerPrompt.includes('how does') ||
      lowerPrompt.includes('what is') ||
      lowerPrompt.includes('understand')
    ) {
      return 'codeExplanation';
    }

    // Review keywords
    if (
      lowerPrompt.includes('review') ||
      lowerPrompt.includes('feedback') ||
      lowerPrompt.includes('improve') ||
      lowerPrompt.includes('critique')
    ) {
      return 'codeReview';
    }

    // Planning keywords
    if (
      lowerPrompt.includes('plan') ||
      lowerPrompt.includes('steps') ||
      lowerPrompt.includes('approach') ||
      lowerPrompt.includes('strategy')
    ) {
      return 'taskPlanning';
    }

    // Default to general
    return 'general';
  }

  /**
   * Clean response to remove common Qwen artifacts
   */
  private cleanResponse(response: string): string {
    let cleaned = response;

    // Remove common preambles
    const preambles = [
      /^(Sure|Certainly|Of course|Absolutely)[,!]\s*/i,
      /^I('d be happy to|'ll|can)\s+/i,
      /^Let me\s+/i,
      /^Here('s| is)\s+/i
    ];

    for (const pattern of preambles) {
      cleaned = cleaned.replace(pattern, '');
    }

    // Remove apologetic phrases
    cleaned = cleaned.replace(/I apologize[^.]*\.\s*/gi, '');
    cleaned = cleaned.replace(/Sorry[^.]*\.\s*/gi, '');

    // Remove meta-commentary
    cleaned = cleaned.replace(/As an AI[^.]*\.\s*/gi, '');
    cleaned = cleaned.replace(/Note that[^.]*\.\s*/gi, '');

    // Trim whitespace
    cleaned = cleaned.trim();

    return cleaned;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<QwenOptimizationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): QwenOptimizationConfig {
    return { ...this.config };
  }
}

