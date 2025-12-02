/**
 * Abstract interface for all AI providers
 */

import { GenerateOptions, StreamCallback, ModelInfo, GenerateResponse } from '../types/compute.types.js';

export interface ICloudProvider {
  /**
   * Provider name (e.g., 'anthropic', 'openai', 'google')
   */
  readonly name: string;

  /**
   * Generate text from a prompt
   */
  generateText(prompt: string, options?: GenerateOptions): Promise<GenerateResponse>;

  /**
   * Stream text generation with callback
   */
  streamText(prompt: string, options: GenerateOptions, callback: StreamCallback): Promise<GenerateResponse>;

  /**
   * Get information about the current model
   */
  getModelInfo(): ModelInfo;

  /**
   * Estimate cost for a given number of tokens
   */
  estimateCost(inputTokens: number, outputTokens: number): number;

  /**
   * Check if provider is available (API key configured, etc.)
   */
  isAvailable(): boolean;
}

