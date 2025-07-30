import {
  CustomGuideConfig,
  CustomMenuItem,
  GuideInfo,
  ValidationResult,
  CopyResult,
  MemoryBankType,
} from '../../src/config/types';

describe('Type Definitions', () => {
  describe('CustomGuideConfig', () => {
    it('should have required properties', () => {
      const config: CustomGuideConfig = {
        version: '1.0.0',
        customGuidesFolder: '/path/to/guides',
        menuItems: [],
      };

      expect(config.version).toBe('1.0.0');
      expect(config.customGuidesFolder).toBe('/path/to/guides');
      expect(config.menuItems).toEqual([]);
    });

    it('should support optional menu items', () => {
      const config: CustomGuideConfig = {
        version: '1.0.0',
        customGuidesFolder: '/path/to/guides',
        menuItems: [
          {
            id: 'test-guide',
            displayName: 'Test Guide',
            folderPath: '/path/to/guides/test-guide',
          },
        ],
      };

      expect(config.menuItems).toHaveLength(1);
      expect(config.menuItems[0].id).toBe('test-guide');
    });
  });

  describe('CustomMenuItem', () => {
    it('should have required properties', () => {
      const menuItem: CustomMenuItem = {
        id: 'test-guide',
        displayName: 'Test Guide',
        folderPath: '/path/to/guides/test-guide',
      };

      expect(menuItem.id).toBe('test-guide');
      expect(menuItem.displayName).toBe('Test Guide');
      expect(menuItem.folderPath).toBe('/path/to/guides/test-guide');
    });

    it('should support optional properties', () => {
      const menuItem: CustomMenuItem = {
        id: 'test-guide',
        displayName: 'Test Guide',
        folderPath: '/path/to/guides/test-guide',
        category: 'Web Development',
        description: 'A test guide for web development',
      };

      expect(menuItem.category).toBe('Web Development');
      expect(menuItem.description).toBe('A test guide for web development');
    });
  });

  describe('GuideInfo', () => {
    it('should have required properties for built-in guide', () => {
      const guideInfo: GuideInfo = {
        id: 'web',
        displayName: 'Web - For TypeScript/React/Next.js development',
        type: 'built-in',
        folderPath: '/path/to/built-in/web',
        hasCursorRules: true,
      };

      expect(guideInfo.id).toBe('web');
      expect(guideInfo.type).toBe('built-in');
      expect(guideInfo.hasCursorRules).toBe(true);
    });

    it('should have required properties for custom guide', () => {
      const guideInfo: GuideInfo = {
        id: 'custom-web',
        displayName: 'Custom Web Guide',
        type: 'custom',
        folderPath: '/path/to/custom/web',
        hasCursorRules: false,
        category: 'Custom Guides',
        description: 'A custom web development guide',
      };

      expect(guideInfo.id).toBe('custom-web');
      expect(guideInfo.type).toBe('custom');
      expect(guideInfo.hasCursorRules).toBe(false);
      expect(guideInfo.category).toBe('Custom Guides');
      expect(guideInfo.description).toBe('A custom web development guide');
    });
  });

  describe('ValidationResult', () => {
    it('should represent successful validation', () => {
      const result: ValidationResult = {
        isValid: true,
      };

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.warnings).toBeUndefined();
    });

    it('should represent failed validation with error', () => {
      const result: ValidationResult = {
        isValid: false,
        error: 'Invalid folder path',
      };

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid folder path');
    });

    it('should support warnings', () => {
      const result: ValidationResult = {
        isValid: true,
        warnings: ['Guide missing description', 'No cursor rules found'],
      };

      expect(result.isValid).toBe(true);
      expect(result.warnings).toEqual([
        'Guide missing description',
        'No cursor rules found',
      ]);
    });
  });

  describe('CopyResult', () => {
    it('should represent successful copy operation', () => {
      const result: CopyResult = {
        success: true,
        copiedFilePath: '/target/path/developmentGuide.md',
      };

      expect(result.success).toBe(true);
      expect(result.copiedFilePath).toBe('/target/path/developmentGuide.md');
      expect(result.error).toBeUndefined();
      expect(result.overwritten).toBeUndefined();
    });

    it('should represent failed copy operation', () => {
      const result: CopyResult = {
        success: false,
        error: 'Permission denied',
      };

      expect(result.success).toBe(false);
      expect(result.error).toBe('Permission denied');
      expect(result.copiedFilePath).toBeUndefined();
    });

    it('should indicate file overwrite', () => {
      const result: CopyResult = {
        success: true,
        copiedFilePath: '/target/path/developmentGuide.md',
        overwritten: true,
      };

      expect(result.success).toBe(true);
      expect(result.overwritten).toBe(true);
    });
  });

  describe('MemoryBankType', () => {
    it('should have required properties', () => {
      const memoryBankType: MemoryBankType = {
        name: 'Web',
        cursorRulesPath: '/path/to/cursorrules',
        developmentGuidePath: '/path/to/developmentGuide.md',
      };

      expect(memoryBankType.name).toBe('Web');
      expect(memoryBankType.cursorRulesPath).toBe('/path/to/cursorrules');
      expect(memoryBankType.developmentGuidePath).toBe(
        '/path/to/developmentGuide.md'
      );
    });
  });
}); 