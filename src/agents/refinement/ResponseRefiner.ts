/**
 * Response Refiner
 * 
 * Takes a response and critique, then generates an improved version.
 * Focuses on addressing specific issues identified in the critique.
 */

import { ICloudProvider } from '../../providers/ICloudProvider.js';
import { Critique } from './CritiqueGenerator.js';

export interface RefinedResponse {
  response: string;
  improvementSummary: string;
  addressedIssues: string[];
}

export class ResponseRefiner {
  constructor(private provider: ICloudProvider) {}

  /**
   * Refine a response based on critique
   */
  async refine(
    prompt: string,
    originalResponse: string,
    critique: Critique,
    context?: string
  ): Promise<RefinedResponse> {
    const refinePrompt = this.buildRefinePrompt(
      prompt,
      originalResponse,
      critique,
      context
    );

    const result = await this.provider.generateText(refinePrompt);
    const refinedText = result.text;

    return this.parseRefinedResponse(refinedText, critique);
  }

  /**
   * Build prompt for response refinement
   */
  private buildRefinePrompt(
    prompt: string,
    originalResponse: string,
    critique: Critique,
    context?: string
  ): string {
    const issuesList = critique.issues
      .map(issue => `- [${issue.severity.toUpperCase()}] ${issue.description}\n  Fix: ${issue.suggestion}`)
      .join('\n');

    return `You are a code quality expert. Improve the following response based on the critique provided.

${context ? `Context:\n${context}\n\n` : ''}Original Request:
${prompt}

Original Response:
${originalResponse}

Critique (Quality Score: ${critique.qualityScore}):
${critique.summary}

Issues to Address:
${issuesList}

Provide an improved response that addresses all the issues. Format:

IMPROVED_RESPONSE:
[Your improved response here]

IMPROVEMENTS_MADE:
- Brief description of each improvement

Focus on:
1. Fixing all identified issues
2. Maintaining what was good in the original
3. Improving clarity and completeness
4. Following best practices

Provide ONLY the improved response and improvements made. Do not include explanations or meta-commentary.`;
  }

  /**
   * Parse refined response text
   */
  private parseRefinedResponse(
    refinedText: string,
    critique: Critique
  ): RefinedResponse {
    let response = '';
    let improvementSummary = '';
    const addressedIssues: string[] = [];

    // Extract improved response
    const responseMatch = refinedText.match(/IMPROVED_RESPONSE:([\s\S]*?)(?:IMPROVEMENTS_MADE:|$)/i);
    if (responseMatch) {
      response = responseMatch[1].trim();
    } else {
      // If format not followed, use entire text as response
      response = refinedText;
    }

    // Extract improvements made
    const improvementsMatch = refinedText.match(/IMPROVEMENTS_MADE:([\s\S]*?)$/i);
    if (improvementsMatch) {
      const improvementLines = improvementsMatch[1]
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.startsWith('-'))
        .map(line => line.substring(1).trim());

      addressedIssues.push(...improvementLines);
      improvementSummary = improvementLines.join('; ');
    }

    // If no improvements extracted, generate summary from critique
    if (!improvementSummary) {
      improvementSummary = `Addressed ${critique.issues.length} issues`;
      addressedIssues.push(...critique.issues.map(i => i.description));
    }

    return {
      response,
      improvementSummary,
      addressedIssues
    };
  }
}

