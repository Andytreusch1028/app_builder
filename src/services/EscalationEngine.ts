/**
 * Escalation Engine - Decides when to escalate from local to cloud execution
 * 
 * Escalation triggers:
 * - Execution timeout (>30s)
 * - Low quality score (<0.7)
 * - Repeated errors (>3)
 * - High complexity tasks
 */

import { ValidationResult } from './QualityValidator.js';

export interface EscalationDecision {
  shouldEscalate: boolean;
  reason: string;
  confidence: number; // 0-1
}

export interface EscalationMetrics {
  totalExecutions: number;
  localSuccesses: number;
  localFailures: number;
  escalations: number;
  escalationRate: number;
  averageLocalTime: number;
  averageCloudTime: number;
}

export interface ExecutionAttempt {
  startTime: number;
  endTime?: number;
  success: boolean;
  error?: string;
  qualityScore?: number;
}

export class EscalationEngine {
  private readonly TIMEOUT_THRESHOLD = 30000; // 30 seconds
  private readonly QUALITY_THRESHOLD = 0.7;
  private readonly MAX_RETRIES = 3;
  
  private metrics: EscalationMetrics = {
    totalExecutions: 0,
    localSuccesses: 0,
    localFailures: 0,
    escalations: 0,
    escalationRate: 0,
    averageLocalTime: 0,
    averageCloudTime: 0
  };

  private executionHistory: Map<string, ExecutionAttempt[]> = new Map();

  /**
   * Decide whether to escalate to cloud
   */
  shouldEscalate(
    taskId: string,
    complexity: 'simple' | 'moderate' | 'complex',
    validationResult?: ValidationResult,
    executionTime?: number,
    errorCount?: number
  ): EscalationDecision {
    // Always escalate complex tasks
    if (complexity === 'complex') {
      return {
        shouldEscalate: true,
        reason: 'Task complexity is high',
        confidence: 1.0
      };
    }

    // Escalate on timeout
    if (executionTime && executionTime > this.TIMEOUT_THRESHOLD) {
      return {
        shouldEscalate: true,
        reason: `Execution timeout (${executionTime}ms > ${this.TIMEOUT_THRESHOLD}ms)`,
        confidence: 0.9
      };
    }

    // Escalate on low quality
    if (validationResult && validationResult.shouldEscalate) {
      return {
        shouldEscalate: true,
        reason: validationResult.reason || 'Quality score below threshold',
        confidence: 0.8
      };
    }

    // Escalate on repeated errors
    if (errorCount && errorCount >= this.MAX_RETRIES) {
      return {
        shouldEscalate: true,
        reason: `Too many errors (${errorCount} >= ${this.MAX_RETRIES})`,
        confidence: 0.9
      };
    }

    // Check execution history
    const history = this.executionHistory.get(taskId) || [];
    if (history.length >= 2 && history.every(a => !a.success)) {
      return {
        shouldEscalate: true,
        reason: 'Multiple failed attempts in history',
        confidence: 0.7
      };
    }

    // Don't escalate
    return {
      shouldEscalate: false,
      reason: 'Task is suitable for local execution',
      confidence: 0.8
    };
  }

  /**
   * Record execution attempt
   */
  recordAttempt(taskId: string, attempt: ExecutionAttempt): void {
    if (!this.executionHistory.has(taskId)) {
      this.executionHistory.set(taskId, []);
    }
    
    const history = this.executionHistory.get(taskId)!;
    history.push(attempt);

    // Keep only last 5 attempts
    if (history.length > 5) {
      history.shift();
    }

    // Update metrics
    this.updateMetrics(attempt);
  }

  /**
   * Record escalation
   */
  recordEscalation(taskId: string, fromLocal: boolean): void {
    this.metrics.totalExecutions++;
    
    if (fromLocal) {
      this.metrics.localFailures++;
      this.metrics.escalations++;
    }

    this.updateEscalationRate();
  }

  /**
   * Update metrics
   */
  private updateMetrics(attempt: ExecutionAttempt): void {
    this.metrics.totalExecutions++;

    if (attempt.success) {
      this.metrics.localSuccesses++;
    } else {
      this.metrics.localFailures++;
    }

    this.updateEscalationRate();
  }

  /**
   * Update escalation rate
   */
  private updateEscalationRate(): void {
    if (this.metrics.totalExecutions > 0) {
      this.metrics.escalationRate = this.metrics.escalations / this.metrics.totalExecutions;
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): EscalationMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      totalExecutions: 0,
      localSuccesses: 0,
      localFailures: 0,
      escalations: 0,
      escalationRate: 0,
      averageLocalTime: 0,
      averageCloudTime: 0
    };
    this.executionHistory.clear();
  }
}

