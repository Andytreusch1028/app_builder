/**
 * Embedding Service - Generate vector embeddings for text
 * 
 * Uses a simple hash-based embedding for now (384 dimensions)
 * Can be upgraded to use OpenAI, Cohere, or local embedding models
 */

export interface Embedding {
  vector: number[];
  dimensions: number;
  text: string;
  metadata?: Record<string, any>;
}

export class EmbeddingService {
  private readonly DIMENSIONS = 384;

  /**
   * Generate embedding for text
   */
  async generateEmbedding(text: string, metadata?: Record<string, any>): Promise<Embedding> {
    // Simple hash-based embedding (deterministic)
    // In production, use OpenAI embeddings or a local model
    const vector = this.hashToVector(text);

    return {
      vector,
      dimensions: this.DIMENSIONS,
      text,
      metadata
    };
  }

  /**
   * Generate embeddings for multiple texts
   */
  async generateEmbeddings(texts: string[], metadata?: Record<string, any>[]): Promise<Embedding[]> {
    const embeddings: Embedding[] = [];

    for (let i = 0; i < texts.length; i++) {
      const embedding = await this.generateEmbedding(
        texts[i],
        metadata?.[i]
      );
      embeddings.push(embedding);
    }

    return embeddings;
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  /**
   * Hash text to vector (simple deterministic embedding)
   */
  private hashToVector(text: string): number[] {
    const vector: number[] = new Array(this.DIMENSIONS).fill(0);
    
    // Normalize text
    const normalized = text.toLowerCase().trim();
    
    // Generate deterministic hash-based vector
    for (let i = 0; i < normalized.length; i++) {
      const charCode = normalized.charCodeAt(i);
      const index = (charCode * (i + 1)) % this.DIMENSIONS;
      vector[index] += Math.sin(charCode * (i + 1)) * 0.1;
    }

    // Add word-level features
    const words = normalized.split(/\s+/);
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const wordHash = this.simpleHash(word);
      const index = wordHash % this.DIMENSIONS;
      vector[index] += Math.cos(wordHash) * 0.2;
    }

    // Normalize vector
    const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (norm > 0) {
      for (let i = 0; i < vector.length; i++) {
        vector[i] /= norm;
      }
    }

    return vector;
  }

  /**
   * Simple hash function
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Get embedding dimensions
   */
  getDimensions(): number {
    return this.DIMENSIONS;
  }
}

