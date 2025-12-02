/**
 * DeepAgentsService - Core DeepAgentsJS harness
 * Integrates TodoList, Filesystem, and SubAgent middleware
 * Based on LangChain DeepAgentsJS architecture
 */

import {
  DeepAgentConfig,
  DeepAgentContext,
  DeepAgentExecutionResult,
  DeepAgentArtifact
} from '../types/deepagents.types.js';
import { TodoListMiddleware } from '../middleware/TodoListMiddleware.js';
import { FilesystemMiddleware } from '../middleware/FilesystemMiddleware.js';
import { SubAgentMiddleware, SOPExecutor } from '../middleware/SubAgentMiddleware.js';
import { FilesystemContextService } from './FilesystemContextService.js';
import { AnthropicHarnessService } from './AnthropicHarnessService.js';
import { FileSystemService } from './FileSystemService.js';
import { ICloudProvider } from '../providers/ICloudProvider.js';
import { randomUUID } from 'crypto';

export class DeepAgentsService {
  private config: DeepAgentConfig;
  private provider: ICloudProvider;
  private fileSystemService: FileSystemService;
  private todoMiddleware: TodoListMiddleware;
  private filesystemMiddleware: FilesystemMiddleware;
  private subAgentMiddleware: SubAgentMiddleware;
  private contextService: FilesystemContextService;
  private harnessService: AnthropicHarnessService;

  constructor(
    provider: ICloudProvider,
    fileSystemService: FileSystemService,
    config: DeepAgentConfig,
    sopExecutor?: SOPExecutor
  ) {
    this.provider = provider;
    this.fileSystemService = fileSystemService;
    this.config = {
      workspaceRoot: config.workspaceRoot,
      maxTodoItems: config.maxTodoItems ?? 50,
      maxSubAgents: config.maxSubAgents ?? 10,
      enableAutoSummarization: config.enableAutoSummarization ?? true,
      summarizationThreshold: config.summarizationThreshold ?? 170000,
      enableHITL: config.enableHITL ?? false
    };

    // Initialize middleware
    this.todoMiddleware = new TodoListMiddleware(this.config.maxTodoItems);
    this.filesystemMiddleware = new FilesystemMiddleware(
      this.config.workspaceRoot,
      this.fileSystemService
    );
    this.subAgentMiddleware = new SubAgentMiddleware(
      this.config.maxSubAgents,
      sopExecutor
    );

    // Initialize services
    this.contextService = new FilesystemContextService(
      this.config.workspaceRoot,
      this.fileSystemService
    );
    this.harnessService = new AnthropicHarnessService(
      this.provider,
      {
        useInitializerAgent: true,
        useCodingAgent: true,
        useFeatureLists: true,
        useProgressFiles: true
      },
      this.filesystemMiddleware
    );
  }

  /**
   * Execute a task using DeepAgentsJS harness
   */
  async execute(userTask: string, userId?: string): Promise<DeepAgentExecutionResult> {
    const startTime = Date.now();
    const taskId = randomUUID();

    // Create execution context
    const context: DeepAgentContext = {
      taskId,
      userId,
      workspaceRoot: this.config.workspaceRoot,
      todoList: this.todoMiddleware.getTodoList(),
      filesystemState: this.filesystemMiddleware.getState(),
      subAgents: this.subAgentMiddleware.getAllSubAgents(),
      metadata: {}
    };

    try {
      // Step 1: Run Initializer Agent
      const initResult = await this.harnessService.runInitializerAgent(userTask);
      console.log('🔧 Initializer Agent:', initResult);

      // Step 2: Break down task into features
      const features = await this.breakDownTask(userTask);
      features.forEach(feature => this.harnessService.addFeature(feature));

      // Step 3: Create todo items for each feature
      for (const feature of features) {
        this.todoMiddleware.addTodo(feature, 'medium');
      }

      // Step 4: Execute todo items
      let nextTask = this.todoMiddleware.getNextTask();
      while (nextTask) {
        this.harnessService.startFeature(nextTask.description);
        this.todoMiddleware.startTask(nextTask.id);

        try {
          // Execute the task
          await this.executeTask(nextTask.description, context);
          
          this.todoMiddleware.completeTask(nextTask.id);
          this.harnessService.completeFeature(nextTask.description);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          this.todoMiddleware.failTask(nextTask.id, errorMsg);
        }

        nextTask = this.todoMiddleware.getNextTask();
      }

      // Step 5: Collect results
      const completedTasks = this.todoMiddleware.getCompletedTasks();
      const failedTasks = this.todoMiddleware.getFailedTasks();
      const artifacts = await this.collectArtifacts();

      return {
        success: failedTasks.length === 0,
        taskId,
        todoList: this.todoMiddleware.getTodoList(),
        completedTasks,
        failedTasks,
        artifacts,
        filesystemOperations: [],
        subAgentResults: this.subAgentMiddleware.getAllSubAgents(),
        executionTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        taskId,
        todoList: this.todoMiddleware.getTodoList(),
        completedTasks: [],
        failedTasks: [],
        artifacts: [],
        filesystemOperations: [],
        subAgentResults: [],
        executionTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Break down task into features
   */
  private async breakDownTask(task: string): Promise<string[]> {
    const prompt = `Break down this task into 3-7 concrete features/steps:

Task: ${task}

Return a JSON array of feature descriptions:
["feature 1", "feature 2", ...]`;

    const response = await this.provider.generateText(prompt, {
      temperature: 0.3,
      maxTokens: 500
    });

    try {
      return JSON.parse(response.text);
    } catch {
      return [task]; // Fallback to single task
    }
  }

  /**
   * Execute a single task
   */
  private async executeTask(task: string, context: DeepAgentContext): Promise<void> {
    // Placeholder for task execution logic
    // In a full implementation, this would use the provider to generate and execute code
    console.log(`Executing task: ${task}`);
  }

  /**
   * Collect artifacts from execution
   */
  private async collectArtifacts(): Promise<DeepAgentArtifact[]> {
    const recentFiles = this.filesystemMiddleware.getRecentFiles();
    const artifacts: DeepAgentArtifact[] = [];

    for (const filePath of recentFiles.slice(0, 10)) {
      artifacts.push({
        type: 'file',
        path: filePath,
        name: filePath.split('/').pop() || filePath
      });
    }

    return artifacts;
  }

  /**
   * Get middleware instances
   */
  getMiddleware() {
    return {
      todo: this.todoMiddleware,
      filesystem: this.filesystemMiddleware,
      subAgent: this.subAgentMiddleware
    };
  }

  /**
   * Get services
   */
  getServices() {
    return {
      context: this.contextService,
      harness: this.harnessService
    };
  }
}

