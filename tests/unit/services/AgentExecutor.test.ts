/**
 * Unit tests for AgentExecutor
 */

import { AgentExecutor } from '../../../src/services/AgentExecutor.js';
import { PlannerService } from '../../../src/services/PlannerService.js';
import { ToolRegistry } from '../../../src/services/ToolRegistry.js';
import { ICloudProvider } from '../../../src/providers/ICloudProvider.js';
import { GenerateResponse } from '../../../src/types/compute.types.js';
import { Tool, ExecutionPlan } from '../../../src/types/agent.types.js';

// Mock provider
class MockProvider implements ICloudProvider {
  name = 'mock';
  private mockResponse: string = '';

  setMockResponse(response: string) {
    this.mockResponse = response;
  }

  async generateText(): Promise<GenerateResponse> {
    return {
      text: this.mockResponse,
      model: 'mock-model',
      provider: 'mock',
      tokensUsed: { input: 10, output: 10, total: 20 },
      cost: 0,
      latency: 100
    };
  }

  async streamText(): Promise<GenerateResponse> {
    return this.generateText();
  }

  getModelInfo() {
    return {
      name: 'mock-model',
      provider: 'mock',
      contextWindow: 4096,
      maxOutputTokens: 2048,
      costPer1kInputTokens: 0,
      costPer1kOutputTokens: 0
    };
  }

  isAvailable(): boolean {
    return true;
  }

  estimateCost(): number {
    return 0;
  }
}

describe('AgentExecutor', () => {
  let executor: AgentExecutor;
  let planner: PlannerService;
  let toolRegistry: ToolRegistry;
  let mockProvider: MockProvider;

  beforeEach(() => {
    toolRegistry = new ToolRegistry();
    mockProvider = new MockProvider();
    planner = new PlannerService(mockProvider, toolRegistry);
    executor = new AgentExecutor(planner, toolRegistry, {
      maxIterations: 10,
      maxRetries: 2
    });

    // Register test tools
    const addTool: Tool = {
      name: 'add',
      description: 'Add two numbers',
      parameters: {
        a: { type: 'number', description: 'First number', required: true },
        b: { type: 'number', description: 'Second number', required: true }
      },
      execute: async (params) => ({ 
        success: true, 
        output: params.a + params.b 
      })
    };

    const multiplyTool: Tool = {
      name: 'multiply',
      description: 'Multiply two numbers',
      parameters: {
        a: { type: 'number', description: 'First number', required: true },
        b: { type: 'number', description: 'Second number', required: true }
      },
      execute: async (params) => ({ 
        success: true, 
        output: params.a * params.b 
      })
    };

    const failTool: Tool = {
      name: 'fail',
      description: 'Always fails',
      parameters: {},
      execute: async () => ({ 
        success: false, 
        error: 'Tool failed' 
      })
    };

    toolRegistry.register(addTool);
    toolRegistry.register(multiplyTool);
    toolRegistry.register(failTool);
  });

  describe('execute', () => {
    it('should execute a simple plan successfully', async () => {
      const mockPlan = {
        steps: [
          {
            id: 'step_1',
            description: 'Add 2 + 3',
            tool: 'add',
            parameters: { a: 2, b: 3 },
            dependencies: []
          }
        ],
        estimatedTime: 1
      };

      mockProvider.setMockResponse(JSON.stringify(mockPlan));

      const result = await executor.execute('Add 2 and 3');

      expect(result.success).toBe(true);
      expect(result.completedSteps).toHaveLength(1);
      expect(result.failedSteps).toHaveLength(0);
      expect(result.output).toBe(5);
      expect(result.metadata.toolsUsed).toContain('add');
    });

    it('should execute multi-step plan with dependencies', async () => {
      const mockPlan = {
        steps: [
          {
            id: 'step_1',
            description: 'Add 2 + 3',
            tool: 'add',
            parameters: { a: 2, b: 3 },
            dependencies: []
          },
          {
            id: 'step_2',
            description: 'Multiply result by 4',
            tool: 'multiply',
            parameters: { a: '$step_1', b: 4 },
            dependencies: ['step_1']
          }
        ],
        estimatedTime: 2
      };

      mockProvider.setMockResponse(JSON.stringify(mockPlan));

      const result = await executor.execute('Add 2 and 3, then multiply by 4');

      expect(result.success).toBe(true);
      expect(result.completedSteps).toHaveLength(2);
      expect(result.output).toHaveLength(2);
      expect(result.output[1].output).toBe(20); // (2+3) * 4 = 20
    });

    it('should handle tool failures', async () => {
      const mockPlan = {
        steps: [
          {
            id: 'step_1',
            description: 'This will fail',
            tool: 'fail',
            parameters: {},
            dependencies: []
          }
        ],
        estimatedTime: 1
      };

      mockProvider.setMockResponse(JSON.stringify(mockPlan));

      const result = await executor.execute('Do something that fails');

      expect(result.success).toBe(false);
      expect(result.completedSteps).toHaveLength(0);
      expect(result.failedSteps).toHaveLength(1);
      expect(result.error).toContain('Tool failed');
    });

    it('should stop execution on critical failure', async () => {
      const mockPlan = {
        steps: [
          {
            id: 'step_1',
            description: 'This will fail',
            tool: 'fail',
            parameters: {},
            dependencies: []
          },
          {
            id: 'step_2',
            description: 'This should not execute',
            tool: 'add',
            parameters: { a: 1, b: 1 },
            dependencies: ['step_1']
          }
        ],
        estimatedTime: 2
      };

      mockProvider.setMockResponse(JSON.stringify(mockPlan));

      const result = await executor.execute('Fail then add');

      expect(result.success).toBe(false);
      expect(result.completedSteps).toHaveLength(0);
      expect(result.failedSteps).toHaveLength(1);
      // step_2 should not be in either list because execution stopped
    });

    it('should handle planning errors', async () => {
      mockProvider.setMockResponse('Invalid JSON');

      const result = await executor.execute('Do something');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to parse plan');
      expect(result.completedSteps).toHaveLength(0);
    });

    it('should track metadata correctly', async () => {
      const mockPlan = {
        steps: [
          {
            id: 'step_1',
            description: 'Add',
            tool: 'add',
            parameters: { a: 1, b: 2 },
            dependencies: []
          },
          {
            id: 'step_2',
            description: 'Multiply',
            tool: 'multiply',
            parameters: { a: 3, b: 4 },
            dependencies: []
          }
        ],
        estimatedTime: 2
      };

      mockProvider.setMockResponse(JSON.stringify(mockPlan));

      const result = await executor.execute('Add and multiply');

      expect(result.metadata.totalTime).toBeGreaterThanOrEqual(0);
      expect(result.metadata.iterations).toBe(2);
      expect(result.metadata.toolsUsed).toHaveLength(2);
      expect(result.metadata.toolsUsed).toContain('add');
      expect(result.metadata.toolsUsed).toContain('multiply');
    });

    it('should respect max iterations', async () => {
      const shortExecutor = new AgentExecutor(planner, toolRegistry, {
        maxIterations: 1
      });

      const mockPlan = {
        steps: [
          {
            id: 'step_1',
            description: 'First',
            tool: 'add',
            parameters: { a: 1, b: 1 },
            dependencies: []
          },
          {
            id: 'step_2',
            description: 'Second',
            tool: 'add',
            parameters: { a: 2, b: 2 },
            dependencies: []
          }
        ],
        estimatedTime: 2
      };

      mockProvider.setMockResponse(JSON.stringify(mockPlan));

      const result = await shortExecutor.execute('Two steps');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Maximum iterations exceeded');
    });
  });
});
