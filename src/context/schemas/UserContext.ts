/**
 * User Context Schema
 * Defines structure for personal context repository
 */

export interface CodingStyle {
  language: string;
  framework: string;
  conventions: string[];
  preferences: {
    indentation?: 'tabs' | 'spaces';
    spacesPerIndent?: number;
    quotes?: 'single' | 'double';
    semicolons?: boolean;
    trailingComma?: boolean;
  };
}

export interface UserPreferences {
  codingStyle: CodingStyle;
  projectType: 'legalops' | 'builder' | 'general';
  qualityStandards: string[];
  communicationStyle?: 'concise' | 'detailed' | 'mixed';
  aiAssistanceLevel?: 'minimal' | 'moderate' | 'extensive';
}

export interface ProjectContext {
  name: string;
  description?: string;
  techStack: string[];
  currentPhase: string;
  requirements: string[];
  architecture?: string;
  patterns?: string[];
}

export interface DomainKnowledge {
  domain: string;
  content: string;
  tags?: string[];
  lastUpdated?: string;
}

export interface ConversationHistory {
  date: string;
  learnings: string[];
  decisions?: string[];
  context?: string;
}

export interface UserContext {
  version: string;
  lastUpdated: string;
  preferences: UserPreferences;
  projects: ProjectContext[];
  knowledge: DomainKnowledge[];
  history: ConversationHistory[];
}

/**
 * Default user context template
 */
export const DEFAULT_USER_CONTEXT: UserContext = {
  version: '1.0.0',
  lastUpdated: new Date().toISOString(),
  preferences: {
    codingStyle: {
      language: 'TypeScript',
      framework: 'Node.js',
      conventions: [
        'Use ES Modules',
        'Prefer async/await over callbacks',
        'Use explicit types',
        'Follow clean code principles'
      ],
      preferences: {
        indentation: 'spaces',
        spacesPerIndent: 2,
        quotes: 'single',
        semicolons: true,
        trailingComma: true
      }
    },
    projectType: 'builder',
    qualityStandards: [
      'Write tests for critical functionality',
      'Document public APIs',
      'Handle errors gracefully',
      'Follow SOLID principles'
    ],
    communicationStyle: 'concise',
    aiAssistanceLevel: 'moderate'
  },
  projects: [
    {
      name: 'Builder App',
      description: 'Local-first AI application builder using LLAMA models',
      techStack: ['Node.js', 'TypeScript', 'Express', 'Ollama', 'Letta'],
      currentPhase: 'Pack 11 - Local LLAMA Enhancements',
      requirements: [
        'Unlimited context through Letta',
        'Personal context repository',
        'Self-improvement loops',
        'Qwen optimization',
        'Context compression'
      ],
      architecture: 'Hybrid compute with local-first strategy',
      patterns: ['Provider pattern', 'Service layer', 'Memory hierarchy']
    }
  ],
  knowledge: [
    {
      domain: 'local-first-ai',
      content: 'Focus on local LLAMA models (Qwen 2.5 Coder 7B, Gemma 3 1B) with cloud fallback. Use Letta for unlimited context, personal context for personalization, and self-improvement for quality.',
      tags: ['ai', 'local-first', 'llama', 'letta'],
      lastUpdated: new Date().toISOString()
    },
    {
      domain: 'coding-standards',
      content: 'Follow Qodo-integration rules: deterministic, consistent, lint-friendly, explicit code. Avoid unused imports, dead code, inconsistent naming.',
      tags: ['coding', 'standards', 'quality'],
      lastUpdated: new Date().toISOString()
    }
  ],
  history: [
    {
      date: new Date().toISOString().split('T')[0],
      learnings: [
        'Implementing Pack 11 for local-first LLAMA enhancements',
        'Using Letta for unlimited context',
        'Building personal context repository'
      ],
      decisions: [
        'Prioritize Pack 11 over Pack 10 for local-first strategy',
        'Use Letta memory system as primary context management',
        'Implement self-improvement loops for quality enhancement'
      ],
      context: 'Phase 1 of Pack 11 implementation'
    }
  ]
};

