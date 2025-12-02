/**
 * Adaptive Provider Service - Intelligently selects the best provider based on quality/time metrics
 * 
 * Strategy:
 * 1. Start with fast local models (1.5b for planning, 7b for execution)
 * 2. Monitor quality metrics (validation failures, code quality, execution success)
 * 3. Monitor time metrics (response time, timeout risk)
 * 4. Automatically escalate to cloud (Claude) if quality/time falls below thresholds
 */

import { ICloudProvider } from '../providers/ICloudProvider.js';
import { GenerateOptions, GenerateResponse } from '../types/compute.types.js';

export interface AdaptiveProviderConfig {
  fastProvider: ICloudProvider;      // Fast local model (e.g., qwen 1.5b)
  standardProvider: ICloudProvider;  // Standard local model (e.g., qwen 7b)
  cloudProvider?: ICloudProvider;    // Cloud fallback (e.g., Claude)
  
  // Quality thresholds
  minQualityScore?: number;          // Minimum acceptable quality score (0-100)
  maxValidationFailures?: number;    // Max validation failures before escalation
  
  // Time thresholds
  maxResponseTime?: number;          // Max response time in ms before escalation
  timeoutWarningThreshold?: number;  // Warn if response time exceeds this
}

export interface ProviderMetrics {
  provider: string;
  responseTime: number;
  qualityScore?: number;
  validationPassed: boolean;
  tokensUsed: number;
  cost: number;
}

export type TaskType = 'planning' | 'code_generation' | 'validation' | 'refactoring' | 'testing';

export class AdaptiveProviderService {
  public config: Required<AdaptiveProviderConfig>; // Public for metrics endpoint
  public metrics: ProviderMetrics[] = []; // Public for metrics endpoint
  private consecutiveFailures = 0;

  constructor(config: AdaptiveProviderConfig) {
    this.config = {
      fastProvider: config.fastProvider,
      standardProvider: config.standardProvider,
      cloudProvider: config.cloudProvider || config.standardProvider,
      minQualityScore: config.minQualityScore ?? 70,
      maxValidationFailures: config.maxValidationFailures ?? 2,
      maxResponseTime: config.maxResponseTime ?? 30000, // 30 seconds
      timeoutWarningThreshold: config.timeoutWarningThreshold ?? 20000 // 20 seconds
    };
  }

  /**
   * Select the best provider for a given task type
   */
  selectProvider(taskType: TaskType, forceCloud: boolean = false): ICloudProvider {
    // Force cloud if requested
    if (forceCloud) {
      console.log('🌩️  Using cloud provider (forced)');
      return this.config.cloudProvider;
    }

    // Escalate to cloud if too many consecutive failures
    if (this.consecutiveFailures >= this.config.maxValidationFailures) {
      console.log(`⚠️  Escalating to cloud provider (${this.consecutiveFailures} consecutive failures)`);
      return this.config.cloudProvider;
    }

    // Check recent performance metrics
    const recentMetrics = this.metrics.slice(-5);
    const avgResponseTime = recentMetrics.length > 0
      ? recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentMetrics.length
      : 0;

    // Escalate to cloud if response times are too slow
    if (avgResponseTime > this.config.maxResponseTime) {
      console.log(`⚠️  Escalating to cloud provider (avg response time: ${avgResponseTime}ms)`);
      return this.config.cloudProvider;
    }

    // Task-specific provider selection
    switch (taskType) {
      case 'planning':
        // Planning is simple, use fast provider
        console.log('⚡ Using fast provider for planning');
        return this.config.fastProvider;

      case 'validation':
        // Validation is simple, use fast provider
        console.log('⚡ Using fast provider for validation');
        return this.config.fastProvider;

      case 'code_generation':
      case 'refactoring':
      case 'testing':
        // Complex tasks, use standard provider (or cloud if needed)
        console.log('🔧 Using standard provider for code generation');
        return this.config.standardProvider;

      default:
        return this.config.standardProvider;
    }
  }

  /**
   * Generate text with automatic provider selection and fallback
   */
  async generateWithAdaptiveSelection(
    prompt: string,
    taskType: TaskType,
    options?: GenerateOptions,
    forceCloud: boolean = false
  ): Promise<GenerateResponse & { metrics: ProviderMetrics }> {
    const startTime = Date.now();
    let provider = this.selectProvider(taskType, forceCloud);
    let attempt = 0;
    const maxAttempts = 3;

    while (attempt < maxAttempts) {
      attempt++;
      
      try {
        console.log(`\n🎯 Attempt ${attempt}/${maxAttempts} with ${provider.name}`);
        
        const response = await provider.generateText(prompt, options);
        const responseTime = Date.now() - startTime;

        // Create metrics
        const metrics: ProviderMetrics = {
          provider: provider.name,
          responseTime,
          validationPassed: true, // Will be updated by caller
          tokensUsed: response.tokensUsed?.total || 0,
          cost: response.cost || 0
        };

        // Record metrics
        this.metrics.push(metrics);
        this.consecutiveFailures = 0; // Reset on success

        console.log(`✅ Success with ${provider.name} (${responseTime}ms)`);

        return { ...response, metrics };

      } catch (error) {
        console.error(`❌ Attempt ${attempt} failed with ${provider.name}:`, error);
        this.consecutiveFailures++;

        // If not last attempt, escalate to next provider
        if (attempt < maxAttempts) {
          if (provider === this.config.fastProvider) {
            console.log('⬆️  Escalating to standard provider...');
            provider = this.config.standardProvider;
          } else if (provider === this.config.standardProvider) {
            console.log('⬆️  Escalating to cloud provider...');
            provider = this.config.cloudProvider;
          }
        } else {
          throw new Error(`All providers failed after ${maxAttempts} attempts: ${error}`);
        }
      }
    }

    throw new Error('Failed to generate response with any provider');
  }

  /**
   * Record quality metrics for a generation
   */
  recordQuality(qualityScore: number, validationPassed: boolean) {
    if (this.metrics.length > 0) {
      const lastMetric = this.metrics[this.metrics.length - 1];
      lastMetric.qualityScore = qualityScore;
      lastMetric.validationPassed = validationPassed;

      if (!validationPassed) {
        this.consecutiveFailures++;
      } else {
        this.consecutiveFailures = 0;
      }
    }
  }

  /**
   * Get current metrics summary
   */
  getMetricsSummary() {
    const recent = this.metrics.slice(-10);
    return {
      totalGenerations: this.metrics.length,
      consecutiveFailures: this.consecutiveFailures,
      avgResponseTime: recent.reduce((sum, m) => sum + m.responseTime, 0) / (recent.length || 1),
      avgQualityScore: recent.filter(m => m.qualityScore).reduce((sum, m) => sum + (m.qualityScore || 0), 0) / (recent.filter(m => m.qualityScore).length || 1),
      totalCost: this.metrics.reduce((sum, m) => sum + m.cost, 0)
    };
  }

  /**
   * Reset metrics and failure counters
   */
  reset() {
    this.metrics = [];
    this.consecutiveFailures = 0;
  }
}

