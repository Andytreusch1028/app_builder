/**
 * Google Gemini provider implementation
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { ICloudProvider } from './ICloudProvider.js';
import { GenerateOptions, StreamCallback, ModelInfo, GenerateResponse } from '../types/compute.types.js';

export class GoogleProvider implements ICloudProvider {
  public readonly name = 'google';
  private client: GoogleGenerativeAI | null = null;
  private model: string;
  private apiKey: string | undefined;

  constructor(apiKey?: string, model: string = 'gemini-2.0-flash-exp') {
    this.apiKey = apiKey || process.env.GOOGLE_API_KEY;
    this.model = model;
    
    if (this.apiKey) {
      this.client = new GoogleGenerativeAI(this.apiKey);
    }
  }

  isAvailable(): boolean {
    return !!this.apiKey && !!this.client;
  }

  async generateText(prompt: string, options?: GenerateOptions): Promise<GenerateResponse> {
    if (!this.client) {
      throw new Error('Google client not initialized. API key missing.');
    }

    const startTime = Date.now();
    const modelName = options?.model || this.model;
    const genModel = this.client.getGenerativeModel({ 
      model: modelName,
      generationConfig: {
        temperature: options?.temperature ?? 1.0,
        topP: options?.topP,
        maxOutputTokens: options?.maxTokens || 8192,
        stopSequences: options?.stopSequences
      }
    });

    const result = await genModel.generateContent(prompt);
    const response = result.response;
    const latency = Date.now() - startTime;

    // Gemini doesn't always provide token counts
    const inputTokens = response.usageMetadata?.promptTokenCount || 0;
    const outputTokens = response.usageMetadata?.candidatesTokenCount || 0;

    return {
      text: response.text(),
      model: modelName,
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
      throw new Error('Google client not initialized. API key missing.');
    }

    const startTime = Date.now();
    const modelName = options?.model || this.model;
    const genModel = this.client.getGenerativeModel({ 
      model: modelName,
      generationConfig: {
        temperature: options?.temperature ?? 1.0,
        topP: options?.topP,
        maxOutputTokens: options?.maxTokens || 8192,
        stopSequences: options?.stopSequences
      }
    });

    let fullText = '';
    let inputTokens = 0;
    let outputTokens = 0;

    const result = await genModel.generateContentStream(prompt);

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      fullText += chunkText;
      callback(chunkText);
      
      // Update token counts if available
      if (chunk.usageMetadata) {
        inputTokens = chunk.usageMetadata.promptTokenCount || 0;
        outputTokens = chunk.usageMetadata.candidatesTokenCount || 0;
      }
    }

    const latency = Date.now() - startTime;

    return {
      text: fullText,
      model: modelName,
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
      'gemini-2.0-flash-exp': { input: 0.0, output: 0.0, context: 1000000, maxOutput: 8192 },
      'gemini-1.5-pro': { input: 1.25, output: 5.0, context: 2000000, maxOutput: 8192 },
      'gemini-1.5-flash': { input: 0.075, output: 0.3, context: 1000000, maxOutput: 8192 }
    };

    const pricing = modelPricing[this.model] || modelPricing['gemini-2.0-flash-exp'];

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

