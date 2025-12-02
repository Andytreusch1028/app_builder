# Pack 11: Local-First LLAMA Enhancements

## 🎯 Goal
Transform local LLAMA models (Qwen 2.5 Coder 7B, Gemma 3 1B) to perform at 80-90% of cloud model quality through advanced memory management, self-improvement, and context optimization.

## 📋 Overview
This pack enhances your existing local model infrastructure with:
1. **Letta Memory System** - Unlimited context through self-editing memory
2. **Personal Context Repository** - User-specific knowledge injection
3. **Self-Improvement (ITSI)** - Inference-time quality enhancement
4. **Qwen Optimization** - Better utilization of existing models
5. **Context Compression** - Efficient context window usage

## 🏗️ Components (22 files, 3,200+ lines)

### Enhancement 1: Letta Memory System (8 files, 1,200 lines)
- `src/memory/LettaMemoryManager.ts` (300 lines)
- `src/memory/MemoryBlock.ts` (150 lines)
- `src/memory/MemoryHierarchy.ts` (200 lines)
- `src/providers/LettaProvider.ts` (250 lines)
- `src/services/LettaIntegrationService.ts` (200 lines)
- `tests/memory/LettaMemoryManager.test.ts` (100 lines)

### Enhancement 2: Personal Context Repository (5 files, 600 lines)
- `src/context/PersonalContextManager.ts` (200 lines)
- `src/context/ContextInjector.ts` (150 lines)
- `src/context/schemas/UserContext.ts` (100 lines)
- `data/user-context/template.json` (50 lines)
- `tests/context/PersonalContextManager.test.ts` (100 lines)

### Enhancement 3: Self-Improvement (ITSI) (5 files, 800 lines)
- `src/agents/SelfImprovementAgent.ts` (300 lines)
- `src/agents/refinement/CritiqueGenerator.ts` (150 lines)
- `src/agents/refinement/ResponseRefiner.ts` (150 lines)
- `src/agents/refinement/VerificationLoop.ts` (100 lines)
- `tests/agents/SelfImprovementAgent.test.ts` (100 lines)

### Enhancement 4: Qwen Optimization (2 files, 300 lines)
- `src/config/qwen-prompts.ts` (150 lines)
- `src/providers/OptimizedQwenProvider.ts` (150 lines)

### Enhancement 5: Context Compression (2 files, 300 lines)
- `src/memory/ContextCompressor.ts` (200 lines)
- `tests/memory/ContextCompressor.test.ts` (100 lines)

---

## 🔨 Build Prompt

### Phase 1: Letta Memory System (3-5 days)

**Step 1: Install Letta SDK**
```bash
npm install @letta-ai/letta-client
```

**Step 2: Create Memory Block Schema**
```typescript
// src/memory/MemoryBlock.ts
export interface MemoryBlock {
  id: string;
  label: string;
  value: string;
  description?: string;
  limit?: number;
  template?: boolean;
  metadata?: Record<string, any>;
}

export interface MemoryHierarchy {
  inContext: MemoryBlock[];      // Active memory in context window
  outOfContext: MemoryBlock[];   // Archived memory (searchable)
}

export class MemoryBlockManager {
  private blocks: Map<string, MemoryBlock> = new Map();

  create(block: Omit<MemoryBlock, 'id'>): MemoryBlock {
    const id = `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newBlock = { id, ...block };
    this.blocks.set(id, newBlock);
    return newBlock;
  }

  update(id: string, updates: Partial<MemoryBlock>): MemoryBlock {
    const block = this.blocks.get(id);
    if (!block) throw new Error(`Block ${id} not found`);
    const updated = { ...block, ...updates };
    this.blocks.set(id, updated);
    return updated;
  }

  search(query: string): MemoryBlock[] {
    return Array.from(this.blocks.values()).filter(block =>
      block.value.toLowerCase().includes(query.toLowerCase()) ||
      block.label.toLowerCase().includes(query.toLowerCase())
    );
  }
}
```

**Step 3: Create Letta Integration Service**
```typescript
// src/services/LettaIntegrationService.ts
import { LettaClient } from '@letta-ai/letta-client';
import { MemoryBlock, MemoryBlockManager } from '../memory/MemoryBlock.js';

export class LettaIntegrationService {
  private client: LettaClient;
  private memoryManager: MemoryBlockManager;
  private agentId?: string;

  constructor(baseUrl: string = 'http://localhost:8283') {
    this.client = new LettaClient({ 
      baseUrl,
      embedding: 'openai/text-embedding-3-small'
    });
    this.memoryManager = new MemoryBlockManager();
  }

  async createAgent(config: {
    model: string;
    memoryBlocks: Omit<MemoryBlock, 'id'>[];
    tools?: string[];
  }): Promise<string> {
    const agentState = await this.client.agents.create({
      model: config.model,
      memoryBlocks: config.memoryBlocks.map(b => ({
        label: b.label,
        value: b.value,
        description: b.description
      })),
      tools: config.tools || []
    });

    this.agentId = agentState.id;
    return agentState.id;
  }

  async sendMessage(message: string): Promise<any> {
    if (!this.agentId) throw new Error('Agent not initialized');

    const response = await this.client.agents.messages.create(
      this.agentId,
      {
        messages: [{ role: 'user', content: message }]
      }
    );

    return response;
  }

  async updateMemory(blockLabel: string, newValue: string): Promise<void> {
    if (!this.agentId) throw new Error('Agent not initialized');

    // Letta agents can self-edit memory through tool calls
    await this.sendMessage(
      `Update your ${blockLabel} memory block with: ${newValue}`
    );
  }
}
```

**Step 4: Integrate with Existing Provider System**
```typescript
// src/providers/LettaProvider.ts
import { ICloudProvider } from './ICloudProvider.js';
import { LettaIntegrationService } from '../services/LettaIntegrationService.js';

export class LettaProvider implements ICloudProvider {
  readonly name: string = 'letta-ollama';
  private lettaService: LettaIntegrationService;
  private initialized: boolean = false;

  constructor(
    private modelName: string = 'ollama/qwen2.5-coder:7b',
    private baseUrl: string = 'http://localhost:8283'
  ) {
    this.lettaService = new LettaIntegrationService(baseUrl);
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    await this.lettaService.createAgent({
      model: this.modelName,
      memoryBlocks: [
        {
          label: 'persona',
          value: 'I am a helpful coding assistant specialized in building applications.',
          description: 'Information about the assistant\'s role and capabilities'
        },
        {
          label: 'user',
          value: 'User preferences and context will be stored here.',
          description: 'Information about the user and their preferences'
        },
        {
          label: 'project',
          value: 'Current project context and requirements.',
          description: 'Information about the current project being worked on'
        }
      ],
      tools: ['web_search', 'run_code']
    });

    this.initialized = true;
  }

  async generateText(prompt: string, options?: any): Promise<any> {
    await this.initialize();
    const response = await this.lettaService.sendMessage(prompt);
    
    return {
      text: response.messages
        .filter((m: any) => m.role === 'assistant')
        .map((m: any) => m.content)
        .join('\n'),
      usage: response.usage
    };
  }

  // ... implement other ICloudProvider methods
}
```

---

### Phase 2: Personal Context Repository (1-2 days)

**Step 1: Create Context Schema**
```typescript
// src/context/schemas/UserContext.ts
export interface UserPreferences {
  codingStyle: {
    language: string;
    framework: string;
    conventions: string[];
  };
  projectType: 'legalops' | 'builder' | 'general';
  qualityStandards: string[];
}

export interface ProjectContext {
  name: string;
  techStack: string[];
  currentPhase: string;
  requirements: string[];
}

export interface UserContext {
  preferences: UserPreferences;
  projects: ProjectContext[];
  knowledge: {
    domain: string;
    content: string;
  }[];
  history: {
    date: string;
    learnings: string[];
  }[];
}
```

**Step 2: Create Context Manager**
```typescript
// src/context/PersonalContextManager.ts
import fs from 'fs/promises';
import path from 'path';
import { UserContext } from './schemas/UserContext.js';

export class PersonalContextManager {
  private contextPath: string;
  private context: UserContext | null = null;

  constructor(contextPath: string = './data/user-context') {
    this.contextPath = contextPath;
  }

  async load(): Promise<UserContext> {
    const filePath = path.join(this.contextPath, 'context.json');
    const data = await fs.readFile(filePath, 'utf-8');
    this.context = JSON.parse(data);
    return this.context!;
  }

  async save(context: UserContext): Promise<void> {
    const filePath = path.join(this.contextPath, 'context.json');
    await fs.writeFile(filePath, JSON.stringify(context, null, 2));
    this.context = context;
  }

  getRelevantContext(query: string): string {
    if (!this.context) throw new Error('Context not loaded');

    // Simple relevance matching (can be enhanced with embeddings)
    const relevant: string[] = [];

    // Add coding preferences
    relevant.push(`Coding Style: ${this.context.preferences.codingStyle.language}`);
    relevant.push(`Framework: ${this.context.preferences.codingStyle.framework}`);

    // Add relevant knowledge
    this.context.knowledge.forEach(k => {
      if (query.toLowerCase().includes(k.domain.toLowerCase())) {
        relevant.push(`Knowledge (${k.domain}): ${k.content}`);
      }
    });

    return relevant.join('\n');
  }
}
```

---

## 📦 Dependencies

```json
{
  "dependencies": {
    "@letta-ai/letta-client": "^0.15.0"
  }
}
```

---

## 🎯 Success Criteria

1. ✅ Letta memory system integrated with Ollama
2. ✅ Agents can self-edit memory blocks
3. ✅ Context window effectively unlimited
4. ✅ Personal context automatically injected
5. ✅ Self-improvement loop reduces errors by 20-40%
6. ✅ Qwen model produces higher quality code
7. ✅ Context compression fits 2-3x more information

---

## 📊 Expected Performance

### Before Pack 11:
- Context limit: 8K (Gemma), 32K (Qwen)
- Quality: 60-70% of Claude Sonnet
- Personalization: None
- Cost: $0 (local) + cloud fallback costs

### After Pack 11:
- Context limit: Unlimited (Letta)
- Quality: 80-90% of Claude Sonnet
- Personalization: High (context repo)
- Cost: $0 (100% local)

---

**This pack transforms your builder into a truly local-first AI application that rivals cloud-based solutions.**

