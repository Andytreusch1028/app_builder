/**
 * DeepAgentsJS API Routes
 * Provides endpoints for DeepAgentsJS harness execution
 */

import { Router, Request, Response } from 'express';
import { DeepAgentsService } from '../services/DeepAgentsService.js';
import { FileSystemService } from '../services/FileSystemService.js';
import { ICloudProvider } from '../providers/ICloudProvider.js';
import { DeepAgentConfig } from '../types/deepagents.types.js';

export interface DeepAgentsRouterConfig {
  provider: ICloudProvider;
  fileSystemService: FileSystemService;
  workspaceRoot: string;
  sopExecutor?: any;
}

export function createDeepAgentsRouter(config: DeepAgentsRouterConfig): Router {
  const router = Router();

  /**
   * POST /execute - Execute task with DeepAgentsJS harness
   */
  router.post('/execute', async (req: Request, res: Response) => {
    try {
      const { task, userId, config: userConfig } = req.body;

      if (!task) {
        return res.status(400).json({
          success: false,
          error: { message: 'Task is required' }
        });
      }

      const deepAgentConfig: DeepAgentConfig = {
        workspaceRoot: config.workspaceRoot,
        maxTodoItems: userConfig?.maxTodoItems ?? 50,
        maxSubAgents: userConfig?.maxSubAgents ?? 10,
        enableAutoSummarization: userConfig?.enableAutoSummarization ?? true,
        summarizationThreshold: userConfig?.summarizationThreshold ?? 170000,
        enableHITL: userConfig?.enableHITL ?? false
      };

      const service = new DeepAgentsService(
        config.provider,
        config.fileSystemService,
        deepAgentConfig,
        config.sopExecutor
      );

      const result = await service.execute(task, userId);

      res.json({
        success: result.success,
        data: result
      });
    } catch (error) {
      console.error('DeepAgents execution error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  });

  /**
   * GET /middleware/todo - Get todo list state
   */
  router.get('/middleware/todo', async (req: Request, res: Response) => {
    try {
      // This would require maintaining service instances
      // For now, return placeholder
      res.json({
        success: true,
        data: {
          items: [],
          currentTaskId: undefined
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  });

  /**
   * GET /middleware/filesystem - Get filesystem state
   */
  router.get('/middleware/filesystem', async (req: Request, res: Response) => {
    try {
      res.json({
        success: true,
        data: {
          workingDirectory: config.workspaceRoot,
          recentFiles: [],
          documentCache: {}
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  });

  /**
   * GET /middleware/subagents - Get sub-agent state
   */
  router.get('/middleware/subagents', async (req: Request, res: Response) => {
    try {
      res.json({
        success: true,
        data: []
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  });

  /**
   * GET /health - Health check
   */
  router.get('/health', (req: Request, res: Response) => {
    res.json({
      success: true,
      data: {
        status: 'ok',
        provider: config.provider.name,
        workspaceRoot: config.workspaceRoot
      }
    });
  });

  return router;
}

