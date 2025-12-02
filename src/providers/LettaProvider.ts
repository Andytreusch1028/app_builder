/**
 * Letta Provider
 * Provides unlimited context through Letta memory system
 * Works with Ollama models for local-first operation
 */

import { ICloudProvider } from './ICloudProvider.js';
import { GenerateOptions, GenerateResponse, ModelInfo, StreamCallback } from '../types/compute.types.js';
import { LettaIntegrationService } from '../services/LettaIntegrationService.js';

export class LettaProvider implements ICloudProvider {
  readonly name: string;
  private lettaService: LettaIntegrationService;
  private modelName: string;
  private initialized: boolean = false;

  constructor(
    modelName: string = 'ollama/qwen2.5-coder:7b',
    baseUrl: string = 'http://localhost:8283'
  ) {
    this.modelName = modelName;
    this.name = `letta-${modelName.replace('ollama/', '')}`;
    this.lettaService = new LettaIntegrationService(baseUrl);
  }

  /**
   * Initialize the Letta agent with default memory blocks
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await this.lettaService.createAgent({
        model: this.modelName,
        name: 'coding-assistant',
        description: 'AI coding assistant with unlimited context',
        memoryBlocks: [
          {
            label: 'persona',
            value: 'I am a helpful coding assistant specialized in building applications. I follow best practices, write clean code, and provide detailed explanations.',
            description: 'Information about the assistant\'s role and capabilities'
          },
          {
            label: 'user',
            value: 'User preferences and context will be stored here as I learn about them.',
            description: 'Information about the user and their preferences'
          },
          {
            label: 'project',
            value: 'Current project: Builder App - A local-first AI application builder using LLAMA models.',
            description: 'Information about the current project being worked on'
          },
          {
            label: 'conversation',
            value: 'Recent conversation context and important points.',
            description: 'Recent conversation history and key takeaways'
          }
        ],
        tools: []
      });

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize Letta provider:', error);
      throw error;
    }
  }

  /**
   * Generate text with unlimited context
   */
  async generateText(prompt: string, options?: GenerateOptions): Promise<GenerateResponse> {
    await this.initialize();

    const startTime = Date.now();

    try {
      const response = await this.lettaService.sendMessage(prompt);

      // Extract assistant messages
      const text = response.messages
        .filter(m => m.role === 'assistant')
        .map(m => m.content)
        .join('\n');

      const latency = Date.now() - startTime;

      return {
        text,
        model: this.modelName,
        provider: 'letta',
        tokensUsed: response.usage ? {
          input: response.usage.promptTokens,
          output: response.usage.completionTokens,
          total: response.usage.totalTokens
        } : {
          input: 0,
          output: 0,
          total: 0
        },
        cost: 0, // Local model, no cost
        latency
      };
    } catch (error) {
      console.error('Letta generation failed:', error);
      throw error;
    }
  }

  /**
   * Stream generation (not yet supported by Letta client)
   */
  async streamText(
    prompt: string,
    options: GenerateOptions,
    callback: StreamCallback
  ): Promise<GenerateResponse> {
    // Fallback to non-streaming for now
    const response = await this.generateText(prompt, options);
    callback(response.text);
    return response;
  }

  /**
   * Get model information
   */
  getModelInfo(): ModelInfo {
    return {
      name: this.modelName,
      provider: 'letta',
      contextWindow: -1, // Unlimited with Letta
      maxOutputTokens: -1,     // Unlimited
      costPer1kInputTokens: 0,  // Local model
      costPer1kOutputTokens: 0  // Local model
    };
  }

  /**
   * Estimate cost (always 0 for local models)
   */
  estimateCost(inputTokens: number, outputTokens: number): number {
    return 0;
  }

  /**
   * Check if provider is available
   */
  isAvailable(): boolean {
    return this.initialized;
  }

  /**
   * Update agent's memory
   */
  async updateMemory(blockLabel: string, newValue: string): Promise<void> {
    await this.initialize();
    await this.lettaService.updateMemory(blockLabel, newValue);
  }

  /**
   * Search agent's memory
   */
  searchMemory(query: string, limit?: number) {
    return this.lettaService.searchMemory(query, limit);
  }

  /**
   * Get all memory blocks
   */
  getMemoryBlocks() {
    return this.lettaService.getMemoryBlocks();
  }

  /**
   * Get memory hierarchy
   */
  getMemoryHierarchy() {
    return this.lettaService.getMemoryHierarchy();
  }

  /**
   * Check if provider is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

