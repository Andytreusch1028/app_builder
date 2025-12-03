/**
 * Builder API Routes - REST endpoints for Application Builder Dashboard
 */

import { Router, Request, Response } from 'express';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { buildQwenPrompt } from '../config/qwen-prompts.js';
import { ProviderOrchestrator } from '../services/ProviderOrchestrator.js';
import { DeepAgentsService } from '../services/DeepAgentsService.js';
import { FileSystemService } from '../services/FileSystemService.js';
import { DeepAgentConfig } from '../types/deepagents.types.js';
import { PlannerService } from '../services/PlannerService.js';
import { AgentExecutor } from '../services/AgentExecutor.js';
import { ToolRegistry } from '../services/ToolRegistry.js';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// WebSocket interface for real-time updates (compatible with both WebSocketService and WebSocketManager)
interface IWebSocketService {
  sendBuildProgress(data: { buildId: string; status: string; progress: number; message: string }): void;
  sendBuildComplete(data: { buildId: string; success: boolean; files: string[]; duration: number }): void;
  sendQualityMetric(data: { buildId: string; metric: string; value: number; label: string }): void;
  sendBuildError(data: { buildId: string; error: string }): void;
  sendFileChange(data: { projectId: string; filePath: string; action: 'created' | 'modified' | 'deleted' }): void;
}

export interface BuilderRouterConfig {
  workspaceRoot: string;
  llmProvider?: any; // Optional LLM provider for proactive chat
  planningProvider?: any; // Optional fast LLM provider for task planning
  adaptiveProvider?: any; // Optional adaptive provider service for intelligent selection
  enableSelfImprovement?: boolean; // Enable Pack 11 Phase 2 self-improvement
  enableQwenOptimization?: boolean; // Enable Pack 11 Phase 2 Qwen optimization
  enableDeepAgents?: boolean; // Enable DeepAgentsJS harness
  wsService?: IWebSocketService; // Optional WebSocket service for real-time updates
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
    console.log('\n📁 POST /api/builder/projects/new');
    console.log('   - Request body:', req.body);

    try {
      const { name, description } = req.body;

      if (!name || typeof name !== 'string' || name.trim() === '') {
        console.log('   ❌ Invalid project name');
        return res.status(400).json({
          success: false,
          error: 'Please provide a valid project name'
        });
      }

      // Generate project ID
      const projectId = `proj_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      console.log('   - Project ID:', projectId);
      console.log('   - Project name:', name);

      // Create project directory
      const projectPath = path.join(config.workspaceRoot, 'projects', name);
      console.log('   - Project path:', projectPath);

      try {
        console.log('   - Creating directories...');
        await fs.mkdir(projectPath, { recursive: true });
        await fs.mkdir(path.join(projectPath, 'src'), { recursive: true });
        await fs.mkdir(path.join(projectPath, 'tests'), { recursive: true });
        console.log('   ✅ Directories created');

        // Create README
        console.log('   - Creating README.md...');
        await fs.writeFile(
          path.join(projectPath, 'README.md'),
          `# ${name}\n\n${description || 'No description provided'}\n`
        );
        console.log('   ✅ README.md created');
      } catch (error: any) {
        console.error('   ❌ Failed to create project directory:', error);
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
   * DELETE /api/builder/projects/:id
   * Delete a project
   */
  router.delete('/projects/:id', async (req: Request, res: Response) => {
    console.log('\n🗑️ DELETE /api/builder/projects/:id');

    try {
      const { id } = req.params;

      const project = projects.get(id);

      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'Project not found'
        });
      }

      console.log(`   - Deleting project: ${project.name} (${id})`);

      // Remove project directory
      try {
        await fs.rm(project.path, { recursive: true, force: true });
        console.log(`   ✅ Project directory deleted: ${project.path}`);
      } catch (error: any) {
        console.error(`   ⚠️ Error deleting directory: ${error.message}`);
        // Continue even if directory deletion fails
      }

      // Remove from projects map
      projects.delete(id);

      console.log(`   ✅ Project removed from memory`);

      return res.status(200).json({
        success: true,
        message: `Project "${project.name}" deleted successfully`
      });

    } catch (error: any) {
      console.error('   ❌ Error deleting project:', error);
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

      // Also create a flat list of files for easy checking
      const flattenFiles = (tree: any[]): any[] => {
        const files: any[] = [];
        for (const item of tree) {
          if (item.type === 'file') {
            files.push(item);
          } else if (item.type === 'directory' && item.children) {
            files.push(...flattenFiles(item.children));
          }
        }
        return files;
      };

      const files = flattenFiles(fileTree);

      return res.status(200).json({
        success: true,
        data: fileTree,
        files: files  // Flat list for easy checking
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
    console.log('\n🎯 POST /api/builder/build received');
    console.log('   - Body:', JSON.stringify(req.body, null, 2));

    try {
      const { prompt, projectId, useQuality } = req.body;

      console.log('   - Prompt:', prompt?.substring(0, 100) + '...');
      console.log('   - Project ID:', projectId);
      console.log('   - Use Quality:', useQuality);

      if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
        console.log('   ❌ Invalid prompt');
        return res.status(400).json({
          success: false,
          error: 'Please provide a valid prompt'
        });
      }

      if (!projectId) {
        console.log('   ❌ Missing project ID');
        return res.status(400).json({
          success: false,
          error: 'Please provide a project ID'
        });
      }

      const project = projects.get(projectId);
      if (!project) {
        console.log('   ❌ Project not found:', projectId);
        console.log('   Available projects:', Array.from(projects.keys()));
        return res.status(404).json({
          success: false,
          error: 'Project not found'
        });
      }

      console.log('   ✅ Project found:', project.name);

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
      const enhancedTask = `${prompt}

IMPORTANT INSTRUCTIONS:
- You are building: ${project.name}
- Generate a complete, working application
- Include index.html, styles.css, and script.js
- Make sure all files are properly linked together

OUTPUT FORMAT - You MUST output code in this EXACT format:

\`\`\`html:index.html
<!DOCTYPE html>
<html>...your HTML code...</html>
\`\`\`

\`\`\`css:styles.css
/* your CSS code */
\`\`\`

\`\`\`javascript:script.js
// your JavaScript code
\`\`\`

CRITICAL: Always use the format \`\`\`language:filename with the colon and filename!`;

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

        console.log('📝 LLM Response:');
        console.log('   - Length:', result.text.length);
        console.log('   - Quality Score:', result.qualityScore);
        console.log('   - Iterations:', result.iterations);
        console.log('   - Full response:', result.text);

        // Save LLM response to debug file
        const debugPath = path.join(project.path, 'llm-response-debug.txt');
        await fs.writeFile(debugPath, result.text, 'utf-8');
        console.log('   - Saved debug file:', debugPath);

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

          // Create project-specific tool registry with project-scoped file operations
          const projectToolRegistry = new ToolRegistry();
          const projectFileService = new FileSystemService({
            workspaceRoot: project.path  // Use project path as workspace root
          });

          // Register project-scoped file tools
          projectToolRegistry.register({
            name: 'create_file',
            description: 'Create a new file with content',
            parameters: {
              path: { type: 'string', required: true, description: 'Path to the file' },
              content: { type: 'string', required: true, description: 'Content to write' }
            },
            execute: async (params: any) => {
              await projectFileService.writeFile(params.path, params.content);
              return { success: true, output: `File created: ${params.path}` };
            }
          });

          projectToolRegistry.register({
            name: 'write_file',
            description: 'Write content to a file (creates or overwrites)',
            parameters: {
              path: { type: 'string', required: true, description: 'Path to the file' },
              content: { type: 'string', required: true, description: 'Content to write' }
            },
            execute: async (params: any) => {
              await projectFileService.writeFile(params.path, params.content);
              return { success: true, output: `File written: ${params.path}` };
            }
          });

          projectToolRegistry.register({
            name: 'read_file',
            description: 'Read content from a file',
            parameters: {
              path: { type: 'string', required: true, description: 'Path to the file' }
            },
            execute: async (params: any) => {
              const content = await projectFileService.readFile(params.path);
              return { success: true, output: content };
            }
          });

          console.log('✅ Created project-specific tool registry with workspace root:', project.path);

          const planner = new PlannerService(
            config.llmProvider,
            projectToolRegistry,  // Use project-specific tool registry
            undefined, // No orchestrator for on-demand executor
            config.planningProvider, // Use fast planning provider if available
            config.adaptiveProvider // Use adaptive provider for intelligent selection
          );
          executor = new AgentExecutor(planner, projectToolRegistry, {  // Use project-specific tool registry
            workspaceRoot: project.path  // Use project path as workspace root
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

          // Save agent output to debug file
          const debugPath = path.join(project.path, 'agent-output-debug.txt');
          await fs.writeFile(debugPath, outputStr, 'utf-8');
          console.log('   - Saved debug file:', debugPath);

          // If no artifacts, try parsing the output as code
          if (!result.artifacts || result.artifacts.length === 0) {
            console.log('   - No artifacts found, attempting to parse output as code...');
            const parsedFiles = await parseAndSaveCode(outputStr, project.path);
            console.log('   - Parsed files:', parsedFiles.length);
            result.artifacts = parsedFiles;
          }
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

  // ============================================================
  // PLANNING ROUTES (Pack 7.1)
  // ============================================================

  /**
   * POST /api/builder/planning/generate
   * Generate planning.md from build request (auto-generated on first build)
   */
  router.post('/planning/generate', async (req: Request, res: Response) => {
    console.log('📝 POST /api/builder/planning/generate received');
    console.log('📋 Request body:', JSON.stringify(req.body, null, 2));

    try {
      const { projectId, description } = req.body;

      if (!projectId || !description) {
        console.log('❌ Missing required fields');
        return res.status(400).json({
          success: false,
          error: 'projectId and description are required'
        });
      }

      const project = projects.get(projectId);
      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'Project not found'
        });
      }

      console.log(`📝 Generating planning.md for project: ${project.name}`);
      console.log(`   Description: ${description.substring(0, 100)}...`);

      // Generate planning.md with AI
      const prompt = `Generate a concise project plan for this build request:

**Build Request:** ${description}

Create a planning document with these sections:

## 📋 Project Overview
Brief summary of what will be built (2-3 sentences)

## 🎯 Core Features
List 3-5 main features to implement

## 🏗️ Technical Approach
- Tech stack to use
- Key files to create
- Architecture overview

## ✅ Implementation Steps
Numbered list of 5-8 steps to build this

## 📦 Deliverables
What files/components will be created

**Requirements:**
- Format as clean Markdown
- Be specific and actionable
- Keep it concise (under 500 words)
- Focus on what will be built, not how to use it

Only output the planning document in Markdown format, nothing else.`;

      console.log('🤖 Calling LLM to generate planning.md...');

      // Use adaptive provider if available, otherwise fall back to llmProvider
      const provider = config.adaptiveProvider || config.llmProvider;

      if (!provider) {
        throw new Error('No LLM provider configured');
      }

      const planning = await provider.generate(prompt, {
        temperature: 0.7,
        maxTokens: 1500
      });

      // Save planning.md to project
      const planningPath = path.join(project.path, 'planning.md');
      await fs.writeFile(planningPath, planning);

      console.log(`✅ planning.md generated and saved to ${planningPath}`);

      return res.status(200).json({
        success: true,
        planning,
        path: 'planning.md'
      });

    } catch (error: any) {
      console.error('❌ planning.md generation error:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  });

  /**
   * POST /api/builder/plan/generate
   * Generate PRD from description using AI
   */
  router.post('/plan/generate', async (req: Request, res: Response) => {
    console.log('🎯 POST /api/builder/plan/generate received');
    console.log('📋 Request body:', JSON.stringify(req.body, null, 2));

    try {
      const { projectId, description, template } = req.body;

      if (!projectId || !description) {
        console.log('❌ Missing required fields');
        return res.status(400).json({
          success: false,
          error: 'projectId and description are required'
        });
      }

      const project = projects.get(projectId);
      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'Project not found'
        });
      }

      // Load template
      const templatesPath = path.join(__dirname, '../data/planning-templates.json');
      const templatesContent = await fs.readFile(templatesPath, 'utf-8');
      const templates = JSON.parse(templatesContent);
      const templateData = templates[template] || templates['web-app'];

      console.log(`📝 Generating PRD for project: ${project.name}`);
      console.log(`   Template: ${templateData.name}`);
      console.log(`   Description: ${description.substring(0, 100)}...`);

      // Generate PRD with AI
      const prompt = `Generate a detailed Product Requirements Document (PRD) for this project:

**Description:** ${description}

**Template:** ${templateData.name}
**Suggested Tech Stack:** ${templateData.techStack.join(', ')}

Create a comprehensive PRD with these sections:
${templateData.sections.map((s: string) => `- ${s}`).join('\n')}

**Requirements:**
- Format as clean Markdown
- Be specific and actionable
- Include 8-12 tasks in the Task Breakdown section
- Each task should be under 2 hours of work
- Tasks should be formatted as a checklist: - [ ] Task name
- Include technical details where relevant
- Define clear success criteria

Only output the PRD in Markdown format, nothing else.`;

      console.log('🤖 Calling LLM to generate PRD...');

      // Use adaptive provider if available, otherwise fall back to llmProvider
      const provider = config.adaptiveProvider || config.llmProvider;

      if (!provider) {
        throw new Error('No LLM provider configured');
      }

      const prd = await provider.generate(prompt, {
        temperature: 0.7,
        maxTokens: 2000
      });

      // Save PRD to project
      const prdPath = path.join(project.path, 'PRD.md');
      await fs.writeFile(prdPath, prd);

      console.log(`✅ PRD generated and saved to ${prdPath}`);

      return res.status(200).json({
        success: true,
        prd,
        path: 'PRD.md'
      });

    } catch (error: any) {
      console.error('❌ PRD generation error:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  });

  /**
   * POST /api/builder/plan/breakdown
   * Break PRD into actionable tasks
   */
  router.post('/plan/breakdown', async (req: Request, res: Response) => {
    try {
      const { projectId, prd } = req.body;

      if (!projectId || !prd) {
        return res.status(400).json({
          success: false,
          error: 'projectId and prd are required'
        });
      }

      const project = projects.get(projectId);
      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'Project not found'
        });
      }

      console.log(`🔨 Breaking down PRD into tasks for project: ${project.name}`);

      const prompt = `Break this Product Requirements Document into specific, actionable tasks:

${prd}

**Requirements:**
- Create 8-15 tasks total
- Each task should be under 2 hours of work
- Tasks should be ordered by dependency (what needs to be done first)
- Tasks should be specific and measurable
- Format as Markdown checklist: - [ ] Task name
- Group related tasks together
- Include setup, development, testing, and deployment tasks

Only output the task list in Markdown checklist format, nothing else.`;

      console.log('🤖 Calling LLM to break down tasks...');

      // Use adaptive provider if available, otherwise fall back to llmProvider
      const provider = config.adaptiveProvider || config.llmProvider;

      if (!provider) {
        throw new Error('No LLM provider configured');
      }

      const tasks = await provider.generate(prompt, {
        temperature: 0.5,
        maxTokens: 1000
      });

      console.log(`✅ Generated task breakdown`);

      return res.status(200).json({
        success: true,
        tasks: tasks.trim()
      });

    } catch (error: any) {
      console.error('❌ Task breakdown error:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  });

  /**
   * POST /api/builder/plan/estimate
   * Estimate project complexity and effort
   */
  router.post('/plan/estimate', async (req: Request, res: Response) => {
    try {
      const { projectId, prd } = req.body;

      if (!projectId || !prd) {
        return res.status(400).json({
          success: false,
          error: 'projectId and prd are required'
        });
      }

      const project = projects.get(projectId);
      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'Project not found'
        });
      }

      console.log(`📊 Estimating complexity for project: ${project.name}`);

      const prompt = `Analyze this Product Requirements Document and estimate project complexity:

${prd}

Provide estimates in this exact JSON format (no markdown, no code blocks, just raw JSON):
{
  "complexity": "simple|moderate|complex",
  "estimatedHours": <number>,
  "teamSize": <number>,
  "riskLevel": "low|medium|high",
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"]
}

**Guidelines:**
- simple: Basic CRUD, single page, minimal features (8-20 hours)
- moderate: Multiple features, database, auth, API (20-60 hours)
- complex: Advanced features, integrations, scalability (60+ hours)
- teamSize: 1 for simple, 1-2 for moderate, 2+ for complex
- riskLevel: Based on technical complexity and unknowns
- recommendations: 3-5 specific suggestions for success

Only output valid JSON, nothing else.`;

      console.log('🤖 Calling LLM to estimate complexity...');

      // Use adaptive provider if available, otherwise fall back to llmProvider
      const provider = config.adaptiveProvider || config.llmProvider;

      if (!provider) {
        throw new Error('No LLM provider configured');
      }

      const response = await provider.generate(prompt, {
        temperature: 0.3,
        maxTokens: 500
      });

      // Parse JSON response (handle potential markdown wrapping)
      let estimate;
      try {
        // Try to extract JSON from response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No JSON found in response');
        }
        estimate = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        console.error('Failed to parse AI response:', response);
        throw new Error('Failed to parse complexity estimate from AI');
      }

      // Validate required fields
      if (!estimate.complexity || !estimate.estimatedHours || !estimate.teamSize || !estimate.riskLevel || !estimate.recommendations) {
        throw new Error('Invalid estimate format from AI');
      }

      console.log(`✅ Complexity: ${estimate.complexity}, ${estimate.estimatedHours}h, Risk: ${estimate.riskLevel}`);

      return res.status(200).json({
        success: true,
        ...estimate
      });

    } catch (error: any) {
      console.error('❌ Complexity estimation error:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  });

  /**
   * POST /api/builder/plan/save
   * Save PRD content to file
   */
  router.post('/plan/save', async (req: Request, res: Response) => {
    try {
      const { projectId, content } = req.body;

      if (!projectId || !content) {
        return res.status(400).json({
          success: false,
          error: 'projectId and content are required'
        });
      }

      const project = projects.get(projectId);
      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'Project not found'
        });
      }

      const prdPath = path.join(project.path, 'PRD.md');
      await fs.writeFile(prdPath, content);

      console.log(`✅ PRD saved to ${prdPath}`);

      return res.status(200).json({
        success: true,
        path: 'PRD.md'
      });

    } catch (error: any) {
      console.error('❌ Save PRD error:', error);
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
  try {
    // Check if directory exists first
    try {
      await fs.access(dirPath);
    } catch {
      console.log(`⚠️ Directory does not exist: ${dirPath}`);
      return [];
    }

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
  } catch (error: any) {
    console.error(`❌ Error building file tree for ${dirPath}:`, error.message);
    return [];
  }
}

/**
 * Parse generated code and save to files
 * Handles code blocks in markdown format
 */
async function parseAndSaveCode(generatedText: string, projectPath: string): Promise<any[]> {
  const files: any[] = [];
  console.log('🔍 parseAndSaveCode called');
  console.log('   - Project path:', projectPath);
  console.log('   - Text length:', generatedText.length);
  console.log('   - Text preview:', generatedText.substring(0, 500));
  console.log('   - Full text:', generatedText); // DEBUG: Log full output

  // Pattern 1: ```html:index.html (explicit filename with colon)
  const explicitColonRegex = /```(\w+):([^\n]+)\n([\s\S]*?)```/g;

  // Pattern 2: ```html index.html (explicit filename with space)
  const explicitSpaceRegex = /```(\w+)\s+([^\n]+)\n([\s\S]*?)```/g;

  // Pattern 3: File path comment before code block (e.g., // index.html followed by ```html)
  const commentFileRegex = /(?:\/\/|#|<!--)\s*([^\n]+\.(?:html|css|js|jsx|ts|tsx))\s*(?:-->)?\s*\n```(\w+)\n([\s\S]*?)```/g;

  // Pattern 4: ```html (just language, infer filename)
  const implicitFileRegex = /```(html|css|javascript|js)\n([\s\S]*?)```/g;

  // Try Pattern 1: ```html:index.html
  let match;
  while ((match = explicitColonRegex.exec(generatedText)) !== null) {
    const [, language, filePath, content] = match;
    const cleanPath = filePath.trim();
    const fullPath = path.join(projectPath, cleanPath);

    try {
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, content.trim(), 'utf-8');
      files.push({
        path: cleanPath,
        name: path.basename(cleanPath),
        type: language,
        size: Buffer.byteLength(content, 'utf-8')
      });
      console.log(`✅ Created file (colon format): ${cleanPath}`);
    } catch (error: any) {
      console.error(`❌ Failed to create file ${cleanPath}:`, error.message);
    }
  }

  // Try Pattern 2: ```html index.html
  if (files.length === 0) {
    console.log('   - No colon format files found, trying space format...');
    while ((match = explicitSpaceRegex.exec(generatedText)) !== null) {
      const [, language, filePath, content] = match;
      const cleanPath = filePath.trim();
      const fullPath = path.join(projectPath, cleanPath);

      try {
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.writeFile(fullPath, content.trim(), 'utf-8');
        files.push({
          path: cleanPath,
          name: path.basename(cleanPath),
          type: language,
          size: Buffer.byteLength(content, 'utf-8')
        });
        console.log(`✅ Created file (space format): ${cleanPath}`);
      } catch (error: any) {
        console.error(`❌ Failed to create file ${cleanPath}:`, error.message);
      }
    }
  }

  // Try Pattern 3: Comment before code block
  if (files.length === 0) {
    console.log('   - No space format files found, trying comment format...');
    while ((match = commentFileRegex.exec(generatedText)) !== null) {
      const [, filePath, language, content] = match;
      const cleanPath = filePath.trim();
      const fullPath = path.join(projectPath, cleanPath);

      try {
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.writeFile(fullPath, content.trim(), 'utf-8');
        files.push({
          path: cleanPath,
          name: path.basename(cleanPath),
          type: language,
          size: Buffer.byteLength(content, 'utf-8')
        });
        console.log(`✅ Created file (comment format): ${cleanPath}`);
      } catch (error: any) {
        console.error(`❌ Failed to create file ${cleanPath}:`, error.message);
      }
    }
  }

  // Try Pattern 4: Implicit filenames
  if (files.length === 0) {
    console.log('   - No explicit files found, trying implicit pattern...');
    const langToFile: Record<string, string> = {
      'html': 'index.html',
      'css': 'styles.css',
      'javascript': 'script.js',
      'js': 'script.js'
    };

    while ((match = implicitFileRegex.exec(generatedText)) !== null) {
      const [, language, content] = match;
      const fileName = langToFile[language.toLowerCase()] || `file.${language}`;
      const fullPath = path.join(projectPath, fileName);

      try {
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.writeFile(fullPath, content.trim(), 'utf-8');
        files.push({
          path: fileName,
          name: fileName,
          type: language,
          size: Buffer.byteLength(content, 'utf-8')
        });
        console.log(`✅ Created file (implicit): ${fileName}`);
      } catch (error: any) {
        console.error(`❌ Failed to create file ${fileName}:`, error.message);
      }
    }
  }

  // Last resort: extract raw HTML/CSS/JS
  if (files.length === 0) {
    console.log('   - No code blocks found, trying raw extraction...');

    // Try to extract HTML
    const htmlMatch = generatedText.match(/<!DOCTYPE html>[\s\S]*?<\/html>/i);
    if (htmlMatch) {
      const fullPath = path.join(projectPath, 'index.html');
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, htmlMatch[0], 'utf-8');
      files.push({ path: 'index.html', name: 'index.html', type: 'html', size: htmlMatch[0].length });
      console.log('✅ Created file (raw): index.html');
    }
  }

  console.log(`📁 parseAndSaveCode: Created ${files.length} files`);
  return files;
}