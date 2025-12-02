/**
 * SubAgentMiddleware - Workflow delegation for DeepAgentsJS
 * Manages sub-agents that execute SOPs and specialized tasks
 */

import { SubAgentTask } from '../types/deepagents.types.js';
import { randomUUID } from 'crypto';

export interface SOPExecutor {
  execute(sopId: string, parameters: Record<string, any>): Promise<any>;
}

export class SubAgentMiddleware {
  private subAgents: SubAgentTask[];
  private maxSubAgents: number;
  private sopExecutor?: SOPExecutor;

  constructor(maxSubAgents: number = 10, sopExecutor?: SOPExecutor) {
    this.maxSubAgents = maxSubAgents;
    this.subAgents = [];
    this.sopExecutor = sopExecutor;
  }

  /**
   * Create a new sub-agent task
   */
  createSubAgent(
    name: string,
    description: string,
    sopId?: string,
    parameters?: Record<string, any>
  ): SubAgentTask {
    if (this.subAgents.length >= this.maxSubAgents) {
      throw new Error(`Maximum number of sub-agents reached (${this.maxSubAgents})`);
    }

    const task: SubAgentTask = {
      id: randomUUID(),
      name,
      description,
      sopId,
      parameters,
      status: 'pending'
    };

    this.subAgents.push(task);
    return task;
  }

  /**
   * Execute a sub-agent task
   */
  async executeSubAgent(taskId: string): Promise<void> {
    const task = this.subAgents.find(t => t.id === taskId);
    if (!task) {
      throw new Error(`Sub-agent task ${taskId} not found`);
    }

    task.status = 'running';

    try {
      let result: any;

      if (task.sopId && this.sopExecutor) {
        // Execute SOP workflow
        result = await this.sopExecutor.execute(task.sopId, task.parameters || {});
      } else {
        // Generic task execution (placeholder)
        result = { message: 'Task executed without SOP' };
      }

      task.result = result;
      task.status = 'completed';
    } catch (error) {
      task.error = error instanceof Error ? error.message : String(error);
      task.status = 'failed';
    }
  }

  /**
   * Get sub-agent by ID
   */
  getSubAgent(taskId: string): SubAgentTask | undefined {
    return this.subAgents.find(t => t.id === taskId);
  }

  /**
   * Get all sub-agents
   */
  getAllSubAgents(): SubAgentTask[] {
    return [...this.subAgents];
  }

  /**
   * Get pending sub-agents
   */
  getPendingSubAgents(): SubAgentTask[] {
    return this.subAgents.filter(t => t.status === 'pending');
  }

  /**
   * Get running sub-agents
   */
  getRunningSubAgents(): SubAgentTask[] {
    return this.subAgents.filter(t => t.status === 'running');
  }

  /**
   * Get completed sub-agents
   */
  getCompletedSubAgents(): SubAgentTask[] {
    return this.subAgents.filter(t => t.status === 'completed');
  }

  /**
   * Get failed sub-agents
   */
  getFailedSubAgents(): SubAgentTask[] {
    return this.subAgents.filter(t => t.status === 'failed');
  }

  /**
   * Get progress summary
   */
  getProgress(): {
    total: number;
    pending: number;
    running: number;
    completed: number;
    failed: number;
  } {
    return {
      total: this.subAgents.length,
      pending: this.subAgents.filter(t => t.status === 'pending').length,
      running: this.subAgents.filter(t => t.status === 'running').length,
      completed: this.subAgents.filter(t => t.status === 'completed').length,
      failed: this.subAgents.filter(t => t.status === 'failed').length
    };
  }

  /**
   * Clear completed sub-agents
   */
  clearCompleted(): void {
    this.subAgents = this.subAgents.filter(t => t.status !== 'completed');
  }

  /**
   * Reset all sub-agents
   */
  reset(): void {
    this.subAgents = [];
  }

  /**
   * Set SOP executor
   */
  setSOPExecutor(executor: SOPExecutor): void {
    this.sopExecutor = executor;
  }
}

