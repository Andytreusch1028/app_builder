/**
 * Unit tests for PlannerService
 */

import { PlannerService } from '../../../src/services/PlannerService.js';
import { ToolRegistry } from '../../../src/services/ToolRegistry.js';
import { ICloudProvider } from '../../../src/providers/ICloudProvider.js';
import { GenerateResponse } from '../../../src/types/compute.types.js';
import { Tool } from '../../../src/types/agent.types.js';

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

describe('PlannerService', () => {
  let planner: PlannerService;
  let toolRegistry: ToolRegistry;
  let mockProvider: MockProvider;

  beforeEach(() => {
    toolRegistry = new ToolRegistry();
    mockProvider = new MockProvider();
    planner = new PlannerService(mockProvider, toolRegistry);

    // Register some test tools
    const readFileTool: Tool = {
      name: 'read_file',
      description: 'Read a file',
      parameters: {
        path: { type: 'string', description: 'File path', required: true }
      },
      execute: async () => ({ success: true })
    };

    const writeFileTool: Tool = {
      name: 'write_file',
      description: 'Write to a file',
      parameters: {
        path: { type: 'string', description: 'File path', required: true },
        content: { type: 'string', description: 'File content', required: true }
      },
      execute: async () => ({ success: true })
    };

    toolRegistry.register(readFileTool);
    toolRegistry.register(writeFileTool);
  });

  describe('generatePlan', () => {
    it('should generate a valid execution plan', async () => {
      const mockPlan = {
        steps: [
          {
            id: 'step_1',
            description: 'Read the file',
            tool: 'read_file',
            parameters: { path: 'test.txt' },
            dependencies: []
          },
          {
            id: 'step_2',
            description: 'Write to file',
            tool: 'write_file',
            parameters: { path: 'output.txt', content: 'Hello' },
            dependencies: ['step_1']
          }
        ],
        estimatedTime: 5
      };

      mockProvider.setMockResponse(JSON.stringify(mockPlan));

      const plan = await planner.generatePlan('Copy test.txt to output.txt');

      expect(plan.steps).toHaveLength(2);
      expect(plan.steps[0].id).toBe('step_1');
      expect(plan.steps[0].status).toBe('pending');
      expect(plan.steps[1].dependencies).toContain('step_1');
      expect(plan.estimatedTime).toBe(5);
    });

    it('should handle markdown code blocks in response', async () => {
      const mockPlan = {
        steps: [
          {
            id: 'step_1',
            description: 'Read file',
            tool: 'read_file',
            parameters: { path: 'test.txt' },
            dependencies: []
          }
        ],
        estimatedTime: 2
      };

      const markdownResponse = '```json\n' + JSON.stringify(mockPlan, null, 2) + '\n```';
      mockProvider.setMockResponse(markdownResponse);

      const plan = await planner.generatePlan('Read a file');

      expect(plan.steps).toHaveLength(1);
      expect(plan.steps[0].id).toBe('step_1');
    });

    it('should throw error for invalid JSON', async () => {
      mockProvider.setMockResponse('This is not JSON');

      await expect(planner.generatePlan('Do something'))
        .rejects.toThrow('Failed to parse plan');
    });

    it('should throw error for plan with non-existent tool', async () => {
      const invalidPlan = {
        steps: [
          {
            id: 'step_1',
            description: 'Use invalid tool',
            tool: 'nonexistent_tool',
            parameters: {},
            dependencies: []
          }
        ],
        estimatedTime: 1
      };

      mockProvider.setMockResponse(JSON.stringify(invalidPlan));

      await expect(planner.generatePlan('Do something'))
        .rejects.toThrow("Tool 'nonexistent_tool' not found");
    });

    it('should throw error for plan with non-existent dependency', async () => {
      const invalidPlan = {
        steps: [
          {
            id: 'step_1',
            description: 'Step with invalid dependency',
            tool: 'read_file',
            parameters: { path: 'test.txt' },
            dependencies: ['nonexistent_step']
          }
        ],
        estimatedTime: 1
      };

      mockProvider.setMockResponse(JSON.stringify(invalidPlan));

      await expect(planner.generatePlan('Do something'))
        .rejects.toThrow("Dependency 'nonexistent_step' not found");
    });

    it('should throw error for circular dependencies', async () => {
      const circularPlan = {
        steps: [
          {
            id: 'step_1',
            description: 'First step',
            tool: 'read_file',
            parameters: { path: 'test.txt' },
            dependencies: ['step_2']
          },
          {
            id: 'step_2',
            description: 'Second step',
            tool: 'write_file',
            parameters: { path: 'output.txt', content: 'test' },
            dependencies: ['step_1']
          }
        ],
        estimatedTime: 5
      };

      mockProvider.setMockResponse(JSON.stringify(circularPlan));

      await expect(planner.generatePlan('Do something'))
        .rejects.toThrow('circular dependencies');
    });

    it('should throw error for empty plan', async () => {
      const emptyPlan = {
        steps: [],
        estimatedTime: 0
      };

      mockProvider.setMockResponse(JSON.stringify(emptyPlan));

      await expect(planner.generatePlan('Do something'))
        .rejects.toThrow('Plan must have at least one step');
    });

    it('should build dependency map correctly', async () => {
      const mockPlan = {
        steps: [
          {
            id: 'step_1',
            description: 'First',
            tool: 'read_file',
            parameters: { path: 'a.txt' },
            dependencies: []
          },
          {
            id: 'step_2',
            description: 'Second',
            tool: 'read_file',
            parameters: { path: 'b.txt' },
            dependencies: []
          },
          {
            id: 'step_3',
            description: 'Third',
            tool: 'write_file',
            parameters: { path: 'c.txt', content: 'merged' },
            dependencies: ['step_1', 'step_2']
          }
        ],
        estimatedTime: 10
      };

      mockProvider.setMockResponse(JSON.stringify(mockPlan));

      const plan = await planner.generatePlan('Merge files');

      expect(plan.dependencies.size).toBe(1);
      expect(plan.dependencies.get('step_3')).toEqual(['step_1', 'step_2']);
    });
  });
});
