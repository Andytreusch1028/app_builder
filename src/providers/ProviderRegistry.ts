/**
 * Provider Registry - Manages provider selection and statistics
 */

import { ICloudProvider } from './ICloudProvider.js';
import { SelectionStrategy, ProviderStats } from '../types/compute.types.js';

export class ProviderRegistry {
  private providers: Map<string, ICloudProvider> = new Map();
  private stats: Map<string, ProviderStats> = new Map();
  private selectionStrategy: SelectionStrategy = 'priority';
  private priorityOrder: string[] = [];
  private roundRobinIndex: number = 0;

  /**
   * Register a provider
   */
  register(provider: ICloudProvider, priority?: number): void {
    this.providers.set(provider.name, provider);
    
    // Initialize stats
    this.stats.set(provider.name, {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalTokens: 0,
      totalCost: 0,
      averageLatency: 0
    });

    // Add to priority order
    if (priority !== undefined) {
      this.priorityOrder.splice(priority, 0, provider.name);
    } else {
      this.priorityOrder.push(provider.name);
    }
  }

  /**
   * Get a provider by name
   */
  getProvider(name: string): ICloudProvider | undefined {
    return this.providers.get(name);
  }

  /**
   * Get all registered providers
   */
  getAllProviders(): ICloudProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Set selection strategy
   */
  setSelectionStrategy(strategy: SelectionStrategy): void {
    this.selectionStrategy = strategy;
  }

  /**
   * Select a provider based on current strategy
   */
  selectProvider(manualProvider?: string): ICloudProvider | null {
    // Manual selection
    if (this.selectionStrategy === 'manual' && manualProvider) {
      const provider = this.providers.get(manualProvider);
      return provider?.isAvailable() ? provider : null;
    }

    // Get available providers
    const availableProviders = Array.from(this.providers.values())
      .filter(p => p.isAvailable());

    if (availableProviders.length === 0) {
      return null;
    }

    switch (this.selectionStrategy) {
      case 'priority':
        return this.selectByPriority(availableProviders);
      
      case 'cost':
        return this.selectByCost(availableProviders);
      
      case 'performance':
        return this.selectByPerformance(availableProviders);
      
      case 'round-robin':
        return this.selectRoundRobin(availableProviders);
      
      default:
        return availableProviders[0];
    }
  }

  /**
   * Record request statistics
   */
  recordRequest(
    providerName: string,
    success: boolean,
    tokens: number,
    cost: number,
    latency: number
  ): void {
    const stats = this.stats.get(providerName);
    if (!stats) return;

    stats.totalRequests++;
    if (success) {
      stats.successfulRequests++;
      stats.totalTokens += tokens;
      stats.totalCost += cost;
      
      // Update average latency
      const totalLatency = stats.averageLatency * (stats.successfulRequests - 1) + latency;
      stats.averageLatency = totalLatency / stats.successfulRequests;
    } else {
      stats.failedRequests++;
    }
  }

  /**
   * Get statistics for a provider
   */
  getStats(providerName: string): ProviderStats | undefined {
    return this.stats.get(providerName);
  }

  /**
   * Get all statistics
   */
  getAllStats(): Map<string, ProviderStats> {
    return new Map(this.stats);
  }

  // Private selection methods

  private selectByPriority(providers: ICloudProvider[]): ICloudProvider {
    for (const name of this.priorityOrder) {
      const provider = providers.find(p => p.name === name);
      if (provider) return provider;
    }
    return providers[0];
  }

  private selectByCost(providers: ICloudProvider[]): ICloudProvider {
    return providers.reduce((cheapest, current) => {
      const cheapestInfo = cheapest.getModelInfo();
      const currentInfo = current.getModelInfo();
      const cheapestCost = cheapestInfo.costPer1kInputTokens + cheapestInfo.costPer1kOutputTokens;
      const currentCost = currentInfo.costPer1kInputTokens + currentInfo.costPer1kOutputTokens;
      return currentCost < cheapestCost ? current : cheapest;
    });
  }

  private selectByPerformance(providers: ICloudProvider[]): ICloudProvider {
    return providers.reduce((fastest, current) => {
      const fastestStats = this.stats.get(fastest.name);
      const currentStats = this.stats.get(current.name);
      
      if (!fastestStats || !currentStats) return fastest;
      
      return currentStats.averageLatency < fastestStats.averageLatency ? current : fastest;
    });
  }

  private selectRoundRobin(providers: ICloudProvider[]): ICloudProvider {
    const provider = providers[this.roundRobinIndex % providers.length];
    this.roundRobinIndex++;
    return provider;
  }
}

