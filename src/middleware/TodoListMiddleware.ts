/**
 * TodoListMiddleware - Planning and task management for DeepAgentsJS
 * Maintains a dynamic todo list that agents can update during execution
 */

import { TodoItem, TodoList } from '../types/deepagents.types.js';
import { randomUUID } from 'crypto';

export class TodoListMiddleware {
  private todoList: TodoList;
  private maxItems: number;

  constructor(maxItems: number = 50) {
    this.maxItems = maxItems;
    this.todoList = {
      items: [],
      currentTaskId: undefined
    };
  }

  /**
   * Add a new todo item
   */
  addTodo(description: string, priority: 'low' | 'medium' | 'high' = 'medium', dependencies?: string[]): TodoItem {
    if (this.todoList.items.length >= this.maxItems) {
      throw new Error(`Todo list is full (max ${this.maxItems} items)`);
    }

    const item: TodoItem = {
      id: randomUUID(),
      description,
      status: 'pending',
      priority,
      dependencies,
      createdAt: new Date()
    };

    this.todoList.items.push(item);
    return item;
  }

  /**
   * Get next available task (respecting dependencies)
   */
  getNextTask(): TodoItem | null {
    const pendingTasks = this.todoList.items.filter(item => item.status === 'pending');

    for (const task of pendingTasks) {
      if (this.areDependenciesMet(task)) {
        return task;
      }
    }

    return null;
  }

  /**
   * Check if task dependencies are satisfied
   */
  private areDependenciesMet(task: TodoItem): boolean {
    if (!task.dependencies || task.dependencies.length === 0) {
      return true;
    }

    return task.dependencies.every(depId => {
      const depTask = this.todoList.items.find(t => t.id === depId);
      return depTask?.status === 'completed';
    });
  }

  /**
   * Start a task
   */
  startTask(taskId: string): void {
    const task = this.todoList.items.find(t => t.id === taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    if (!this.areDependenciesMet(task)) {
      throw new Error(`Task ${taskId} has unmet dependencies`);
    }

    task.status = 'in_progress';
    this.todoList.currentTaskId = taskId;
  }

  /**
   * Complete a task
   */
  completeTask(taskId: string): void {
    const task = this.todoList.items.find(t => t.id === taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    task.status = 'completed';
    task.completedAt = new Date();

    if (this.todoList.currentTaskId === taskId) {
      this.todoList.currentTaskId = undefined;
    }
  }

  /**
   * Fail a task
   */
  failTask(taskId: string, error: string): void {
    const task = this.todoList.items.find(t => t.id === taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    task.status = 'failed';
    task.error = error;
    task.completedAt = new Date();

    if (this.todoList.currentTaskId === taskId) {
      this.todoList.currentTaskId = undefined;
    }
  }

  /**
   * Get todo list state
   */
  getTodoList(): TodoList {
    return { ...this.todoList };
  }

  /**
   * Get completed tasks
   */
  getCompletedTasks(): TodoItem[] {
    return this.todoList.items.filter(t => t.status === 'completed');
  }

  /**
   * Get failed tasks
   */
  getFailedTasks(): TodoItem[] {
    return this.todoList.items.filter(t => t.status === 'failed');
  }

  /**
   * Get pending tasks
   */
  getPendingTasks(): TodoItem[] {
    return this.todoList.items.filter(t => t.status === 'pending');
  }

  /**
   * Get progress summary
   */
  getProgress(): { total: number; completed: number; failed: number; pending: number; inProgress: number } {
    return {
      total: this.todoList.items.length,
      completed: this.todoList.items.filter(t => t.status === 'completed').length,
      failed: this.todoList.items.filter(t => t.status === 'failed').length,
      pending: this.todoList.items.filter(t => t.status === 'pending').length,
      inProgress: this.todoList.items.filter(t => t.status === 'in_progress').length
    };
  }

  /**
   * Clear completed tasks
   */
  clearCompleted(): void {
    this.todoList.items = this.todoList.items.filter(t => t.status !== 'completed');
  }

  /**
   * Reset todo list
   */
  reset(): void {
    this.todoList = {
      items: [],
      currentTaskId: undefined
    };
  }
}

