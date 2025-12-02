/**
 * Personal Context Manager
 * Manages user-specific context for personalized AI responses
 */

import fs from 'fs/promises';
import path from 'path';
import { UserContext, DEFAULT_USER_CONTEXT } from './schemas/UserContext.js';

export class PersonalContextManager {
  private contextPath: string;
  private context: UserContext | null = null;

  constructor(contextPath: string = './data/user-context') {
    this.contextPath = contextPath;
  }

  /**
   * Load user context from file
   */
  async load(): Promise<UserContext> {
    try {
      const filePath = path.join(this.contextPath, 'context.json');
      const data = await fs.readFile(filePath, 'utf-8');
      this.context = JSON.parse(data);
      return this.context!;
    } catch (error) {
      // If file doesn't exist, create default context
      console.log('No existing context found, creating default...');
      await this.save(DEFAULT_USER_CONTEXT);
      this.context = DEFAULT_USER_CONTEXT;
      return this.context;
    }
  }

  /**
   * Save user context to file
   */
  async save(context: UserContext): Promise<void> {
    try {
      // Ensure directory exists
      await fs.mkdir(this.contextPath, { recursive: true });

      const filePath = path.join(this.contextPath, 'context.json');
      context.lastUpdated = new Date().toISOString();
      await fs.writeFile(filePath, JSON.stringify(context, null, 2));
      this.context = context;
    } catch (error) {
      console.error('Failed to save context:', error);
      throw error;
    }
  }

  /**
   * Get relevant context for a query
   */
  getRelevantContext(query: string): string {
    if (!this.context) {
      throw new Error('Context not loaded. Call load() first.');
    }

    const queryLower = query.toLowerCase();
    const relevant: string[] = [];

    // Add coding preferences
    const { codingStyle } = this.context.preferences;
    relevant.push(`Coding Style: ${codingStyle.language} with ${codingStyle.framework}`);
    relevant.push(`Conventions: ${codingStyle.conventions.join(', ')}`);

    // Add current project context
    if (this.context.projects.length > 0) {
      const currentProject = this.context.projects[0]; // Most recent project
      relevant.push(`\nCurrent Project: ${currentProject.name}`);
      relevant.push(`Phase: ${currentProject.currentPhase}`);
      relevant.push(`Tech Stack: ${currentProject.techStack.join(', ')}`);
    }

    // Add relevant knowledge
    for (const knowledge of this.context.knowledge) {
      const domainMatch = queryLower.includes(knowledge.domain.toLowerCase());
      const tagMatch = knowledge.tags?.some(tag => queryLower.includes(tag.toLowerCase()));
      
      if (domainMatch || tagMatch) {
        relevant.push(`\nKnowledge (${knowledge.domain}): ${knowledge.content}`);
      }
    }

    // Add quality standards
    if (queryLower.includes('code') || queryLower.includes('implement') || queryLower.includes('build')) {
      relevant.push(`\nQuality Standards: ${this.context.preferences.qualityStandards.join(', ')}`);
    }

    return relevant.join('\n');
  }

  /**
   * Get full context as formatted string
   */
  getFullContext(): string {
    if (!this.context) {
      throw new Error('Context not loaded');
    }

    const sections: string[] = [];

    // Preferences
    sections.push('=== User Preferences ===');
    sections.push(`Language: ${this.context.preferences.codingStyle.language}`);
    sections.push(`Framework: ${this.context.preferences.codingStyle.framework}`);
    sections.push(`Communication Style: ${this.context.preferences.communicationStyle}`);

    // Projects
    sections.push('\n=== Active Projects ===');
    for (const project of this.context.projects) {
      sections.push(`\n${project.name}:`);
      sections.push(`  Phase: ${project.currentPhase}`);
      sections.push(`  Tech: ${project.techStack.join(', ')}`);
    }

    // Knowledge
    sections.push('\n=== Domain Knowledge ===');
    for (const knowledge of this.context.knowledge) {
      sections.push(`\n${knowledge.domain}:`);
      sections.push(`  ${knowledge.content}`);
    }

    return sections.join('\n');
  }

  /**
   * Update user preferences
   */
  async updatePreferences(updates: Partial<UserContext['preferences']>): Promise<void> {
    if (!this.context) {
      await this.load();
    }

    this.context!.preferences = {
      ...this.context!.preferences,
      ...updates
    };

    await this.save(this.context!);
  }

  /**
   * Add a new project
   */
  async addProject(project: UserContext['projects'][0]): Promise<void> {
    if (!this.context) {
      await this.load();
    }

    this.context!.projects.push(project);
    await this.save(this.context!);
  }

  /**
   * Add domain knowledge
   */
  async addKnowledge(knowledge: UserContext['knowledge'][0]): Promise<void> {
    if (!this.context) {
      await this.load();
    }

    knowledge.lastUpdated = new Date().toISOString();
    this.context!.knowledge.push(knowledge);
    await this.save(this.context!);
  }

  /**
   * Add conversation history
   */
  async addHistory(history: UserContext['history'][0]): Promise<void> {
    if (!this.context) {
      await this.load();
    }

    this.context!.history.push(history);
    await this.save(this.context!);
  }

  /**
   * Get current context
   */
  getContext(): UserContext | null {
    return this.context;
  }
}

