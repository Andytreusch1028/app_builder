/**
 * Unit tests for LocalModelService
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { LocalModelService } from '../../../src/services/LocalModelService.js';
import fs from 'fs';
import path from 'path';

describe('LocalModelService', () => {
  let service: LocalModelService;
  const testModelPath = './test-model.gguf';

  beforeEach(() => {
    service = new LocalModelService(testModelPath);
  });

  describe('Constructor and Configuration', () => {
    it('should create service instance', () => {
      expect(service).toBeDefined();
    });

    it('should use custom model path', () => {
      const customService = new LocalModelService('/custom/path/model.gguf');
      const status = customService.getStatus();
      expect(status.path).toBe('/custom/path/model.gguf');
    });

    it('should use default model path from env', () => {
      const originalPath = process.env.LOCAL_MODEL_PATH;
      process.env.LOCAL_MODEL_PATH = '/env/path/model.gguf';
      
      const envService = new LocalModelService();
      const status = envService.getStatus();
      expect(status.path).toBe('/env/path/model.gguf');
      
      // Restore
      if (originalPath) {
        process.env.LOCAL_MODEL_PATH = originalPath;
      } else {
        delete process.env.LOCAL_MODEL_PATH;
      }
    });
  });

  describe('Availability Check', () => {
    it('should return false when model file does not exist', () => {
      expect(service.isAvailable()).toBe(false);
    });

    it('should return true when model file exists', () => {
      // Create a dummy file
      fs.writeFileSync(testModelPath, 'dummy model data');
      
      expect(service.isAvailable()).toBe(true);
      
      // Cleanup
      fs.unlinkSync(testModelPath);
    });
  });

  describe('Model Status', () => {
    it('should return correct status when not loaded', () => {
      const status = service.getStatus();
      
      expect(status.loaded).toBe(false);
      expect(status.path).toBe(testModelPath);
      expect(status.available).toBe(false);
    });

    it('should return correct status after loading', async () => {
      // Create dummy file
      fs.writeFileSync(testModelPath, 'dummy model data');
      
      await service.loadModel();
      const status = service.getStatus();
      
      expect(status.loaded).toBe(true);
      expect(status.available).toBe(true);
      
      // Cleanup
      await service.unloadModel();
      fs.unlinkSync(testModelPath);
    });
  });

  describe('Model Information', () => {
    it('should return correct model info', () => {
      const info = service.getModelInfo();
      
      expect(info.name).toBe('gemma-2-9b-it');
      expect(info.provider).toBe('local');
      expect(info.contextWindow).toBe(8192);
      expect(info.maxOutputTokens).toBe(2048);
      expect(info.costPer1kInputTokens).toBe(0);
      expect(info.costPer1kOutputTokens).toBe(0);
    });
  });

  describe('Text Generation', () => {
    beforeEach(() => {
      // Create dummy model file
      fs.writeFileSync(testModelPath, 'dummy model data');
    });

    afterEach(() => {
      // Cleanup
      if (fs.existsSync(testModelPath)) {
        fs.unlinkSync(testModelPath);
      }
    });

    it('should generate text', async () => {
      const response = await service.generateText('Test prompt');
      
      expect(response).toBeDefined();
      expect(response.text).toContain('Local Model Response');
      expect(response.model).toBe('gemma-2-9b-it');
      expect(response.provider).toBe('local');
      expect(response.cost).toBe(0);
      expect(response.tokensUsed.total).toBeGreaterThan(0);
    });

    it('should auto-load model on first generation', async () => {
      const statusBefore = service.getStatus();
      expect(statusBefore.loaded).toBe(false);
      
      await service.generateText('Test prompt');
      
      const statusAfter = service.getStatus();
      expect(statusAfter.loaded).toBe(true);
    });

    it('should throw error when model file not found', async () => {
      const noFileService = new LocalModelService('/nonexistent/model.gguf');
      
      await expect(
        noFileService.generateText('Test prompt')
      ).rejects.toThrow('Model file not found');
    });
  });

  describe('Text Streaming', () => {
    beforeEach(() => {
      fs.writeFileSync(testModelPath, 'dummy model data');
    });

    afterEach(() => {
      if (fs.existsSync(testModelPath)) {
        fs.unlinkSync(testModelPath);
      }
    });

    it('should stream text with callback', async () => {
      const chunks: string[] = [];
      const callback = (chunk: string) => {
        chunks.push(chunk);
      };
      
      const response = await service.streamText('Test prompt', {}, callback);
      
      expect(response).toBeDefined();
      expect(chunks.length).toBeGreaterThan(0);
      expect(response.cost).toBe(0);
    });

    it('should return complete text after streaming', async () => {
      let streamedText = '';
      const callback = (chunk: string) => {
        streamedText += chunk;
      };
      
      const response = await service.streamText('Test prompt', {}, callback);
      
      expect(streamedText.trim()).toBe(response.text);
    });
  });

  describe('Model Loading and Unloading', () => {
    beforeEach(() => {
      fs.writeFileSync(testModelPath, 'dummy model data');
    });

    afterEach(() => {
      if (fs.existsSync(testModelPath)) {
        fs.unlinkSync(testModelPath);
      }
    });

    it('should load model', async () => {
      await service.loadModel();
      expect(service.getStatus().loaded).toBe(true);
    });

    it('should not reload if already loaded', async () => {
      await service.loadModel();
      await service.loadModel(); // Should not throw
      expect(service.getStatus().loaded).toBe(true);
    });

    it('should unload model', async () => {
      await service.loadModel();
      await service.unloadModel();
      expect(service.getStatus().loaded).toBe(false);
    });
  });
});

