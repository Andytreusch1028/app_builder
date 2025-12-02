/**
 * Agent API Routes - REST endpoints for agent execution
 */

import { Router, Request, Response } from 'express';
import { AgentExecutor } from '../services/AgentExecutor.js';
import { PlannerService } from '../services/PlannerService.js';
import { ToolRegistry } from '../services/ToolRegistry.js';
import { ICloudProvider } from '../providers/ICloudProvider.js';
import { ProviderOrchestrator } from '../services/ProviderOrchestrator.js';
import { packRegistry } from '../config/pack-registry.js';
import {
  analyzeTask,
  shouldEnableWorkflow,
  DEFAULT_WORKFLOW_CONFIG,
  WorkflowConfig
} from '../config/workflow-config.js';

export interface AgentRouterConfig {
  provider: ICloudProvider;
  toolRegistry: ToolRegistry;
  workflowConfig?: WorkflowConfig;
  enableEnhancements?: boolean; // Enable advanced features (Letta, Context, Self-Improvement, etc.)
}

export function createAgentRouter(config: AgentRouterConfig): Router {
  const router = Router();

  // Create orchestrator with advanced features if enabled
  const orchestrator = config.enableEnhancements !== false ? new ProviderOrchestrator({
    primaryProvider: config.provider,
    enableLetta: true,
    enableContextInjection: true,
    enableSelfImprovement: true,
    enableQwenOptimization: true
  }) : undefined;

  // Pass orchestrator to tool registry for tracking
  if (orchestrator) {
    config.toolRegistry.setOrchestrator(orchestrator);
  }

  // Create planner and executor with orchestrator for tracking
  const planner = new PlannerService(config.provider, config.toolRegistry, orchestrator);
  const executor = new AgentExecutor(planner, config.toolRegistry, {
    orchestrator
  });

  // Workflow configuration
  const workflowConfig = config.workflowConfig || DEFAULT_WORKFLOW_CONFIG;

  // Store for tracking execution status (in-memory for now)
  const executionStore = new Map<string, any>();

  /**
   * POST /api/agent/analyze
   * Analyze task to determine if workflow should be used
   */
  router.post('/analyze', async (req: Request, res: Response) => {
    try {
      const { task } = req.body;

      if (!task || typeof task !== 'string' || task.trim() === '') {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Please provide a valid task description',
            field: 'task'
          }
        });
      }

      // Analyze task
      const analysis = analyzeTask(task.trim());
      const useWorkflow = shouldEnableWorkflow(analysis, workflowConfig);

      return res.status(200).json({
        success: true,
        data: {
          analysis,
          useWorkflow,
          workflowConfig
        }
      });

    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: {
          message: error.message || 'An error occurred during analysis'
        }
      });
    }
  });

  /**
   * POST /api/agent/execute
   * Execute an agent task (SYNCHRONOUS - waits for completion)
   */
  router.post('/execute', async (req: Request, res: Response) => {
    try {
      const { task, userId, useWorkflow } = req.body;

      // Validate task input
      if (!task || typeof task !== 'string') {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Please provide a valid task description',
            field: 'task'
          }
        });
      }

      // Check for empty or whitespace-only input
      if (task.trim() === '') {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Please enter a task to get started',
            field: 'task'
          }
        });
      }

      // Analyze task if workflow mode not explicitly set
      let workflowMode = useWorkflow;
      let analysis = null;

      if (workflowMode === undefined) {
        analysis = analyzeTask(task.trim());
        workflowMode = shouldEnableWorkflow(analysis, workflowConfig);
      }

      // Execute task synchronously and wait for result
      const result = await executor.execute(task.trim(), userId);

      // Get technologies used during execution
      const technologies = orchestrator ? {
        used: orchestrator.getTechnologiesUsed(),
        available: orchestrator.getAvailableTechnologies()
      } : undefined;

      // Add workflow metadata to result
      const enhancedResult = {
        ...result,
        metadata: {
          ...result.metadata,
          workflowUsed: workflowMode,
          analysis: analysis || undefined,
          technologies: technologies
        }
      };

      // Return result immediately
      return res.status(200).json(enhancedResult);

    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: {
          message: error.message || 'An error occurred while processing your task'
        }
      });
    }
  });

  /**
   * POST /api/agent/execute-async
   * Execute an agent task (ASYNC - returns execution ID)
   */
  router.post('/execute-async', async (req: Request, res: Response) => {
    try {
      const { task, userId } = req.body;

      // Validate task input
      if (!task || typeof task !== 'string') {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Please provide a valid task description',
            field: 'task'
          }
        });
      }

      // Check for empty or whitespace-only input
      if (task.trim() === '') {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Please enter a task to get started',
            field: 'task'
          }
        });
      }

      // Generate execution ID
      const executionId = `exec_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      // Store initial status
      executionStore.set(executionId, {
        id: executionId,
        task,
        userId,
        status: 'running',
        startTime: new Date().toISOString()
      });

      // Execute task asynchronously
      executor.execute(task, userId)
        .then(result => {
          executionStore.set(executionId, {
            id: executionId,
            task,
            userId,
            status: result.success ? 'completed' : 'failed',
            startTime: executionStore.get(executionId)?.startTime,
            endTime: new Date().toISOString(),
            result
          });
        })
        .catch(error => {
          executionStore.set(executionId, {
            id: executionId,
            task,
            userId,
            status: 'failed',
            startTime: executionStore.get(executionId)?.startTime,
            endTime: new Date().toISOString(),
            error: error.message
          });
        });

      // Return execution ID immediately
      return res.status(202).json({
        success: true,
        data: {
          executionId,
          status: 'running',
          message: 'Task execution started'
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
   * GET /api/agent/status/:executionId
   * Get execution status
   */
  router.get('/status/:executionId', (req: Request, res: Response) => {
    try {
      const { executionId } = req.params;

      const execution = executionStore.get(executionId);

      if (!execution) {
        return res.status(404).json({
          success: false,
          error: 'Execution not found'
        });
      }

      return res.status(200).json({
        success: true,
        data: execution
      });

    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  });

  /**
   * GET /api/agent/tools
   * List available tools
   */
  router.get('/tools', (req: Request, res: Response) => {
    try {
      const tools = config.toolRegistry.listTools();

      return res.status(200).json({
        success: true,
        data: {
          tools,
          count: tools.length
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
   * GET /api/agent/stats
   * Get tool execution statistics
   */
  router.get('/stats', (req: Request, res: Response) => {
    try {
      const stats = config.toolRegistry.getAllStats();

      return res.status(200).json({
        success: true,
        data: stats
      });

    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  });

  /**
   * GET /api/agent/workflow-config
   * Get current workflow configuration
   */
  router.get('/workflow-config', (req: Request, res: Response) => {
    try {
      return res.status(200).json({
        success: true,
        data: workflowConfig
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  });

  /**
   * POST /api/agent/workflow-config
   * Update workflow configuration
   */
  router.post('/workflow-config', (req: Request, res: Response) => {
    try {
      const { enabled, autoDetect, minComplexityThreshold, preferredMode } = req.body;

      // Update configuration
      if (enabled !== undefined) workflowConfig.enabled = enabled;
      if (autoDetect !== undefined) workflowConfig.autoDetect = autoDetect;
      if (minComplexityThreshold !== undefined) workflowConfig.minComplexityThreshold = minComplexityThreshold;
      if (preferredMode !== undefined) workflowConfig.preferredMode = preferredMode;

      return res.status(200).json({
        success: true,
        data: workflowConfig
      });

    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  });

  /**
   * GET /api/agent/pack11-status
   * Get Pack 11 integration status
   */
  router.get('/pack11-status', (req: Request, res: Response) => {
    try {
      if (!orchestrator) {
        return res.status(200).json({
          success: true,
          data: {
            enabled: false,
            message: 'Pack 11 features are disabled'
          }
        });
      }

      const status = orchestrator.getPack11Status();

      return res.status(200).json({
        success: true,
        data: {
          enabled: true,
          ...status,
          features: {
            unlimitedContext: status.phase1.lettaAvailable,
            personalContext: status.phase1.contextInjectionEnabled,
            selfImprovement: status.phase2.selfImprovementEnabled,
            qwenOptimization: status.phase2.qwenOptimizationEnabled
          }
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
   * GET /api/agent/packs
   * Get all registered packs and their status
   */
  router.get('/packs', (req: Request, res: Response) => {
    try {
      const summary = packRegistry.getStatusSummary();
      const testCases = packRegistry.getAllTestCases();

      return res.status(200).json({
        success: true,
        data: {
          ...summary,
          testCases: testCases.length
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
   * GET /api/agent/packs/test-cases
   * Get all test cases from registered packs
   */
  router.get('/packs/test-cases', (req: Request, res: Response) => {
    try {
      const testCases = packRegistry.getAllTestCases();

      return res.status(200).json({
        success: true,
        data: {
          testCases,
          count: testCases.length
        }
      });

    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  });

  return router;
}

