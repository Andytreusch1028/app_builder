/**
 * Unit tests for Agent API Routes
 */

import request from 'supertest';
import express, { Express } from 'express';
import { createAgentRouter } from '../../../src/api/agent.routes.js';
import { ToolRegistry } from '../../../src/services/ToolRegistry.js';
import { ICloudProvider } from '../../../src/providers/ICloudProvider.js';
import { GenerateResponse } from '../../../src/types/compute.types.js';

// Mock provider class
class MockProvider implements ICloudProvider {
  name = 'mock-provider';

  async generateText(): Promise<GenerateResponse> {
    return {
      text: JSON.stringify({
        steps: [
          {
            id: 'step_1',
            description: 'Test step',
            tool: 'test-tool',
            parameters: {},
            status: 'pending'
          }
        ]
      }),
      model: 'mock-model',
      provider: 'mock',
      tokensUsed: { input: 10, output: 20, total: 30 },
      cost: 0.001,
      latency: 100
    };
  }

  async streamText(): Promise<GenerateResponse> {
    return this.generateText();
  }

  estimateCost(): number {
    return 0.001;
  }

  isAvailable(): boolean {
    return true;
  }

  getModelInfo() {
    return {
      name: 'mock-model',
      provider: 'mock',
      contextWindow: 4096,
      maxOutputTokens: 2048,
      costPer1kInputTokens: 0.001,
      costPer1kOutputTokens: 0.002
    };
  }
}

describe('Agent API Routes', () => {
  let app: Express;
  let toolRegistry: ToolRegistry;
  let mockProvider: ICloudProvider;

  beforeEach(() => {
    // Create mock provider
    mockProvider = new MockProvider();

    // Create tool registry
    toolRegistry = new ToolRegistry();

    // Register a test tool
    toolRegistry.register({
      name: 'test-tool',
      description: 'A test tool',
      parameters: {},
      execute: async () => ({
        success: true,
        data: 'Test result'
      })
    });

    // Create Express app
    app = express();
    app.use(express.json());
    app.use('/api/agent', createAgentRouter({
      provider: mockProvider,
      toolRegistry
    }));
  });

  describe('POST /api/agent/execute-async', () => {
    it('should start task execution and return execution ID', async () => {
      const response = await request(app)
        .post('/api/agent/execute-async')
        .send({ task: 'Test task' })
        .expect(202);

      expect(response.body.success).toBe(true);
      expect(response.body.data.executionId).toBeDefined();
      expect(response.body.data.status).toBe('running');
      expect(response.body.data.message).toBe('Task execution started');
    });

    it('should accept userId parameter', async () => {
      const response = await request(app)
        .post('/api/agent/execute-async')
        .send({ task: 'Test task', userId: 'user123' })
        .expect(202);

      expect(response.body.success).toBe(true);
      expect(response.body.data.executionId).toBeDefined();
    });

    it('should return 400 for missing task', async () => {
      const response = await request(app)
        .post('/api/agent/execute-async')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.message).toContain('task description');
      expect(response.body.error.field).toBe('task');
    });

    it('should return 400 for non-string task', async () => {
      const response = await request(app)
        .post('/api/agent/execute-async')
        .send({ task: 123 })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.message).toContain('task description');
    });

    it('should return 400 for empty task string', async () => {
      const response = await request(app)
        .post('/api/agent/execute-async')
        .send({ task: '   ' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.message).toBe('Please enter a task to get started');
      expect(response.body.error.field).toBe('task');
    });

    it('should trim whitespace from task input', async () => {
      const response = await request(app)
        .post('/api/agent/execute-async')
        .send({ task: '  Test task with whitespace  ' })
        .expect(202);

      expect(response.body.success).toBe(true);
      expect(response.body.data.executionId).toBeDefined();
    });
  });

  describe('GET /api/agent/status/:executionId', () => {
    it('should return execution status', async () => {
      // Start an execution
      const execResponse = await request(app)
        .post('/api/agent/execute-async')
        .send({ task: 'Test task' });

      const executionId = execResponse.body.data.executionId;

      // Get status
      const statusResponse = await request(app)
        .get(`/api/agent/status/${executionId}`)
        .expect(200);

      expect(statusResponse.body.success).toBe(true);
      expect(statusResponse.body.data.id).toBe(executionId);
      expect(statusResponse.body.data.task).toBe('Test task');
      expect(statusResponse.body.data.status).toBeDefined();
    });

    it('should return 404 for non-existent execution', async () => {
      const response = await request(app)
        .get('/api/agent/status/nonexistent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });
  });

  describe('GET /api/agent/tools', () => {
    it('should list available tools', async () => {
      const response = await request(app)
        .get('/api/agent/tools')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tools).toBeDefined();
      expect(response.body.data.count).toBeGreaterThan(0);
      expect(response.body.data.tools[0].name).toBe('test-tool');
    });
  });

  describe('GET /api/agent/stats', () => {
    it('should return tool statistics', async () => {
      const response = await request(app)
        .get('/api/agent/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });
});

