/**
 * RAG Service - Retrieval-Augmented Generation
 * 
 * Augments prompts with relevant context from memory
 * Improves AI responses with contextual information
 */

import { MemoryService, MemoryType } from './MemoryService.js';

export interface RAGOptions {
  memoryTypes?: MemoryType[];
  userId?: string;
  maxContextLength?: number;
  similarityThreshold?: number;
  topK?: number;
}

export interface RAGResult {
  augmentedPrompt: string;
  originalPrompt: string;
  context: Array<{
    content: string;
    type: MemoryType;
    similarity: number;
  }>;
  contextLength: number;
}

export class RAGService {
  private memoryService: MemoryService;
  private readonly DEFAULT_MAX_CONTEXT_LENGTH = 4000;
  private readonly DEFAULT_SIMILARITY_THRESHOLD = 0.6;
  private readonly DEFAULT_TOP_K = 5;

  constructor(memoryService: MemoryService) {
    this.memoryService = memoryService;
  }

  /**
   * Augment prompt with relevant context from memory
   */
  async augmentPrompt(
    prompt: string,
    options: RAGOptions = {}
  ): Promise<RAGResult> {
    const {
      memoryTypes,
      userId,
      maxContextLength = this.DEFAULT_MAX_CONTEXT_LENGTH,
      similarityThreshold = this.DEFAULT_SIMILARITY_THRESHOLD,
      topK = this.DEFAULT_TOP_K
    } = options;

    // Search for relevant memories
    const memories = await this.memoryService.searchMemories(prompt, {
      userId,
      limit: topK,
      threshold: similarityThreshold
    });

    // Filter by memory types if specified
    const filteredMemories = memoryTypes
      ? memories.filter(m => memoryTypes.includes(m.type))
      : memories;

    // Build context
    const context: RAGResult['context'] = [];
    let contextLength = 0;

    for (const memory of filteredMemories) {
      const contentLength = memory.content.length;
      
      // Check if adding this memory would exceed max context length
      if (contextLength + contentLength > maxContextLength) {
        break;
      }

      context.push({
        content: memory.content,
        type: memory.type,
        similarity: memory.metadata.similarity || 0
      });

      contextLength += contentLength;
    }

    // Build augmented prompt
    const augmentedPrompt = this.buildAugmentedPrompt(prompt, context);

    return {
      augmentedPrompt,
      originalPrompt: prompt,
      context,
      contextLength
    };
  }

  /**
   * Build augmented prompt with context
   */
  private buildAugmentedPrompt(
    prompt: string,
    context: RAGResult['context']
  ): string {
    if (context.length === 0) {
      return prompt;
    }

    const contextSections: string[] = [];

    // Group context by type
    const conversationContext = context.filter(c => c.type === 'conversation');
    const codeContext = context.filter(c => c.type === 'code');
    const documentationContext = context.filter(c => c.type === 'documentation');
    const generalContext = context.filter(c => c.type === 'general');

    // Add conversation context
    if (conversationContext.length > 0) {
      contextSections.push('## Previous Conversations\n' +
        conversationContext.map(c => c.content).join('\n\n'));
    }

    // Add code context
    if (codeContext.length > 0) {
      contextSections.push('## Relevant Code\n' +
        codeContext.map(c => c.content).join('\n\n'));
    }

    // Add documentation context
    if (documentationContext.length > 0) {
      contextSections.push('## Relevant Documentation\n' +
        documentationContext.map(c => c.content).join('\n\n'));
    }

    // Add general context
    if (generalContext.length > 0) {
      contextSections.push('## Additional Context\n' +
        generalContext.map(c => c.content).join('\n\n'));
    }

    // Build final prompt
    return `# Context

${contextSections.join('\n\n')}

---

# User Request

${prompt}`;
  }

  /**
   * Store conversation for future RAG
   */
  async storeConversation(
    userMessage: string,
    aiResponse: string,
    userId?: string
  ): Promise<void> {
    const conversationText = `User: ${userMessage}\n\nAssistant: ${aiResponse}`;
    
    await this.memoryService.storeMemory(
      conversationText,
      'conversation',
      userId,
      {
        userMessage,
        aiResponse,
        timestamp: new Date().toISOString()
      }
    );
  }

  /**
   * Store code snippet for future RAG
   */
  async storeCode(
    code: string,
    language: string,
    description?: string,
    userId?: string
  ): Promise<void> {
    const codeText = description
      ? `${description}\n\n\`\`\`${language}\n${code}\n\`\`\``
      : `\`\`\`${language}\n${code}\n\`\`\``;

    await this.memoryService.storeMemory(
      codeText,
      'code',
      userId,
      {
        language,
        description,
        timestamp: new Date().toISOString()
      }
    );
  }

  /**
   * Store documentation for future RAG
   */
  async storeDocumentation(
    content: string,
    title?: string,
    userId?: string
  ): Promise<void> {
    const docText = title ? `# ${title}\n\n${content}` : content;

    await this.memoryService.storeMemory(
      docText,
      'documentation',
      userId,
      {
        title,
        timestamp: new Date().toISOString()
      }
    );
  }
}

