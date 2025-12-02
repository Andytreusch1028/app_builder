/**
 * Memory Service - Manage conversation and code memory
 * 
 * Stores and retrieves memories using vector embeddings
 * Supports different memory types: conversation, code, documentation
 */

import { VectorStore, SearchResult } from './VectorStore.js';
import { EmbeddingService } from './EmbeddingService.js';

export type MemoryType = 'conversation' | 'code' | 'documentation' | 'general';

export interface Memory {
  id: string;
  type: MemoryType;
  content: string;
  userId?: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface MemorySearchOptions {
  type?: MemoryType;
  userId?: string;
  limit?: number;
  threshold?: number;
}

export class MemoryService {
  private conversationStore: VectorStore;
  private codeStore: VectorStore;
  private documentationStore: VectorStore;
  private generalStore: VectorStore;

  constructor(
    embeddingService: EmbeddingService,
    persistenceDir?: string
  ) {
    this.conversationStore = new VectorStore(
      embeddingService,
      persistenceDir ? `${persistenceDir}/conversation.json` : undefined
    );
    this.codeStore = new VectorStore(
      embeddingService,
      persistenceDir ? `${persistenceDir}/code.json` : undefined
    );
    this.documentationStore = new VectorStore(
      embeddingService,
      persistenceDir ? `${persistenceDir}/documentation.json` : undefined
    );
    this.generalStore = new VectorStore(
      embeddingService,
      persistenceDir ? `${persistenceDir}/general.json` : undefined
    );
  }

  /**
   * Initialize all stores
   */
  async initialize(): Promise<void> {
    await Promise.all([
      this.conversationStore.initialize(),
      this.codeStore.initialize(),
      this.documentationStore.initialize(),
      this.generalStore.initialize()
    ]);
  }

  /**
   * Store a memory
   */
  async storeMemory(
    content: string,
    type: MemoryType = 'general',
    userId?: string,
    metadata: Record<string, any> = {}
  ): Promise<Memory> {
    const id = `mem_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    const memoryMetadata = {
      ...metadata,
      type,
      userId
    };

    const store = this.getStore(type);
    const document = await store.addDocument(id, content, memoryMetadata);

    return {
      id: document.id,
      type,
      content: document.text,
      userId,
      metadata: document.metadata,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt
    };
  }

  /**
   * Search memories
   */
  async searchMemories(
    query: string,
    options: MemorySearchOptions = {}
  ): Promise<Memory[]> {
    const {
      type,
      userId,
      limit = 5,
      threshold = 0.5
    } = options;

    let results: SearchResult[] = [];

    if (type) {
      // Search specific store
      const store = this.getStore(type);
      results = await store.search(query, limit, threshold);
    } else {
      // Search all stores
      const [convResults, codeResults, docResults, genResults] = await Promise.all([
        this.conversationStore.search(query, limit, threshold),
        this.codeStore.search(query, limit, threshold),
        this.documentationStore.search(query, limit, threshold),
        this.generalStore.search(query, limit, threshold)
      ]);

      results = [...convResults, ...codeResults, ...docResults, ...genResults];
      results.sort((a, b) => b.similarity - a.similarity);
      results = results.slice(0, limit);
    }

    // Filter by userId if specified
    if (userId) {
      results = results.filter(r => r.document.metadata.userId === userId);
    }

    return results.map(r => ({
      id: r.document.id,
      type: r.document.metadata.type || 'general',
      content: r.document.text,
      userId: r.document.metadata.userId,
      metadata: {
        ...r.document.metadata,
        similarity: r.similarity
      },
      createdAt: r.document.createdAt,
      updatedAt: r.document.updatedAt
    }));
  }

  /**
   * Get memory by ID
   */
  async getMemory(id: string, type?: MemoryType): Promise<Memory | null> {
    if (type) {
      const store = this.getStore(type);
      const document = store.getDocument(id);
      
      if (document) {
        return {
          id: document.id,
          type,
          content: document.text,
          userId: document.metadata.userId,
          metadata: document.metadata,
          createdAt: document.createdAt,
          updatedAt: document.updatedAt
        };
      }
    } else {
      // Search all stores
      for (const storeType of ['conversation', 'code', 'documentation', 'general'] as MemoryType[]) {
        const memory = await this.getMemory(id, storeType);
        if (memory) return memory;
      }
    }

    return null;
  }

  /**
   * Delete memory
   */
  async deleteMemory(id: string, type?: MemoryType): Promise<boolean> {
    if (type) {
      const store = this.getStore(type);
      return await store.deleteDocument(id);
    } else {
      // Try all stores
      const results = await Promise.all([
        this.conversationStore.deleteDocument(id),
        this.codeStore.deleteDocument(id),
        this.documentationStore.deleteDocument(id),
        this.generalStore.deleteDocument(id)
      ]);
      return results.some(r => r);
    }
  }

  /**
   * Get store by type
   */
  private getStore(type: MemoryType): VectorStore {
    switch (type) {
      case 'conversation':
        return this.conversationStore;
      case 'code':
        return this.codeStore;
      case 'documentation':
        return this.documentationStore;
      case 'general':
      default:
        return this.generalStore;
    }
  }

  /**
   * Get memory statistics
   */
  getStats() {
    return {
      conversation: this.conversationStore.count(),
      code: this.codeStore.count(),
      documentation: this.documentationStore.count(),
      general: this.generalStore.count(),
      total: this.conversationStore.count() + this.codeStore.count() + 
             this.documentationStore.count() + this.generalStore.count()
    };
  }
}

