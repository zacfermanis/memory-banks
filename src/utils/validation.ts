import path from 'path';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ValidationRule {
  name: string;
  validate: (value: any) => boolean;
  message: string;
}

export class ValidationUtils {
  /**
   * Validate project name
   */
  static validateProjectName(name: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!name || name.trim().length === 0) {
      errors.push('Project name is required');
      return { isValid: false, errors, warnings };
    }

    const trimmedName = name.trim();

    // Check length
    if (trimmedName.length < 2) {
      errors.push('Project name must be at least 2 characters long');
    }

    if (trimmedName.length > 50) {
      errors.push('Project name must be less than 50 characters long');
    }

    // Check for invalid characters
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(trimmedName)) {
      errors.push('Project name contains invalid characters (<>:"/\\|?*)');
    }

    // Check for reserved names
    const reservedNames = [
      'con',
      'prn',
      'aux',
      'nul',
      'com1',
      'com2',
      'com3',
      'com4',
      'com5',
      'com6',
      'com7',
      'com8',
      'com9',
      'lpt1',
      'lpt2',
      'lpt3',
      'lpt4',
      'lpt5',
      'lpt6',
      'lpt7',
      'lpt8',
      'lpt9',
    ];
    if (reservedNames.includes(trimmedName.toLowerCase())) {
      errors.push('Project name is a reserved system name');
    }

    // Check for common issues
    if (trimmedName.startsWith('.') || trimmedName.endsWith('.')) {
      warnings.push(
        'Project name starts or ends with a dot, which may cause issues'
      );
    }

    if (trimmedName.includes('  ')) {
      warnings.push('Project name contains multiple consecutive spaces');
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
  static validateFilePath(
    filePath: string,
    _options: {
      mustExist?: boolean;
      mustNotExist?: boolean;
      mustBeDirectory?: boolean;
      mustBeFile?: boolean;
      writable?: boolean;
    } = {}
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!filePath || filePath.trim().length === 0) {
      errors.push('File path is required');
      return { isValid: false, errors, warnings };
    }

    const normalizedPath = path.normalize(filePath.trim());

    // Check for invalid characters
    const invalidChars = /[<>"|?*]/;
    if (invalidChars.test(normalizedPath)) {
      errors.push('File path contains invalid characters (<>"|?*)');
    }

    // Check for null bytes
    if (normalizedPath.includes('\0')) {
      errors.push('File path contains null bytes');
    }

    // Check path length
    if (normalizedPath.length > 260) {
      warnings.push(
        'File path is very long and may cause issues on some systems'
      );
    }

    // Check for relative path issues
    if (normalizedPath.startsWith('..')) {
      warnings.push('File path uses relative navigation, which may be unsafe');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate template ID
   */
  static validateTemplateId(templateId: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!templateId || templateId.trim().length === 0) {
      errors.push('Template ID is required');
      return { isValid: false, errors, warnings };
    }

    const trimmedId = templateId.trim();

    // Check length
    if (trimmedId.length < 2) {
      errors.push('Template ID must be at least 2 characters long');
    }

    if (trimmedId.length > 30) {
      errors.push('Template ID must be less than 30 characters long');
    }

    // Check for valid characters (alphanumeric, hyphens, underscores)
    const validChars = /^[a-zA-Z0-9_-]+$/;
    if (!validChars.test(trimmedId)) {
      errors.push(
        'Template ID can only contain letters, numbers, hyphens, and underscores'
      );
    }

    // Check for reserved prefixes
    if (trimmedId.startsWith('_') || trimmedId.startsWith('-')) {
      errors.push('Template ID cannot start with underscore or hyphen');
    }

    if (trimmedId.endsWith('_') || trimmedId.endsWith('-')) {
      errors.push('Template ID cannot end with underscore or hyphen');
    }

    // Check for consecutive special characters
    if (
      trimmedId.includes('__') ||
      trimmedId.includes('--') ||
      trimmedId.includes('_-') ||
      trimmedId.includes('-_')
    ) {
      warnings.push('Template ID contains consecutive special characters');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate configuration options
   */
  static validateConfiguration(
    config: Record<string, any>,
    schema: Record<string, any>
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required fields
    for (const [key, fieldSchema] of Object.entries(schema)) {
      if (
        fieldSchema.required &&
        (config[key] === undefined ||
          config[key] === null ||
          config[key] === '')
      ) {
        errors.push(`Required field '${key}' is missing`);
        continue;
      }

      if (config[key] !== undefined && config[key] !== null) {
        // Type validation
        if (fieldSchema.type && typeof config[key] !== fieldSchema.type) {
          errors.push(`Field '${key}' must be of type ${fieldSchema.type}`);
        }

        // Length validation for strings
        if (fieldSchema.type === 'string') {
          if (
            fieldSchema.minLength &&
            config[key].length < fieldSchema.minLength
          ) {
            errors.push(
              `Field '${key}' must be at least ${fieldSchema.minLength} characters long`
            );
          }
          if (
            fieldSchema.maxLength &&
            config[key].length > fieldSchema.maxLength
          ) {
            errors.push(
              `Field '${key}' must be less than ${fieldSchema.maxLength} characters long`
            );
          }
        }

        // Range validation for numbers
        if (fieldSchema.type === 'number') {
          if (fieldSchema.min !== undefined && config[key] < fieldSchema.min) {
            errors.push(`Field '${key}' must be at least ${fieldSchema.min}`);
          }
          if (fieldSchema.max !== undefined && config[key] > fieldSchema.max) {
            errors.push(`Field '${key}' must be at most ${fieldSchema.max}`);
          }
        }

        // Pattern validation
        if (fieldSchema.pattern && !fieldSchema.pattern.test(config[key])) {
          errors.push(`Field '${key}' does not match required pattern`);
        }

        // Enum validation
        if (fieldSchema.enum && !fieldSchema.enum.includes(config[key])) {
          errors.push(
            `Field '${key}' must be one of: ${fieldSchema.enum.join(', ')}`
          );
        }
      }
    }

    // Check for unknown fields
    for (const key of Object.keys(config)) {
      if (!schema[key] && !key.startsWith('_')) {
        warnings.push(`Unknown configuration field '${key}'`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate email address
   */
  static validateEmail(email: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!email || email.trim().length === 0) {
      errors.push('Email address is required');
      return { isValid: false, errors, warnings };
    }

    const trimmedEmail = email.trim();

    // Basic email pattern
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(trimmedEmail)) {
      errors.push('Email address format is invalid');
    }

    // Check length
    if (trimmedEmail.length > 254) {
      errors.push('Email address is too long');
    }

    // Check for common issues
    if (trimmedEmail.includes('..')) {
      warnings.push('Email address contains consecutive dots');
    }

    if (trimmedEmail.startsWith('.') || trimmedEmail.endsWith('.')) {
      warnings.push('Email address starts or ends with a dot');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate version string
   */
  static validateVersion(version: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!version || version.trim().length === 0) {
      errors.push('Version is required');
      return { isValid: false, errors, warnings };
    }

    const trimmedVersion = version.trim();

    // Semantic versioning pattern
    const semverPattern =
      /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;
    if (!semverPattern.test(trimmedVersion)) {
      errors.push(
        'Version must follow semantic versioning format (e.g., 1.0.0)'
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate URL
   */
  static validateUrl(url: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!url || url.trim().length === 0) {
      errors.push('URL is required');
      return { isValid: false, errors, warnings };
    }

    const trimmedUrl = url.trim();

    try {
      new URL(trimmedUrl);
    } catch {
      errors.push('URL format is invalid');
    }

    // Check for common issues
    if (trimmedUrl.startsWith('http://')) {
      warnings.push('URL should use HTTPS for security');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Format validation result for display
   */
  static formatValidationResult(result: ValidationResult): string {
    const parts: string[] = [];

    if (result.errors.length > 0) {
      parts.push('Errors:');
      result.errors.forEach(error => parts.push(`  ❌ ${error}`));
    }

    if (result.warnings.length > 0) {
      parts.push('Warnings:');
      result.warnings.forEach(warning => parts.push(`  ⚠️  ${warning}`));
    }

    return parts.join('\n');
  }
}
