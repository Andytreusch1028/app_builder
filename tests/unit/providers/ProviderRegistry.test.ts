/**
 * Unit tests for ProviderRegistry
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { ProviderRegistry } from '../../../src/providers/ProviderRegistry.js';
import { AnthropicProvider } from '../../../src/providers/AnthropicProvider.js';
import { OpenAIProvider } from '../../../src/providers/OpenAIProvider.js';
import { GoogleProvider } from '../../../src/providers/GoogleProvider.js';

describe('ProviderRegistry', () => {
  let registry: ProviderRegistry;
  let anthropic: AnthropicProvider;
  let openai: OpenAIProvider;
  let google: GoogleProvider;

  beforeEach(() => {
    registry = new ProviderRegistry();
    anthropic = new AnthropicProvider('test-key');
    openai = new OpenAIProvider('test-key');
    google = new GoogleProvider('test-key');
  });

  describe('Provider Registration', () => {
    it('should register a provider', () => {
      registry.register(anthropic);
      const provider = registry.getProvider('anthropic');
      
      expect(provider).toBeDefined();
      expect(provider?.name).toBe('anthropic');
    });

    it('should register multiple providers', () => {
      registry.register(anthropic);
      registry.register(openai);
      registry.register(google);
      
      const providers = registry.getAllProviders();
      expect(providers.length).toBe(3);
    });

    it('should initialize stats for registered providers', () => {
      registry.register(anthropic);
      const stats = registry.getStats('anthropic');
      
      expect(stats).toBeDefined();
      expect(stats?.totalRequests).toBe(0);
      expect(stats?.successfulRequests).toBe(0);
      expect(stats?.failedRequests).toBe(0);
    });

    it('should handle priority registration', () => {
      registry.register(anthropic, 0);
      registry.register(openai, 1);
      registry.register(google, 0);
      
      const providers = registry.getAllProviders();
      expect(providers.length).toBe(3);
    });
  });

  describe('Provider Selection - Priority Strategy', () => {
    beforeEach(() => {
      registry.setSelectionStrategy('priority');
      registry.register(anthropic, 0);
      registry.register(openai, 1);
      registry.register(google, 2);
    });

    it('should select first available provider by priority', () => {
      const selected = registry.selectProvider();
      // First in priority order is anthropic (registered at position 0)
      expect(selected?.name).toBe('anthropic');
    });

    it('should skip unavailable providers', () => {
      const noKeyAnthropic = new AnthropicProvider('');
      registry.register(noKeyAnthropic, 0);
      
      const selected = registry.selectProvider();
      expect(selected?.name).not.toBe('anthropic');
    });
  });

  describe('Provider Selection - Cost Strategy', () => {
    beforeEach(() => {
      registry.setSelectionStrategy('cost');
      registry.register(anthropic);
      registry.register(openai);
      registry.register(google);
    });

    it('should select cheapest provider', () => {
      const selected = registry.selectProvider();
      // Google Gemini 2.0 Flash is free
      expect(selected?.name).toBe('google');
    });
  });

  describe('Provider Selection - Round Robin Strategy', () => {
    beforeEach(() => {
      registry.setSelectionStrategy('round-robin');
      registry.register(anthropic);
      registry.register(openai);
      registry.register(google);
    });

    it('should rotate through providers', () => {
      const first = registry.selectProvider();
      const second = registry.selectProvider();
      const third = registry.selectProvider();
      const fourth = registry.selectProvider();
      
      expect(first?.name).not.toBe(second?.name);
      expect(second?.name).not.toBe(third?.name);
      expect(first?.name).toBe(fourth?.name); // Should cycle back
    });
  });

  describe('Provider Selection - Manual Strategy', () => {
    beforeEach(() => {
      registry.setSelectionStrategy('manual');
      registry.register(anthropic);
      registry.register(openai);
      registry.register(google);
    });

    it('should select manually specified provider', () => {
      const selected = registry.selectProvider('openai');
      expect(selected?.name).toBe('openai');
    });

    it('should return null if manual provider not available', () => {
      const noKeyProvider = new AnthropicProvider('');
      registry.register(noKeyProvider);
      
      const selected = registry.selectProvider('anthropic');
      expect(selected).toBeNull();
    });
  });

  describe('Statistics Tracking', () => {
    beforeEach(() => {
      registry.register(anthropic);
    });

    it('should record successful request', () => {
      registry.recordRequest('anthropic', true, 1000, 18.0, 500);
      
      const stats = registry.getStats('anthropic');
      expect(stats?.totalRequests).toBe(1);
      expect(stats?.successfulRequests).toBe(1);
      expect(stats?.failedRequests).toBe(0);
      expect(stats?.totalTokens).toBe(1000);
      expect(stats?.totalCost).toBe(18.0);
      expect(stats?.averageLatency).toBe(500);
    });

    it('should record failed request', () => {
      registry.recordRequest('anthropic', false, 0, 0, 0);
      
      const stats = registry.getStats('anthropic');
      expect(stats?.totalRequests).toBe(1);
      expect(stats?.successfulRequests).toBe(0);
      expect(stats?.failedRequests).toBe(1);
    });

    it('should calculate average latency correctly', () => {
      registry.recordRequest('anthropic', true, 1000, 18.0, 500);
      registry.recordRequest('anthropic', true, 1000, 18.0, 700);
      
      const stats = registry.getStats('anthropic');
      expect(stats?.averageLatency).toBe(600); // (500 + 700) / 2
    });

    it('should accumulate tokens and cost', () => {
      registry.recordRequest('anthropic', true, 1000, 18.0, 500);
      registry.recordRequest('anthropic', true, 2000, 36.0, 600);
      
      const stats = registry.getStats('anthropic');
      expect(stats?.totalTokens).toBe(3000);
      expect(stats?.totalCost).toBe(54.0);
    });
  });

  describe('Get All Stats', () => {
    it('should return stats for all providers', () => {
      registry.register(anthropic);
      registry.register(openai);
      
      const allStats = registry.getAllStats();
      expect(allStats.size).toBe(2);
      expect(allStats.has('anthropic')).toBe(true);
      expect(allStats.has('openai')).toBe(true);
    });
  });
});

