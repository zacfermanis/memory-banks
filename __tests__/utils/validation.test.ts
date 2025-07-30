import * as fs from 'fs';
import * as path from 'path';
import {
  validateFilePath,
  validateGuideStructure,
  validateConfiguration,
} from '../../src/utils/validation';
import { CustomGuideConfig, ValidationResult } from '../../src/config/types';

// Mock fs module
jest.mock('fs');
const mockedFs = fs as jest.Mocked<typeof fs>;

describe('Validation Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateFilePath', () => {
    it('should validate a valid file path', () => {
      const result = validateFilePath('/valid/path/to/file.txt');

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject empty file path', () => {
      const result = validateFilePath('');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('File path cannot be empty');
    });

    it('should reject whitespace-only file path', () => {
      const result = validateFilePath('   ');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('File path cannot be empty');
    });

    it('should reject null file path', () => {
      const result = validateFilePath(null as any);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('File path cannot be empty');
    });

    it('should reject undefined file path', () => {
      const result = validateFilePath(undefined as any);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('File path cannot be empty');
    });

    it('should reject file path with invalid characters', () => {
      const result = validateFilePath('/path/with/invalid<chars>');

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('File path contains invalid characters');
    });

    it('should reject file path with directory traversal', () => {
      const result = validateFilePath('/path/../../../etc/passwd');

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('File path contains directory traversal');
    });

    it('should reject file path with null bytes', () => {
      const result = validateFilePath('/path/with\0null/bytes');

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('File path contains invalid characters');
    });
  });

  describe('validateGuideStructure', () => {
    it('should validate a guide with required files', () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.statSync.mockReturnValue({
        isDirectory: () => true,
      } as fs.Stats);

      const result = validateGuideStructure('/path/to/guide');

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
      expect(mockedFs.existsSync).toHaveBeenCalledWith(
        path.join('/path/to/guide', 'developmentGuide.md')
      );
    });

    it('should reject guide without developmentGuide.md', () => {
      mockedFs.existsSync.mockReturnValue(false);

      const result = validateGuideStructure('/path/to/invalid-guide');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe(
        'Guide is missing required file: developmentGuide.md'
      );
    });

    it('should provide warning when cursor rules are missing', () => {
      mockedFs.existsSync
        .mockReturnValueOnce(true) // developmentGuide.md exists
        .mockReturnValueOnce(false); // .cursorrules does not exist

      const result = validateGuideStructure('/path/to/guide');

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Guide is missing optional file: .cursorrules');
    });

    it('should not provide warning when cursor rules exist', () => {
      mockedFs.existsSync.mockReturnValue(true);

      const result = validateGuideStructure('/path/to/guide');

      expect(result.isValid).toBe(true);
      expect(result.warnings).toBeUndefined();
    });

    it('should handle file system errors gracefully', () => {
      mockedFs.existsSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const result = validateGuideStructure('/path/to/guide');

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Permission denied');
    });
  });

  describe('validateConfiguration', () => {
    it('should validate a correct configuration', () => {
      const config: CustomGuideConfig = {
        version: '1.0.0',
        customGuidesFolder: '/valid/path',
        menuItems: [],
      };

      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.statSync.mockReturnValue({
        isDirectory: () => true,
      } as fs.Stats);

      const result = validateConfiguration(config);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject configuration with invalid version', () => {
      const config: CustomGuideConfig = {
        version: '2.0.0',
        customGuidesFolder: '/valid/path',
        menuItems: [],
      };

      const result = validateConfiguration(config);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid version');
    });

    it('should reject configuration with empty custom guides folder', () => {
      const config: CustomGuideConfig = {
        version: '1.0.0',
        customGuidesFolder: '',
        menuItems: [],
      };

      const result = validateConfiguration(config);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Custom guides folder path cannot be empty');
    });

    it('should reject configuration with non-existent custom guides folder', () => {
      const config: CustomGuideConfig = {
        version: '1.0.0',
        customGuidesFolder: '/non/existent/path',
        menuItems: [],
      };

      mockedFs.existsSync.mockReturnValue(false);

      const result = validateConfiguration(config);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Custom guides folder does not exist');
    });

    it('should reject configuration with custom guides folder that is not a directory', () => {
      const config: CustomGuideConfig = {
        version: '1.0.0',
        customGuidesFolder: '/path/to/file',
        menuItems: [],
      };

      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.statSync.mockReturnValue({
        isDirectory: () => false,
      } as fs.Stats);

      const result = validateConfiguration(config);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Custom guides folder is not a directory');
    });

    it('should validate configuration with valid menu items', () => {
      const config: CustomGuideConfig = {
        version: '1.0.0',
        customGuidesFolder: '/valid/path',
        menuItems: [
          {
            id: 'test-guide',
            displayName: 'Test Guide',
            folderPath: '/valid/path/test-guide',
          },
        ],
      };

      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.statSync.mockReturnValue({
        isDirectory: () => true,
      } as fs.Stats);

      const result = validateConfiguration(config);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject configuration with menu items having empty folder paths', () => {
      const config: CustomGuideConfig = {
        version: '1.0.0',
        customGuidesFolder: '/valid/path',
        menuItems: [
          {
            id: 'test-guide',
            displayName: 'Test Guide',
            folderPath: '',
          },
        ],
      };

      const result = validateConfiguration(config);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Menu item \'test-guide\' has empty folder path');
    });

    it('should reject configuration with menu items having non-existent folder paths', () => {
      const config: CustomGuideConfig = {
        version: '1.0.0',
        customGuidesFolder: '/valid/path',
        menuItems: [
          {
            id: 'test-guide',
            displayName: 'Test Guide',
            folderPath: '/invalid/path',
          },
        ],
      };

      mockedFs.existsSync
        .mockReturnValueOnce(true) // customGuidesFolder exists
        .mockReturnValueOnce(false); // menu item folder does not exist

      const result = validateConfiguration(config);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Menu item folder does not exist');
    });

    it('should handle file system errors gracefully', () => {
      const config: CustomGuideConfig = {
        version: '1.0.0',
        customGuidesFolder: '/valid/path',
        menuItems: [],
      };

      mockedFs.existsSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const result = validateConfiguration(config);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Permission denied');
    });
  });
}); 