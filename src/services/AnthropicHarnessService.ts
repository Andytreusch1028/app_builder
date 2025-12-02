/**
 * AnthropicHarnessService - Long-running agent patterns
 * Based on: https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents
 * 
 * Implements:
 * - Initializer Agent (setup)
 * - Coding Agent (incremental progress)
 * - Feature Lists (workflow steps)
 * - Git Commits (state management)
 * - Progress Files (tracking)
 */

import {
  AnthropicHarnessConfig,
  InitializerAgentResult,
  CodingAgentStep,
  FeatureList,
  GitCommitState,
  ProgressFile
} from '../types/deepagents.types.js';
import { ICloudProvider } from '../providers/ICloudProvider.js';
import { FilesystemMiddleware } from '../middleware/FilesystemMiddleware.js';
import * as path from 'path';

export class AnthropicHarnessService {
  private config: AnthropicHarnessConfig;
  private provider: ICloudProvider;
  private filesystemMiddleware?: FilesystemMiddleware;
  private featureList: FeatureList;
  private codingSteps: CodingAgentStep[];
  private gitCommits: GitCommitState[];
  private progressFiles: ProgressFile[];

  constructor(
    provider: ICloudProvider,
    config: AnthropicHarnessConfig = {},
    filesystemMiddleware?: FilesystemMiddleware
  ) {
    this.provider = provider;
    this.filesystemMiddleware = filesystemMiddleware;
    this.config = {
      useInitializerAgent: config.useInitializerAgent ?? true,
      useCodingAgent: config.useCodingAgent ?? true,
      useFeatureLists: config.useFeatureLists ?? true,
      useGitCommits: config.useGitCommits ?? false,
      useProgressFiles: config.useProgressFiles ?? true
    };

    this.featureList = {
      features: [],
      completed: [],
      inProgress: [],
      pending: []
    };
    this.codingSteps = [];
    this.gitCommits = [];
    this.progressFiles = [];
  }

  /**
   * Initializer Agent - Setup environment and dependencies
   */
  async runInitializerAgent(task: string): Promise<InitializerAgentResult> {
    if (!this.config.useInitializerAgent) {
      return {
        setupComplete: false,
        environment: {},
        dependencies: [],
        configuration: {}
      };
    }

    const prompt = `You are an Initializer Agent. Your job is to set up the environment for this task:

Task: ${task}

Analyze the task and determine:
1. Required environment variables
2. Required dependencies
3. Required configuration

Return a JSON object with:
{
  "environment": { "VAR_NAME": "description" },
  "dependencies": ["package1", "package2"],
  "configuration": { "key": "value" }
}`;

    const response = await this.provider.generateText(prompt, {
      temperature: 0.3,
      maxTokens: 1000
    });

    try {
      const parsed = JSON.parse(response.text);
      return {
        setupComplete: true,
        environment: parsed.environment || {},
        dependencies: parsed.dependencies || [],
        configuration: parsed.configuration || {}
      };
    } catch (error) {
      return {
        setupComplete: false,
        environment: {},
        dependencies: [],
        configuration: {}
      };
    }
  }

  /**
   * Coding Agent - Incremental progress with testing
   */
  async addCodingStep(
    description: string,
    code?: string,
    testsPassed: boolean = false
  ): Promise<CodingAgentStep> {
    const step: CodingAgentStep = {
      stepNumber: this.codingSteps.length + 1,
      description,
      code,
      testsPassed,
      incrementalProgress: true
    };

    this.codingSteps.push(step);
    
    // Update progress file if enabled
    if (this.config.useProgressFiles) {
      await this.updateProgressFile();
    }

    return step;
  }

  /**
   * Feature Lists - Track workflow steps
   */
  addFeature(feature: string): void {
    if (!this.featureList.features.includes(feature)) {
      this.featureList.features.push(feature);
      this.featureList.pending.push(feature);
    }
  }

  startFeature(feature: string): void {
    this.featureList.pending = this.featureList.pending.filter(f => f !== feature);
    if (!this.featureList.inProgress.includes(feature)) {
      this.featureList.inProgress.push(feature);
    }
  }

  completeFeature(feature: string): void {
    this.featureList.inProgress = this.featureList.inProgress.filter(f => f !== feature);
    if (!this.featureList.completed.includes(feature)) {
      this.featureList.completed.push(feature);
    }
  }

  getFeatureList(): FeatureList {
    return { ...this.featureList };
  }

  /**
   * Progress Files - Track execution state
   */
  private async updateProgressFile(): Promise<void> {
    if (!this.filesystemMiddleware) {
      return;
    }

    const progressContent = {
      featureList: this.featureList,
      codingSteps: this.codingSteps,
      lastUpdated: new Date().toISOString()
    };

    const progressPath = 'progress.json';
    
    await this.filesystemMiddleware.execute({
      type: 'write_file',
      path: progressPath,
      content: JSON.stringify(progressContent, null, 2)
    });

    this.progressFiles.push({
      path: progressPath,
      content: JSON.stringify(progressContent, null, 2),
      lastUpdated: new Date()
    });
  }

  /**
   * Get coding steps
   */
  getCodingSteps(): CodingAgentStep[] {
    return [...this.codingSteps];
  }

  /**
   * Get progress summary
   */
  getProgressSummary(): {
    totalFeatures: number;
    completedFeatures: number;
    inProgressFeatures: number;
    pendingFeatures: number;
    totalSteps: number;
    stepsWithTests: number;
  } {
    return {
      totalFeatures: this.featureList.features.length,
      completedFeatures: this.featureList.completed.length,
      inProgressFeatures: this.featureList.inProgress.length,
      pendingFeatures: this.featureList.pending.length,
      totalSteps: this.codingSteps.length,
      stepsWithTests: this.codingSteps.filter(s => s.testsPassed).length
    };
  }
}

