/**
 * Ollama Model Configuration
 * Defines available models and their characteristics for intelligent routing
 */

export interface OllamaModelConfig {
  name: string;
  displayName: string;
  size: string;
  contextWindow: number;
  speedTier: 'fast' | 'medium' | 'slow';
  qualityTier: 'basic' | 'good' | 'excellent';
  specialization: 'general' | 'code' | 'chat';
  recommendedFor: string[];
  estimatedTokensPerSec: number;
}

export const OLLAMA_MODELS: Record<string, OllamaModelConfig> = {
  'gemma3:1b': {
    name: 'gemma3:1b',
    displayName: 'Gemma 3 1B',
    size: '815 MB',
    contextWindow: 8192,
    speedTier: 'fast',
    qualityTier: 'basic',
    specialization: 'general',
    recommendedFor: [
      'Simple code snippets',
      'Quick questions',
      'Code formatting',
      'Basic refactoring',
      'Documentation generation',
      'Simple debugging'
    ],
    estimatedTokensPerSec: 40
  },
  'qwen2.5-coder:7b': {
    name: 'qwen2.5-coder:7b',
    displayName: 'Qwen 2.5 Coder 7B',
    size: '4.7 GB',
    contextWindow: 32768,
    speedTier: 'medium',
    qualityTier: 'excellent',
    specialization: 'code',
    recommendedFor: [
      'Complex code generation',
      'Multi-file refactoring',
      'Architecture design',
      'Advanced debugging',
      'Code review',
      'Algorithm implementation',
      'API design',
      'Test generation'
    ],
    estimatedTokensPerSec: 10
  }
};

export type TaskComplexity = 'simple' | 'moderate' | 'complex';
export type TaskPriority = 'speed' | 'quality' | 'balanced';

export interface TaskRequirements {
  complexity: TaskComplexity;
  priority: TaskPriority;
  estimatedTokens?: number;
  requiresCodeSpecialization?: boolean;
}

/**
 * Select the best Ollama model based on task requirements
 */
export function selectOllamaModel(requirements: TaskRequirements): string {
  const { complexity, priority, requiresCodeSpecialization = false } = requirements;

  // For simple tasks with speed priority, use Gemma 3 1B
  if (complexity === 'simple' && priority === 'speed') {
    return 'gemma3:1b';
  }

  // For complex tasks or code specialization, use Qwen 2.5 Coder
  if (complexity === 'complex' || requiresCodeSpecialization) {
    return 'qwen2.5-coder:7b';
  }

  // For moderate complexity with quality priority, use Qwen
  if (priority === 'quality') {
    return 'qwen2.5-coder:7b';
  }

  // For moderate complexity with speed priority, use Gemma
  if (priority === 'speed') {
    return 'gemma3:1b';
  }

  // Default: balanced approach - use Qwen for better quality
  return 'qwen2.5-coder:7b';
}

/**
 * Analyze prompt to determine task requirements
 */
export function analyzePrompt(prompt: string): TaskRequirements {
  const lowerPrompt = prompt.toLowerCase();

  // Detect complexity
  let complexity: TaskComplexity = 'moderate';

  const simpleKeywords = ['format', 'fix typo', 'rename', 'simple', 'quick', 'basic', 'generate basic', 'simple function'];
  const complexKeywords = ['refactor', 'architecture', 'design', 'implement', 'algorithm', 'optimize', 'debug', 'advanced'];

  if (simpleKeywords.some(kw => lowerPrompt.includes(kw))) {
    complexity = 'simple';
  } else if (complexKeywords.some(kw => lowerPrompt.includes(kw))) {
    complexity = 'complex';
  }

  // Detect code specialization need (only for complex tasks)
  const codeKeywords = ['function', 'class', 'typescript', 'javascript', 'code', 'api', 'test'];
  const requiresCodeSpecialization = complexity !== 'simple' && codeKeywords.some(kw => lowerPrompt.includes(kw));

  // Detect priority
  let priority: TaskPriority = 'balanced';

  if (lowerPrompt.includes('quick') || lowerPrompt.includes('fast')) {
    priority = 'speed';
  } else if (lowerPrompt.includes('best') || lowerPrompt.includes('high quality')) {
    priority = 'quality';
  }

  return {
    complexity,
    priority,
    requiresCodeSpecialization
  };
}

/**
 * Get model info by name
 */
export function getModelInfo(modelName: string): OllamaModelConfig | undefined {
  return OLLAMA_MODELS[modelName];
}

/**
 * List all available models
 */
export function listAvailableModels(): OllamaModelConfig[] {
  return Object.values(OLLAMA_MODELS);
}

