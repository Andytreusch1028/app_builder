/**
 * Tool Registry - Register and execute tools with validation
 */

import { Tool, ToolParameter, ToolResult } from '../types/agent.types.js';
import { ProviderOrchestrator } from './ProviderOrchestrator.js';

export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();
  private executionStats: Map<string, {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    averageExecutionTime: number;
  }> = new Map();
  private orchestrator?: ProviderOrchestrator;

  /**
   * Set orchestrator for technology tracking
   */
  setOrchestrator(orchestrator: ProviderOrchestrator): void {
    this.orchestrator = orchestrator;
  }

  /**
   * Register a tool
   */
  register(tool: Tool): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool '${tool.name}' is already registered`);
    }

    // Validate tool definition
    this.validateToolDefinition(tool);

    this.tools.set(tool.name, tool);
    
    // Initialize stats
    this.executionStats.set(tool.name, {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      averageExecutionTime: 0
    });
  }

  /**
   * Unregister a tool
   */
  unregister(toolName: string): boolean {
    const deleted = this.tools.delete(toolName);
    if (deleted) {
      this.executionStats.delete(toolName);
    }
    return deleted;
  }

  /**
   * Get a tool by name
   */
  getTool(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  /**
   * List all registered tools
   */
  listTools(): Tool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Check if a tool exists
   */
  hasTool(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * Execute a tool with parameter validation
   */
  async execute(toolName: string, params: Record<string, any>): Promise<ToolResult> {
    // Track Tool Registry technology usage
    if (this.orchestrator) {
      this.orchestrator.trackTechnology('TOOL_REGISTRY');

      // Track specific tool technologies
      const toolTechMap: Record<string, string> = {
        'create_file': 'FILE_OPERATIONS',
        'read_file': 'FILE_OPERATIONS',
        'update_file': 'FILE_OPERATIONS',
        'delete_file': 'FILE_OPERATIONS',
        'list_files': 'FILE_OPERATIONS',
        'execute_code': 'CODE_EXECUTION',
        'run_shell': 'SHELL_SERVICE'
      };

      const techName = toolTechMap[toolName];
      if (techName) {
        this.orchestrator.trackTechnology(techName);
      }
    }

    const tool = this.tools.get(toolName);

    if (!tool) {
      return {
        success: false,
        error: `Tool '${toolName}' not found`
      };
    }

    // Validate parameters
    const validationError = this.validateParameters(tool, params);
    if (validationError) {
      return {
        success: false,
        error: validationError
      };
    }

    // Execute tool with timing
    const startTime = Date.now();
    let result: ToolResult;

    try {
      result = await tool.execute(params);
      
      // Update stats
      const stats = this.executionStats.get(toolName)!;
      stats.totalExecutions++;
      if (result.success) {
        stats.successfulExecutions++;
      } else {
        stats.failedExecutions++;
      }
      
      const executionTime = Date.now() - startTime;
      stats.averageExecutionTime = 
        (stats.averageExecutionTime * (stats.totalExecutions - 1) + executionTime) / stats.totalExecutions;
      
      // Add execution time to result metadata
      result.metadata = {
        ...result.metadata,
        executionTime
      };
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      // Update stats
      const stats = this.executionStats.get(toolName)!;
      stats.totalExecutions++;
      stats.failedExecutions++;
      
      result = {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        metadata: { executionTime }
      };
    }

    return result;
  }

  /**
   * Get execution statistics for a tool
   */
  getStats(toolName: string) {
    return this.executionStats.get(toolName);
  }

  /**
   * Get all execution statistics
   */
  getAllStats() {
    return Object.fromEntries(this.executionStats);
  }

  /**
   * Validate tool definition
   */
  private validateToolDefinition(tool: Tool): void {
    if (!tool.name || typeof tool.name !== 'string') {
      throw new Error('Tool name must be a non-empty string');
    }

    if (!tool.description || typeof tool.description !== 'string') {
      throw new Error('Tool description must be a non-empty string');
    }

    if (!tool.parameters || typeof tool.parameters !== 'object') {
      throw new Error('Tool parameters must be an object');
    }

    if (typeof tool.execute !== 'function') {
      throw new Error('Tool execute must be a function');
    }
  }

  /**
   * Validate parameters against tool definition
   */
  private validateParameters(tool: Tool, params: Record<string, any>): string | null {
    // Check required parameters
    for (const [paramName, paramDef] of Object.entries(tool.parameters)) {
      if (paramDef.required && !(paramName in params)) {
        return `Missing required parameter: ${paramName}`;
      }

      // Skip validation if parameter not provided and not required
      if (!(paramName in params)) {
        continue;
      }

      const value = params[paramName];

      // Type validation
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (actualType !== paramDef.type && value !== null && value !== undefined) {
        return `Parameter '${paramName}' must be of type ${paramDef.type}, got ${actualType}`;
      }

      // Enum validation
      if (paramDef.enum && !paramDef.enum.includes(value)) {
        return `Parameter '${paramName}' must be one of: ${paramDef.enum.join(', ')}`;
      }
    }

    // Check for unexpected parameters
    for (const paramName of Object.keys(params)) {
      if (!(paramName in tool.parameters)) {
        return `Unexpected parameter: ${paramName}`;
      }
    }

    return null;
  }
}

