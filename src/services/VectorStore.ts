/**
 * Vector Store - Store and search vector embeddings
 * 
 * In-memory vector store with cosine similarity search
 * Can be upgraded to use pgvector, Pinecone, or Weaviate
 */

import { Embedding, EmbeddingService } from './EmbeddingService.js';
import fs from 'fs/promises';
import path from 'path';

export interface VectorDocument {
  id: string;
  embedding: number[];
  text: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface SearchResult {
  document: VectorDocument;
  similarity: number;
}

export class VectorStore {
  private documents: Map<string, VectorDocument> = new Map();
  private embeddingService: EmbeddingService;
  private persistencePath?: string;

  constructor(embeddingService: EmbeddingService, persistencePath?: string) {
    this.embeddingService = embeddingService;
    this.persistencePath = persistencePath;
  }

  /**
   * Initialize store (load from disk if persistence enabled)
   */
  async initialize(): Promise<void> {
    if (this.persistencePath) {
      try {
        await this.load();
        console.log(`📦 VectorStore: Loaded ${this.documents.size} documents from disk`);
      } catch (error) {
        console.log('📦 VectorStore: No existing data found, starting fresh');
      }
    }
  }

  /**
   * Add document to store
   */
  async addDocument(
    id: string,
    text: string,
    metadata: Record<string, any> = {}
  ): Promise<VectorDocument> {
    const embedding = await this.embeddingService.generateEmbedding(text, metadata);

    const document: VectorDocument = {
      id,
      embedding: embedding.vector,
      text,
      metadata,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.documents.set(id, document);

    // Persist if enabled
    if (this.persistencePath) {
      await this.save();
    }

    return document;
  }

  /**
   * Add multiple documents
   */
  async addDocuments(
    documents: Array<{ id: string; text: string; metadata?: Record<string, any> }>
  ): Promise<VectorDocument[]> {
    const results: VectorDocument[] = [];

    for (const doc of documents) {
      const result = await this.addDocument(doc.id, doc.text, doc.metadata || {});
      results.push(result);
    }

    return results;
  }

  /**
   * Search for similar documents
   */
  async search(query: string, limit: number = 5, threshold: number = 0.5): Promise<SearchResult[]> {
    const queryEmbedding = await this.embeddingService.generateEmbedding(query);

    const results: SearchResult[] = [];

    for (const document of this.documents.values()) {
      const similarity = this.embeddingService.cosineSimilarity(
        queryEmbedding.vector,
        document.embedding
      );

      if (similarity >= threshold) {
        results.push({ document, similarity });
      }
    }

    // Sort by similarity (descending)
    results.sort((a, b) => b.similarity - a.similarity);

    // Return top results
    return results.slice(0, limit);
  }

  /**
   * Get document by ID
   */
  getDocument(id: string): VectorDocument | undefined {
    return this.documents.get(id);
  }

  /**
   * Delete document
   */
  async deleteDocument(id: string): Promise<boolean> {
    const deleted = this.documents.delete(id);

    if (deleted && this.persistencePath) {
      await this.save();
    }

    return deleted;
  }

  /**
   * Clear all documents
   */
  async clear(): Promise<void> {
    this.documents.clear();

    if (this.persistencePath) {
      await this.save();
    }
  }

  /**
   * Get document count
   */
  count(): number {
    return this.documents.size;
  }

  /**
   * Save to disk
   */
  private async save(): Promise<void> {
    if (!this.persistencePath) return;

    const data = Array.from(this.documents.values());
    const dir = path.dirname(this.persistencePath);
    
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(this.persistencePath, JSON.stringify(data, null, 2));
  }

  /**
   * Load from disk
   */
  private async load(): Promise<void> {
    if (!this.persistencePath) return;

    const data = await fs.readFile(this.persistencePath, 'utf-8');
    const documents: VectorDocument[] = JSON.parse(data);

    this.documents.clear();
    for (const doc of documents) {
      this.documents.set(doc.id, doc);
    }
  }
}

