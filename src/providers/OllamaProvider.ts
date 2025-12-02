/**
 * Ollama Provider - Local model provider using Ollama API
 */

import { ICloudProvider } from './ICloudProvider.js';
import { GenerateOptions, GenerateResponse, ModelInfo, StreamCallback } from '../types/compute.types.js';
import { selectOllamaModel, analyzePrompt, getModelInfo, type TaskRequirements } from '../config/ollama-models.js';

export class OllamaProvider implements ICloudProvider {
  readonly name: string;
  private apiUrl: string;
  private modelName: string;
  private autoSelectModel: boolean;

  constructor(
    modelName: string = 'qwen2.5-coder:7b',
    apiUrl: string = 'http://localhost:11434',
    autoSelectModel: boolean = false
  ) {
    this.modelName = modelName;
    this.apiUrl = apiUrl;
    this.autoSelectModel = autoSelectModel;
    this.name = `ollama-${modelName}`;
  }

  /**
   * Generate text using Ollama
   */
  async generateText(prompt: string, options?: GenerateOptions): Promise<GenerateResponse> {
    const startTime = Date.now();

    // Auto-select model based on prompt if enabled
    const modelToUse = this.autoSelectModel ? this.selectModelForPrompt(prompt) : this.modelName;

    try {
      const response = await fetch(`${this.apiUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelToUse,
          prompt,
          stream: false,
          options: {
            temperature: options?.temperature ?? 0.7,
            num_predict: options?.maxTokens ?? 2048,
            top_p: options?.topP ?? 1.0,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const latency = Date.now() - startTime;

      // Estimate token counts (Ollama doesn't always provide exact counts)
      const inputTokens = this.estimateTokens(prompt);
      const outputTokens = data.eval_count || this.estimateTokens(data.response);

      return {
        text: data.response,
        provider: this.name,
        model: modelToUse,
        tokensUsed: {
          input: inputTokens,
          output: outputTokens,
          total: inputTokens + outputTokens
        },
        cost: 0, // Ollama is free
        latency
      };
    } catch (error) {
      throw new Error(`Ollama generation failed: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Stream text generation using Ollama
   */
  async streamText(prompt: string, options: GenerateOptions, callback: StreamCallback): Promise<GenerateResponse> {
    const startTime = Date.now();
    let fullText = '';
    let totalTokens = 0;

    // Auto-select model based on prompt if enabled
    const modelToUse = this.autoSelectModel ? this.selectModelForPrompt(prompt) : this.modelName;

    try {
      const response = await fetch(`${this.apiUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelToUse,
          prompt,
          stream: true,
          options: {
            temperature: options?.temperature ?? 0.7,
            num_predict: options?.maxTokens ?? 2048,
            top_p: options?.topP ?? 1.0,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.response) {
              fullText += data.response;
              callback(data.response);
            }
            if (data.eval_count) {
              totalTokens = data.eval_count;
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }

      const latency = Date.now() - startTime;
      const inputTokens = this.estimateTokens(prompt);
      const outputTokens = totalTokens || this.estimateTokens(fullText);

      return {
        text: fullText,
        provider: this.name,
        model: modelToUse,
        tokensUsed: {
          input: inputTokens,
          output: outputTokens,
          total: inputTokens + outputTokens
        },
        cost: 0,
        latency
      };
    } catch (error) {
      throw new Error(`Ollama streaming failed: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Get model information
   */
  getModelInfo(): ModelInfo {
    return {
      name: this.modelName,
      provider: 'ollama',
      contextWindow: 32768, // Most Ollama models support 32k context
      maxOutputTokens: 4096,
      costPer1kInputTokens: 0,
      costPer1kOutputTokens: 0
    };
  }

  /**
   * Estimate cost (always 0 for Ollama)
   */
  estimateCost(inputTokens: number, outputTokens: number): number {
    return 0;
  }

  /**
   * Check if Ollama is available
   */
  isAvailable(): boolean {
    // Ollama is available if it's running locally
    // We'll do a simple check in the actual call
    return true;
  }

  /**
   * Estimate token count (rough approximation)
   * Average: 1 token ≈ 4 characters
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Get the model name
   */
  getModelName(): string {
    return this.modelName;
  }

  /**
   * Set a different model
   */
  setModel(modelName: string): void {
    this.modelName = modelName;
  }

  /**
   * Enable or disable auto model selection
   */
  setAutoSelect(enabled: boolean): void {
    this.autoSelectModel = enabled;
  }

  /**
   * Select the best model for a given prompt
   */
  private selectModelForPrompt(prompt: string): string {
    const requirements = analyzePrompt(prompt);
    const selectedModel = selectOllamaModel(requirements);

    // Log model selection for debugging
    console.log(`[OllamaProvider] Auto-selected ${selectedModel} for prompt (complexity: ${requirements.complexity}, priority: ${requirements.priority})`);

    return selectedModel;
  }

  /**
   * Manually select model based on task requirements
   */
  selectModelByRequirements(requirements: TaskRequirements): string {
    return selectOllamaModel(requirements);
  }

  /**
   * Get information about a specific model
   */
  getModelConfig(modelName: string) {
    return getModelInfo(modelName);
  }
}

