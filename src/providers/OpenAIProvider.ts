/**
 * OpenAI GPT provider implementation
 */

import OpenAI from 'openai';
import { ICloudProvider } from './ICloudProvider.js';
import { GenerateOptions, StreamCallback, ModelInfo, GenerateResponse } from '../types/compute.types.js';

export class OpenAIProvider implements ICloudProvider {
  public readonly name = 'openai';
  private client: OpenAI | null = null;
  private model: string;
  private apiKey: string | undefined;

  constructor(apiKey?: string, model: string = 'gpt-4o') {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY;
    this.model = model;
    
    if (this.apiKey) {
      this.client = new OpenAI({ apiKey: this.apiKey });
    }
  }

  isAvailable(): boolean {
    return !!this.apiKey && !!this.client;
  }

  async generateText(prompt: string, options?: GenerateOptions): Promise<GenerateResponse> {
    if (!this.client) {
      throw new Error('OpenAI client not initialized. API key missing.');
    }

    const startTime = Date.now();
    const model = options?.model || this.model;

    const response = await this.client.chat.completions.create({
      model,
      max_tokens: options?.maxTokens || 4096,
      temperature: options?.temperature ?? 1.0,
      top_p: options?.topP,
      stop: options?.stopSequences,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const latency = Date.now() - startTime;
    const inputTokens = response.usage?.prompt_tokens || 0;
    const outputTokens = response.usage?.completion_tokens || 0;

    return {
      text: response.choices[0]?.message?.content || '',
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
      throw new Error('OpenAI client not initialized. API key missing.');
    }

    const startTime = Date.now();
    const model = options?.model || this.model;
    let fullText = '';
    let inputTokens = 0;
    let outputTokens = 0;

    const stream = await this.client.chat.completions.create({
      model,
      max_tokens: options?.maxTokens || 4096,
      temperature: options?.temperature ?? 1.0,
      top_p: options?.topP,
      stop: options?.stopSequences,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      stream: true,
      stream_options: { include_usage: true }
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        fullText += content;
        callback(content);
      }
      
      // Usage info comes in the last chunk
      if (chunk.usage) {
        inputTokens = chunk.usage.prompt_tokens;
        outputTokens = chunk.usage.completion_tokens;
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
      'gpt-4o': { input: 2.5, output: 10.0, context: 128000, maxOutput: 16384 },
      'gpt-4o-mini': { input: 0.15, output: 0.6, context: 128000, maxOutput: 16384 },
      'gpt-4-turbo': { input: 10.0, output: 30.0, context: 128000, maxOutput: 4096 },
      'gpt-3.5-turbo': { input: 0.5, output: 1.5, context: 16385, maxOutput: 4096 }
    };

    const pricing = modelPricing[this.model] || modelPricing['gpt-4o'];

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

