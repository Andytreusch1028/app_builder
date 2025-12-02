/**
 * Memory Block Schema for Letta Integration
 * Provides self-editing memory blocks for unlimited context
 */

export interface MemoryBlock {
  id: string;
  label: string;
  value: string;
  description?: string;
  limit?: number;
  template?: boolean;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MemoryHierarchy {
  inContext: MemoryBlock[];      // Active memory in context window
  outOfContext: MemoryBlock[];   // Archived memory (searchable)
}

export interface MemorySearchResult {
  block: MemoryBlock;
  relevanceScore: number;
  matchedText: string;
}

/**
 * Memory Block Manager
 * Manages creation, updates, and search of memory blocks
 */
export class MemoryBlockManager {
  private blocks: Map<string, MemoryBlock> = new Map();
  private hierarchy: MemoryHierarchy = {
    inContext: [],
    outOfContext: []
  };

  /**
   * Create a new memory block
   */
  create(block: Omit<MemoryBlock, 'id' | 'createdAt' | 'updatedAt'>): MemoryBlock {
    const id = `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    const newBlock: MemoryBlock = {
      id,
      ...block,
      createdAt: now,
      updatedAt: now
    };
    this.blocks.set(id, newBlock);
    
    // Add to in-context by default
    this.hierarchy.inContext.push(newBlock);
    
    return newBlock;
  }

  /**
   * Update an existing memory block
   */
  update(id: string, updates: Partial<Omit<MemoryBlock, 'id' | 'createdAt'>>): MemoryBlock {
    const block = this.blocks.get(id);
    if (!block) {
      throw new Error(`Memory block ${id} not found`);
    }
    
    const updated: MemoryBlock = {
      ...block,
      ...updates,
      updatedAt: new Date()
    };
    
    this.blocks.set(id, updated);
    
    // Update in hierarchy
    this.updateInHierarchy(updated);
    
    return updated;
  }

  /**
   * Get a memory block by ID
   */
  get(id: string): MemoryBlock | undefined {
    return this.blocks.get(id);
  }

  /**
   * Get all memory blocks
   */
  getAll(): MemoryBlock[] {
    return Array.from(this.blocks.values());
  }

  /**
   * Search memory blocks by query
   */
  search(query: string, limit: number = 5): MemorySearchResult[] {
    const queryLower = query.toLowerCase();
    const results: MemorySearchResult[] = [];

    for (const block of this.blocks.values()) {
      const valueLower = block.value.toLowerCase();
      const labelLower = block.label.toLowerCase();
      
      if (valueLower.includes(queryLower) || labelLower.includes(queryLower)) {
        // Simple relevance scoring (can be enhanced with embeddings)
        const valueMatch = valueLower.includes(queryLower);
        const labelMatch = labelLower.includes(queryLower);
        const relevanceScore = (valueMatch ? 0.7 : 0) + (labelMatch ? 0.3 : 0);
        
        // Extract matched text
        const matchIndex = valueLower.indexOf(queryLower);
        const matchedText = matchIndex >= 0
          ? block.value.substring(Math.max(0, matchIndex - 50), Math.min(block.value.length, matchIndex + 100))
          : block.value.substring(0, 100);
        
        results.push({
          block,
          relevanceScore,
          matchedText
        });
      }
    }

    // Sort by relevance and limit
    return results
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }

  /**
   * Move block to out-of-context (archive)
   */
  archive(id: string): void {
    const block = this.blocks.get(id);
    if (!block) return;

    this.hierarchy.inContext = this.hierarchy.inContext.filter(b => b.id !== id);
    if (!this.hierarchy.outOfContext.find(b => b.id === id)) {
      this.hierarchy.outOfContext.push(block);
    }
  }

  /**
   * Move block to in-context (restore)
   */
  restore(id: string): void {
    const block = this.blocks.get(id);
    if (!block) return;

    this.hierarchy.outOfContext = this.hierarchy.outOfContext.filter(b => b.id !== id);
    if (!this.hierarchy.inContext.find(b => b.id === id)) {
      this.hierarchy.inContext.push(block);
    }
  }

  /**
   * Get current memory hierarchy
   */
  getHierarchy(): MemoryHierarchy {
    return this.hierarchy;
  }

  /**
   * Update block in hierarchy
   */
  private updateInHierarchy(block: MemoryBlock): void {
    const inContextIndex = this.hierarchy.inContext.findIndex(b => b.id === block.id);
    if (inContextIndex >= 0) {
      this.hierarchy.inContext[inContextIndex] = block;
    }

    const outOfContextIndex = this.hierarchy.outOfContext.findIndex(b => b.id === block.id);
    if (outOfContextIndex >= 0) {
      this.hierarchy.outOfContext[outOfContextIndex] = block;
    }
  }

  /**
   * Clear all memory blocks
   */
  clear(): void {
    this.blocks.clear();
    this.hierarchy = {
      inContext: [],
      outOfContext: []
    };
  }
}

