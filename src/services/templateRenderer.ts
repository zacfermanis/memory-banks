import { TemplateCache } from './templateCache';

export interface RenderOptions {
  enableCache?: boolean;
  cache?: TemplateCache;
  optimizeStrings?: boolean;
  maxIterations?: number;
  enableProfiling?: boolean;
}

export interface RenderResult {
  content: string;
  renderTime: number;
  cacheHit?: boolean;
  iterations: number;
  memoryUsage?: number;
}

export class TemplateRenderer {
  private cache: TemplateCache | null = null;
  private renderCache: Map<string, string> = new Map();
  private variableCache: Map<string, any> = new Map();
  private conditionalCache: Map<string, boolean> = new Map();

  constructor(options: RenderOptions = {}) {
    if (options.enableCache && options.cache) {
      this.cache = options.cache;
    }
  }

  /**
   * TASK-029: Implement efficient variable substitution
   * Render a template string by replacing variables with values and processing conditionals
   */
  async renderTemplate(
    template: string,
    variables: Record<string, any>,
    options: RenderOptions = {}
  ): Promise<RenderResult> {
    const startTime = process.hrtime.bigint();
    const startMemory = options.enableProfiling
      ? process.memoryUsage().heapUsed
      : 0;

    // Check cache first
    const cacheKey = this.generateCacheKey(template, variables);
    const cacheToUse = options.cache || this.cache;
    if (cacheToUse && options.enableCache) {
      const cachedResult = await cacheToUse.getTemplateContent(cacheKey);
      if (cachedResult) {
        return {
          content: cachedResult,
          renderTime: Number(process.hrtime.bigint() - startTime) / 1000000, // Convert to milliseconds
          cacheHit: true,
          iterations: 0,
        };
      }
    }

    let result = template;
    let iterations = 0;
    // const maxIterations = options.maxIterations || 100; // TODO: Implement iteration limiting

    // Process conditionals first
    result = this.processConditionalsOptimized(result, variables, options);

    // Process loops iteratively until no more changes
    let previousResult = '';
    let loopIterations = 0;
    while (result !== previousResult && loopIterations < 5) {
      previousResult = result;
      result = this.processLoops(result, variables, options);
      // Also process conditionals in case they were introduced by loops
      result = this.processConditionalsOptimized(result, variables, options);
      loopIterations++;
    }

    // TASK-029: Create string operation optimization
    result = this.optimizeStringOperations(result, variables, options);

    // TASK-029: Add memory usage optimization
    if (options.enableProfiling) {
      const endMemory = process.memoryUsage().heapUsed;
      const memoryUsage = endMemory - startMemory;

      // Cache the result
      if (cacheToUse && options.enableCache) {
        cacheToUse.setTemplateContent(cacheKey, result);
      }

      return {
        content: result,
        renderTime: Number(process.hrtime.bigint() - startTime) / 1000000, // Convert to milliseconds
        cacheHit: false,
        iterations,
        memoryUsage,
      };
    }

    // Cache the result
    if (cacheToUse && options.enableCache) {
      cacheToUse.setTemplateContent(cacheKey, result);
    }

    return {
      content: result,
      renderTime: Number(process.hrtime.bigint() - startTime) / 1000000, // Convert to milliseconds
      cacheHit: false,
      iterations,
    };
  }

  /**
   * TASK-029: Add conditional evaluation optimization
   * Process conditional blocks with caching and optimization
   */
  private processConditionalsOptimized(
    template: string,
    variables: Record<string, any>,
    _options: RenderOptions = {}
  ): string {
    // Pattern to match {% if condition %}content{% endif %} blocks
    const conditionalPattern =
      /\{%\s*if\s+([^%]+)\s*%\}(.*?)\{%\s*endif\s*%\}/gs;

    return template.replace(
      conditionalPattern,
      (_match, condition, content) => {
        const cacheKey = `${condition}:${JSON.stringify(variables)}`;

        // Check conditional cache
        if (this.conditionalCache.has(cacheKey)) {
          return this.conditionalCache.get(cacheKey) ? content : '';
        }

        const isTrue = this.evaluateConditionOptimized(
          condition.trim(),
          variables,
          _options
        );

        // Cache the result
        this.conditionalCache.set(cacheKey, isTrue);

        return isTrue ? content : '';
      }
    );
  }

  /**
   * TASK-029: Add loop processing
   * Process {% for %} loops with loop.index and loop.last support (supports nesting)
   */
  private processLoops(
    template: string,
    variables: Record<string, any>,
    _options: RenderOptions = {},
    depth: number = 0
  ): string {
    // Prevent infinite recursion
    if (depth > 20) {
      return template;
    }

    let result = '';
    let cursor = 0;
    while (cursor < template.length) {
      const forStart = template.indexOf('{% for ', cursor);
      if (forStart === -1) {
        result += template.slice(cursor);
        break;
      }
      result += template.slice(cursor, forStart);
      const forTagEnd = template.indexOf('%}', forStart);
      if (forTagEnd === -1) {
        result += template.slice(forStart);
        break;
      }
      const forTag = template.slice(forStart + 2, forTagEnd).trim();
      const forMatch = forTag.match(/^for\s+(\w+)\s+in\s+([\w.]+)$/);
      if (!forMatch) {
        result += template.slice(forStart, forTagEnd + 2);
        cursor = forTagEnd + 2;
        continue;
      }
      const itemVar = forMatch[1] || 'item';
      const collectionPath = forMatch[2] || '';
      let nest = 1;
      let searchIdx = forTagEnd + 2;
      let loopEnd = -1;
      while (searchIdx < template.length) {
        const nextFor = template.indexOf('{% for ', searchIdx);
        const nextEnd = template.indexOf('{% endfor %}', searchIdx);
        if (nextEnd === -1) break;
        if (nextFor !== -1 && nextFor < nextEnd) {
          nest++;
          searchIdx = nextFor + 1;
        } else {
          nest--;
          if (nest === 0) {
            loopEnd = nextEnd;
            break;
          }
          searchIdx = nextEnd + 1;
        }
      }
      if (loopEnd === -1) {
        result += template.slice(forStart);
        break;
      }
      const loopBody = template.slice(forTagEnd + 2, loopEnd);
      const collection = this.getNestedValueOptimized(variables, collectionPath);
      if (!Array.isArray(collection)) {
        cursor = loopEnd + 12;
        continue;
      }
      for (let index = 0; index < collection.length; index++) {
        const item = collection[index];
        const loopContext: Record<string, any> = {
          ...variables,
        };
        loopContext[itemVar] = item;
        loopContext['loop'] = {
          index: index + 1,
          last: index === collection.length - 1,
          first: index === 0,
          length: collection.length,
        };
        let processed = this.processLoops(loopBody, loopContext, _options, depth + 1);
        processed = this.processConditionalsOptimized(processed, loopContext, _options);
        processed = this.replaceVariablesOriginal(processed, loopContext);
        result += processed;
      }
      cursor = loopEnd + 12;
    }
    return result;
  }

  /**
   * TASK-029: Optimize conditional evaluation
   */
  private evaluateConditionOptimized(
    condition: string,
    variables: Record<string, any>,
    _options: RenderOptions = {}
  ): boolean {
    // Check variable cache first
    const variableCacheKey = `${condition}:${JSON.stringify(variables)}`;
    if (this.variableCache.has(variableCacheKey)) {
      return this.variableCache.get(variableCacheKey);
    }

    let result: boolean;

    // Handle simple variable existence checks (most common case)
    if (this.isSimpleVariableCheck(condition)) {
      const variableName = condition.trim();
      const value = this.getNestedValueOptimized(variables, variableName);
      result = this.isTruthy(value);
    }
    // Handle comparison operators
    else if (this.isComparison(condition)) {
      result = this.evaluateComparisonOptimized(condition, variables);
    }
    // Handle logical operators (and, or, not)
    else if (this.isLogicalOperation(condition)) {
      result = this.evaluateLogicalOperationOptimized(condition, variables);
    }
    // Default: treat as variable existence check
    else {
      const value = this.getNestedValueOptimized(variables, condition.trim());
      result = this.isTruthy(value);
    }

    // Cache the result
    this.variableCache.set(variableCacheKey, result);
    return result;
  }

  /**
   * TASK-029: Create string operation optimization
   * Optimize string operations for better performance
   */
  private optimizeStringOperations(
    template: string,
    variables: Record<string, any>,
    options: RenderOptions = {}
  ): string {
    if (!options.optimizeStrings) {
      // Use original method if optimization is disabled
      return this.replaceVariablesOriginal(template, variables);
    }

    // Pre-compile variable patterns for better performance
    const variablePatterns = this.precompileVariablePatterns(template);

    let result = template;

    // Replace variables in batches for better performance
    for (const pattern of variablePatterns) {
      const { regex, variableName } = pattern;
      const value = this.getNestedValueOptimized(variables, variableName);
      const replacement =
        value !== undefined ? String(value) : `{{${variableName}}}`;

      result = result.replace(regex, replacement);
    }

    return result;
  }

  /**
   * Pre-compile variable patterns for optimization
   */
  private precompileVariablePatterns(
    template: string
  ): Array<{ regex: RegExp; variableName: string }> {
    const patterns: Array<{ regex: RegExp; variableName: string }> = [];
    const variablePattern = /\{\{([^}]+)\}\}/g;

    let match;
    while ((match = variablePattern.exec(template)) !== null) {
      const variableName = match[1]?.trim() || '';
      const escapedVariableName = this.escapeRegExp(variableName);
      const regex = new RegExp(
        `\\{\\{\\s*${escapedVariableName}\\s*\\}\\}`,
        'g'
      );

      patterns.push({ regex, variableName });
    }

    return patterns;
  }

  /**
   * Escape special regex characters
   */
  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Original variable replacement method (fallback)
   */
  private replaceVariablesOriginal(
    template: string,
    variables: Record<string, any>
  ): string {
    const variablePattern = /\{\{([^}]+)\}\}/g;
    return template.replace(variablePattern, (match, variableName) => {
      const value = this.getNestedValueOptimized(
        variables,
        variableName.trim()
      );
      return value !== undefined ? String(value) : match;
    });
  }

  /**
   * TASK-029: Optimize nested value retrieval
   */
  private getNestedValueOptimized(obj: any, path: string): any {
    const cacheKey = `${JSON.stringify(obj)}:${path}`;

    if (this.variableCache.has(cacheKey)) {
      return this.variableCache.get(cacheKey);
    }

    const result = this.getNestedValue(obj, path);
    this.variableCache.set(cacheKey, result);
    return result;
  }

  /**
   * TASK-029: Optimize comparison evaluation
   */
  private evaluateComparisonOptimized(
    condition: string,
    variables: Record<string, any>
  ): boolean {
    // Cache key for comparison results
    const cacheKey = `comp:${condition}:${JSON.stringify(variables)}`;

    if (this.variableCache.has(cacheKey)) {
      return this.variableCache.get(cacheKey);
    }

    const result = this.evaluateComparison(condition, variables);
    this.variableCache.set(cacheKey, result);
    return result;
  }

  /**
   * TASK-029: Optimize logical operation evaluation
   */
  private evaluateLogicalOperationOptimized(
    condition: string,
    variables: Record<string, any>
  ): boolean {
    // Cache key for logical operation results
    const cacheKey = `logical:${condition}:${JSON.stringify(variables)}`;

    if (this.variableCache.has(cacheKey)) {
      return this.variableCache.get(cacheKey);
    }

    const result = this.evaluateLogicalOperation(condition, variables);
    this.variableCache.set(cacheKey, result);
    return result;
  }

  /**
   * Generate cache key for template rendering
   */
  private generateCacheKey(
    template: string,
    variables: Record<string, any>
  ): string {
    const templateHash = this.simpleHash(template);
    const variablesHash = this.simpleHash(JSON.stringify(variables));
    return `${templateHash}:${variablesHash}`;
  }

  /**
   * Simple hash function for cache keys
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  /**
   * Clear all caches
   */
  clearCaches(): void {
    this.renderCache.clear();
    this.variableCache.clear();
    this.conditionalCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    renderCache: number;
    variableCache: number;
    conditionalCache: number;
  } {
    return {
      renderCache: this.renderCache.size,
      variableCache: this.variableCache.size,
      conditionalCache: this.conditionalCache.size,
    };
  }

  // Original methods (keeping for backward compatibility)

  /**
   * Process conditional blocks in template
   */
  // Legacy method - replaced by processConditionalsOptimized
  // private processConditionals(
  //   template: string,
  //   variables: Record<string, any>
  // ): string {
  //   // Pattern to match {% if condition %}content{% endif %} blocks
  //   const conditionalPattern =
  //     /\{%\s*if\s+([^%]+)\s*%\}(.*?)\{%\s*endif\s*%\}/gs;

  //   return template.replace(
  //     conditionalPattern,
  //     (_match, condition, content) => {
  //       const isTrue = this.evaluateCondition(condition.trim(), variables);
  //       return isTrue ? content : '';
  //     }
  //   );
  // }

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
    // Parse comparison: variable operator value
    const comparisonMatch = condition.match(
      /^(.+?)\s*(==|!=|>=|<=|>|<)\s*(.+)$/
    );
    if (!comparisonMatch) {
      return false;
    }

    const [, leftOperand, operator, rightOperand] = comparisonMatch;

    if (!leftOperand || !rightOperand) {
      return false;
    }

    // Get left operand value
    let leftValue = this.getNestedValue(variables, leftOperand.trim());
    if (leftValue === undefined) {
      leftValue = leftOperand.trim();
    }

    // Get right operand value
    let rightValue = this.getNestedValue(variables, rightOperand.trim());
    if (rightValue === undefined) {
      // Try to parse as string literal (remove quotes if present)
      const trimmed = rightOperand.trim();
      if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || 
          (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
        rightValue = trimmed.slice(1, -1);
      } else {
        rightValue = trimmed;
      }
    }

    // Convert to numbers if possible
    const leftNum = Number(leftValue);
    const rightNum = Number(rightValue);
    const isLeftNumeric = !isNaN(leftNum);
    const isRightNumeric = !isNaN(rightNum);

    // Use numeric comparison if both are numbers
    if (isLeftNumeric && isRightNumeric) {
      switch (operator) {
        case '==':
          return leftNum === rightNum;
        case '!=':
          return leftNum !== rightNum;
        case '>=':
          return leftNum >= rightNum;
        case '<=':
          return leftNum <= rightNum;
        case '>':
          return leftNum > rightNum;
        case '<':
          return leftNum < rightNum;
        default:
          return false;
      }
    }

    // Use string comparison
    const leftStr = String(leftValue);
    const rightStr = String(rightValue);

    switch (operator) {
      case '==':
        return leftStr === rightStr;
      case '!=':
        return leftStr !== rightStr;
      case '>=':
        return leftStr >= rightStr;
      case '<=':
        return leftStr <= rightStr;
      case '>':
        return leftStr > rightStr;
      case '<':
        return leftStr < rightStr;
      default:
        return false;
    }
  }

  /**
   * Evaluate logical operations
   */
  private evaluateLogicalOperation(
    condition: string,
    variables: Record<string, any>
  ): boolean {
    const lowerCondition = condition.toLowerCase();

    // Handle NOT operator
    if (lowerCondition.startsWith('not ')) {
      const subCondition = condition.substring(4).trim();
      return !this.evaluateCondition(subCondition, variables);
    }

    // Handle AND operator
    if (lowerCondition.includes(' and ')) {
      const parts = condition.split(/\s+and\s+/i);
      return parts.every(part =>
        this.evaluateCondition(part.trim(), variables)
      );
    }

    // Handle OR operator
    if (lowerCondition.includes(' or ')) {
      const parts = condition.split(/\s+or\s+/i);
      return parts.some(part => this.evaluateCondition(part.trim(), variables));
    }

    // If no logical operators found, evaluate as simple condition
    return this.evaluateCondition(condition, variables);
  }

  /**
   * Check if a value is truthy
   */
  private isTruthy(value: any): boolean {
    if (value === null || value === undefined) {
      return false;
    }
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'number') {
      return value !== 0;
    }
    if (typeof value === 'string') {
      return (
        value.length > 0 && value.toLowerCase() !== 'false' && value !== '0'
      );
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
   * Get nested value from object using dot notation
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
    const requiredVariables = this.getTemplateVariables(template);
    const missingVariables: string[] = [];

    for (const variable of requiredVariables) {
      if (!(variable in providedVariables)) {
        missingVariables.push(variable);
      }
    }

    return missingVariables;
  }

  /**
   * Extract all variable names from template
   */
  getTemplateVariables(template: string): string[] {
    const variables: string[] = [];
    const variablePattern = /\{\{([^}]+)\}\}/g;

    let match;
    while ((match = variablePattern.exec(template)) !== null) {
      const variableName = match[1]?.trim() || '';
      if (!variables.includes(variableName)) {
        variables.push(variableName);
      }
    }

    return variables;
  }

  /**
   * Extract variables used in conditional statements
   */
  getConditionalVariables(template: string): string[] {
    const variables: string[] = [];
    const conditionalPattern = /\{%\s*if\s+([^%]+)\s*%\}/g;

    let match;
    while ((match = conditionalPattern.exec(template)) !== null) {
      const condition = match[1]?.trim() || '';
      const conditionVariables = this.extractVariablesFromCondition(condition);

      for (const variable of conditionVariables) {
        if (!variables.includes(variable)) {
          variables.push(variable);
        }
      }
    }

    return variables;
  }

  /**
   * Extract variable names from a conditional expression
   */
  private extractVariablesFromCondition(condition: string): string[] {
    const variables: string[] = [];

    // Remove logical operators and comparison operators
    const cleanCondition = condition
      .replace(/\b(and|or|not)\b/gi, ' ')
      .replace(/==|!=|>=|<=|>|</g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Split by spaces and filter valid variable names
    const parts = cleanCondition.split(' ');
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed && /^[a-zA-Z_][a-zA-Z0-9_.]*$/.test(trimmed)) {
        variables.push(trimmed);
      }
    }

    return variables;
  }

  /**
   * Validate conditional syntax
   */
  validateConditionalSyntax(template: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check for unmatched if/endif pairs
    const ifMatches = template.match(/\{%\s*if\s+/g) || [];
    const endifMatches = template.match(/\{%\s*endif\s*%\}/g) || [];

    if (ifMatches.length !== endifMatches.length) {
      errors.push(
        `Mismatched if/endif pairs: ${ifMatches.length} if statements, ${endifMatches.length} endif statements`
      );
    }

    // Check for nested conditionals (basic check)
    const conditionalBlocks =
      template.match(/\{%\s*if[^%]*%\}[^]*?\{%\s*endif\s*%\}/g) || [];
    for (const block of conditionalBlocks) {
      const nestedIfs = block.match(/\{%\s*if\s+/g) || [];
      if (nestedIfs.length > 1) {
        errors.push('Nested conditional blocks are not supported');
        break;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
