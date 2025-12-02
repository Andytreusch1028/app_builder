import { AgentExecutor } from '../../src/services/AgentExecutor.js';
import { PlannerService } from '../../src/services/PlannerService.js';
import { ToolRegistry } from '../../src/services/ToolRegistry.js';
import { FileSystemService } from '../../src/services/FileSystemService.js';
import { ICloudProvider } from '../../src/providers/ICloudProvider.js';
import { GenerateResponse } from '../../src/types/compute.types.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

// Mock provider for integration tests
class MockCloudProvider implements ICloudProvider {
  name = 'mock-cloud';
  private planResponse: string = '';

  setPlanResponse(response: string) {
    this.planResponse = response;
  }

  async generateText(): Promise<GenerateResponse> {
    return {
      text: this.planResponse,
      model: 'mock-model',
      provider: 'mock',
      tokensUsed: { input: 100, output: 200, total: 300 },
      cost: 0.01,
      latency: 500
    };
  }

  async streamText(): Promise<GenerateResponse> {
    return this.generateText();
  }

  getModelInfo() {
    return {
      name: 'mock-model',
      provider: 'mock',
      contextWindow: 8192,
      maxOutputTokens: 4096,
      costPer1kInputTokens: 0.01,
      costPer1kOutputTokens: 0.02
    };
  }

  isAvailable(): boolean {
    return true;
  }

  estimateCost(): number {
    return 0.01;
  }
}

describe('Agent Integration Tests', () => {
  let tempDir: string;
  let toolRegistry: ToolRegistry;
  let mockProvider: MockCloudProvider;
  let planner: PlannerService;
  let executor: AgentExecutor;
  let fileService: FileSystemService;

  beforeEach(async () => {
    // Create temporary workspace
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'agent-test-'));

    // Initialize services
    toolRegistry = new ToolRegistry();
    mockProvider = new MockCloudProvider();
    planner = new PlannerService(mockProvider, toolRegistry);
    executor = new AgentExecutor(planner, toolRegistry);
    fileService = new FileSystemService({ workspaceRoot: tempDir });

    // Register file system tools
    toolRegistry.register({
      name: 'write_file',
      description: 'Write content to a file',
      parameters: {
        path: { type: 'string', required: true, description: 'File path' },
        content: { type: 'string', required: true, description: 'File content' }
      },
      execute: async (params) => {
        await fileService.writeFile(params.path as string, params.content as string);
        return { success: true, output: `File written: ${params.path}` };
      }
    });

    // Register a special tool to convert numbers to strings
    toolRegistry.register({
      name: 'to_string',
      description: 'Convert a value to string',
      parameters: {
        value: { type: 'number', required: true, description: 'Value to convert' }
      },
      execute: async (params) => {
        return { success: true, output: String(params.value) };
      }
    });

    toolRegistry.register({
      name: 'read_file',
      description: 'Read content from a file',
      parameters: {
        path: { type: 'string', required: true, description: 'File path' }
      },
      execute: async (params) => {
        const content = await fileService.readFile(params.path as string);
        return { success: true, output: content };
      }
    });

    toolRegistry.register({
      name: 'list_files',
      description: 'List files in a directory',
      parameters: {
        path: { type: 'string', required: false, description: 'Directory path' }
      },
      execute: async (params) => {
        const files = await fileService.listFiles(params.path as string || '.');
        return { success: true, output: files };
      }
    });

    toolRegistry.register({
      name: 'calculate',
      description: 'Perform a calculation',
      parameters: {
        expression: { type: 'string', required: true, description: 'Math expression' }
      },
      execute: async (params) => {
        // Simple eval for testing (never use in production!)
        const result = eval(params.expression as string);
        return { success: true, output: result };
      }
    });
  });

  afterEach(async () => {
    // Clean up temp directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('End-to-End Agent Execution', () => {
    it('should execute a simple file creation task', async () => {
      // Set up plan
      const plan = {
        steps: [
          {
            id: 'step_1',
            description: 'Create a hello.txt file',
            tool: 'write_file',
            parameters: { path: 'hello.txt', content: 'Hello, World!' },
            status: 'pending' as const
          }
        ]
      };

      mockProvider.setPlanResponse(JSON.stringify(plan));

      // Execute task
      const result = await executor.execute('Create a hello.txt file with "Hello, World!"');

      // Verify execution
      expect(result.success).toBe(true);
      expect(result.completedSteps).toHaveLength(1);
      expect(result.failedSteps).toHaveLength(0);

      // Verify file was created
      const fileExists = await fileService.fileExists('hello.txt');
      expect(fileExists).toBe(true);

      const content = await fileService.readFile('hello.txt');
      expect(content).toBe('Hello, World!');
    });

    it('should execute multi-step task with dependencies', async () => {
      // Set up plan with dependencies
      const plan = {
        steps: [
          {
            id: 'step_1',
            description: 'Calculate result',
            tool: 'calculate',
            parameters: { expression: '10 + 20' },
            status: 'pending' as const,
            dependencies: []
          },
          {
            id: 'step_2',
            description: 'Convert to string',
            tool: 'to_string',
            parameters: { value: '$step_1' },
            status: 'pending' as const,
            dependencies: ['step_1']
          },
          {
            id: 'step_3',
            description: 'Write result to file',
            tool: 'write_file',
            parameters: { path: 'result.txt', content: '$step_2' },
            status: 'pending' as const,
            dependencies: ['step_2']
          }
        ],
        estimatedTime: 5
      };

      mockProvider.setPlanResponse(JSON.stringify(plan));

      // Execute task
      const result = await executor.execute('Calculate 10 + 20 and save to result.txt');

      // Debug output
      if (!result.success) {
        console.log('Execution failed:', result.error);
        console.log('Failed steps:', result.failedSteps.map(s => ({ id: s.id, error: s.result?.error })));
        console.log('Completed steps:', result.completedSteps.map(s => ({ id: s.id, output: s.result?.output })));
      }

      // Verify execution
      expect(result.success).toBe(true);
      expect(result.completedSteps).toHaveLength(3);
      expect(result.failedSteps).toHaveLength(0);

      // Verify file contains calculation result
      const content = await fileService.readFile('result.txt');
      expect(content).toBe('30'); // Should be string "30" from number 30
    });

    it('should handle complex multi-file workflow', async () => {
      // Set up complex plan
      const plan = {
        steps: [
          {
            id: 'step_1',
            description: 'Create config file',
            tool: 'write_file',
            parameters: { path: 'config.json', content: '{"version": "1.0"}' },
            status: 'pending' as const
          },
          {
            id: 'step_2',
            description: 'Create readme file',
            tool: 'write_file',
            parameters: { path: 'README.md', content: '# My Project' },
            status: 'pending' as const
          },
          {
            id: 'step_3',
            description: 'List all files',
            tool: 'list_files',
            parameters: { path: '.' },
            status: 'pending' as const,
            dependencies: ['step_1', 'step_2']
          }
        ]
      };

      mockProvider.setPlanResponse(JSON.stringify(plan));

      // Execute task
      const result = await executor.execute('Create project structure with config and readme');

      // Verify execution
      expect(result.success).toBe(true);
      expect(result.completedSteps).toHaveLength(3);
      expect(result.failedSteps).toHaveLength(0);

      // Verify files exist
      expect(await fileService.fileExists('config.json')).toBe(true);
      expect(await fileService.fileExists('README.md')).toBe(true);

      // Verify list_files result
      const lastStep = result.completedSteps[2];
      expect(lastStep.result?.success).toBe(true);
      expect(lastStep.result?.output).toContain('config.json');
      expect(lastStep.result?.output).toContain('README.md');
    });

    it('should handle partial failures gracefully', async () => {
      // Set up plan with a failing step
      const plan = {
        steps: [
          {
            id: 'step_1',
            description: 'Create valid file',
            tool: 'write_file',
            parameters: { path: 'valid.txt', content: 'Valid content' },
            status: 'pending' as const
          },
          {
            id: 'step_2',
            description: 'Read non-existent file',
            tool: 'read_file',
            parameters: { path: 'nonexistent.txt' },
            status: 'pending' as const
          },
          {
            id: 'step_3',
            description: 'Create another file',
            tool: 'write_file',
            parameters: { path: 'another.txt', content: 'Another content' },
            status: 'pending' as const
          }
        ]
      };

      mockProvider.setPlanResponse(JSON.stringify(plan));

      // Execute task
      const result = await executor.execute('Create files and read one');

      // Verify partial execution
      expect(result.success).toBe(false);
      expect(result.completedSteps.length).toBeGreaterThan(0);
      expect(result.failedSteps.length).toBeGreaterThan(0);

      // Verify first file was created
      expect(await fileService.fileExists('valid.txt')).toBe(true);
    });

    it('should track execution metadata', async () => {
      const plan = {
        steps: [
          {
            id: 'step_1',
            description: 'Simple calculation',
            tool: 'calculate',
            parameters: { expression: '5 * 5' },
            status: 'pending' as const
          }
        ]
      };

      mockProvider.setPlanResponse(JSON.stringify(plan));

      const result = await executor.execute('Calculate 5 * 5');

      // Verify metadata
      expect(result.metadata).toBeDefined();
      expect(result.metadata.totalTime).toBeGreaterThanOrEqual(0); // Can be 0 for very fast execution
      expect(result.metadata.iterations).toBe(1); // One iteration
      expect(result.metadata.toolsUsed).toContain('calculate');
    });
  });

  describe('Tool Registry Integration', () => {
    it('should validate tool parameters before execution', async () => {
      const plan = {
        steps: [
          {
            id: 'step_1',
            description: 'Write file with missing parameter',
            tool: 'write_file',
            parameters: { path: 'test.txt' }, // Missing 'content' parameter
            status: 'pending' as const
          }
        ]
      };

      mockProvider.setPlanResponse(JSON.stringify(plan));

      const result = await executor.execute('Write file');

      // Should fail due to missing parameter
      expect(result.success).toBe(false);
      expect(result.failedSteps).toHaveLength(1);
    });

    it('should list all available tools', () => {
      const tools = toolRegistry.listTools();

      expect(tools).toHaveLength(5);
      expect(tools.map(t => t.name)).toContain('write_file');
      expect(tools.map(t => t.name)).toContain('read_file');
      expect(tools.map(t => t.name)).toContain('list_files');
      expect(tools.map(t => t.name)).toContain('calculate');
      expect(tools.map(t => t.name)).toContain('to_string');
    });

    it('should track tool execution statistics', async () => {
      const plan = {
        steps: [
          {
            id: 'step_1',
            description: 'Calculate',
            tool: 'calculate',
            parameters: { expression: '1 + 1' },
            status: 'pending' as const
          }
        ]
      };

      mockProvider.setPlanResponse(JSON.stringify(plan));

      await executor.execute('Calculate 1 + 1');

      const stats = toolRegistry.getStats('calculate');
      expect(stats).toBeDefined();
      expect(stats!.totalExecutions).toBe(1);
      expect(stats!.successfulExecutions).toBe(1);
      expect(stats!.failedExecutions).toBe(0);
    });
  });
});

