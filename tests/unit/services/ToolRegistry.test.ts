/**
 * Unit tests for ToolRegistry
 */

import { ToolRegistry } from '../../../src/services/ToolRegistry.js';
import { Tool, ToolResult } from '../../../src/types/agent.types.js';

describe('ToolRegistry', () => {
  let registry: ToolRegistry;

  beforeEach(() => {
    registry = new ToolRegistry();
  });

  describe('register', () => {
    it('should register a valid tool', () => {
      const tool: Tool = {
        name: 'test_tool',
        description: 'A test tool',
        parameters: {
          input: {
            type: 'string',
            description: 'Input string',
            required: true
          }
        },
        execute: async (params) => ({ success: true, output: params.input })
      };

      registry.register(tool);
      expect(registry.hasTool('test_tool')).toBe(true);
    });

    it('should throw error when registering duplicate tool', () => {
      const tool: Tool = {
        name: 'duplicate',
        description: 'A tool',
        parameters: {},
        execute: async () => ({ success: true })
      };

      registry.register(tool);
      expect(() => registry.register(tool)).toThrow("Tool 'duplicate' is already registered");
    });

    it('should throw error for invalid tool definition', () => {
      const invalidTool = {
        name: '',
        description: 'Invalid',
        parameters: {},
        execute: async () => ({ success: true })
      } as Tool;

      expect(() => registry.register(invalidTool)).toThrow('Tool name must be a non-empty string');
    });
  });

  describe('unregister', () => {
    it('should unregister an existing tool', () => {
      const tool: Tool = {
        name: 'removable',
        description: 'A tool',
        parameters: {},
        execute: async () => ({ success: true })
      };

      registry.register(tool);
      expect(registry.hasTool('removable')).toBe(true);
      
      const result = registry.unregister('removable');
      expect(result).toBe(true);
      expect(registry.hasTool('removable')).toBe(false);
    });

    it('should return false when unregistering non-existent tool', () => {
      const result = registry.unregister('nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('getTool', () => {
    it('should return tool by name', () => {
      const tool: Tool = {
        name: 'getter',
        description: 'A tool',
        parameters: {},
        execute: async () => ({ success: true })
      };

      registry.register(tool);
      const retrieved = registry.getTool('getter');
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('getter');
    });

    it('should return undefined for non-existent tool', () => {
      const retrieved = registry.getTool('nonexistent');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('listTools', () => {
    it('should list all registered tools', () => {
      const tool1: Tool = {
        name: 'tool1',
        description: 'First tool',
        parameters: {},
        execute: async () => ({ success: true })
      };

      const tool2: Tool = {
        name: 'tool2',
        description: 'Second tool',
        parameters: {},
        execute: async () => ({ success: true })
      };

      registry.register(tool1);
      registry.register(tool2);

      const tools = registry.listTools();
      expect(tools).toHaveLength(2);
      expect(tools.map(t => t.name)).toContain('tool1');
      expect(tools.map(t => t.name)).toContain('tool2');
    });

    it('should return empty array when no tools registered', () => {
      const tools = registry.listTools();
      expect(tools).toHaveLength(0);
    });
  });

  describe('execute', () => {
    it('should execute tool with valid parameters', async () => {
      const tool: Tool = {
        name: 'echo',
        description: 'Echo tool',
        parameters: {
          message: {
            type: 'string',
            description: 'Message to echo',
            required: true
          }
        },
        execute: async (params) => ({
          success: true,
          output: `Echo: ${params.message}`
        })
      };

      registry.register(tool);
      const result = await registry.execute('echo', { message: 'Hello' });

      expect(result.success).toBe(true);
      expect(result.output).toBe('Echo: Hello');
      expect(result.metadata?.executionTime).toBeGreaterThanOrEqual(0);
    });

    it('should return error for non-existent tool', async () => {
      const result = await registry.execute('nonexistent', {});

      expect(result.success).toBe(false);
      expect(result.error).toBe("Tool 'nonexistent' not found");
    });

    it('should validate required parameters', async () => {
      const tool: Tool = {
        name: 'required_param',
        description: 'Tool with required param',
        parameters: {
          required: {
            type: 'string',
            description: 'Required param',
            required: true
          }
        },
        execute: async () => ({ success: true })
      };

      registry.register(tool);
      const result = await registry.execute('required_param', {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required parameter');
    });

    it('should validate parameter types', async () => {
      const tool: Tool = {
        name: 'type_check',
        description: 'Tool with type checking',
        parameters: {
          count: {
            type: 'number',
            description: 'A number',
            required: true
          }
        },
        execute: async () => ({ success: true })
      };

      registry.register(tool);
      const result = await registry.execute('type_check', { count: 'not a number' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('must be of type number');
    });

    it('should validate enum parameters', async () => {
      const tool: Tool = {
        name: 'enum_check',
        description: 'Tool with enum',
        parameters: {
          mode: {
            type: 'string',
            description: 'Mode',
            required: true,
            enum: ['fast', 'slow']
          }
        },
        execute: async () => ({ success: true })
      };

      registry.register(tool);
      const result = await registry.execute('enum_check', { mode: 'invalid' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('must be one of');
    });

    it('should reject unexpected parameters', async () => {
      const tool: Tool = {
        name: 'strict',
        description: 'Strict tool',
        parameters: {
          allowed: {
            type: 'string',
            description: 'Allowed param',
            required: false
          }
        },
        execute: async () => ({ success: true })
      };

      registry.register(tool);
      const result = await registry.execute('strict', {
        allowed: 'ok',
        unexpected: 'not ok'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unexpected parameter');
    });

    it('should handle tool execution errors', async () => {
      const tool: Tool = {
        name: 'error_tool',
        description: 'Tool that throws',
        parameters: {},
        execute: async () => {
          throw new Error('Execution failed');
        }
      };

      registry.register(tool);
      const result = await registry.execute('error_tool', {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Execution failed');
      expect(result.metadata?.executionTime).toBeGreaterThanOrEqual(0);
    });

    it('should update execution statistics', async () => {
      const tool: Tool = {
        name: 'stats_tool',
        description: 'Tool for stats',
        parameters: {},
        execute: async () => ({ success: true })
      };

      registry.register(tool);

      await registry.execute('stats_tool', {});
      await registry.execute('stats_tool', {});

      const stats = registry.getStats('stats_tool');
      expect(stats?.totalExecutions).toBe(2);
      expect(stats?.successfulExecutions).toBe(2);
      expect(stats?.failedExecutions).toBe(0);
      expect(stats?.averageExecutionTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getStats', () => {
    it('should return stats for a tool', async () => {
      const tool: Tool = {
        name: 'stat_test',
        description: 'Test',
        parameters: {},
        execute: async () => ({ success: true })
      };

      registry.register(tool);
      await registry.execute('stat_test', {});

      const stats = registry.getStats('stat_test');
      expect(stats).toBeDefined();
      expect(stats?.totalExecutions).toBe(1);
    });

    it('should return undefined for non-existent tool', () => {
      const stats = registry.getStats('nonexistent');
      expect(stats).toBeUndefined();
    });
  });

  describe('getAllStats', () => {
    it('should return all statistics', async () => {
      const tool1: Tool = {
        name: 'tool1',
        description: 'First',
        parameters: {},
        execute: async () => ({ success: true })
      };

      const tool2: Tool = {
        name: 'tool2',
        description: 'Second',
        parameters: {},
        execute: async () => ({ success: true })
      };

      registry.register(tool1);
      registry.register(tool2);

      await registry.execute('tool1', {});
      await registry.execute('tool2', {});

      const allStats = registry.getAllStats();
      expect(Object.keys(allStats)).toHaveLength(2);
      expect(allStats['tool1']).toBeDefined();
      expect(allStats['tool2']).toBeDefined();
    });
  });
});
