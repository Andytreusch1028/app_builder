/**
 * Critique Generator
 * 
 * Analyzes responses and generates constructive critiques to guide improvement.
 * Focuses on:
 * - Correctness
 * - Completeness
 * - Clarity
 * - Code quality (if applicable)
 * - Best practices
 */

import { ICloudProvider } from '../../providers/ICloudProvider.js';

export interface Critique {
  summary: string;
  qualityScore: number; // 0.0 to 1.0
  issues: CritiqueIssue[];
  suggestions: string[];
}

export interface CritiqueIssue {
  category: 'correctness' | 'completeness' | 'clarity' | 'quality' | 'best-practices';
  severity: 'low' | 'medium' | 'high';
  description: string;
  suggestion: string;
}

export class CritiqueGenerator {
  constructor(private provider: ICloudProvider) {}

  /**
   * Generate critique for a response
   */
  async generate(
    prompt: string,
    response: string,
    context?: string
  ): Promise<Critique> {
    const critiquePrompt = this.buildCritiquePrompt(prompt, response, context);

    const result = await this.provider.generateText(critiquePrompt);
    const critiqueText = result.text;

    return this.parseCritique(critiqueText);
  }

  /**
   * Build prompt for critique generation
   */
  private buildCritiquePrompt(
    prompt: string,
    response: string,
    context?: string
  ): string {
    return `You are a code quality expert. Analyze the following response and provide constructive critique.

${context ? `Context:\n${context}\n\n` : ''}Original Request:
${prompt}

Response to Critique:
${response}

Provide a critique in the following format:

QUALITY_SCORE: [0.0 to 1.0]

ISSUES:
- [CATEGORY: correctness|completeness|clarity|quality|best-practices] [SEVERITY: low|medium|high] Description
  SUGGESTION: How to fix

SUMMARY:
Brief summary of main issues and overall quality

Focus on:
1. Correctness - Is the response accurate and error-free?
2. Completeness - Does it fully address the request?
3. Clarity - Is it clear and well-explained?
4. Code Quality - Is the code clean, readable, and maintainable?
5. Best Practices - Does it follow industry standards?

Be constructive and specific. If the response is excellent, say so.`;
  }

  /**
   * Parse critique text into structured format
   */
  private parseCritique(critiqueText: string): Critique {
    const issues: CritiqueIssue[] = [];
    let qualityScore = 0.7; // Default
    let summary = '';

    // Extract quality score
    const scoreMatch = critiqueText.match(/QUALITY_SCORE:\s*([\d.]+)/i);
    if (scoreMatch) {
      qualityScore = parseFloat(scoreMatch[1]);
    }

    // Extract issues
    const issuesSection = critiqueText.match(/ISSUES:([\s\S]*?)(?:SUMMARY:|$)/i);
    if (issuesSection) {
      const issueLines = issuesSection[1].split('\n');
      let currentIssue: Partial<CritiqueIssue> | null = null;

      for (const line of issueLines) {
        const trimmed = line.trim();
        
        // Issue line
        const issueMatch = trimmed.match(/^-\s*\[CATEGORY:\s*(\w+(?:-\w+)?)\]\s*\[SEVERITY:\s*(\w+)\]\s*(.+)/i);
        if (issueMatch) {
          if (currentIssue && currentIssue.category && currentIssue.severity && currentIssue.description) {
            issues.push(currentIssue as CritiqueIssue);
          }
          
          currentIssue = {
            category: issueMatch[1] as CritiqueIssue['category'],
            severity: issueMatch[2] as CritiqueIssue['severity'],
            description: issueMatch[3],
            suggestion: ''
          };
        }
        
        // Suggestion line
        const suggestionMatch = trimmed.match(/^SUGGESTION:\s*(.+)/i);
        if (suggestionMatch && currentIssue) {
          currentIssue.suggestion = suggestionMatch[1];
        }
      }

      // Add last issue
      if (currentIssue && currentIssue.category && currentIssue.severity && currentIssue.description) {
        issues.push(currentIssue as CritiqueIssue);
      }
    }

    // Extract summary
    const summaryMatch = critiqueText.match(/SUMMARY:([\s\S]*?)$/i);
    if (summaryMatch) {
      summary = summaryMatch[1].trim();
    }

    // Generate suggestions from issues
    const suggestions = issues.map(issue => issue.suggestion).filter(s => s);

    return {
      summary: summary || 'No major issues found.',
      qualityScore,
      issues,
      suggestions
    };
  }
}

