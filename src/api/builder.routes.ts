/**
 * Builder API Routes - REST endpoints for Application Builder Dashboard
 */

import { Router, Request, Response } from 'express';
import * as fs from 'fs/promises';
import * as path from 'path';
import { buildQwenPrompt } from '../config/qwen-prompts.js';
import { ProviderOrchestrator } from '../services/ProviderOrchestrator.js';
import { DeepAgentsService } from '../services/DeepAgentsService.js';
import { FileSystemService } from '../services/FileSystemService.js';
import { DeepAgentConfig } from '../types/deepagents.types.js';
import { WebSocketService } from '../services/WebSocketService.js';
import { PlannerService } from '../services/PlannerService.js';
import { AgentExecutor } from '../services/AgentExecutor.js';

export interface BuilderRouterConfig {
  workspaceRoot: string;
  llmProvider?: any; // Optional LLM provider for proactive chat
  planningProvider?: any; // Optional fast LLM provider for task planning
  adaptiveProvider?: any; // Optional adaptive provider service for intelligent selection
  enableSelfImprovement?: boolean; // Enable Pack 11 Phase 2 self-improvement
  enableQwenOptimization?: boolean; // Enable Pack 11 Phase 2 Qwen optimization
  enableDeepAgents?: boolean; // Enable DeepAgentsJS harness
  wsService?: WebSocketService; // Optional WebSocket service for real-time updates
  agentExecutor?: any; // Agent executor for build tasks
  toolRegistry?: any; // Tool registry for creating executor on-demand
}

export function createBuilderRouter(config: BuilderRouterConfig): Router {
  const router = Router();

  // In-memory project store (will be replaced with database later)
  const projects = new Map<string, any>();

  // Initialize Pack 11 Phase 2 orchestrator if enabled
  let orchestrator: ProviderOrchestrator | undefined;
  if (config.llmProvider && (config.enableSelfImprovement || config.enableQwenOptimization)) {
    orchestrator = new ProviderOrchestrator({
      primaryProvider: config.llmProvider,
      enableLetta: false, // Disable Letta for builder (requires server)
      enableContextInjection: false, // Disable context injection for builder
      enableSelfImprovement: config.enableSelfImprovement !== false, // Default true
      enableQwenOptimization: config.enableQwenOptimization !== false // Default true
    });
    console.log('✨ Pack 11 Phase 2 enabled for Application Builder');
  }

  // Load existing projects from disk on startup
  async function loadExistingProjects() {
    try {
      const projectsDir = path.join(config.workspaceRoot, 'projects');

      // Check if projects directory exists
      try {
        await fs.access(projectsDir);
      } catch {
        // Projects directory doesn't exist yet
        return;
      }

      const entries = await fs.readdir(projectsDir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const projectPath = path.join(projectsDir, entry.name);
          const projectId = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

          // Try to read project metadata if it exists
          let metadata: any = {
            name: entry.name,
            description: '',
            createdAt: new Date().toISOString()
          };

          try {
            const metadataPath = path.join(projectPath, '.project.json');
            const metadataContent = await fs.readFile(metadataPath, 'utf-8');
            metadata = JSON.parse(metadataContent);
          } catch {
            // No metadata file, use defaults
          }

          projects.set(projectId, {
            id: projectId,
            name: metadata.name || entry.name,
            description: metadata.description || '',
            path: projectPath,
            createdAt: metadata.createdAt || new Date().toISOString()
          });

          console.log(`Loaded project: ${entry.name} (${projectId})`);
        }
      }

      console.log(`Loaded ${projects.size} existing projects`);
    } catch (error) {
      console.error('Error loading existing projects:', error);
    }
  }

  // Load projects on startup
  loadExistingProjects();

  /**
   * POST /api/builder/projects/new
   * Create a new project
   */
  router.post('/projects/new', async (req: Request, res: Response) => {
    try {
      const { name, description } = req.body;

      if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({
          success: false,
          error: 'Please provide a valid project name'
        });
      }

      // Generate project ID
      const projectId = `proj_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      // Create project directory
      const projectPath = path.join(config.workspaceRoot, 'projects', name);

      try {
        await fs.mkdir(projectPath, { recursive: true });
        await fs.mkdir(path.join(projectPath, 'src'), { recursive: true });
        await fs.mkdir(path.join(projectPath, 'tests'), { recursive: true });

        // Create README
        await fs.writeFile(
          path.join(projectPath, 'README.md'),
          `# ${name}\n\n${description || 'No description provided'}\n`
        );
      } catch (error: any) {
        return res.status(500).json({
          success: false,
          error: `Failed to create project directory: ${error.message}`
        });
      }

      // Store project metadata
      const project = {
        id: projectId,
        name,
        description: description || '',
        path: projectPath,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      projects.set(projectId, project);

      // Save metadata to disk
      try {
        await fs.writeFile(
          path.join(projectPath, '.project.json'),
          JSON.stringify({
            name,
            description: description || '',
            createdAt: project.createdAt
          }, null, 2)
        );
      } catch (error) {
        console.error('Failed to save project metadata:', error);
      }

      return res.status(201).json({
        success: true,
        data: project
      });

    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  });

  /**
   * GET /api/builder/projects
   * List all projects
   */
  router.get('/projects', (req: Request, res: Response) => {
    try {
      const projectList = Array.from(projects.values());

      return res.status(200).json({
        success: true,
        data: projectList
      });

    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  });

  /**
   * GET /api/builder/projects/:id
   * Get project details
   */
  router.get('/projects/:id', (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const project = projects.get(id);

      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'Project not found'
        });
      }

      return res.status(200).json({
        success: true,
        data: project
      });

    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  });

  /**
   * GET /api/builder/projects/:id/files
   * Get file tree for a project
   */
  router.get('/projects/:id/files', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const project = projects.get(id);

      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'Project not found'
        });
      }

      // Read directory structure
      const fileTree = await buildFileTree(project.path);

      return res.status(200).json({
        success: true,
        data: fileTree
      });

    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  });

  /**
   * GET /api/builder/files/:projectId
   * Read a file from a project (file path in query string)
   */
  router.get('/files/:projectId', async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;
      const filePath = req.query.path as string;

      if (!filePath) {
        return res.status(400).json({
          success: false,
          error: 'File path is required (use ?path=...)'
        });
      }

      const project = projects.get(projectId);

      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'Project not found'
        });
      }

      // Decode and resolve file path
      const decodedPath = decodeURIComponent(filePath);
      const fullPath = path.isAbsolute(decodedPath) ? decodedPath : path.join(project.path, decodedPath);

      // Security check: ensure file is within project directory
      if (!fullPath.startsWith(project.path)) {
        return res.status(403).json({
          success: false,
          error: 'Access denied: File is outside project directory'
        });
      }

      // Read file
      const content = await fs.readFile(fullPath, 'utf-8');

      return res.status(200).json({
        success: true,
        data: {
          path: decodedPath,
          content
        }
      });

    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  });

  /**
   * PUT /api/builder/files/:projectId
   * Update a file in a project (file path in body)
   */
  router.put('/files/:projectId', async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;
      const { path: filePath, content } = req.body;

      if (!filePath) {
        return res.status(400).json({
          success: false,
          error: 'File path is required'
        });
      }

      if (typeof content !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Content must be a string'
        });
      }

      const project = projects.get(projectId);

      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'Project not found'
        });
      }

      // Decode and resolve file path
      const decodedPath = decodeURIComponent(filePath);
      const fullPath = path.isAbsolute(decodedPath) ? decodedPath : path.join(project.path, decodedPath);

      // Security check: ensure file is within project directory
      if (!fullPath.startsWith(project.path)) {
        return res.status(403).json({
          success: false,
          error: 'Access denied: File is outside project directory'
        });
      }

      // Write file
      await fs.writeFile(fullPath, content, 'utf-8');

      return res.status(200).json({
        success: true,
        data: {
          path: decodedPath
        }
      });

    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  });

  /**
   * POST /api/builder/chat
   * Proactive chat with the LLM (uses proactiveBuilder prompt)
   */
  router.post('/chat', async (req: Request, res: Response) => {
    try {
      const { message, projectId, conversationHistory, customPersona } = req.body;

      if (!message || typeof message !== 'string' || message.trim() === '') {
        return res.status(400).json({
          success: false,
          error: 'Please provide a valid message'
        });
      }

      if (!config.llmProvider) {
        return res.status(503).json({
          success: false,
          error: 'LLM provider not configured'
        });
      }

      // Get project context if projectId provided
      let projectContext = '';
      if (projectId) {
        const project = projects.get(projectId);
        if (project) {
          projectContext = `\n\nCURRENT PROJECT: ${project.name}
Project Path: ${project.path}
Description: ${project.description || 'No description'}`;
        }
      }

      // Build prompt - use custom persona if provided, otherwise use default proactive prompt
      let systemPrompt: string;
      let userPrompt: string;

      if (customPersona && typeof customPersona === 'string' && customPersona.trim() !== '') {
        // Use custom persona
        systemPrompt = customPersona.trim();
        userPrompt = message + projectContext;
      } else {
        // Use default proactive builder prompt
        const { system, user } = buildQwenPrompt('proactiveBuilder', message + projectContext);
        systemPrompt = system;
        userPrompt = user;
      }

      // Build conversation with history
      let fullPrompt = systemPrompt + '\n\n';

      // Add conversation history if provided
      if (conversationHistory && Array.isArray(conversationHistory)) {
        for (const msg of conversationHistory) {
          if (msg.role === 'user') {
            fullPrompt += `USER: ${msg.content}\n\n`;
          } else if (msg.role === 'assistant') {
            fullPrompt += `ASSISTANT: ${msg.content}\n\n`;
          }
        }
      }

      fullPrompt += `USER: ${userPrompt}\n\nASSISTANT:`;

      // Generate response
      const response = await config.llmProvider.generateText(fullPrompt, {
        temperature: 0.7,
        maxTokens: 1000
      });

      return res.status(200).json({
        success: true,
        data: {
          message: response.text.trim(),
          model: response.model
        }
      });

    } catch (error: any) {
      console.error('Chat error:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  });

  /**
   * POST /api/builder/build
   * Execute a build request with full agent integration
   */
  router.post('/build', async (req: Request, res: Response) => {
    try {
      const { prompt, projectId, useQuality } = req.body;

      if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
        return res.status(400).json({
          success: false,
          error: 'Please provide a valid prompt'
        });
      }

      if (!projectId) {
        return res.status(400).json({
          success: false,
          error: 'Please provide a project ID'
        });
      }

      const project = projects.get(projectId);
      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'Project not found'
        });
      }

      const buildId = `build_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const startTime = Date.now();

      // Send WebSocket: Build started
      if (config.wsService) {
        config.wsService.sendBuildProgress({
          buildId,
          status: 'started',
          progress: 0,
          message: useQuality ? 'Starting build with quality improvement...' : 'Starting build...'
        });
      }

      // Build the enhanced task with project context
      // Get relative path from workspace root for tool calls
      const relativeProjectPath = `projects/${project.name}`;

      const enhancedTask = `${prompt}

IMPORTANT INSTRUCTIONS:
- You are building for project: ${project.name}
- Create all files using the write_file tool with FULL PATHS starting with: ${relativeProjectPath}/
- For example: write_file with path "${relativeProjectPath}/index.html"
- Generate a complete, working application
- Include index.html, styles.css, and script.js at minimum
- Make sure all files are properly linked together

REQUIRED FILE PATHS (use exactly these paths with write_file):
- ${relativeProjectPath}/index.html (main HTML file)
- ${relativeProjectPath}/styles.css (CSS styles)
- ${relativeProjectPath}/script.js (JavaScript logic)

Project Context:
- Name: ${project.name}
- Description: ${project.description || 'No description'}`;

      let executionResult;

      if (useQuality && orchestrator) {
        // Use quality mode with self-improvement
        if (config.wsService) {
          config.wsService.sendBuildProgress({
            buildId,
            status: 'in_progress',
            progress: 25,
            message: '✨ Generating with quality improvement...'
          });
        }

        const result = await orchestrator.generateWithImprovement(enhancedTask, {
          temperature: 0.3,
          maxTokens: 4000,
          maxIterations: 2
        });

        // Parse and save generated code to files
        const files = await parseAndSaveCode(result.text, project.path);

        executionResult = {
          success: true,
          qualityScore: result.qualityScore,
          iterations: result.iterations,
          files,
          output: result.text
        };

      } else {
        // Use standard agent execution
        if (config.wsService) {
          config.wsService.sendBuildProgress({
            buildId,
            status: 'in_progress',
            progress: 25,
            message: '🤔 Planning application structure...'
          });
        }

        // Create executor on-demand if not provided
        let executor = config.agentExecutor;
        if (!executor && config.llmProvider && config.toolRegistry) {
          console.log('📝 Creating executor on-demand...');
          console.log('🔍 DEBUG: config.adaptiveProvider exists?', !!config.adaptiveProvider);
          console.log('🔍 DEBUG: config.adaptiveProvider type:', config.adaptiveProvider?.constructor?.name);
          console.log('   - LLM Provider:', config.llmProvider.constructor.name);
          if (config.planningProvider) {
            console.log('   - Planning Provider:', config.planningProvider.constructor.name, '(fast)');
          }
          if (config.adaptiveProvider) {
            console.log('   - Adaptive Provider: enabled (intelligent selection + cloud fallback)');
          }
          console.log('   - Available tools:', config.toolRegistry.listTools().map((t: any) => t.name).join(', '));

          const planner = new PlannerService(
            config.llmProvider,
            config.toolRegistry,
            undefined, // No orchestrator for on-demand executor
            config.planningProvider, // Use fast planning provider if available
            config.adaptiveProvider // Use adaptive provider for intelligent selection
          );
          executor = new AgentExecutor(planner, config.toolRegistry, {
            workspaceRoot: config.workspaceRoot
          });

          console.log('✅ Executor created successfully');
        }

        if (!executor) {
          console.error('❌ Agent executor not available');
          return res.status(503).json({
            success: false,
            error: 'Agent executor not available'
          });
        }

        console.log('\n🚀 Starting agent execution...');
        console.log('📋 Task:', enhancedTask.substring(0, 200) + '...');

        const result = await executor.execute(enhancedTask, 'builder-user');

        console.log('\n✅ Agent execution completed');
        console.log('   - Success:', result.success);
        console.log('   - Output length:', result.output?.length || 0);
        console.log('   - Artifacts:', result.artifacts?.length || 0);
        console.log('   - Error:', result.error || 'none');

        if (result.output) {
          console.log('\n📄 Agent output preview:');
          const outputStr = typeof result.output === 'string' ? result.output : JSON.stringify(result.output);
        console.log(outputStr.substring(0, 500));
        }

        executionResult = {
          success: result.success,
          qualityScore: result.metadata?.qualityScore,
          iterations: result.metadata?.iterations || 1,
          files: result.artifacts || [],
          output: result.output,
          error: result.error
        };
      }

      const duration = Date.now() - startTime;

      // Get updated file tree
      const fileTree = await buildFileTree(project.path);

      // Send WebSocket: Build complete
      if (config.wsService) {
        config.wsService.sendBuildComplete({
          buildId,
          success: executionResult.success,
          files: fileTree,
          duration
        });

        if (executionResult.qualityScore) {
          config.wsService.sendQualityMetric({
            buildId,
            metric: 'quality_score',
            value: executionResult.qualityScore,
            label: 'Quality Score'
          });
        }
      }

      return res.status(200).json({
        success: true,
        data: {
          buildId,
          duration,
          files: fileTree,
          qualityScore: executionResult.qualityScore,
          iterations: executionResult.iterations,
          improved: (executionResult.iterations || 0) > 1
        }
      });

    } catch (error: any) {
      console.error('Build error:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  });

  /**
   * POST /api/builder/generate-with-improvement
   * Generate code with self-improvement (Pack 11 Phase 2)
   */
  router.post('/generate-with-improvement', async (req: Request, res: Response) => {
    try {
      const { prompt, projectId, maxIterations } = req.body;

      if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
        return res.status(400).json({
          success: false,
          error: 'Please provide a valid prompt'
        });
      }

      if (!orchestrator) {
        return res.status(503).json({
          success: false,
          error: 'Self-improvement not enabled. Please enable Pack 11 Phase 2.'
        });
      }

      // Get project context if projectId provided
      let projectContext = '';
      if (projectId) {
        const project = projects.get(projectId);
        if (project) {
          projectContext = `\n\nCURRENT PROJECT: ${project.name}
Project Path: ${project.path}
Description: ${project.description || 'No description'}`;
        }
      }

      const fullPrompt = prompt + projectContext;
      const buildId = `build_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      // Send WebSocket notification: build started
      if (config.wsService) {
        config.wsService.sendBuildProgress({
          buildId,
          status: 'started',
          progress: 0,
          message: 'Starting code generation with quality improvement...'
        });
      }

      // Generate with self-improvement
      console.log('🔄 Generating with self-improvement...');
      const result = await orchestrator.generateWithImprovement(fullPrompt, {
        temperature: 0.3,
        maxTokens: 2000,
        maxIterations: maxIterations || 2
      });

      // Send WebSocket notification: build complete
      if (config.wsService) {
        config.wsService.sendBuildComplete({
          buildId,
          success: true,
          files: [],
          duration: 0
        });

        config.wsService.sendQualityMetric({
          buildId,
          metric: 'quality_score',
          value: result.qualityScore || 0,
          label: 'Quality Score'
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          code: result.text,
          qualityScore: result.qualityScore,
          iterations: result.iterations,
          improved: (result.iterations || 0) > 1,
          buildId
        }
      });

    } catch (error: any) {
      console.error('Generate with improvement error:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  });

  /**
   * GET /api/builder/pack11-status
   * Get Pack 11 Phase 2 status for builder
   */
  router.get('/pack11-status', (req: Request, res: Response) => {
    try {
      if (!orchestrator) {
        return res.status(200).json({
          success: true,
          data: {
            enabled: false,
            message: 'Pack 11 Phase 2 features are disabled'
          }
        });
      }

      const status = orchestrator.getPack11Status();

      return res.status(200).json({
        success: true,
        data: {
          enabled: true,
          ...status
        }
      });

    } catch (error: any) {
      console.error('Pack 11 status error:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  });

  /**
   * GET /api/builder/metrics/provider
   * Get adaptive provider metrics
   */
  router.get('/metrics/provider', (req: Request, res: Response) => {
    try {
      if (!config.adaptiveProvider) {
        return res.status(200).json({
          success: true,
          data: {
            enabled: false,
            message: 'Adaptive provider not enabled'
          }
        });
      }

      const summary = config.adaptiveProvider.getMetricsSummary();
      const allMetrics = config.adaptiveProvider.metrics || [];

      // Get recent metrics (last 20)
      const recentMetrics = allMetrics.slice(-20);

      // Calculate provider usage breakdown
      const providerUsage = allMetrics.reduce((acc: any, m: any) => {
        acc[m.provider] = (acc[m.provider] || 0) + 1;
        return acc;
      }, {});

      // Calculate escalation count (when provider changes)
      let escalations = 0;
      for (let i = 1; i < allMetrics.length; i++) {
        if (allMetrics[i].provider !== allMetrics[i - 1].provider) {
          escalations++;
        }
      }

      return res.status(200).json({
        success: true,
        data: {
          enabled: true,
          summary: {
            totalGenerations: summary.totalGenerations,
            consecutiveFailures: summary.consecutiveFailures,
            avgResponseTime: Math.round(summary.avgResponseTime),
            avgQualityScore: Math.round(summary.avgQualityScore),
            totalCost: summary.totalCost.toFixed(4),
            escalations
          },
          providerUsage,
          recentMetrics: recentMetrics.map((m: any) => ({
            provider: m.provider,
            responseTime: m.responseTime,
            qualityScore: m.qualityScore,
            validationPassed: m.validationPassed,
            tokensUsed: m.tokensUsed,
            cost: m.cost
          })),
          thresholds: {
            minQualityScore: config.adaptiveProvider.config?.minQualityScore || 70,
            maxValidationFailures: config.adaptiveProvider.config?.maxValidationFailures || 2,
            maxResponseTime: config.adaptiveProvider.config?.maxResponseTime || 30000,
            timeoutWarningThreshold: config.adaptiveProvider.config?.timeoutWarningThreshold || 20000
          }
        }
      });
    } catch (error: any) {
      console.error('Error getting provider metrics:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  });

  /**
   * POST /api/builder/deepagents/execute
   * Execute task with DeepAgentsJS harness
   */
  router.post('/deepagents/execute', async (req: Request, res: Response) => {
    try {
      const { task, projectId, userId, config: userConfig } = req.body;

      if (!task || typeof task !== 'string' || task.trim() === '') {
        return res.status(400).json({
          success: false,
          error: 'Please provide a valid task'
        });
      }

      if (!config.llmProvider) {
        return res.status(503).json({
          success: false,
          error: 'LLM provider not configured'
        });
      }

      if (!config.enableDeepAgents) {
        return res.status(503).json({
          success: false,
          error: 'DeepAgentsJS not enabled. Please enable in configuration.'
        });
      }

      // Get project path if projectId provided
      let workspaceRoot = config.workspaceRoot;
      if (projectId) {
        const project = projects.get(projectId);
        if (project) {
          workspaceRoot = project.path;
        }
      }

      const deepAgentConfig: DeepAgentConfig = {
        workspaceRoot,
        maxTodoItems: userConfig?.maxTodoItems ?? 50,
        maxSubAgents: userConfig?.maxSubAgents ?? 10,
        enableAutoSummarization: userConfig?.enableAutoSummarization ?? true,
        summarizationThreshold: userConfig?.summarizationThreshold ?? 170000,
        enableHITL: userConfig?.enableHITL ?? false
      };

      const fileSystemService = new FileSystemService({
        workspaceRoot,
        projectId // Pass projectId for WebSocket broadcasting
      });
      const deepAgentsService = new DeepAgentsService(
        config.llmProvider,
        fileSystemService,
        deepAgentConfig
      );

      console.log('🤖 Executing task with DeepAgentsJS harness...');
      const result = await deepAgentsService.execute(task, userId);

      return res.status(200).json({
        success: result.success,
        data: result
      });

    } catch (error: any) {
      console.error('DeepAgents execution error:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  });

  return router;
}

/**
 * Build file tree recursively
 */
async function buildFileTree(dirPath: string, basePath?: string): Promise<any> {
  const items = await fs.readdir(dirPath, { withFileTypes: true });
  const base = basePath || dirPath;

  const tree = [];

  for (const item of items) {
    const itemPath = path.join(dirPath, item.name);

    if (item.isDirectory()) {
      tree.push({
        name: item.name,
        type: 'directory',
        children: await buildFileTree(itemPath, base)
      });
    } else {
      // Store relative path from project root
      const relativePath = path.relative(base, itemPath);
      tree.push({
        name: item.name,
        type: 'file',
        path: relativePath
      });
    }
  }

  return tree;
}

/**
 * Parse generated code and save to files
 * Handles code blocks in markdown format
 */
async function parseAndSaveCode(generatedText: string, projectPath: string): Promise<any[]> {
  const files: any[] = [];

  // Regex to match code blocks with file paths
  // Matches: ```html:index.html or ```javascript:script.js
  const codeBlockRegex = /```(\w+):([^\n]+)\n([\s\S]*?)```/g;

  let match;
  while ((match = codeBlockRegex.exec(generatedText)) !== null) {
    const [, language, filePath, content] = match;
    const cleanPath = filePath.trim();
    const fullPath = path.join(projectPath, cleanPath);

    try {
      // Ensure directory exists
      await fs.mkdir(path.dirname(fullPath), { recursive: true });

      // Write file
      await fs.writeFile(fullPath, content.trim(), 'utf-8');

      files.push({
        path: cleanPath,
        name: path.basename(cleanPath),
        type: language,
        size: Buffer.byteLength(content, 'utf-8')
      });

      console.log(`✅ Created file: ${cleanPath}`);
    } catch (error: any) {
      console.error(`❌ Failed to create file ${cleanPath}:`, error.message);
    }
  }

  // If no code blocks found, try to detect common patterns
  if (files.length === 0) {
    // Try to extract HTML, CSS, JS from the text
    const htmlMatch = generatedText.match(/<!DOCTYPE html>[\s\S]*<\/html>/i);
    const cssMatch = generatedText.match(/\/\*[\s\S]*?\*\/|[^{}]+\{[^{}]*\}/);
    const jsMatch = generatedText.match(/function\s+\w+|const\s+\w+|let\s+\w+|var\s+\w+/);

    if (htmlMatch) {
      const htmlPath = path.join(projectPath, 'index.html');
      await fs.writeFile(htmlPath, htmlMatch[0], 'utf-8');
      files.push({ path: 'index.html', name: 'index.html', type: 'html', size: htmlMatch[0].length });
    }
  }

  return files;
}
