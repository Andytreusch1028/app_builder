/**
 * DeepAgentsJS Type Definitions
 * Based on LangChain DeepAgentsJS middleware architecture
 */

export interface TodoItem {
  id: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  priority: 'low' | 'medium' | 'high';
  dependencies?: string[]; // IDs of tasks that must complete first
  createdAt: Date;
  completedAt?: Date;
  error?: string;
}

export interface TodoList {
  items: TodoItem[];
  currentTaskId?: string;
}

export interface FilesystemOperation {
  type: 'ls' | 'read_file' | 'write_file' | 'edit_file' | 'glob' | 'grep';
  path: string;
  content?: string;
  pattern?: string;
  options?: Record<string, any>;
}

export interface FilesystemResult {
  success: boolean;
  data?: any;
  error?: string;
  operation: FilesystemOperation;
}

export interface SubAgentTask {
  id: string;
  name: string;
  description: string;
  sopId?: string; // Reference to SOP workflow
  parameters?: Record<string, any>;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
}

export interface DeepAgentContext {
  taskId: string;
  userId?: string;
  workspaceRoot: string;
  todoList: TodoList;
  filesystemState: FilesystemState;
  subAgents: SubAgentTask[];
  metadata: Record<string, any>;
}

export interface FilesystemState {
  workingDirectory: string;
  recentFiles: string[];
  documentCache: Map<string, string>;
}

export interface DeepAgentConfig {
  workspaceRoot: string;
  maxTodoItems?: number;
  maxSubAgents?: number;
  enableAutoSummarization?: boolean;
  summarizationThreshold?: number; // Token count threshold (default: 170k)
  enableHITL?: boolean; // Human-in-the-loop
}

export interface DeepAgentExecutionResult {
  success: boolean;
  taskId: string;
  todoList: TodoList;
  completedTasks: TodoItem[];
  failedTasks: TodoItem[];
  artifacts: DeepAgentArtifact[];
  filesystemOperations: FilesystemOperation[];
  subAgentResults: SubAgentTask[];
  executionTime: number;
  error?: string;
}

export interface DeepAgentArtifact {
  type: 'file' | 'document' | 'code' | 'data';
  path: string;
  name: string;
  content?: string;
  metadata?: Record<string, any>;
}

export interface AnthropicHarnessConfig {
  useInitializerAgent?: boolean;
  useCodingAgent?: boolean;
  useFeatureLists?: boolean;
  useGitCommits?: boolean;
  useProgressFiles?: boolean;
}

export interface InitializerAgentResult {
  setupComplete: boolean;
  environment: Record<string, any>;
  dependencies: string[];
  configuration: Record<string, any>;
}

export interface CodingAgentStep {
  stepNumber: number;
  description: string;
  code?: string;
  testsPassed: boolean;
  incrementalProgress: boolean;
}

export interface FeatureList {
  features: string[];
  completed: string[];
  inProgress: string[];
  pending: string[];
}

export interface GitCommitState {
  commitHash?: string;
  message: string;
  files: string[];
  timestamp: Date;
}

export interface ProgressFile {
  path: string;
  content: string;
  lastUpdated: Date;
}

export interface LegalOpsWorkflowState {
  workflowId: string;
  workflowType: 'dba-filing' | 'entity-creation' | 'publication';
  currentStep: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  data: Record<string, any>;
  history: WorkflowHistoryEntry[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowHistoryEntry {
  step: string;
  timestamp: Date;
  action: string;
  result: 'success' | 'failure';
  data?: Record<string, any>;
}

