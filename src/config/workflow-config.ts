/**
 * Workflow Configuration - SOP-based structured workflow system
 * Determines when to use Agent SOPs based on task complexity and type
 */

export interface WorkflowConfig {
  enabled: boolean;
  autoDetect: boolean;
  minComplexityThreshold: 'simple' | 'moderate' | 'complex';
  preferredMode: 'sop' | 'freeform' | 'auto';
}

export interface TaskAnalysis {
  complexity: 'simple' | 'moderate' | 'complex';
  type: TaskType;
  requiresWorkflow: boolean;
  suggestedWorkflow?: string;
  confidence: number; // 0-100
  reasoning: string;
}

export type TaskType = 
  | 'scaffold-app'
  | 'crud-entity'
  | 'api-endpoint'
  | 'workflow-creation'
  | 'database-migration'
  | 'authentication'
  | 'testing'
  | 'documentation'
  | 'refactor'
  | 'bugfix'
  | 'feature'
  | 'unknown';

/**
 * Default workflow configuration
 */
export const DEFAULT_WORKFLOW_CONFIG: WorkflowConfig = {
  enabled: true,
  autoDetect: true,
  minComplexityThreshold: 'moderate',
  preferredMode: 'auto'
};

/**
 * Analyze task to determine if SOP workflow should be used
 */
export function analyzeTask(task: string): TaskAnalysis {
  const lowerTask = task.toLowerCase();
  
  // Detect task type
  const type = detectTaskType(lowerTask);
  
  // Detect complexity
  const complexity = detectComplexity(lowerTask, type);
  
  // Determine if workflow is needed
  const requiresWorkflow = shouldUseWorkflow(complexity, type);
  
  // Suggest workflow if applicable
  const suggestedWorkflow = requiresWorkflow ? getWorkflowForType(type) : undefined;
  
  // Calculate confidence
  const confidence = calculateConfidence(lowerTask, type, complexity);
  
  // Generate reasoning
  const reasoning = generateReasoning(type, complexity, requiresWorkflow);
  
  return {
    complexity,
    type,
    requiresWorkflow,
    suggestedWorkflow,
    confidence,
    reasoning
  };
}

/**
 * Detect task type from user input
 */
function detectTaskType(task: string): TaskType {
  const patterns: Record<TaskType, string[]> = {
    'scaffold-app': ['create app', 'new app', 'scaffold', 'initialize project', 'setup project'],
    'crud-entity': ['crud', 'create entity', 'add model', 'database entity', 'new table'],
    'api-endpoint': ['api', 'endpoint', 'route', 'rest api', 'create route'],
    'workflow-creation': ['workflow', 'multi-step', 'process flow', 'state machine'],
    'database-migration': ['migration', 'alter table', 'schema change', 'database change'],
    'authentication': ['auth', 'login', 'signup', 'authentication', 'authorization', 'jwt'],
    'testing': ['test', 'unit test', 'integration test', 'e2e test'],
    'documentation': ['document', 'readme', 'docs', 'api docs', 'generate docs'],
    'refactor': ['refactor', 'restructure', 'reorganize', 'clean up'],
    'bugfix': ['fix', 'bug', 'error', 'issue', 'broken'],
    'feature': ['add feature', 'implement', 'new feature', 'functionality'],
    'unknown': []
  };
  
  for (const [type, keywords] of Object.entries(patterns)) {
    if (keywords.some(kw => task.includes(kw))) {
      return type as TaskType;
    }
  }
  
  return 'unknown';
}

/**
 * Detect complexity level
 */
function detectComplexity(task: string, type: TaskType): 'simple' | 'moderate' | 'complex' {
  // High complexity task types
  const highComplexityTypes: TaskType[] = ['scaffold-app', 'workflow-creation', 'authentication'];
  if (highComplexityTypes.includes(type)) {
    return 'complex';
  }
  
  // Low complexity task types
  const lowComplexityTypes: TaskType[] = ['bugfix', 'documentation'];
  if (lowComplexityTypes.includes(type)) {
    return 'simple';
  }
  
  // Check for complexity indicators
  const complexKeywords = ['multiple', 'integrate', 'system', 'architecture', 'advanced', 'complete'];
  const simpleKeywords = ['simple', 'basic', 'quick', 'small', 'single'];
  
  if (complexKeywords.some(kw => task.includes(kw))) {
    return 'complex';
  }
  
  if (simpleKeywords.some(kw => task.includes(kw))) {
    return 'simple';
  }
  
  return 'moderate';
}

/**
 * Determine if workflow should be used
 */
function shouldUseWorkflow(complexity: string, type: TaskType): boolean {
  // Always use workflow for these types
  const alwaysWorkflowTypes: TaskType[] = ['scaffold-app', 'workflow-creation', 'crud-entity'];
  if (alwaysWorkflowTypes.includes(type)) {
    return true;
  }
  
  // Use workflow for complex tasks
  if (complexity === 'complex') {
    return true;
  }
  
  // Don't use workflow for simple bugfixes or unknown tasks
  if (type === 'bugfix' || type === 'unknown') {
    return false;
  }
  
  return false;
}

/**
 * Get workflow name for task type
 */
function getWorkflowForType(type: TaskType): string | undefined {
  const workflowMap: Partial<Record<TaskType, string>> = {
    'scaffold-app': 'application-scaffold',
    'crud-entity': 'crud-generator',
    'api-endpoint': 'api-endpoint-generator',
    'workflow-creation': 'workflow-generator',
    'database-migration': 'database-migration',
    'authentication': 'authentication-setup',
    'testing': 'test-suite-generator'
  };
  
  return workflowMap[type];
}

/**
 * Calculate confidence score (0-100)
 */
function calculateConfidence(task: string, type: TaskType, complexity: string): number {
  let confidence = 50; // Base confidence

  // Increase confidence if task type is clearly identified
  if (type !== 'unknown') {
    confidence += 30;
  }

  // Increase confidence if complexity indicators are present
  const hasComplexityIndicators =
    task.includes('simple') ||
    task.includes('complex') ||
    task.includes('advanced') ||
    task.includes('basic');

  if (hasComplexityIndicators) {
    confidence += 20;
  }

  return Math.min(confidence, 100);
}

/**
 * Generate human-readable reasoning
 */
function generateReasoning(type: TaskType, complexity: string, requiresWorkflow: boolean): string {
  if (requiresWorkflow) {
    return `This is a ${complexity} ${type.replace('-', ' ')} task. Using structured workflow will ensure consistency, completeness, and adherence to best practices.`;
  } else {
    return `This is a ${complexity} ${type.replace('-', ' ')} task. Freeform approach is sufficient for this type of work.`;
  }
}

/**
 * Check if workflow should be used based on config
 */
export function shouldEnableWorkflow(
  analysis: TaskAnalysis,
  config: WorkflowConfig
): boolean {
  // If workflows are disabled, return false
  if (!config.enabled) {
    return false;
  }

  // If auto-detect is disabled, use preferred mode
  if (!config.autoDetect) {
    return config.preferredMode === 'sop';
  }

  // Auto-detect mode
  if (config.preferredMode === 'auto') {
    return analysis.requiresWorkflow;
  }

  // Explicit SOP mode
  if (config.preferredMode === 'sop') {
    return true;
  }

  // Freeform mode
  return false;
}

