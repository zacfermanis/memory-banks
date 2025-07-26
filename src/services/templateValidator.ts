import { TemplateConfig, TemplateFile } from '../types';
import { ValidationResult } from '../utils/validation';

export interface TemplateValidationResult extends ValidationResult {
  templateId: string;
  metadata: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
  syntax: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
  configuration: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
  files: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    fileResults: Record<string, ValidationResult>;
  };
}

export interface TemplateSyntaxError {
  type: 'variable' | 'conditional' | 'structure' | 'file';
  message: string;
  line?: number;
  column?: number;
  context?: string;
}

export class TemplateValidator {
  /**
   * Validate a complete template configuration
   */
  async validateTemplate(
    template: TemplateConfig,
    templateId: string
  ): Promise<TemplateValidationResult> {
    const result: TemplateValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      templateId,
      metadata: { isValid: true, errors: [], warnings: [] },
      syntax: { isValid: true, errors: [], warnings: [] },
      configuration: { isValid: true, errors: [], warnings: [] },
      files: {
        isValid: true,
        errors: [],
        warnings: [],
        fileResults: {},
      },
    };

    // Validate metadata structure
    const metadataResult = this.validateTemplateMetadata(template);
    result.metadata = metadataResult;
    if (!metadataResult.isValid) {
      result.isValid = false;
      result.errors.push(...metadataResult.errors);
    }

    // Validate template syntax for all files
    const syntaxResult = await this.validateTemplateSyntax(template);
    result.syntax = syntaxResult;
    if (!syntaxResult.isValid) {
      result.isValid = false;
      result.errors.push(...syntaxResult.errors);
    }

    // Validate configuration options
    const configResult = this.validateTemplateConfiguration(template);
    result.configuration = configResult;
    if (!configResult.isValid) {
      result.isValid = false;
      result.errors.push(...configResult.errors);
    }

    // Validate individual files
    const filesResult = await this.validateTemplateFiles(template);
    result.files = filesResult;
    if (!filesResult.isValid) {
      result.isValid = false;
      result.errors.push(...filesResult.errors);
    }

    return result;
  }

  /**
   * TASK-016: Create template syntax validator
   * Implement template syntax checking
   */
  async validateTemplateSyntax(
    template: TemplateConfig
  ): Promise<{ isValid: boolean; errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate each file's syntax
    for (const file of template.files) {
      const fileSyntaxResult = this.validateFileSyntax(file.content);

      if (!fileSyntaxResult.isValid) {
        errors.push(
          `File '${file.path}': ${fileSyntaxResult.errors.join(', ')}`
        );
      }

      if (fileSyntaxResult.warnings.length > 0) {
        warnings.push(
          `File '${file.path}': ${fileSyntaxResult.warnings.join(', ')}`
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate syntax of a single file
   */
  private validateFileSyntax(content: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate variable syntax
    const variableResult = this.validateVariableSyntax(content);
    if (!variableResult.isValid) {
      errors.push(...variableResult.errors);
    }
    warnings.push(...variableResult.warnings);

    // Validate conditional syntax
    const conditionalResult = this.validateConditionalSyntax(content);
    if (!conditionalResult.isValid) {
      errors.push(...conditionalResult.errors);
    }
    warnings.push(...conditionalResult.warnings);

    // Validate template structure
    const structureResult = this.validateTemplateStructure(content);
    if (!structureResult.isValid) {
      errors.push(...structureResult.errors);
    }
    warnings.push(...structureResult.warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate variable syntax in template content
   */
  private validateVariableSyntax(content: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for malformed variable syntax
    const variablePattern = /\{\{([^}]*)\}\}/g;
    let match;

    while ((match = variablePattern.exec(content)) !== null) {
      const variableContent = match[1]?.trim();

      if (!variableContent) {
        errors.push(`Empty variable at position ${match.index}`);
        continue;
      }

      // Check for valid variable name pattern
      const variableNamePattern = /^[a-zA-Z_][a-zA-Z0-9_.]*$/;
      if (!variableNamePattern.test(variableContent)) {
        errors.push(
          `Invalid variable name '${variableContent}' at position ${match.index}`
        );
      }

      // Check for potential issues
      if (variableContent.includes('  ')) {
        warnings.push(`Variable '${variableContent}' contains multiple spaces`);
      }

      if (variableContent.startsWith('.') || variableContent.endsWith('.')) {
        warnings.push(
          `Variable '${variableContent}' starts or ends with a dot`
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate conditional syntax in template content
   */
  private validateConditionalSyntax(content: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for unmatched if/endif blocks
    const ifBlocks = (content.match(/\{%\s*if\s+/g) || []).length;
    const endifBlocks = (content.match(/\{%\s*endif\s*%\}/g) || []).length;

    if (ifBlocks !== endifBlocks) {
      errors.push(
        `Mismatched if/endif blocks: ${ifBlocks} if blocks, ${endifBlocks} endif blocks`
      );
    }

    // Check for malformed conditional syntax
    const allConditionalBlocks = (content.match(/\{%[^%]*%\}/g) ||
      []) as string[];
    const validIfBlocks = (content.match(/\{%\s*if\s+[^%]*%\}/g) ||
      []) as string[];
    const validEndifBlocks = (content.match(/\{%\s*endif\s*%\}/g) ||
      []) as string[];

    const malformedBlocks = allConditionalBlocks.filter(
      block =>
        !validIfBlocks.includes(block) && !validEndifBlocks.includes(block)
    );

    if (malformedBlocks.length > 0) {
      errors.push(
        `Malformed conditional syntax: ${malformedBlocks.join(', ')}`
      );
    }

    // Check for nested conditional depth
    const maxNestingDepth = this.calculateConditionalNestingDepth(content);
    if (maxNestingDepth > 10) {
      warnings.push(
        `Deep conditional nesting detected (depth: ${maxNestingDepth}), consider simplifying`
      );
    }

    // Check for empty conditional blocks
    const emptyConditionalPattern = /\{%\s*if\s+[^%]*%\s*{%\s*endif\s*%\}/gs;
    const emptyBlocks = content.match(emptyConditionalPattern) || [];
    if (emptyBlocks.length > 0) {
      warnings.push(
        `Empty conditional blocks detected: ${emptyBlocks.length} blocks`
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Calculate the maximum nesting depth of conditionals
   */
  private calculateConditionalNestingDepth(content: string): number {
    let maxDepth = 0;
    let currentDepth = 0;

    // Use regex to find all if and endif blocks
    const ifMatches = content.match(/\{%\s*if\s+/g) || [];
    const endifMatches = content.match(/\{%\s*endif\s*%\}/g) || [];

    // Count opening and closing blocks
    for (const _ of ifMatches) {
      currentDepth++;
      maxDepth = Math.max(maxDepth, currentDepth);
    }

    for (const _ of endifMatches) {
      currentDepth = Math.max(0, currentDepth - 1);
    }

    return maxDepth;
  }

  /**
   * Validate template structure
   */
  private validateTemplateStructure(content: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for unclosed tags
    const openTags = content.match(/\{\{[^}]*$/gm);
    if (openTags && openTags.length > 0) {
      errors.push(
        `Unclosed variable tags detected: ${openTags.length} instances`
      );
    }

    // Check for excessive line length
    const lines = content.split('\n');
    const longLines = lines.filter(line => line.length > 120);
    if (longLines.length > 0) {
      warnings.push(`${longLines.length} lines exceed 120 characters`);
    }

    // Check for mixed line endings
    const hasCRLF = content.includes('\r\n');
    const hasLF = content.includes('\n') && !content.includes('\r\n');
    if (hasCRLF && hasLF) {
      warnings.push('Mixed line endings detected (CRLF and LF)');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * TASK-017: Implement configuration validator
   * Create template configuration validation
   */
  private validateTemplateConfiguration(template: TemplateConfig): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate required fields
    if (!template.name || template.name.trim().length === 0) {
      errors.push('Template name is required');
    }

    if (!template.description || template.description.trim().length === 0) {
      errors.push('Template description is required');
    }

    if (!template.version || template.version.trim().length === 0) {
      errors.push('Template version is required');
    }

    if (!template.files || template.files.length === 0) {
      errors.push('Template must have at least one file');
    }

    // Validate template name format
    if (template.name) {
      const namePattern = /^[a-zA-Z0-9\s_.-]+$/;
      if (!namePattern.test(template.name)) {
        errors.push('Template name contains invalid characters');
      }

      if (template.name.length > 100) {
        errors.push('Template name is too long (max 100 characters)');
      }
    }

    // Validate template description
    if (template.description && template.description.length > 500) {
      warnings.push(
        'Template description is very long (max 500 characters recommended)'
      );
    }

    // Validate template version format
    if (template.version) {
      const versionPattern = /^\d+\.\d+\.\d+$/;
      if (!versionPattern.test(template.version)) {
        warnings.push(
          'Template version should follow semantic versioning (e.g., 1.0.0)'
        );
      }
    }

    // Validate template options
    if (template.options) {
      const optionResult = this.validateTemplateOptions(template.options);
      if (!optionResult.isValid) {
        errors.push(...optionResult.errors);
      }
      warnings.push(...optionResult.warnings);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate template options
   */
  private validateTemplateOptions(options: any[]): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (let i = 0; i < options.length; i++) {
      const option = options[i];

      // Check required fields
      if (!option.name || option.name.trim().length === 0) {
        errors.push(`Option ${i + 1}: name is required`);
      }

      if (
        !option.type ||
        !['string', 'boolean', 'number', 'select'].includes(option.type)
      ) {
        errors.push(`Option ${i + 1}: invalid type '${option.type}'`);
      }

      if (!option.description || option.description.trim().length === 0) {
        errors.push(`Option ${i + 1}: description is required`);
      }

      // Validate option name format
      if (option.name) {
        const namePattern = /^[a-zA-Z][a-zA-Z0-9_]*$/;
        if (!namePattern.test(option.name)) {
          errors.push(
            `Option ${i + 1}: name must start with a letter and contain only letters, numbers, and underscores`
          );
        }
      }

      // Validate select options
      if (
        option.type === 'select' &&
        (!option.choices || option.choices.length === 0)
      ) {
        errors.push(`Option ${i + 1}: select type requires choices array`);
      }

      // Check for duplicate option names
      const duplicateIndex = options.findIndex(
        (o, idx) => idx !== i && o.name === option.name
      );
      if (duplicateIndex !== -1) {
        errors.push(
          `Option ${i + 1}: duplicate name '${option.name}' (also used by option ${duplicateIndex + 1})`
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * TASK-018: Create template metadata validator
   * Implement metadata structure validation
   */
  private validateTemplateMetadata(template: TemplateConfig): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate metadata structure
    const requiredFields = ['name', 'description', 'version', 'files'];
    for (const field of requiredFields) {
      if (!(field in template)) {
        errors.push(`Required metadata field '${field}' is missing`);
      }
    }

    // Validate metadata field types
    if (template.name && typeof template.name !== 'string') {
      errors.push('Template name must be a string');
    }

    if (template.description && typeof template.description !== 'string') {
      errors.push('Template description must be a string');
    }

    if (template.version && typeof template.version !== 'string') {
      errors.push('Template version must be a string');
    }

    if (template.files && !Array.isArray(template.files)) {
      errors.push('Template files must be an array');
    }

    if (template.options && !Array.isArray(template.options)) {
      errors.push('Template options must be an array');
    }

    // Validate metadata consistency
    if (template.name && template.description) {
      if (template.name.length > template.description.length) {
        warnings.push('Template name is longer than description');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate template files
   */
  private async validateTemplateFiles(template: TemplateConfig): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    fileResults: Record<string, ValidationResult>;
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const fileResults: Record<string, ValidationResult> = {};

    if (!template.files || template.files.length === 0) {
      errors.push('Template must have at least one file');
      return {
        isValid: false,
        errors,
        warnings,
        fileResults,
      };
    }

    // Check for duplicate file paths
    const filePaths = template.files.map(f => f.path);
    const duplicatePaths = filePaths.filter(
      (path, index) => filePaths.indexOf(path) !== index
    );
    if (duplicatePaths.length > 0) {
      errors.push(`Duplicate file paths: ${duplicatePaths.join(', ')}`);
    }

    // Validate each file
    for (const file of template.files) {
      const fileResult = this.validateTemplateFile(file);
      fileResults[file.path] = fileResult;

      if (!fileResult.isValid) {
        errors.push(`File '${file.path}': ${fileResult.errors.join(', ')}`);
      }

      if (fileResult.warnings.length > 0) {
        warnings.push(`File '${file.path}': ${fileResult.warnings.join(', ')}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      fileResults,
    };
  }

  /**
   * Validate a single template file
   */
  private validateTemplateFile(file: TemplateFile): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate file path
    if (!file.path || file.path.trim().length === 0) {
      errors.push('File path is required');
    } else {
      const pathResult = this.validateFilePath(file.path);
      if (!pathResult.isValid) {
        errors.push(...pathResult.errors);
      }
      warnings.push(...pathResult.warnings);
    }

    // Validate file content
    if (file.content === undefined || file.content === null) {
      errors.push('File content is required');
    } else if (typeof file.content !== 'string') {
      errors.push('File content must be a string');
    }

    // Validate overwrite flag
    if (file.overwrite !== undefined && typeof file.overwrite !== 'boolean') {
      errors.push('Overwrite flag must be a boolean');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate file path
   */
  private validateFilePath(filePath: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for invalid characters
    const invalidChars = /[<>"|?*]/;
    if (invalidChars.test(filePath)) {
      errors.push('File path contains invalid characters (<>"|?*)');
    }

    // Check for null bytes
    if (filePath.includes('\0')) {
      errors.push('File path contains null bytes');
    }

    // Check path length
    if (filePath.length > 260) {
      warnings.push(
        'File path is very long and may cause issues on some systems'
      );
    }

    // Check for relative path issues
    if (filePath.startsWith('..')) {
      warnings.push('File path uses relative navigation, which may be unsafe');
    }

    // Check for absolute paths
    if (filePath.startsWith('/') || filePath.match(/^[A-Z]:\\/i)) {
      warnings.push('File path is absolute, consider using relative paths');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * TASK-019: Implement validation error handling
   * Create validation error categorization
   */
  categorizeValidationErrors(result: TemplateValidationResult): {
    critical: string[];
    errors: string[];
    warnings: string[];
    suggestions: string[];
  } {
    const critical: string[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Categorize metadata errors
    if (!result.metadata.isValid) {
      result.metadata.errors.forEach(error => {
        if (error.includes('required') || error.includes('missing')) {
          critical.push(`Metadata: ${error}`);
        } else {
          errors.push(`Metadata: ${error}`);
        }
      });
    }

    // Categorize syntax errors
    if (!result.syntax.isValid) {
      result.syntax.errors.forEach(error => {
        if (error.includes('malformed') || error.includes('unclosed')) {
          critical.push(`Syntax: ${error}`);
        } else {
          errors.push(`Syntax: ${error}`);
        }
      });
    }

    // Categorize configuration errors
    if (!result.configuration.isValid) {
      result.configuration.errors.forEach(error => {
        if (error.includes('required') || error.includes('invalid type')) {
          critical.push(`Configuration: ${error}`);
        } else {
          errors.push(`Configuration: ${error}`);
        }
      });
    }

    // Categorize file errors
    if (!result.files.isValid) {
      result.files.errors.forEach(error => {
        if (error.includes('required') || error.includes('duplicate')) {
          critical.push(`Files: ${error}`);
        } else {
          errors.push(`Files: ${error}`);
        }
      });
    }

    // Add warnings
    warnings.push(...result.metadata.warnings);
    warnings.push(...result.syntax.warnings);
    warnings.push(...result.configuration.warnings);
    warnings.push(...result.files.warnings);

    // Generate suggestions based on errors
    if (critical.length > 0) {
      suggestions.push('Fix critical errors before using this template');
    }
    if (errors.length > 0) {
      suggestions.push('Review and fix validation errors');
    }
    if (warnings.length > 0) {
      suggestions.push(
        'Consider addressing warnings for better template quality'
      );
    }

    return {
      critical,
      errors,
      warnings,
      suggestions,
    };
  }

  /**
   * Format validation result for display
   */
  formatValidationResult(result: TemplateValidationResult): string {
    const parts: string[] = [];
    const categorized = this.categorizeValidationErrors(result);

    parts.push(`Template Validation Results for '${result.templateId}':`);
    parts.push('');

    if (categorized.critical.length > 0) {
      parts.push('🚨 Critical Issues:');
      categorized.critical.forEach(error => parts.push(`  ❌ ${error}`));
      parts.push('');
    }

    if (categorized.errors.length > 0) {
      parts.push('❌ Errors:');
      categorized.errors.forEach(error => parts.push(`  • ${error}`));
      parts.push('');
    }

    if (categorized.warnings.length > 0) {
      parts.push('⚠️  Warnings:');
      categorized.warnings.forEach(warning => parts.push(`  • ${warning}`));
      parts.push('');
    }

    if (categorized.suggestions.length > 0) {
      parts.push('💡 Suggestions:');
      categorized.suggestions.forEach(suggestion =>
        parts.push(`  • ${suggestion}`)
      );
      parts.push('');
    }

    if (result.isValid) {
      parts.push('✅ Template is valid and ready to use');
    } else {
      parts.push('❌ Template has validation issues that need to be resolved');
    }

    return parts.join('\n');
  }
}
