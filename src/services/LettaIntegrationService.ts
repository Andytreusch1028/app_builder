/**
 * Letta Integration Service
 * Provides unlimited context through self-editing memory blocks
 */

import LettaClient from '@letta-ai/letta-client';
import { MemoryBlock, MemoryBlockManager } from '../memory/MemoryBlock.js';

export interface LettaAgentConfig {
  model: string;
  memoryBlocks: Omit<MemoryBlock, 'id' | 'createdAt' | 'updatedAt'>[];
  tools?: string[];
  name?: string;
  description?: string;
}

export interface LettaMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface LettaResponse {
  messages: LettaMessage[];
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  memoryUpdates?: MemoryBlock[];
}

/**
 * Letta Integration Service
 * Manages Letta agents with unlimited context
 */
export class LettaIntegrationService {
  private client: LettaClient;
  private memoryManager: MemoryBlockManager;
  private agentId?: string;
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:8283') {
    this.baseUrl = baseUrl;
    this.client = new LettaClient({
      baseURL: baseUrl
    });
    this.memoryManager = new MemoryBlockManager();
  }

  /**
   * Create a new Letta agent with memory blocks
   */
  async createAgent(config: LettaAgentConfig): Promise<string> {
    try {
      // Create memory blocks in manager
      const memoryBlocks = config.memoryBlocks.map(block => 
        this.memoryManager.create(block)
      );

      // Create agent with Letta
      const agentState = await this.client.agents.create({
        name: config.name || 'coding-assistant',
        model: config.model,
        memory_blocks: memoryBlocks.map(b => ({
          label: b.label,
          value: b.value,
          description: b.description
        })),
        tools: config.tools || []
      } as any);

      this.agentId = agentState.id;
      return agentState.id;
    } catch (error) {
      console.error('Failed to create Letta agent:', error);
      throw new Error(`Letta agent creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Send a message to the agent
   */
  async sendMessage(message: string): Promise<LettaResponse> {
    if (!this.agentId) {
      throw new Error('Agent not initialized. Call createAgent() first.');
    }

    try {
      const response = await this.client.agents.messages.create(
        this.agentId,
        {
          messages: [{ role: 'user', content: message }]
        } as any
      );

      // Extract messages
      const messages: LettaMessage[] = (response as any).messages || [];

      // Extract usage if available
      const usage = (response as any).usage;

      return {
        messages,
        usage,
        memoryUpdates: []
      };
    } catch (error) {
      console.error('Failed to send message to Letta agent:', error);
      throw new Error(`Letta message failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update a memory block
   * Letta agents can self-edit memory through tool calls
   */
  async updateMemory(blockLabel: string, newValue: string): Promise<void> {
    if (!this.agentId) {
      throw new Error('Agent not initialized');
    }

    try {
      // Send instruction to agent to update its own memory
      await this.sendMessage(
        `Update your ${blockLabel} memory block with the following information: ${newValue}`
      );

      // Update local memory manager
      const blocks = this.memoryManager.getAll();
      const block = blocks.find(b => b.label === blockLabel);
      if (block) {
        this.memoryManager.update(block.id, { value: newValue });
      }
    } catch (error) {
      console.error('Failed to update memory:', error);
      throw error;
    }
  }

  /**
   * Search agent's memory
   */
  searchMemory(query: string, limit: number = 5) {
    return this.memoryManager.search(query, limit);
  }

  /**
   * Get all memory blocks
   */
  getMemoryBlocks(): MemoryBlock[] {
    return this.memoryManager.getAll();
  }

  /**
   * Get memory hierarchy (in-context vs out-of-context)
   */
  getMemoryHierarchy() {
    return this.memoryManager.getHierarchy();
  }

  /**
   * Archive a memory block (move to out-of-context)
   */
  archiveMemory(blockId: string): void {
    this.memoryManager.archive(blockId);
  }

  /**
   * Restore a memory block (move to in-context)
   */
  restoreMemory(blockId: string): void {
    this.memoryManager.restore(blockId);
  }

  /**
   * Get agent ID
   */
  getAgentId(): string | undefined {
    return this.agentId;
  }

  /**
   * Check if agent is initialized
   */
  isInitialized(): boolean {
    return !!this.agentId;
  }
}

