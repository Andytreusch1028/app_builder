/**
 * Type definitions for agent system
 */

/**
 * Tool parameter definition
 */
export interface ToolParameter {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required: boolean;
  default?: any;
  enum?: any[];
}

/**
 * Tool execution result
 */
export interface ToolResult {
  success: boolean;
  output?: any;
  error?: string;
  metadata?: {
    executionTime?: number;
    [key: string]: any;
  };
}

/**
 * Tool definition
 */
export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, ToolParameter>;
  execute: (params: Record<string, any>) => Promise<ToolResult>;
}

/**
 * Task step in execution plan
 */
export interface TaskStep {
  id: string;
  description: string;
  tool: string;
  parameters: Record<string, any>;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: ToolResult;
  dependencies?: string[];
}

/**
 * Execution plan
 */
export interface ExecutionPlan {
  steps: TaskStep[];
  dependencies: Map<string, string[]>;
  estimatedTime?: number;
  metadata?: Record<string, any>;
}

/**
 * Agent execution context
 */
export interface AgentContext {
  taskId: string;
  userId?: string;
  workspaceRoot: string;
  maxIterations: number;
  currentIteration: number;
  state: Record<string, any>;
}

/**
 * Artifact (created file) definition
 */
export interface Artifact {
  path: string;
  name: string;
  content: string;
  type: string;
  createdBy: string;
}

/**
 * Agent execution result
 */
export interface AgentExecutionResult {
  success: boolean;
  plan: ExecutionPlan;
  completedSteps: TaskStep[];
  failedSteps: TaskStep[];
  output?: any;
  error?: string;
  artifacts?: Artifact[];
  metadata: {
    totalTime: number;
    iterations: number;
    toolsUsed: string[];
  };
}

