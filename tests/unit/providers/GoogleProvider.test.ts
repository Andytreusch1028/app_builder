/**
 * Unit tests for GoogleProvider
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { GoogleProvider } from '../../../src/providers/GoogleProvider.js';

describe('GoogleProvider', () => {
  let provider: GoogleProvider;

  beforeEach(() => {
    provider = new GoogleProvider('test-key');
  });

  describe('Constructor and Configuration', () => {
    it('should create provider instance', () => {
      expect(provider).toBeDefined();
      expect(provider.name).toBe('google');
    });

    it('should use default model', () => {
      const info = provider.getModelInfo();
      expect(info.name).toBe('gemini-2.0-flash-exp');
    });

    it('should accept custom model', () => {
      const customProvider = new GoogleProvider('test-key', 'gemini-1.5-pro');
      const info = customProvider.getModelInfo();
      expect(info.name).toBe('gemini-1.5-pro');
    });

    it('should check availability with API key', () => {
      const withKey = new GoogleProvider('test-key');
      expect(withKey.isAvailable()).toBe(true);
    });

    it('should check availability without API key', () => {
      const withoutKey = new GoogleProvider('');
      expect(withoutKey.isAvailable()).toBe(false);
    });
  });

  describe('Model Information', () => {
    it('should return correct model info for Gemini 2.0 Flash', () => {
      const info = provider.getModelInfo();
      
      expect(info.name).toBe('gemini-2.0-flash-exp');
      expect(info.provider).toBe('google');
      expect(info.contextWindow).toBe(1000000);
      expect(info.maxOutputTokens).toBe(8192);
      expect(info.costPer1kInputTokens).toBe(0.0);
      expect(info.costPer1kOutputTokens).toBe(0.0);
    });

    it('should return correct model info for Gemini 1.5 Pro', () => {
      const proProvider = new GoogleProvider('test-key', 'gemini-1.5-pro');
      const info = proProvider.getModelInfo();
      
      expect(info.costPer1kInputTokens).toBe(1.25);
      expect(info.costPer1kOutputTokens).toBe(5.0);
      expect(info.contextWindow).toBe(2000000);
    });

    it('should return correct model info for Gemini 1.5 Flash', () => {
      const flashProvider = new GoogleProvider('test-key', 'gemini-1.5-flash');
      const info = flashProvider.getModelInfo();
      
      expect(info.costPer1kInputTokens).toBe(0.075);
      expect(info.costPer1kOutputTokens).toBe(0.3);
    });
  });

  describe('Cost Estimation', () => {
    it('should calculate cost correctly for Gemini 2.0 Flash (free)', () => {
      const cost = provider.estimateCost(1000, 1000);
      expect(cost).toBe(0);
    });

    it('should calculate cost for Gemini 1.5 Pro', () => {
      const proProvider = new GoogleProvider('test-key', 'gemini-1.5-pro');
      const cost = proProvider.estimateCost(1000, 1000);
      // (1000/1000 * 1.25) + (1000/1000 * 5.0) = 1.25 + 5.0 = 6.25
      expect(cost).toBe(6.25);
    });

    it('should calculate cost for different token counts', () => {
      const proProvider = new GoogleProvider('test-key', 'gemini-1.5-pro');
      const cost = proProvider.estimateCost(500, 2000);
      // (500/1000 * 1.25) + (2000/1000 * 5.0) = 0.625 + 10.0 = 10.625
      expect(cost).toBe(10.625);
    });

    it('should handle zero tokens', () => {
      const cost = provider.estimateCost(0, 0);
      expect(cost).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should throw error when generating without API key', async () => {
      const noKeyProvider = new GoogleProvider('');
      
      await expect(
        noKeyProvider.generateText('test prompt')
      ).rejects.toThrow('Google client not initialized');
    });

    it('should throw error when streaming without API key', async () => {
      const noKeyProvider = new GoogleProvider('');
      
      await expect(
        noKeyProvider.streamText('test prompt', {}, () => {})
      ).rejects.toThrow('Google client not initialized');
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
      expect(provider.name).toBe('google');
    });
  });
});

