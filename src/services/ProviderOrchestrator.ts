/**
 * Provider Orchestrator - Smart provider selection with Pack 11 integration
 * 
 * This service automatically selects the best provider based on:
 * - Task complexity
 * - Context requirements
 * - Provider availability
 * - Pack 11 features (unlimited context, personalization)
 */

import { ICloudProvider } from '../providers/ICloudProvider.js';
import { LettaProvider } from '../providers/LettaProvider.js';
import { OllamaProvider } from '../providers/OllamaProvider.js';
import { OptimizedQwenProvider } from '../providers/OptimizedQwenProvider.js';
import { PersonalContextManager } from '../context/PersonalContextManager.js';
import { ContextInjector } from '../context/ContextInjector.js';
import { SelfImprovementAgent, SelfImprovementConfig } from '../agents/SelfImprovementAgent.js';
import { ContextCompressor } from '../memory/ContextCompressor.js';
import { packRegistry } from '../config/pack-registry.js';

export interface ProviderOrchestratorConfig {
  primaryProvider: ICloudProvider;
  fallbackProvider?: ICloudProvider;
  enableLetta?: boolean;
  enableContextInjection?: boolean;
  enableSelfImprovement?: boolean;
  enableQwenOptimization?: boolean;
  enableContextCompression?: boolean;
  lettaBaseUrl?: string;
  selfImprovementConfig?: Partial<SelfImprovementConfig>;
}

export interface EnhancedPrompt {
  original: string;
  enhanced: string;
  contextInjected: boolean;
  provider: ICloudProvider;
  metadata: {
    contextLength: number;
    usesLetta: boolean;
    usesPersonalContext: boolean;
  };
}

export class ProviderOrchestrator {
  private primaryProvider: ICloudProvider;
  private fallbackProvider?: ICloudProvider;
  private lettaProvider?: LettaProvider;
  private qwenProvider?: OptimizedQwenProvider;
  private selfImprovementAgent?: SelfImprovementAgent;
  private contextManager?: PersonalContextManager;
  private contextInjector?: ContextInjector;
  private contextCompressor?: ContextCompressor;
  private enableLetta: boolean;
  private enableContextInjection: boolean;
  private enableSelfImprovement: boolean;
  private enableQwenOptimization: boolean;
  private enableContextCompression: boolean;
  private technologiesUsed: Set<string> = new Set();

  constructor(config: ProviderOrchestratorConfig) {
    this.primaryProvider = config.primaryProvider;
    this.fallbackProvider = config.fallbackProvider;
    this.enableLetta = config.enableLetta ?? true;
    this.enableContextInjection = config.enableContextInjection ?? true;
    this.enableSelfImprovement = config.enableSelfImprovement ?? true;
    this.enableQwenOptimization = config.enableQwenOptimization ?? true;
    this.enableContextCompression = config.enableContextCompression ?? true;

    // Initialize Pack 11 Phase 1 components
    if (this.enableLetta) {
      this.lettaProvider = new LettaProvider(
        'ollama/qwen2.5-coder:7b',
        config.lettaBaseUrl || 'http://localhost:8283'
      );
    }

    if (this.enableContextInjection) {
      this.contextManager = new PersonalContextManager();
      this.contextInjector = new ContextInjector(this.contextManager);
    }

    // Initialize Pack 11 Phase 2 components
    if (this.enableQwenOptimization) {
      this.qwenProvider = new OptimizedQwenProvider('qwen2.5-coder:7b');
    }

    if (this.enableSelfImprovement) {
      const provider = this.qwenProvider || this.primaryProvider;
      this.selfImprovementAgent = new SelfImprovementAgent({
        maxIterations: 2,
        qualityThreshold: 0.8,
        enableCritique: true,
        enableVerification: true,
        provider,
        ...config.selfImprovementConfig
      });
    }

    // Initialize Pack 11 Phase 3 components
    if (this.enableContextCompression) {
      this.contextCompressor = new ContextCompressor();
    }
  }

  /**
   * Enhance a prompt with Pack 11 features (context injection)
   */
  async enhancePrompt(prompt: string, options: {
    injectContext?: boolean;
    useLetta?: boolean;
  } = {}): Promise<EnhancedPrompt> {
    const injectContext = options.injectContext ?? this.enableContextInjection;
    const useLetta = options.useLetta ?? this.enableLetta;

    let enhanced = prompt;
    let contextInjected = false;
    let contextLength = 0;

    // Inject personal context if enabled
    if (injectContext && this.contextInjector) {
      try {
        this.trackTechnology('PERSONAL_CONTEXT_REPOSITORY');
        enhanced = await this.contextInjector.injectContext(prompt, {
          includePreferences: true,
          includeProject: true,
          includeKnowledge: true
        });
        contextInjected = true;
        contextLength = enhanced.length - prompt.length;
      } catch (error) {
        console.warn('Failed to inject context:', error);
        enhanced = prompt;
      }
    }

    // Compress context if enabled and context is large
    if (this.enableContextCompression && this.contextCompressor && enhanced.length > 8000) {
      try {
        this.trackTechnology('CONTEXT_COMPRESSION');
        const compressed = this.contextCompressor.compress(enhanced, {
          type: 'hybrid',
          maxTokens: 2000,
          preserveRecent: true,
          preserveImportant: true
        });
        enhanced = compressed.compressed;
        console.log(`Context compressed: ${compressed.originalTokens} → ${compressed.compressedTokens} tokens (${compressed.compressionRatio.toFixed(2)}x)`);
      } catch (error) {
        console.warn('Failed to compress context:', error);
      }
    }

    // Select provider
    const provider = this.selectProvider(useLetta, enhanced.length);

    return {
      original: prompt,
      enhanced,
      contextInjected,
      provider,
      metadata: {
        contextLength,
        usesLetta: provider === this.lettaProvider,
        usesPersonalContext: contextInjected
      }
    };
  }

  /**
   * Select the best provider based on requirements
   */
  private selectProvider(preferLetta: boolean, promptLength: number): ICloudProvider {
    // Use Letta if:
    // 1. Explicitly requested
    // 2. Prompt is very long (>8000 chars)
    // 3. Letta is available
    if (preferLetta && this.lettaProvider?.isAvailable()) {
      this.trackTechnology('LETTA_MEMORY_SYSTEM');
      return this.lettaProvider;
    }

    if (promptLength > 8000 && this.lettaProvider?.isAvailable()) {
      console.log('📊 Using Letta provider for long context (>8000 chars)');
      this.trackTechnology('LETTA_MEMORY_SYSTEM');
      return this.lettaProvider;
    }

    // Use primary provider if available
    if (this.primaryProvider.isAvailable()) {
      return this.primaryProvider;
    }

    // Fallback to secondary provider
    if (this.fallbackProvider?.isAvailable()) {
      console.log('⚠️ Primary provider unavailable, using fallback');
      return this.fallbackProvider;
    }

    // Last resort: return primary even if unavailable (will error)
    return this.primaryProvider;
  }

  /**
   * Get the current provider (for backward compatibility)
   */
  getProvider(): ICloudProvider {
    return this.selectProvider(false, 0);
  }

  /**
   * Generate response with self-improvement (Pack 11 Phase 2)
   */
  async generateWithImprovement(
    prompt: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
      maxIterations?: number;
      context?: string;
    }
  ): Promise<{ text: string; qualityScore?: number; iterations?: number }> {
    if (!this.enableSelfImprovement || !this.selfImprovementAgent) {
      // Fallback to regular generation
      const provider = this.qwenProvider || this.primaryProvider;
      if (this.qwenProvider) {
        this.trackTechnology('QWEN_OPTIMIZATION');
      }
      const result = await provider.generateText(prompt, {
        temperature: options?.temperature,
        maxTokens: options?.maxTokens
      });
      return { text: result.text };
    }

    // Use self-improvement agent (sub-technologies tracked automatically)
    this.trackTechnology('SELF_IMPROVEMENT_AGENT');

    if (this.qwenProvider) {
      this.trackTechnology('QWEN_OPTIMIZATION');
    }

    // Temporarily update maxIterations if specified
    if (options?.maxIterations) {
      this.selfImprovementAgent.updateConfig({ maxIterations: options.maxIterations });
    }

    const result = await this.selfImprovementAgent.generateAndImprove(
      prompt,
      options?.context
    );

    console.log(`✨ Self-Improvement: ${result.iterations} iterations, quality ${(result.qualityScore * 100).toFixed(0)}%`);

    return {
      text: result.finalResponse,
      qualityScore: result.qualityScore,
      iterations: result.iterations
    };
  }

  /**
   * Check if Pack 11 features are enabled
   */
  isPack11Enabled(): boolean {
    return this.enableLetta || this.enableContextInjection || this.enableSelfImprovement || this.enableQwenOptimization;
  }

  /**
   * Get Pack 11 status
   */
  getPack11Status() {
    return {
      phase1: {
        lettaEnabled: this.enableLetta,
        lettaAvailable: this.lettaProvider?.isAvailable() ?? false,
        contextInjectionEnabled: this.enableContextInjection,
        contextManagerLoaded: this.contextManager !== undefined
      },
      phase2: {
        selfImprovementEnabled: this.enableSelfImprovement,
        selfImprovementLoaded: this.selfImprovementAgent !== undefined,
        qwenOptimizationEnabled: this.enableQwenOptimization,
        qwenProviderLoaded: this.qwenProvider !== undefined
      }
    };
  }

  /**
   * Track technology usage (with automatic sub-technology tracking)
   * Public method so other services can track their technology usage
   */
  trackTechnology(technology: string): void {
    this.technologiesUsed.add(technology);
    console.log(`🔧 Technology Used: ${technology}`);

    // Auto-track sub-technologies
    const subTechnologies = this.getSubTechnologies(technology);
    for (const subTech of subTechnologies) {
      this.technologiesUsed.add(subTech);
      console.log(`   └─ ${subTech}`);
    }
  }

  /**
   * Get sub-technologies that are automatically used when a parent technology is invoked
   */
  private getSubTechnologies(technology: string): string[] {
    const subTechMap: Record<string, string[]> = {
      'SELF_IMPROVEMENT_AGENT': [
        'CRITIQUE_GENERATOR',
        'RESPONSE_REFINER',
        'VERIFICATION_LOOP'
      ],
      'PERSONAL_CONTEXT_REPOSITORY': [
        'CONTEXT_INJECTOR'
      ]
    };

    return subTechMap[technology] || [];
  }

  /**
   * Get all technologies used in this session
   */
  getTechnologiesUsed(): string[] {
    return Array.from(this.technologiesUsed);
  }

  /**
   * Reset technology tracking
   */
  resetTechnologyTracking(): void {
    this.technologiesUsed.clear();
  }

  /**
   * Get all available technologies from ALL packs (auto-discovered from Pack Registry)
   */
  getAvailableTechnologies(): string[] {
    const technologies: string[] = [];

    // Auto-discover from Pack Registry
    const allFeatures = packRegistry.getAllFeatures();

    for (const feature of allFeatures) {
      // Only include enabled and available features
      if (feature.enabled && feature.available) {
        // Convert feature ID to technology name (uppercase with underscores)
        const techName = this.featureIdToTechnologyName(feature.id);
        technologies.push(techName);
      }
    }

    return technologies;
  }

  /**
   * Convert feature ID to technology name
   * Example: 'pack-11-letta' -> 'LETTA_MEMORY_SYSTEM'
   */
  private featureIdToTechnologyName(featureId: string): string {
    // Map of feature IDs to technology names (for custom naming)
    const featureMap: Record<string, string> = {
      // Pack 3: Agent Loop
      'pack-3-agent-executor': 'AGENT_EXECUTOR',
      'pack-3-planner': 'TASK_PLANNER',
      'pack-3-tool-registry': 'TOOL_REGISTRY',
      'pack-3-reasoning-engine': 'REASONING_ENGINE',

      // Pack 4: Two-Brain Hybrid
      'pack-4-hybrid-executor': 'HYBRID_EXECUTOR',
      'pack-4-strategic-planner': 'STRATEGIC_PLANNER',
      'pack-4-local-executor': 'LOCAL_EXECUTOR',
      'pack-4-escalation-manager': 'ESCALATION_MANAGER',

      // Pack 5: Memory + RAG
      'pack-5-memory-service': 'MEMORY_SERVICE',
      'pack-5-embedding-service': 'EMBEDDING_SERVICE',
      'pack-5-rag': 'RAG',
      'pack-5-vector-store': 'VECTOR_STORE',

      // Pack 6: Tools + File System
      'pack-6-file-operations': 'FILE_OPERATIONS',
      'pack-6-code-execution': 'CODE_EXECUTION',
      'pack-6-shell-service': 'SHELL_SERVICE',
      'pack-6-project-scanner': 'PROJECT_SCANNER',
      'pack-6-dependency-analyzer': 'DEPENDENCY_ANALYZER',
      'pack-6-diff-service': 'DIFF_SERVICE',

      // Pack 7: Frontend UI + GitHub
      'pack-7-chat-panel': 'CHAT_PANEL',
      'pack-7-file-browser': 'FILE_BROWSER',
      'pack-7-code-editor': 'CODE_EDITOR',
      'pack-7-diff-viewer': 'DIFF_VIEWER',
      'pack-7-git-service': 'GIT_SERVICE',
      'pack-7-websocket': 'WEBSOCKET_SERVICE',

      // Pack 8: Deployment + Packaging
      'pack-8-auth-service': 'AUTH_SERVICE',
      'pack-8-error-logger': 'ERROR_LOGGER',
      'pack-8-version-manager': 'VERSION_MANAGER',
      'pack-8-docker': 'DOCKER_SUPPORT',

      // Pack 9: Agent SOP
      'pack-9-sop-loader': 'SOP_LOADER',
      'pack-9-sop-validator': 'SOP_VALIDATOR',
      'pack-9-sop-executor': 'SOP_EXECUTOR',
      'pack-9-workflow-selector': 'WORKFLOW_SELECTOR',

      // Pack 10: Production Enhancements
      'pack-10-monaco-editor': 'MONACO_EDITOR',
      'pack-10-pgvector': 'PGVECTOR',
      'pack-10-vercel-ai-sdk': 'VERCEL_AI_SDK',
      'pack-10-webcontainers': 'WEBCONTAINERS',

      // Pack 11: Local-First LLAMA Enhancements
      'pack-11-letta': 'LETTA_MEMORY_SYSTEM',
      'pack-11-context': 'PERSONAL_CONTEXT_REPOSITORY',
      'pack-11-context-injector': 'CONTEXT_INJECTOR',
      'pack-11-self-improvement': 'SELF_IMPROVEMENT_AGENT',
      'pack-11-critique-generator': 'CRITIQUE_GENERATOR',
      'pack-11-response-refiner': 'RESPONSE_REFINER',
      'pack-11-verification-loop': 'VERIFICATION_LOOP',
      'pack-11-qwen-optimization': 'QWEN_OPTIMIZATION',
      'pack-11-context-compression': 'CONTEXT_COMPRESSION'
    };

    // If we have a mapping, use it
    if (featureMap[featureId]) {
      return featureMap[featureId];
    }

    // Otherwise, generate from feature ID
    // Remove 'pack-X-' prefix and convert to SCREAMING_SNAKE_CASE
    const withoutPrefix = featureId.replace(/^pack-\d+-/, '');
    return withoutPrefix.toUpperCase().replace(/-/g, '_');
  }

  /**
   * Get detailed technology information from Pack Registry
   */
  getTechnologyDetails(): Array<{
    id: string;
    name: string;
    description: string;
    packId: string;
    packName: string;
    enabled: boolean;
    available: boolean;
    version: string;
    phase?: string;
  }> {
    const details: Array<any> = [];
    const packs = packRegistry.getEnabledPacks();

    for (const pack of packs) {
      for (const feature of pack.features) {
        if (feature.enabled && feature.available) {
          details.push({
            id: feature.id,
            name: feature.name,
            description: feature.description,
            packId: pack.id,
            packName: pack.name,
            enabled: feature.enabled,
            available: feature.available,
            version: feature.version,
            phase: feature.phase
          });
        }
      }
    }

    return details;
  }
}

