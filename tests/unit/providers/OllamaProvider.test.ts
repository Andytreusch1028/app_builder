/**
 * Tests for OllamaProvider
 */

import { OllamaProvider } from '../../../src/providers/OllamaProvider.js';

describe('OllamaProvider', () => {
  let provider: OllamaProvider;

  beforeEach(() => {
    provider = new OllamaProvider('qwen2.5-coder:7b');
  });

  describe('Constructor', () => {
    test('should create provider with default model', () => {
      const defaultProvider = new OllamaProvider();
      expect(defaultProvider.name).toBe('ollama-qwen2.5-coder:7b');
    });

    test('should create provider with custom model', () => {
      const customProvider = new OllamaProvider('gemma3:1b');
      expect(customProvider.name).toBe('ollama-gemma3:1b');
    });

    test('should create provider with custom API URL', () => {
      const customProvider = new OllamaProvider('llama3.2:3b', 'http://custom:11434');
      expect(customProvider.name).toBe('ollama-llama3.2:3b');
    });
  });

  describe('getModelInfo', () => {
    test('should return correct model info', () => {
      const info = provider.getModelInfo();
      
      expect(info.name).toBe('qwen2.5-coder:7b');
      expect(info.provider).toBe('ollama');
      expect(info.contextWindow).toBe(32768);
      expect(info.maxOutputTokens).toBe(4096);
      expect(info.costPer1kInputTokens).toBe(0);
      expect(info.costPer1kOutputTokens).toBe(0);
    });
  });

  describe('estimateCost', () => {
    test('should always return 0 cost', () => {
      expect(provider.estimateCost(100, 200)).toBe(0);
      expect(provider.estimateCost(1000, 2000)).toBe(0);
      expect(provider.estimateCost(0, 0)).toBe(0);
    });
  });

  describe('isAvailable', () => {
    test('should return true', () => {
      expect(provider.isAvailable()).toBe(true);
    });
  });

  describe('getModelName', () => {
    test('should return current model name', () => {
      expect(provider.getModelName()).toBe('qwen2.5-coder:7b');
    });
  });

  describe('setModel', () => {
    test('should change model name', () => {
      provider.setModel('gemma3:1b');
      expect(provider.getModelName()).toBe('gemma3:1b');
    });
  });

  describe('Interface compliance', () => {
    test('should implement ICloudProvider interface', () => {
      expect(typeof provider.generateText).toBe('function');
      expect(typeof provider.streamText).toBe('function');
      expect(typeof provider.getModelInfo).toBe('function');
      expect(typeof provider.estimateCost).toBe('function');
      expect(typeof provider.isAvailable).toBe('function');
      expect(typeof provider.name).toBe('string');
    });

    test('should have correct method signatures', () => {
      const info = provider.getModelInfo();
      expect(info).toHaveProperty('name');
      expect(info).toHaveProperty('provider');
      expect(info).toHaveProperty('contextWindow');
      expect(info).toHaveProperty('maxOutputTokens');
      expect(info).toHaveProperty('costPer1kInputTokens');
      expect(info).toHaveProperty('costPer1kOutputTokens');
    });
  });
});

