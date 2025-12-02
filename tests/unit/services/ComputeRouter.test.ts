/**
 * Unit tests for ComputeRouter
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { ComputeRouter } from '../../../src/services/ComputeRouter.js';
import { ProviderRegistry } from '../../../src/providers/ProviderRegistry.js';
import { LocalModelService } from '../../../src/services/LocalModelService.js';
import { AnthropicProvider } from '../../../src/providers/AnthropicProvider.js';
import { OpenAIProvider } from '../../../src/providers/OpenAIProvider.js';
import fs from 'fs';

describe('ComputeRouter', () => {
  let router: ComputeRouter;
  let registry: ProviderRegistry;
  let localModel: LocalModelService;
  const testModelPath = './test-router-model.gguf';

  beforeEach(() => {
    registry = new ProviderRegistry();
    localModel = new LocalModelService(testModelPath);
    router = new ComputeRouter(registry, localModel, 'hybrid');
  });

  afterEach(() => {
    if (fs.existsSync(testModelPath)) {
      fs.unlinkSync(testModelPath);
    }
  });

  describe('Constructor and Configuration', () => {
    it('should create router instance', () => {
      expect(router).toBeDefined();
    });

    it('should use default hybrid mode', () => {
      expect(router.getMode()).toBe('hybrid');
    });

    it('should accept custom mode', () => {
      const localRouter = new ComputeRouter(registry, localModel, 'local');
      expect(localRouter.getMode()).toBe('local');
    });

    it('should allow mode changes', () => {
      router.setMode('cloud');
      expect(router.getMode()).toBe('cloud');
    });
  });

  describe('Local Mode', () => {
    beforeEach(() => {
      router.setMode('local');
      fs.writeFileSync(testModelPath, 'dummy model');
    });

    it('should generate with local model', async () => {
      const response = await router.generateText('Test prompt');
      
      expect(response.provider).toBe('local');
      expect(response.cost).toBe(0);
    });

    it('should throw error when local model unavailable', async () => {
      fs.unlinkSync(testModelPath);
      
      await expect(
        router.generateText('Test prompt')
      ).rejects.toThrow('Local model not available');
    });

    it('should stream with local model', async () => {
      const chunks: string[] = [];
      const response = await router.streamText('Test prompt', {}, (chunk) => {
        chunks.push(chunk);
      });
      
      expect(response.provider).toBe('local');
      expect(chunks.length).toBeGreaterThan(0);
    });
  });

  describe('Cloud Mode', () => {
    beforeEach(() => {
      router.setMode('cloud');
      const anthropic = new AnthropicProvider('test-key');
      registry.register(anthropic);
    });

    it('should throw error when no providers available', async () => {
      const emptyRegistry = new ProviderRegistry();
      const cloudRouter = new ComputeRouter(emptyRegistry, localModel, 'cloud');
      
      await expect(
        cloudRouter.generateText('Test prompt')
      ).rejects.toThrow('No cloud providers available');
    });

    it('should select provider from registry', async () => {
      // This will fail because we don't have real API keys
      // But it tests the routing logic
      await expect(
        router.generateText('Test prompt')
      ).rejects.toThrow(); // Will throw from Anthropic SDK
    });
  });

  describe('Hybrid Mode', () => {
    beforeEach(() => {
      router.setMode('hybrid');
    });

    it('should use local model when available', async () => {
      fs.writeFileSync(testModelPath, 'dummy model');
      
      const response = await router.generateText('Test prompt');
      expect(response.provider).toBe('local');
    });

    it('should fallback to cloud when local unavailable', async () => {
      const anthropic = new AnthropicProvider('test-key');
      registry.register(anthropic);
      
      // Local model file doesn't exist, should try cloud
      await expect(
        router.generateText('Test prompt')
      ).rejects.toThrow(); // Will fail at Anthropic SDK level
    });

    it('should use local model when file exists in hybrid mode', async () => {
      // Create file - local model will succeed
      fs.writeFileSync(testModelPath, 'dummy');
      const anthropic = new AnthropicProvider('test-key');
      registry.register(anthropic);

      // Should use local model successfully
      const response = await router.generateText('Test prompt');
      expect(response.provider).toBe('local');
    });
  });

  describe('Telemetry', () => {
    it('should return telemetry data', () => {
      const anthropic = new AnthropicProvider('test-key');
      const openai = new OpenAIProvider('test-key');
      registry.register(anthropic);
      registry.register(openai);
      
      const telemetry = router.getTelemetry();
      
      expect(telemetry.mode).toBe('hybrid');
      expect(telemetry.cloudProviders).toBe(2);
      expect(telemetry.localAvailable).toBe(false);
      expect(telemetry.stats).toBeDefined();
    });

    it('should show local availability', () => {
      fs.writeFileSync(testModelPath, 'dummy model');
      
      const telemetry = router.getTelemetry();
      expect(telemetry.localAvailable).toBe(true);
    });
  });

  describe('Statistics Recording', () => {
    beforeEach(() => {
      const anthropic = new AnthropicProvider('test-key');
      registry.register(anthropic);
      router.setMode('cloud');
    });

    it('should record failed requests', async () => {
      try {
        await router.generateText('Test prompt');
      } catch (error) {
        // Expected to fail
      }
      
      const stats = registry.getStats('anthropic');
      expect(stats?.totalRequests).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should throw error for invalid mode', async () => {
      // @ts-ignore - Testing invalid mode
      router.setMode('invalid');
      
      await expect(
        router.generateText('Test prompt')
      ).rejects.toThrow('Invalid compute mode');
    });

    it('should handle streaming errors', async () => {
      router.setMode('local');
      // No model file exists
      
      await expect(
        router.streamText('Test prompt', {}, () => {})
      ).rejects.toThrow();
    });
  });
});

