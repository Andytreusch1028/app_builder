/**
 * Unit tests for OpenAIProvider
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { OpenAIProvider } from '../../../src/providers/OpenAIProvider.js';

describe('OpenAIProvider', () => {
  let provider: OpenAIProvider;

  beforeEach(() => {
    provider = new OpenAIProvider('test-key');
  });

  describe('Constructor and Configuration', () => {
    it('should create provider instance', () => {
      expect(provider).toBeDefined();
      expect(provider.name).toBe('openai');
    });

    it('should use default model', () => {
      const info = provider.getModelInfo();
      expect(info.name).toBe('gpt-4o');
    });

    it('should accept custom model', () => {
      const customProvider = new OpenAIProvider('test-key', 'gpt-4-turbo');
      const info = customProvider.getModelInfo();
      expect(info.name).toBe('gpt-4-turbo');
    });

    it('should check availability with API key', () => {
      const withKey = new OpenAIProvider('test-key');
      expect(withKey.isAvailable()).toBe(true);
    });

    it('should check availability without API key', () => {
      const withoutKey = new OpenAIProvider('');
      expect(withoutKey.isAvailable()).toBe(false);
    });
  });

  describe('Model Information', () => {
    it('should return correct model info for GPT-4o', () => {
      const info = provider.getModelInfo();
      
      expect(info.name).toBe('gpt-4o');
      expect(info.provider).toBe('openai');
      expect(info.contextWindow).toBe(128000);
      expect(info.maxOutputTokens).toBe(16384);
      expect(info.costPer1kInputTokens).toBe(2.5);
      expect(info.costPer1kOutputTokens).toBe(10.0);
    });

    it('should return correct model info for GPT-4 Turbo', () => {
      const turboProvider = new OpenAIProvider('test-key', 'gpt-4-turbo');
      const info = turboProvider.getModelInfo();
      
      expect(info.costPer1kInputTokens).toBe(10.0);
      expect(info.costPer1kOutputTokens).toBe(30.0);
    });

    it('should return correct model info for GPT-3.5', () => {
      const gpt35Provider = new OpenAIProvider('test-key', 'gpt-3.5-turbo');
      const info = gpt35Provider.getModelInfo();
      
      expect(info.costPer1kInputTokens).toBe(0.5);
      expect(info.costPer1kOutputTokens).toBe(1.5);
    });
  });

  describe('Cost Estimation', () => {
    it('should calculate cost correctly for GPT-4o', () => {
      const cost = provider.estimateCost(1000, 1000);
      // (1000/1000 * 2.5) + (1000/1000 * 10.0) = 2.5 + 10.0 = 12.5
      expect(cost).toBe(12.5);
    });

    it('should calculate cost for different token counts', () => {
      const cost = provider.estimateCost(500, 2000);
      // (500/1000 * 2.5) + (2000/1000 * 10.0) = 1.25 + 20.0 = 21.25
      expect(cost).toBe(21.25);
    });

    it('should handle zero tokens', () => {
      const cost = provider.estimateCost(0, 0);
      expect(cost).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should throw error when generating without API key', async () => {
      const noKeyProvider = new OpenAIProvider('');
      
      await expect(
        noKeyProvider.generateText('test prompt')
      ).rejects.toThrow('OpenAI client not initialized');
    });

    it('should throw error when streaming without API key', async () => {
      const noKeyProvider = new OpenAIProvider('');
      
      await expect(
        noKeyProvider.streamText('test prompt', {}, () => {})
      ).rejects.toThrow('OpenAI client not initialized');
    });
  });

  describe('Provider Interface Compliance', () => {
    it('should implement all required methods', () => {
      expect(typeof provider.generateText).toBe('function');
      expect(typeof provider.streamText).toBe('function');
      expect(typeof provider.getModelInfo).toBe('function');
      expect(typeof provider.estimateCost).toBe('function');
      expect(typeof provider.isAvailable).toBe('function');
    });

    it('should have readonly name property', () => {
      expect(provider.name).toBe('openai');
    });
  });
});

