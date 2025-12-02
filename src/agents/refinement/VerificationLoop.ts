/**
 * Verification Loop
 * 
 * Verifies that refinements actually improved the response.
 * Prevents degradation through iterative refinement.
 */

import { ICloudProvider } from '../../providers/ICloudProvider.js';

export interface VerificationResult {
  improved: boolean;
  confidence: number; // 0.0 to 1.0
  reasoning: string;
  recommendation: 'accept' | 'reject' | 'uncertain';
}

export class VerificationLoop {
  constructor(private provider: ICloudProvider) {}

  /**
   * Verify that refined response is better than original
   */
  async verify(
    prompt: string,
    originalResponse: string,
    refinedResponse: string,
    context?: string
  ): Promise<VerificationResult> {
    const verificationPrompt = this.buildVerificationPrompt(
      prompt,
      originalResponse,
      refinedResponse,
      context
    );

    const result = await this.provider.generateText(verificationPrompt);
    const verificationText = result.text;

    return this.parseVerification(verificationText);
  }

  /**
   * Build prompt for verification
   */
  private buildVerificationPrompt(
    prompt: string,
    originalResponse: string,
    refinedResponse: string,
    context?: string
  ): string {
    return `You are a code quality expert. Compare two responses and determine if the refined version is actually better.

${context ? `Context:\n${context}\n\n` : ''}Original Request:
${prompt}

Original Response:
${originalResponse}

Refined Response:
${refinedResponse}

Analyze both responses and provide verification in this format:

IMPROVED: [YES/NO]
CONFIDENCE: [0.0 to 1.0]
RECOMMENDATION: [accept|reject|uncertain]

REASONING:
[Explain why the refined version is better, worse, or similar]

Criteria:
1. Correctness - Is the refined version more accurate?
2. Completeness - Does it address more of the request?
3. Clarity - Is it clearer and easier to understand?
4. Code Quality - Is the code better structured?
5. Best Practices - Does it follow standards better?

Be honest. If the refined version is worse or no better, say so.`;
  }

  /**
   * Parse verification text
   */
  private parseVerification(verificationText: string): VerificationResult {
    let improved = false;
    let confidence = 0.5;
    let recommendation: VerificationResult['recommendation'] = 'uncertain';
    let reasoning = '';

    // Extract improved flag
    const improvedMatch = verificationText.match(/IMPROVED:\s*(YES|NO)/i);
    if (improvedMatch) {
      improved = improvedMatch[1].toUpperCase() === 'YES';
    }

    // Extract confidence
    const confidenceMatch = verificationText.match(/CONFIDENCE:\s*([\d.]+)/i);
    if (confidenceMatch) {
      confidence = parseFloat(confidenceMatch[1]);
    }

    // Extract recommendation
    const recommendationMatch = verificationText.match(/RECOMMENDATION:\s*(\w+)/i);
    if (recommendationMatch) {
      const rec = recommendationMatch[1].toLowerCase();
      if (rec === 'accept' || rec === 'reject' || rec === 'uncertain') {
        recommendation = rec as VerificationResult['recommendation'];
      }
    }

    // Extract reasoning
    const reasoningMatch = verificationText.match(/REASONING:([\s\S]*?)$/i);
    if (reasoningMatch) {
      reasoning = reasoningMatch[1].trim();
    }

    // If no reasoning, generate default
    if (!reasoning) {
      reasoning = improved 
        ? 'Refined version shows improvements in quality.'
        : 'Refined version does not show significant improvements.';
    }

    return {
      improved,
      confidence,
      reasoning,
      recommendation
    };
  }
}

