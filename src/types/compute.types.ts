/**
 * Type definitions for compute system
 */

export interface GenerateOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stopSequences?: string[];
  model?: string;
}

export interface StreamCallback {
  (chunk: string): void;
}

export interface ModelInfo {
  name: string;
  provider: string;
  contextWindow: number;
  maxOutputTokens: number;
  costPer1kInputTokens: number;
  costPer1kOutputTokens: number;
}

export interface GenerateResponse {
  text: string;
  model: string;
  provider: string;
  tokensUsed: {
    input: number;
    output: number;
    total: number;
  };
  cost: number;
  latency: number;
}

export interface ProviderStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalTokens: number;
  totalCost: number;
  averageLatency: number;
}

export type SelectionStrategy = 
  | 'priority'
  | 'cost'
  | 'performance'
  | 'round-robin'
  | 'manual';

export type ComputeMode = 'local' | 'cloud' | 'hybrid';

