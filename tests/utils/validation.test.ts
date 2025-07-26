import { ValidationUtils, ValidationResult } from '../../src/utils/validation';

describe('ValidationUtils', () => {
  describe('validateProjectName', () => {
    it('should validate a valid project name', () => {
      const result = ValidationUtils.validateProjectName('my-project');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty project name', () => {
      const result = ValidationUtils.validateProjectName('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Project name is required');
    });

    it('should reject project name with invalid characters', () => {
      const result = ValidationUtils.validateProjectName('my<project>');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Project name contains invalid characters (<>:"/\\|?*)');
    });

    it('should reject reserved system names', () => {
      const result = ValidationUtils.validateProjectName('con');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Project name is a reserved system name');
    });

    it('should warn about names starting with dot', () => {
      const result = ValidationUtils.validateProjectName('.myproject');
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Project name starts or ends with a dot, which may cause issues');
    });

    it('should reject names that are too short', () => {
      const result = ValidationUtils.validateProjectName('a');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Project name must be at least 2 characters long');
    });

    it('should reject names that are too long', () => {
      const longName = 'a'.repeat(51);
      const result = ValidationUtils.validateProjectName(longName);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Project name must be less than 50 characters long');
    });
  });

  describe('validateFilePath', () => {
    it('should validate a valid file path', () => {
      const result = ValidationUtils.validateFilePath('path/to/file.txt');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty file path', () => {
      const result = ValidationUtils.validateFilePath('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('File path is required');
    });

    it('should reject file path with invalid characters', () => {
      const result = ValidationUtils.validateFilePath('path<to>file.txt');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('File path contains invalid characters (<>"|?*)');
    });

    it('should warn about very long paths', () => {
      const longPath = 'a'.repeat(261);
      const result = ValidationUtils.validateFilePath(longPath);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('File path is very long and may cause issues on some systems');
    });

    it('should warn about relative navigation', () => {
      const result = ValidationUtils.validateFilePath('../path/to/file');
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('File path uses relative navigation, which may be unsafe');
    });
  });

  describe('validateTemplateId', () => {
    it('should validate a valid template ID', () => {
      const result = ValidationUtils.validateTemplateId('typescript-basic');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty template ID', () => {
      const result = ValidationUtils.validateTemplateId('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Template ID is required');
    });

    it('should reject template ID with invalid characters', () => {
      const result = ValidationUtils.validateTemplateId('template@id');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Template ID can only contain letters, numbers, hyphens, and underscores');
    });

    it('should reject template ID starting with underscore', () => {
      const result = ValidationUtils.validateTemplateId('_template');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Template ID cannot start with underscore or hyphen');
    });

    it('should reject template ID ending with hyphen', () => {
      const result = ValidationUtils.validateTemplateId('template-');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Template ID cannot end with underscore or hyphen');
    });

    it('should warn about consecutive special characters', () => {
      const result = ValidationUtils.validateTemplateId('template__id');
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Template ID contains consecutive special characters');
    });

    it('should reject template ID that is too short', () => {
      const result = ValidationUtils.validateTemplateId('a');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Template ID must be at least 2 characters long');
    });

    it('should reject template ID that is too long', () => {
      const longId = 'a'.repeat(31);
      const result = ValidationUtils.validateTemplateId(longId);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Template ID must be less than 30 characters long');
    });
  });

  describe('validateConfiguration', () => {
    it('should validate a valid configuration', () => {
      const config = {
        name: 'test',
        version: '1.0.0',
        description: 'A test project'
      };

      const schema = {
        name: { type: 'string', required: true },
        version: { type: 'string', required: true },
        description: { type: 'string', required: false }
      };

      const result = ValidationUtils.validateConfiguration(config, schema);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject configuration with missing required fields', () => {
      const config = {
        name: 'test'
      };

      const schema = {
        name: { type: 'string', required: true },
        version: { type: 'string', required: true }
      };

      const result = ValidationUtils.validateConfiguration(config, schema);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Required field 'version' is missing");
    });

    it('should reject configuration with wrong types', () => {
      const config = {
        name: 123,
        version: '1.0.0'
      };

      const schema = {
        name: { type: 'string', required: true },
        version: { type: 'string', required: true }
      };

      const result = ValidationUtils.validateConfiguration(config, schema);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Field 'name' must be of type string");
    });

    it('should validate string length constraints', () => {
      const config = {
        name: 'a',
        description: 'A very long description that exceeds the maximum length'
      };

      const schema = {
        name: { type: 'string', required: true, minLength: 2 },
        description: { type: 'string', required: false, maxLength: 10 }
      };

      const result = ValidationUtils.validateConfiguration(config, schema);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Field 'name' must be at least 2 characters long");
      expect(result.errors).toContain("Field 'description' must be less than 10 characters long");
    });

    it('should validate number range constraints', () => {
      const config = {
        port: 5000,
        timeout: 30
      };

      const schema = {
        port: { type: 'number', required: true, min: 1024, max: 65535 },
        timeout: { type: 'number', required: true, min: 1, max: 60 }
      };

      const result = ValidationUtils.validateConfiguration(config, schema);
      expect(result.isValid).toBe(true);
    });

    it('should warn about unknown fields', () => {
      const config = {
        name: 'test',
        unknownField: 'value'
      };

      const schema = {
        name: { type: 'string', required: true }
      };

      const result = ValidationUtils.validateConfiguration(config, schema);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain("Unknown configuration field 'unknownField'");
    });
  });

  describe('validateEmail', () => {
    it('should validate a valid email address', () => {
      const result = ValidationUtils.validateEmail('test@example.com');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty email', () => {
      const result = ValidationUtils.validateEmail('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Email address is required');
    });

    it('should reject invalid email format', () => {
      const result = ValidationUtils.validateEmail('invalid-email');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Email address format is invalid');
    });

    it('should reject email that is too long', () => {
      const longEmail = 'a'.repeat(255) + '@example.com';
      const result = ValidationUtils.validateEmail(longEmail);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Email address is too long');
    });

    it('should warn about email with consecutive dots', () => {
      const result = ValidationUtils.validateEmail('test..user@example.com');
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Email address contains consecutive dots');
    });
  });

  describe('validateVersion', () => {
    it('should validate a valid semantic version', () => {
      const result = ValidationUtils.validateVersion('1.0.0');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate version with pre-release', () => {
      const result = ValidationUtils.validateVersion('1.0.0-alpha');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate version with build metadata', () => {
      const result = ValidationUtils.validateVersion('1.0.0+build.1');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty version', () => {
      const result = ValidationUtils.validateVersion('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Version is required');
    });

    it('should reject invalid version format', () => {
      const result = ValidationUtils.validateVersion('1.0');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Version must follow semantic versioning format (e.g., 1.0.0)');
    });
  });

  describe('validateUrl', () => {
    it('should validate a valid URL', () => {
      const result = ValidationUtils.validateUrl('https://example.com');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty URL', () => {
      const result = ValidationUtils.validateUrl('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('URL is required');
    });

    it('should reject invalid URL format', () => {
      const result = ValidationUtils.validateUrl('not-a-url');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('URL format is invalid');
    });

    it('should warn about non-HTTPS URLs', () => {
      const result = ValidationUtils.validateUrl('http://example.com');
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('URL should use HTTPS for security');
    });
  });

  describe('formatValidationResult', () => {
    it('should format validation result with errors', () => {
      const result: ValidationResult = {
        isValid: false,
        errors: ['Error 1', 'Error 2'],
        warnings: []
      };

      const formatted = ValidationUtils.formatValidationResult(result);
      expect(formatted).toContain('Errors:');
      expect(formatted).toContain('❌ Error 1');
      expect(formatted).toContain('❌ Error 2');
    });

    it('should format validation result with warnings', () => {
      const result: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: ['Warning 1', 'Warning 2']
      };

      const formatted = ValidationUtils.formatValidationResult(result);
      expect(formatted).toContain('Warnings:');
      expect(formatted).toContain('⚠️  Warning 1');
      expect(formatted).toContain('⚠️  Warning 2');
    });

    it('should format validation result with both errors and warnings', () => {
      const result: ValidationResult = {
        isValid: false,
        errors: ['Error 1'],
        warnings: ['Warning 1']
      };

      const formatted = ValidationUtils.formatValidationResult(result);
      expect(formatted).toContain('Errors:');
      expect(formatted).toContain('Warnings:');
      expect(formatted).toContain('❌ Error 1');
      expect(formatted).toContain('⚠️  Warning 1');
    });
  });
}); 