/**
 * Memory API Routes - Endpoints for memory operations
 */

import { Router, Request, Response } from 'express';
import { MemoryService, MemoryType } from '../services/MemoryService.js';
import { RAGService } from '../services/RAGService.js';

export interface MemoryConfig {
  memoryService: MemoryService;
  ragService: RAGService;
}

export function createMemoryRouter(config: MemoryConfig): Router {
  const router = Router();
  const { memoryService, ragService } = config;

  /**
   * POST /api/memory/store
   * Store a new memory
   */
  router.post('/store', async (req: Request, res: Response) => {
    try {
      const { content, type, userId, metadata } = req.body;

      if (!content || typeof content !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Content is required and must be a string'
        });
      }

      const memory = await memoryService.storeMemory(
        content,
        type as MemoryType || 'general',
        userId,
        metadata || {}
      );

      return res.status(200).json({
        success: true,
        data: memory
      });

    } catch (error: any) {
      console.error('❌ Error storing memory:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  });

  /**
   * POST /api/memory/search
   * Search memories
   */
  router.post('/search', async (req: Request, res: Response) => {
    try {
      const { query, type, userId, limit, threshold } = req.body;

      if (!query || typeof query !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Query is required and must be a string'
        });
      }

      const memories = await memoryService.searchMemories(query, {
        type: type as MemoryType,
        userId,
        limit: limit || 5,
        threshold: threshold || 0.5
      });

      return res.status(200).json({
        success: true,
        data: memories
      });

    } catch (error: any) {
      console.error('❌ Error searching memories:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  });

  /**
   * GET /api/memory/:id
   * Get memory by ID
   */
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { type } = req.query;

      const memory = await memoryService.getMemory(id, type as MemoryType);

      if (!memory) {
        return res.status(404).json({
          success: false,
          error: 'Memory not found'
        });
      }

      return res.status(200).json({
        success: true,
        data: memory
      });

    } catch (error: any) {
      console.error('❌ Error getting memory:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  });

  /**
   * DELETE /api/memory/:id
   * Delete memory
   */
  router.delete('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { type } = req.query;

      const deleted = await memoryService.deleteMemory(id, type as MemoryType);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Memory not found'
        });
      }

      return res.status(200).json({
        success: true,
        data: { id, deleted: true }
      });

    } catch (error: any) {
      console.error('❌ Error deleting memory:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  });

  /**
   * GET /api/memory/stats
   * Get memory statistics
   */
  router.get('/stats', async (req: Request, res: Response) => {
    try {
      const stats = memoryService.getStats();

      return res.status(200).json({
        success: true,
        data: stats
      });

    } catch (error: any) {
      console.error('❌ Error getting memory stats:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  });

  return router;
}

