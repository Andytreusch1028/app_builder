/**
 * Compute Router - Routes requests between local and cloud providers
 */

import { ICloudProvider } from '../providers/ICloudProvider.js';
import { ProviderRegistry } from '../providers/ProviderRegistry.js';
import { LocalModelService } from './LocalModelService.js';
import { ComputeMode, GenerateOptions, StreamCallback, GenerateResponse } from '../types/compute.types.js';

export class ComputeRouter {
  private mode: ComputeMode;
  private providerRegistry: ProviderRegistry;
  private localModel: LocalModelService | null;
  private timeout: number;

  constructor(
    providerRegistry: ProviderRegistry,
    localModel: LocalModelService | null,
    mode: ComputeMode = 'hybrid',
    timeout: number = 30000
  ) {
    this.providerRegistry = providerRegistry;
    this.localModel = localModel;
    this.mode = mode;
    this.timeout = timeout;
  }

  /**
   * Set compute mode
   */
  setMode(mode: ComputeMode): void {
    this.mode = mode;
  }

  /**
   * Get current mode
   */
  getMode(): ComputeMode {
    return this.mode;
  }

  /**
   * Route and generate text
   */
  async generateText(prompt: string, options?: GenerateOptions): Promise<GenerateResponse> {
    const startTime = Date.now();

    try {
      switch (this.mode) {
        case 'local':
          return await this.generateWithLocal(prompt, options);
        
        case 'cloud':
          return await this.generateWithCloud(prompt, options);
        
        case 'hybrid':
          return await this.generateWithHybrid(prompt, options);
        
        default:
          throw new Error(`Invalid compute mode: ${this.mode}`);
      }
    } catch (error) {
      // Log error and attempt fallback
      console.error('Generation error:', error);
      
      // If we're in hybrid mode and local failed, try cloud
      if (this.mode === 'hybrid') {
        try {
          return await this.generateWithCloud(prompt, options);
        } catch (cloudError) {
          throw new Error(`Both local and cloud generation failed: ${error}`);
        }
      }
      
      throw error;
    }
  }

  /**
   * Route and stream text
   */
  async streamText(
    prompt: string,
    options: GenerateOptions,
    callback: StreamCallback
  ): Promise<GenerateResponse> {
    try {
      switch (this.mode) {
        case 'local':
          if (!this.localModel) {
            throw new Error('Local model not configured');
          }
          return await this.localModel.streamText(prompt, options, callback);

        case 'cloud':
          return await this.streamWithCloud(prompt, options, callback);

        case 'hybrid':
          // Try local first, fallback to cloud
          if (this.localModel?.isAvailable()) {
            return await this.localModel.streamText(prompt, options, callback);
          }
          return await this.streamWithCloud(prompt, options, callback);

        default:
          throw new Error(`Invalid compute mode: ${this.mode}`);
      }
    } catch (error) {
      console.error('Streaming error:', error);
      throw error;
    }
  }

  /**
   * Get telemetry data
   */
  getTelemetry(): {
    mode: ComputeMode;
    localAvailable: boolean;
    cloudProviders: number;
    stats: Map<string, any>;
  } {
    return {
      mode: this.mode,
      localAvailable: this.localModel?.isAvailable() ?? false,
      cloudProviders: this.providerRegistry.getAllProviders().length,
      stats: this.providerRegistry.getAllStats()
    };
  }

  // Private helper methods

  private async generateWithLocal(prompt: string, options?: GenerateOptions): Promise<GenerateResponse> {
    if (!this.localModel || !this.localModel.isAvailable()) {
      throw new Error('Local model not available');
    }
    return await this.localModel.generateText(prompt, options);
  }

  private async generateWithCloud(prompt: string, options?: GenerateOptions): Promise<GenerateResponse> {
    const provider = this.providerRegistry.selectProvider();
    if (!provider) {
      throw new Error('No cloud providers available');
    }

    const startTime = Date.now();
    try {
      const response = await provider.generateText(prompt, options);
      
      // Record stats
      this.providerRegistry.recordRequest(
        provider.name,
        true,
        response.tokensUsed.total,
        response.cost,
        response.latency
      );
      
      return response;
    } catch (error) {
      this.providerRegistry.recordRequest(provider.name, false, 0, 0, Date.now() - startTime);
      throw error;
    }
  }

  private async generateWithHybrid(prompt: string, options?: GenerateOptions): Promise<GenerateResponse> {
    // Try local first if available
    if (this.localModel?.isAvailable()) {
      try {
        return await this.localModel.generateText(prompt, options);
      } catch (error) {
        console.warn('Local generation failed, escalating to cloud:', error);
      }
    }

    // Fallback to cloud
    return await this.generateWithCloud(prompt, options);
  }

  private async streamWithCloud(
    prompt: string,
    options: GenerateOptions,
    callback: StreamCallback
  ): Promise<GenerateResponse> {
    const provider = this.providerRegistry.selectProvider();
    if (!provider) {
      throw new Error('No cloud providers available');
    }

    const startTime = Date.now();
    try {
      const response = await provider.streamText(prompt, options, callback);
      
      this.providerRegistry.recordRequest(
        provider.name,
        true,
        response.tokensUsed.total,
        response.cost,
        response.latency
      );
      
      return response;
    } catch (error) {
      this.providerRegistry.recordRequest(provider.name, false, 0, 0, Date.now() - startTime);
      throw error;
    }
  }
}

