/**
 * Context Injector
 * Automatically injects relevant user context into prompts
 */

import { PersonalContextManager } from './PersonalContextManager.js';

export interface InjectionOptions {
  includePreferences?: boolean;
  includeProject?: boolean;
  includeKnowledge?: boolean;
  includeHistory?: boolean;
  maxContextLength?: number;
}

export class ContextInjector {
  private contextManager: PersonalContextManager;

  constructor(contextManager: PersonalContextManager) {
    this.contextManager = contextManager;
  }

  /**
   * Inject relevant context into a prompt
   */
  async injectContext(
    prompt: string,
    options: InjectionOptions = {}
  ): Promise<string> {
    const {
      includePreferences = true,
      includeProject = true,
      includeKnowledge = true,
      includeHistory = false,
      maxContextLength = 2000
    } = options;

    // Ensure context is loaded
    const context = this.contextManager.getContext();
    if (!context) {
      await this.contextManager.load();
    }

    // Get relevant context based on prompt
    const relevantContext = this.contextManager.getRelevantContext(prompt);

    // Build context sections
    const sections: string[] = [];

    if (includePreferences) {
      sections.push('=== User Context ===');
      sections.push(relevantContext);
    }

    // Combine context with prompt
    const contextPrefix = sections.join('\n\n');
    
    // Truncate if too long
    const truncatedContext = this.truncateContext(contextPrefix, maxContextLength);

    // Format final prompt
    const injectedPrompt = `${truncatedContext}\n\n=== User Request ===\n${prompt}`;

    return injectedPrompt;
  }

  /**
   * Inject context for code generation
   */
  async injectCodeContext(prompt: string): Promise<string> {
    const context = this.contextManager.getContext();
    if (!context) {
      await this.contextManager.load();
    }

    const { codingStyle } = context!.preferences;
    
    const codeContext = `
=== Coding Standards ===
Language: ${codingStyle.language}
Framework: ${codingStyle.framework}
Conventions:
${codingStyle.conventions.map(c => `- ${c}`).join('\n')}

Style Preferences:
- Indentation: ${codingStyle.preferences.indentation} (${codingStyle.preferences.spacesPerIndent || 2})
- Quotes: ${codingStyle.preferences.quotes}
- Semicolons: ${codingStyle.preferences.semicolons ? 'required' : 'optional'}
- Trailing commas: ${codingStyle.preferences.trailingComma ? 'yes' : 'no'}

Quality Standards:
${context!.preferences.qualityStandards.map(s => `- ${s}`).join('\n')}

=== Code Request ===
${prompt}
`;

    return codeContext;
  }

  /**
   * Inject context for project-specific queries
   */
  async injectProjectContext(prompt: string, projectName?: string): Promise<string> {
    const context = this.contextManager.getContext();
    if (!context) {
      await this.contextManager.load();
    }

    // Find project
    const project = projectName
      ? context!.projects.find(p => p.name === projectName)
      : context!.projects[0]; // Default to first project

    if (!project) {
      return prompt;
    }

    const projectContext = `
=== Project Context ===
Project: ${project.name}
${project.description ? `Description: ${project.description}` : ''}
Current Phase: ${project.currentPhase}
Tech Stack: ${project.techStack.join(', ')}
${project.architecture ? `Architecture: ${project.architecture}` : ''}
${project.patterns ? `Patterns: ${project.patterns.join(', ')}` : ''}

Requirements:
${project.requirements.map(r => `- ${r}`).join('\n')}

=== Request ===
${prompt}
`;

    return projectContext;
  }

  /**
   * Truncate context to fit within max length
   */
  private truncateContext(context: string, maxLength: number): string {
    if (context.length <= maxLength) {
      return context;
    }

    // Truncate and add indicator
    return context.substring(0, maxLength - 50) + '\n\n[Context truncated...]';
  }

  /**
   * Extract key information from prompt for better context matching
   */
  private extractKeywords(prompt: string): string[] {
    const keywords: string[] = [];
    
    // Common coding keywords
    const codingKeywords = ['code', 'implement', 'build', 'create', 'function', 'class', 'component'];
    const projectKeywords = ['project', 'architecture', 'design', 'structure'];
    const knowledgeKeywords = ['how', 'what', 'why', 'explain', 'understand'];

    const promptLower = prompt.toLowerCase();

    for (const keyword of [...codingKeywords, ...projectKeywords, ...knowledgeKeywords]) {
      if (promptLower.includes(keyword)) {
        keywords.push(keyword);
      }
    }

    return keywords;
  }
}

