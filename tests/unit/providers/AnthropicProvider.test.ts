/**
 * Unit tests for AnthropicProvider
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { AnthropicProvider } from '../../../src/providers/AnthropicProvider.js';

describe('AnthropicProvider', () => {
  let provider: AnthropicProvider;

  beforeEach(() => {
    // Create provider without API key for testing structure
    provider = new AnthropicProvider('test-key');
  });

  describe('Constructor and Configuration', () => {
    it('should create provider instance', () => {
      expect(provider).toBeDefined();
      expect(provider.name).toBe('anthropic');
    });

    it('should use default model', () => {
      const info = provider.getModelInfo();
      expect(info.name).toBe('claude-sonnet-4-20250514');
    });

    it('should accept custom model', () => {
      const customProvider = new AnthropicProvider('test-key', 'claude-3-opus-20240229');
      const info = customProvider.getModelInfo();
      expect(info.name).toBe('claude-3-opus-20240229');
    });

    it('should check availability with API key', () => {
      const withKey = new AnthropicProvider('test-key');
      expect(withKey.isAvailable()).toBe(true);
    });

    it('should check availability without API key', () => {
      const withoutKey = new AnthropicProvider('');
      expect(withoutKey.isAvailable()).toBe(false);
    });
  });

  describe('Model Information', () => {
    it('should return correct model info for Claude Sonnet 4', () => {
      const info = provider.getModelInfo();
      
      expect(info.name).toBe('claude-sonnet-4-20250514');
      expect(info.provider).toBe('anthropic');
      expect(info.contextWindow).toBe(200000);
      expect(info.maxOutputTokens).toBe(8192);
      expect(info.costPer1kInputTokens).toBe(3.0);
      expect(info.costPer1kOutputTokens).toBe(15.0);
    });

    it('should return correct model info for Claude Opus', () => {
      const opusProvider = new AnthropicProvider('test-key', 'claude-3-opus-20240229');
      const info = opusProvider.getModelInfo();
      
      expect(info.costPer1kInputTokens).toBe(15.0);
      expect(info.costPer1kOutputTokens).toBe(75.0);
    });

    it('should return correct model info for Claude Haiku', () => {
      const haikuProvider = new AnthropicProvider('test-key', 'claude-3-haiku-20240307');
      const info = haikuProvider.getModelInfo();
      
      expect(info.costPer1kInputTokens).toBe(0.25);
      expect(info.costPer1kOutputTokens).toBe(1.25);
    });
  });

  describe('Cost Estimation', () => {
    it('should calculate cost correctly for Sonnet', () => {
      const cost = provider.estimateCost(1000, 1000);
      // (1000/1000 * 3.0) + (1000/1000 * 15.0) = 3.0 + 15.0 = 18.0
      expect(cost).toBe(18.0);
    });

    it('should calculate cost for different token counts', () => {
      const cost = provider.estimateCost(500, 2000);
      // (500/1000 * 3.0) + (2000/1000 * 15.0) = 1.5 + 30.0 = 31.5
      expect(cost).toBe(31.5);
    });

    it('should handle zero tokens', () => {
      const cost = provider.estimateCost(0, 0);
      expect(cost).toBe(0);
    });

    it('should calculate cost for Opus model', () => {
      const opusProvider = new AnthropicProvider('test-key', 'claude-3-opus-20240229');
      const cost = opusProvider.estimateCost(1000, 1000);
      // (1000/1000 * 15.0) + (1000/1000 * 75.0) = 15.0 + 75.0 = 90.0
      expect(cost).toBe(90.0);
    });
  });

  describe('Error Handling', () => {
    it('should throw error when generating without API key', async () => {
      const noKeyProvider = new AnthropicProvider('');
      
      await expect(
        noKeyProvider.generateText('test prompt')
      ).rejects.toThrow('Anthropic client not initialized');
    });

    it('should throw error when streaming without API key', async () => {
      const noKeyProvider = new AnthropicProvider('');
      
      await expect(
        noKeyProvider.streamText('test prompt', {}, () => {})
      ).rejects.toThrow('Anthropic client not initialized');
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
      expect(provider.name).toBe('anthropic');
      // TypeScript enforces readonly at compile time
    });
  });
});

