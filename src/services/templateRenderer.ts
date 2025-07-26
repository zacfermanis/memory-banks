export class TemplateRenderer {
  /**
   * Render a template string by replacing variables with values and processing conditionals
   */
  async renderTemplate(
    template: string,
    variables: Record<string, any>
  ): Promise<string> {
    let result = template;

    // Process conditional blocks first
    result = this.processConditionals(result, variables);

    // Replace {{variable}} patterns with values
    const variablePattern = /\{\{([^}]+)\}\}/g;
    result = result.replace(variablePattern, (match, variableName) => {
      const value = this.getNestedValue(variables, variableName.trim());
      return value !== undefined ? String(value) : match;
    });

    return result;
  }

  /**
   * Process conditional blocks in template
   */
  private processConditionals(
    template: string,
    variables: Record<string, any>
  ): string {
    // Pattern to match {% if condition %}content{% endif %} blocks
    const conditionalPattern =
      /\{%\s*if\s+([^%]+)\s*%\}(.*?)\{%\s*endif\s*%\}/gs;

    return template.replace(
      conditionalPattern,
      (_match, condition, content) => {
        const isTrue = this.evaluateCondition(condition.trim(), variables);
        return isTrue ? content : '';
      }
    );
  }

  /**
   * Evaluate a boolean condition
   */
  private evaluateCondition(
    condition: string,
    variables: Record<string, any>
  ): boolean {
    // Handle simple variable existence checks
    if (this.isSimpleVariableCheck(condition)) {
      const variableName = condition.trim();
      const value = this.getNestedValue(variables, variableName);
      return this.isTruthy(value);
    }

    // Handle comparison operators
    if (this.isComparison(condition)) {
      return this.evaluateComparison(condition, variables);
    }

    // Handle logical operators (and, or, not)
    if (this.isLogicalOperation(condition)) {
      return this.evaluateLogicalOperation(condition, variables);
    }

    // Default: treat as variable existence check
    const value = this.getNestedValue(variables, condition.trim());
    return this.isTruthy(value);
  }

  /**
   * Check if condition is a simple variable existence check
   */
  private isSimpleVariableCheck(condition: string): boolean {
    return /^[a-zA-Z_][a-zA-Z0-9_.]*$/.test(condition.trim());
  }

  /**
   * Check if condition contains comparison operators
   */
  private isComparison(condition: string): boolean {
    return /==|!=|>=|<=|>|</.test(condition);
  }

  /**
   * Check if condition contains logical operators
   */
  private isLogicalOperation(condition: string): boolean {
    return /\b(and|or|not)\b/i.test(condition.toLowerCase());
  }

  /**
   * Evaluate comparison expressions
   */
  private evaluateComparison(
    condition: string,
    variables: Record<string, any>
  ): boolean {
    // Match patterns like: variable == value, variable != value, etc.
    const comparisonPattern =
      /([a-zA-Z_][a-zA-Z0-9_.]*)\s*(==|!=|>=|<=|>|<)\s*(.+)/;
    const match = condition.match(comparisonPattern);

    if (!match) {
      return false;
    }

    const [, variableName, operator, valueStr] = match;
    if (!variableName || !valueStr) {
      return false;
    }
    const variableValue = this.getNestedValue(variables, variableName.trim());

    // Try to parse the value as number if possible
    let compareValue: any = valueStr.trim();
    if (!isNaN(Number(compareValue)) && compareValue !== '') {
      compareValue = Number(compareValue);
    } else if (compareValue === 'true') {
      compareValue = true;
    } else if (compareValue === 'false') {
      compareValue = false;
    } else if (compareValue.startsWith('"') && compareValue.endsWith('"')) {
      compareValue = compareValue.slice(1, -1);
    } else if (compareValue.startsWith("'") && compareValue.endsWith("'")) {
      compareValue = compareValue.slice(1, -1);
    }

    switch (operator) {
      case '==':
        return variableValue === compareValue;
      case '!=':
        return variableValue !== compareValue;
      case '>=':
        return Number(variableValue) >= Number(compareValue);
      case '<=':
        return Number(variableValue) <= Number(compareValue);
      case '>':
        return Number(variableValue) > Number(compareValue);
      case '<':
        return Number(variableValue) < Number(compareValue);
      default:
        return false;
    }
  }

  /**
   * Evaluate logical operations (and, or, not)
   */
  private evaluateLogicalOperation(
    condition: string,
    variables: Record<string, any>
  ): boolean {
    const lowerCondition = condition.toLowerCase();

    // Handle NOT operations
    if (lowerCondition.startsWith('not ')) {
      const subCondition = condition.substring(4).trim();
      return !this.evaluateCondition(subCondition, variables);
    }

    // Handle AND operations
    if (lowerCondition.includes(' and ')) {
      const parts = condition.split(/\s+and\s+/i);
      return parts.every(part =>
        this.evaluateCondition(part.trim(), variables)
      );
    }

    // Handle OR operations
    if (lowerCondition.includes(' or ')) {
      const parts = condition.split(/\s+or\s+/i);
      return parts.some(part => this.evaluateCondition(part.trim(), variables));
    }

    return false;
  }

  /**
   * Check if a value is truthy
   */
  private isTruthy(value: any): boolean {
    if (value === undefined || value === null) {
      return false;
    }
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      return value.length > 0 && value.toLowerCase() !== 'false';
    }
    if (typeof value === 'number') {
      return value !== 0;
    }
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    if (typeof value === 'object') {
      return Object.keys(value).length > 0;
    }
    return true;
  }

  /**
   * Get a nested value from an object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * Validate that all required variables are provided
   */
  validateVariables(
    template: string,
    providedVariables: Record<string, any>
  ): string[] {
    const variablePattern = /\{\{([^}]+)\}\}/g;
    const requiredVariables: string[] = [];
    let match;

    while ((match = variablePattern.exec(template)) !== null) {
      const variableName = match[1]?.trim();
      if (
        variableName &&
        !this.getNestedValue(providedVariables, variableName)
      ) {
        requiredVariables.push(variableName);
      }
    }

    return [...new Set(requiredVariables)]; // Remove duplicates
  }

  /**
   * Get all variables used in a template
   */
  getTemplateVariables(template: string): string[] {
    const variablePattern = /\{\{([^}]+)\}\}/g;
    const variables: string[] = [];
    let match;

    while ((match = variablePattern.exec(template)) !== null) {
      const variableName = match[1]?.trim();
      if (variableName) {
        variables.push(variableName);
      }
    }

    return [...new Set(variables)]; // Remove duplicates
  }

  /**
   * Get all conditional variables used in a template
   */
  getConditionalVariables(template: string): string[] {
    const conditionalPattern = /\{%\s*if\s+([^%]+)\s*%\}/g;
    const variables: string[] = [];
    let match;

    while ((match = conditionalPattern.exec(template)) !== null) {
      const condition = match[1]?.trim();
      if (condition) {
        // Extract variable names from condition, excluding logical operators
        const variableMatches = condition.match(/[a-zA-Z_][a-zA-Z0-9_.]*/g);
        if (variableMatches) {
          // Filter out logical operators
          const filteredMatches = variableMatches.filter(
            match => !['and', 'or', 'not'].includes(match.toLowerCase())
          );
          variables.push(...filteredMatches);
        }
      }
    }

    return [...new Set(variables)]; // Remove duplicates
  }

  /**
   * Validate conditional syntax in template
   */
  validateConditionalSyntax(template: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check for unmatched if/endif blocks
    const ifBlocks = (template.match(/\{%\s*if\s+/g) || []).length;
    const endifBlocks = (template.match(/\{%\s*endif\s*%\}/g) || []).length;

    if (ifBlocks !== endifBlocks) {
      errors.push(
        `Mismatched if/endif blocks: ${ifBlocks} if blocks, ${endifBlocks} endif blocks`
      );
    }

    // Check for malformed conditional syntax (excluding valid if/endif)
    const allConditionalBlocks = (template.match(/\{%[^%]*%\}/g) || []) as string[];
    const validIfBlocks = (template.match(/\{%\s*if\s+[^%]*%\}/g) || []) as string[];
    const validEndifBlocks = (template.match(/\{%\s*endif\s*%\}/g) || []) as string[];

    const malformedBlocks = allConditionalBlocks.filter(
      block => !validIfBlocks.includes(block) && !validEndifBlocks.includes(block)
    );

    if (malformedBlocks.length > 0) {
      errors.push(
        `Malformed conditional syntax: ${malformedBlocks.join(', ')}`
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
