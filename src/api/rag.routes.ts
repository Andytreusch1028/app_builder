/**
 * RAG API Routes - Endpoints for retrieval-augmented generation
 */

import { Router, Request, Response } from 'express';
import { RAGService } from '../services/RAGService.js';
import { MemoryType } from '../services/MemoryService.js';

export interface RAGConfig {
  ragService: RAGService;
}

export function createRAGRouter(config: RAGConfig): Router {
  const router = Router();
  const { ragService } = config;

  /**
   * POST /api/rag/augment
   * Augment prompt with relevant context
   */
  router.post('/augment', async (req: Request, res: Response) => {
    try {
      const {
        prompt,
        memoryTypes,
        userId,
        maxContextLength,
        similarityThreshold,
        topK
      } = req.body;

      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Prompt is required and must be a string'
        });
      }

      const result = await ragService.augmentPrompt(prompt, {
        memoryTypes: memoryTypes as MemoryType[],
        userId,
        maxContextLength,
        similarityThreshold,
        topK
      });

      return res.status(200).json({
        success: true,
        data: result
      });

    } catch (error: any) {
      console.error('❌ Error augmenting prompt:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  });

  /**
   * POST /api/rag/store-conversation
   * Store conversation for future RAG
   */
  router.post('/store-conversation', async (req: Request, res: Response) => {
    try {
      const { userMessage, aiResponse, userId } = req.body;

      if (!userMessage || !aiResponse) {
        return res.status(400).json({
          success: false,
          error: 'userMessage and aiResponse are required'
        });
      }

      await ragService.storeConversation(userMessage, aiResponse, userId);

      return res.status(200).json({
        success: true,
        data: { stored: true }
      });

    } catch (error: any) {
      console.error('❌ Error storing conversation:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  });

  /**
   * POST /api/rag/store-code
   * Store code snippet for future RAG
   */
  router.post('/store-code', async (req: Request, res: Response) => {
    try {
      const { code, language, description, userId } = req.body;

      if (!code || !language) {
        return res.status(400).json({
          success: false,
          error: 'code and language are required'
        });
      }

      await ragService.storeCode(code, language, description, userId);

      return res.status(200).json({
        success: true,
        data: { stored: true }
      });

    } catch (error: any) {
      console.error('❌ Error storing code:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  });

  /**
   * POST /api/rag/store-documentation
   * Store documentation for future RAG
   */
  router.post('/store-documentation', async (req: Request, res: Response) => {
    try {
      const { content, title, userId } = req.body;

      if (!content) {
        return res.status(400).json({
          success: false,
          error: 'content is required'
        });
      }

      await ragService.storeDocumentation(content, title, userId);

      return res.status(200).json({
        success: true,
        data: { stored: true }
      });

    } catch (error: any) {
      console.error('❌ Error storing documentation:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  });

  return router;
}

