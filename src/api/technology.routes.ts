/**
 * Technology Management API Routes
 * 
 * Endpoints for checking status, starting/stopping, and getting metadata
 * for all helper technologies (Ollama, Letta, etc.)
 */

import express, { Request, Response } from 'express';
import { TechnologyManager } from '../services/TechnologyManager.js';

const router = express.Router();
const techManager = new TechnologyManager();

/**
 * GET /api/technologies
 * Get all technologies with metadata
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const technologies = techManager.getTechnologies();
    res.json({
      success: true,
      data: technologies
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        message: error.message
      }
    });
  }
});

/**
 * GET /api/technologies/status
 * Get status of all technologies
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const statuses = await techManager.getAllStatus();
    res.json({
      success: true,
      data: statuses
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        message: error.message
      }
    });
  }
});

/**
 * GET /api/technologies/:id/status
 * Get status of a specific technology
 */
router.get('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const status = await techManager.checkStatus(id);
    res.json({
      success: true,
      data: status
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        message: error.message
      }
    });
  }
});

/**
 * POST /api/technologies/:id/start
 * Start a specific technology
 */
router.post('/:id/start', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await techManager.startTechnology(id);
    
    res.json({
      success: result.success,
      data: result.success ? { message: result.message } : undefined,
      error: !result.success ? { message: result.message } : undefined
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        message: error.message
      }
    });
  }
});

/**
 * POST /api/technologies/:id/stop
 * Stop a specific technology
 */
router.post('/:id/stop', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await techManager.stopTechnology(id);
    
    res.json({
      success: result.success,
      data: result.success ? { message: result.message } : undefined,
      error: !result.success ? { message: result.message } : undefined
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        message: error.message
      }
    });
  }
});

/**
 * POST /api/technologies/cache/clear
 * Clear status cache
 */
router.post('/cache/clear', (req: Request, res: Response) => {
  try {
    techManager.clearCache();
    res.json({
      success: true,
      data: { message: 'Cache cleared successfully' }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        message: error.message
      }
    });
  }
});

export default router;

