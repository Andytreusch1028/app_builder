/**
 * Hybrid Agent API Routes - Two-brain hybrid system endpoints
 */

import { Router, Request, Response } from 'express';
import { HybridAgentExecutor } from '../services/HybridAgentExecutor.js';
import { PlannerService } from '../services/PlannerService.js';
import { LocalExecutorService } from '../services/LocalExecutorService.js';
import { AgentExecutor } from '../services/AgentExecutor.js';
import { ToolRegistry } from '../services/ToolRegistry.js';
import { ICloudProvider } from '../providers/ICloudProvider.js';
import { ProviderOrchestrator } from '../services/ProviderOrchestrator.js';

export interface HybridAgentConfig {
  cloudProvider: ICloudProvider;
  localProvider: ICloudProvider;
  toolRegistry: ToolRegistry;
  orchestrator?: ProviderOrchestrator;
}

export function createHybridAgentRouter(config: HybridAgentConfig): Router {
  const router = Router();

  // Create services
  const planner = new PlannerService(config.cloudProvider, config.toolRegistry, config.orchestrator);
  const localExecutor = new LocalExecutorService(config.localProvider, config.toolRegistry);
  const cloudExecutor = new AgentExecutor(planner, config.toolRegistry, {
    orchestrator: config.orchestrator
  });
  const hybridExecutor = new HybridAgentExecutor(planner, localExecutor, cloudExecutor);

  /**
   * POST /api/hybrid-agent/execute
   * Execute a task using the hybrid two-brain system
   */
  router.post('/execute', async (req: Request, res: Response) => {
    try {
      const { task, userId } = req.body;

      if (!task || typeof task !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Task is required and must be a string'
        });
      }

      console.log(`🧠 Hybrid Agent: Executing task for user ${userId || 'anonymous'}`);
      console.log(`   Task: ${task}`);

      const result = await hybridExecutor.execute(task, userId);

      return res.status(200).json({
        success: result.success,
        data: result,
        metadata: {
          executionMode: result.executionMode,
          escalated: result.escalated,
          escalationReason: result.escalationReason,
          localExecutionTime: result.localExecutionTime,
          cloudExecutionTime: result.cloudExecutionTime,
          qualityScore: result.qualityScore
        }
      });

    } catch (error: any) {
      console.error('❌ Hybrid agent execution error:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  });

  /**
   * GET /api/hybrid-agent/stats
   * Get escalation statistics
   */
  router.get('/stats', async (req: Request, res: Response) => {
    try {
      const metrics = hybridExecutor.getMetrics();

      return res.status(200).json({
        success: true,
        data: metrics
      });

    } catch (error: any) {
      console.error('❌ Error getting hybrid agent stats:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  });

  /**
   * GET /api/hybrid-agent/health
   * Health check for hybrid agent system
   */
  router.get('/health', async (req: Request, res: Response) => {
    try {
      const cloudAvailable = config.cloudProvider.isAvailable();
      const localAvailable = config.localProvider.isAvailable();

      return res.status(200).json({
        success: true,
        data: {
          cloudProvider: {
            name: config.cloudProvider.name,
            available: cloudAvailable
          },
          localProvider: {
            name: config.localProvider.name,
            available: localAvailable
          },
          hybridSystemReady: cloudAvailable && localAvailable
        }
      });

    } catch (error: any) {
      console.error('❌ Error checking hybrid agent health:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  });

  return router;
}

