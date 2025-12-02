/**
 * Quality Validator - Validates code quality and completeness
 * 
 * Assesses generated code for:
 * - Syntax validity
 * - Completeness
 * - Common errors
 * - Best practices
 */

export interface QualityScore {
  overall: number; // 0-1
  syntax: number; // 0-1
  completeness: number; // 0-1
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface ValidationResult {
  isValid: boolean;
  score: QualityScore;
  shouldEscalate: boolean;
  reason?: string;
}

export class QualityValidator {
  private readonly ESCALATION_THRESHOLD = 0.7;

  /**
   * Validate code quality
   */
  async validate(code: string, language: string = 'javascript'): Promise<ValidationResult> {
    const score = await this.calculateQualityScore(code, language);
    const shouldEscalate = score.overall < this.ESCALATION_THRESHOLD;

    return {
      isValid: score.overall >= 0.5,
      score,
      shouldEscalate,
      reason: shouldEscalate ? `Quality score ${score.overall.toFixed(2)} below threshold ${this.ESCALATION_THRESHOLD}` : undefined
    };
  }

  /**
   * Calculate quality score
   */
  private async calculateQualityScore(code: string, language: string): Promise<QualityScore> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Syntax validation
    const syntaxScore = this.validateSyntax(code, language, errors);

    // Completeness validation
    const completenessScore = this.validateCompleteness(code, language, warnings);

    // Best practices validation
    this.validateBestPractices(code, language, suggestions);

    // Calculate overall score
    const overall = (syntaxScore * 0.5) + (completenessScore * 0.5);

    return {
      overall,
      syntax: syntaxScore,
      completeness: completenessScore,
      errors,
      warnings,
      suggestions
    };
  }

  /**
   * Validate syntax
   */
  private validateSyntax(code: string, language: string, errors: string[]): number {
    let score = 1.0;

    // Basic syntax checks
    if (language === 'javascript' || language === 'typescript') {
      // Check for unclosed brackets
      const openBrackets = (code.match(/\{/g) || []).length;
      const closeBrackets = (code.match(/\}/g) || []).length;
      if (openBrackets !== closeBrackets) {
        errors.push('Unclosed brackets detected');
        score -= 0.3;
      }

      // Check for unclosed parentheses
      const openParens = (code.match(/\(/g) || []).length;
      const closeParens = (code.match(/\)/g) || []).length;
      if (openParens !== closeParens) {
        errors.push('Unclosed parentheses detected');
        score -= 0.3;
      }

      // Check for basic syntax errors
      if (code.includes('function(') && !code.includes(')')) {
        errors.push('Incomplete function declaration');
        score -= 0.2;
      }
    }

    if (language === 'html') {
      // Check for unclosed tags
      const openTags = (code.match(/<[^/][^>]*>/g) || []).length;
      const closeTags = (code.match(/<\/[^>]*>/g) || []).length;
      const selfClosing = (code.match(/<[^>]*\/>/g) || []).length;
      
      if (openTags - selfClosing !== closeTags) {
        errors.push('Unclosed HTML tags detected');
        score -= 0.3;
      }
    }

    return Math.max(0, score);
  }

  /**
   * Validate completeness
   */
  private validateCompleteness(code: string, language: string, warnings: string[]): number {
    let score = 1.0;

    // Check for TODO/FIXME comments
    if (code.includes('TODO') || code.includes('FIXME')) {
      warnings.push('Code contains TODO/FIXME comments');
      score -= 0.1;
    }

    // Check for placeholder content
    if (code.includes('...') || code.includes('// implement this')) {
      warnings.push('Code contains placeholders');
      score -= 0.2;
    }

    // Check minimum length
    if (code.trim().length < 50) {
      warnings.push('Code is very short, may be incomplete');
      score -= 0.3;
    }

    // Language-specific checks
    if (language === 'javascript' || language === 'typescript') {
      // Check for empty functions
      if (code.match(/function\s+\w+\s*\([^)]*\)\s*\{\s*\}/)) {
        warnings.push('Empty function detected');
        score -= 0.2;
      }
    }

    return Math.max(0, score);
  }

  /**
   * Validate best practices
   */
  private validateBestPractices(code: string, language: string, suggestions: string[]): void {
    if (language === 'javascript' || language === 'typescript') {
      // Check for var usage
      if (code.includes('var ')) {
        suggestions.push('Consider using let/const instead of var');
      }

      // Check for console.log
      if (code.includes('console.log')) {
        suggestions.push('Remove console.log statements in production code');
      }
    }
  }
}

