/**
 * Anthropic Claude provider implementation
 */

import Anthropic from '@anthropic-ai/sdk';
import { ICloudProvider } from './ICloudProvider.js';
import { GenerateOptions, StreamCallback, ModelInfo, GenerateResponse } from '../types/compute.types.js';

export class AnthropicProvider implements ICloudProvider {
  public readonly name = 'anthropic';
  private client: Anthropic | null = null;
  private model: string;
  private apiKey: string | undefined;

  constructor(apiKey?: string, model: string = 'claude-sonnet-4-20250514') {
    this.apiKey = apiKey || process.env.ANTHROPIC_API_KEY;
    this.model = model;
    
    if (this.apiKey) {
      this.client = new Anthropic({ apiKey: this.apiKey });
    }
  }

  isAvailable(): boolean {
    return !!this.apiKey && !!this.client;
  }

  async generateText(prompt: string, options?: GenerateOptions): Promise<GenerateResponse> {
    if (!this.client) {
      throw new Error('Anthropic client not initialized. API key missing.');
    }

    const startTime = Date.now();
    const model = options?.model || this.model;

    const response = await this.client.messages.create({
      model,
      max_tokens: options?.maxTokens || 4096,
      temperature: options?.temperature ?? 1.0,
      top_p: options?.topP,
      stop_sequences: options?.stopSequences,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const latency = Date.now() - startTime;
    const inputTokens = response.usage.input_tokens;
    const outputTokens = response.usage.output_tokens;

    return {
      text: response.content[0].type === 'text' ? response.content[0].text : '',
      model,
      provider: this.name,
      tokensUsed: {
        input: inputTokens,
        output: outputTokens,
        total: inputTokens + outputTokens
      },
      cost: this.estimateCost(inputTokens, outputTokens),
      latency
    };
  }

  async streamText(
    prompt: string,
    options: GenerateOptions,
    callback: StreamCallback
  ): Promise<GenerateResponse> {
    if (!this.client) {
      throw new Error('Anthropic client not initialized. API key missing.');
    }

    const startTime = Date.now();
    const model = options?.model || this.model;
    let fullText = '';
    let inputTokens = 0;
    let outputTokens = 0;

    const stream = await this.client.messages.create({
      model,
      max_tokens: options?.maxTokens || 4096,
      temperature: options?.temperature ?? 1.0,
      top_p: options?.topP,
      stop_sequences: options?.stopSequences,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      stream: true
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        const chunk = event.delta.text;
        fullText += chunk;
        callback(chunk);
      } else if (event.type === 'message_start') {
        inputTokens = event.message.usage.input_tokens;
      } else if (event.type === 'message_delta') {
        outputTokens = event.usage.output_tokens;
      }
    }

    const latency = Date.now() - startTime;

    return {
      text: fullText,
      model,
      provider: this.name,
      tokensUsed: {
        input: inputTokens,
        output: outputTokens,
        total: inputTokens + outputTokens
      },
      cost: this.estimateCost(inputTokens, outputTokens),
      latency
    };
  }

  getModelInfo(): ModelInfo {
    const modelPricing: Record<string, { input: number; output: number; context: number; maxOutput: number }> = {
      'claude-sonnet-4-20250514': { input: 3.0, output: 15.0, context: 200000, maxOutput: 8192 },
      'claude-3-5-sonnet-20241022': { input: 3.0, output: 15.0, context: 200000, maxOutput: 8192 },
      'claude-3-opus-20240229': { input: 15.0, output: 75.0, context: 200000, maxOutput: 4096 },
      'claude-3-haiku-20240307': { input: 0.25, output: 1.25, context: 200000, maxOutput: 4096 }
    };

    const pricing = modelPricing[this.model] || modelPricing['claude-sonnet-4-20250514'];

    return {
      name: this.model,
      provider: this.name,
      contextWindow: pricing.context,
      maxOutputTokens: pricing.maxOutput,
      costPer1kInputTokens: pricing.input,
      costPer1kOutputTokens: pricing.output
    };
  }

  estimateCost(inputTokens: number, outputTokens: number): number {
    const info = this.getModelInfo();
    const inputCost = (inputTokens / 1000) * info.costPer1kInputTokens;
    const outputCost = (outputTokens / 1000) * info.costPer1kOutputTokens;
    return inputCost + outputCost;
  }
}

