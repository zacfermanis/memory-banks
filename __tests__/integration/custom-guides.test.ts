import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { ConfigurationManager } from '../../src/config/configuration-manager';
import { GuideDiscoveryService } from '../../src/services/guide-discovery-service';
import { FileCopyService } from '../../src/services/file-copy-service';
import { CustomGuideConfig, GuideInfo } from '../../src/config/types';

// Mock fs and os modules
jest.mock('fs');
jest.mock('os');
const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedOs = os as jest.Mocked<typeof os>;

describe('Custom Development Guides Integration', () => {
  let configManager: ConfigurationManager;
  let guideDiscoveryService: GuideDiscoveryService;
  let fileCopyService: FileCopyService;
  const mockHomeDir = '/mock/home';
  const mockConfigDir = path.join(mockHomeDir, '.memory-bank');
  const mockConfigPath = path.join(mockConfigDir, 'config.json');
  const mockCustomGuidesDir = '/custom/guides';

  beforeEach(() => {
    mockedOs.homedir.mockReturnValue(mockHomeDir);
    configManager = new ConfigurationManager();
    guideDiscoveryService = new GuideDiscoveryService();
    fileCopyService = new FileCopyService();
    jest.clearAllMocks();
    
    // Reset mock implementations
    mockedFs.existsSync.mockReset();
    mockedFs.readFileSync.mockReset();
    mockedFs.writeFileSync.mockReset();
    mockedFs.mkdirSync.mockReset();
    mockedFs.statSync.mockReset();
    mockedFs.readdirSync.mockReset();
    mockedFs.accessSync.mockReset();
  });

  describe('Complete Workflow Integration', () => {
    it('should handle complete custom guides workflow successfully', () => {
      // Setup mock configuration
      const config: CustomGuideConfig = {
        version: '1.0.0',
        customGuidesFolder: mockCustomGuidesDir,
        menuItems: [
          {
            id: 'test-guide',
            displayName: 'Test Development Guide',
            folderPath: 'test-guide',
            category: 'Testing',
            description: 'A test development guide',
          },
        ],
      };

      // Mock configuration loading
      // Mock existsSync to handle dynamic paths
      mockedFs.existsSync.mockImplementation((path) => {
        const pathStr = path.toString();
        // Return true for config file
        if (pathStr.includes('config.json')) {
          return true;
        }
        // Return true for custom guides folder
        if (pathStr === mockCustomGuidesDir) {
          return true;
        }
        // Return true for guide folder
        if (pathStr.includes('test-guide')) {
          return true;
        }
        // Return true for developmentGuide.md
        if (pathStr.includes('developmentGuide.md')) {
          return true;
        }
        // Return true for .cursorrules
        if (pathStr.includes('.cursorrules')) {
          return true;
        }
        // Return true for target directory
        if (pathStr === '/target/project') {
          return true;
        }
        // Return false for target .memory-bank (should be created)
        if (pathStr.includes('.memory-bank')) {
          return false;
        }
        return false;
      });

      mockedFs.readFileSync
        .mockReturnValueOnce(JSON.stringify(config)) // config file
        .mockReturnValueOnce('Test guide content') // developmentGuide.md
        .mockReturnValueOnce('Test cursor rules'); // .cursorrules

      mockedFs.statSync.mockReturnValue({
        isDirectory: () => true,
      } as any);

      mockedFs.readdirSync.mockReturnValue(['test-guide'] as any);

      // Test configuration loading
      const loadedConfig = configManager.loadConfig();
      expect(loadedConfig).toEqual(config);

      // Test configuration validation
      const validation = configManager.validateConfig(loadedConfig);
      expect(validation.isValid).toBe(true);

      // Test guide discovery
      const builtInGuides = guideDiscoveryService.discoverBuiltInGuides();
      expect(builtInGuides.length).toBeGreaterThan(0);

      const customGuides = guideDiscoveryService.discoverCustomGuides(loadedConfig);
      expect(customGuides.length).toBe(1);
      expect(customGuides[0].id).toBe('test-guide');
      expect(customGuides[0].displayName).toBe('Test Development Guide');
      expect(customGuides[0].type).toBe('custom');

      // Test guide accessibility
      const isAccessible = guideDiscoveryService.isGuideAccessible(customGuides[0]);
      expect(isAccessible).toBe(true);

      // Test file copying
      const targetDir = '/target/project';
      const copyResults = fileCopyService.copyGuideFiles(customGuides[0], targetDir);

      expect(copyResults.length).toBe(2); // developmentGuide.md and .cursorrules
      expect(copyResults.every(result => result.success)).toBe(true);

      const guideResult = copyResults.find(r => r.copiedFilePath?.includes('developmentGuide.md'));
      const cursorResult = copyResults.find(r => r.copiedFilePath?.includes('.cursorrules'));

      expect(guideResult?.success).toBe(true);
      expect(cursorResult?.success).toBe(true);
    });

    it('should handle configuration errors gracefully', () => {
      // Mock corrupted configuration
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue('invalid json');

      // Should return default config
      const config = configManager.loadConfig();
      expect(config.version).toBe('1.0.0');
      expect(config.customGuidesFolder).toBe(path.join(mockHomeDir, 'custom-dev-guides'));

      // Should still discover built-in guides
      const builtInGuides = guideDiscoveryService.discoverBuiltInGuides();
      expect(builtInGuides.length).toBeGreaterThan(0);

      // Should handle missing custom guides folder
      const customGuides = guideDiscoveryService.discoverCustomGuides(config);
      expect(customGuides.length).toBe(0);
    });

    it('should handle missing custom guides folder gracefully', () => {
      const config: CustomGuideConfig = {
        version: '1.0.0',
        customGuidesFolder: '/non/existent',
        menuItems: [],
      };

      // Mock configuration loading
      mockedFs.existsSync
        .mockReturnValueOnce(true) // config file exists
        .mockReturnValueOnce(false); // custom guides folder doesn't exist
      mockedFs.readFileSync.mockReturnValue(JSON.stringify(config));

      const loadedConfig = configManager.loadConfig();
      const validation = configManager.validateConfig(loadedConfig);

      // Should be valid but with warnings
      expect(validation.isValid).toBe(true);
      expect(validation.warnings).toContain('Custom guides folder does not exist');

      // Should still discover built-in guides
      const builtInGuides = guideDiscoveryService.discoverBuiltInGuides();
      expect(builtInGuides.length).toBeGreaterThan(0);

      // Should return empty custom guides
      const customGuides = guideDiscoveryService.discoverCustomGuides(loadedConfig);
      expect(customGuides.length).toBe(0);
    });

    it('should handle file copy errors gracefully', () => {
      const config: CustomGuideConfig = {
        version: '1.0.0',
        customGuidesFolder: mockCustomGuidesDir,
        menuItems: [],
      };

      const guide: GuideInfo = {
        id: 'test-guide',
        displayName: 'Test Guide',
        type: 'custom',
        folderPath: '/test/guide',
        hasCursorRules: true,
      };

      // Mock file system operations
      mockedFs.existsSync
        .mockReturnValueOnce(true) // config file exists
        .mockReturnValueOnce(true) // custom guides folder exists
        .mockReturnValueOnce(true) // guide folder exists
        .mockReturnValueOnce(true) // developmentGuide.md exists
        .mockReturnValueOnce(true) // .cursorrules exists
        .mockReturnValueOnce(true) // target directory exists
        .mockReturnValueOnce(false) // target .memory-bank doesn't exist
        .mockReturnValueOnce(false); // source developmentGuide.md doesn't exist

      mockedFs.readFileSync.mockReturnValue(JSON.stringify(config));
      mockedFs.statSync.mockReturnValue({
        isDirectory: () => true,
      } as any);
      mockedFs.readdirSync.mockReturnValue(['test-guide'] as any);

      const loadedConfig = configManager.loadConfig();
      const customGuides = guideDiscoveryService.discoverCustomGuides(loadedConfig);

      // Should handle missing source files
      const copyResults = fileCopyService.copyGuideFiles(guide, '/target/project');
      const failedCopies = copyResults.filter(result => !result.success);
      expect(failedCopies.length).toBeGreaterThan(0);
    });
  });

  describe('Configuration Recovery Integration', () => {
    it('should recover from corrupted configuration using backup', () => {
      const backupConfig: CustomGuideConfig = {
        version: '1.0.0',
        customGuidesFolder: '/backup/guides',
        menuItems: [
          {
            id: 'backup-guide',
            displayName: 'Backup Guide',
            folderPath: 'backup-guide',
          },
        ],
      };

      // Mock main config corrupted, backup valid
      mockedFs.existsSync
        .mockReturnValueOnce(true) // main config exists
        .mockReturnValueOnce(true); // backup exists
      mockedFs.readFileSync
        .mockReturnValueOnce('invalid json') // main config corrupted
        .mockReturnValueOnce(JSON.stringify(backupConfig)); // backup valid

      const config = configManager.loadConfig();

      // Should restore from backup
      expect(config).toEqual(backupConfig);

      // Should be able to discover guides with restored config
      const customGuides = guideDiscoveryService.discoverCustomGuides(config);
      expect(customGuides.length).toBe(0); // backup folder doesn't exist in mocks
    });

    it('should handle complete configuration corruption gracefully', () => {
      // Mock both main and backup config corrupted
      mockedFs.existsSync
        .mockReturnValueOnce(true) // main config exists
        .mockReturnValueOnce(true); // backup exists
      mockedFs.readFileSync
        .mockReturnValueOnce('invalid json') // main config corrupted
        .mockReturnValueOnce('invalid json'); // backup also corrupted

      const config = configManager.loadConfig();

      // Should return default config
      expect(config.version).toBe('1.0.0');
      expect(config.customGuidesFolder).toBe(path.join(mockHomeDir, 'custom-dev-guides'));

      // Should still work with built-in guides
      const builtInGuides = guideDiscoveryService.discoverBuiltInGuides();
      expect(builtInGuides.length).toBeGreaterThan(0);
    });
  });

  describe('Guide Discovery Integration', () => {
    it('should discover and validate custom guides correctly', () => {
      const config: CustomGuideConfig = {
        version: '1.0.0',
        customGuidesFolder: mockCustomGuidesDir,
        menuItems: [
          {
            id: 'valid-guide',
            displayName: 'Valid Guide',
            folderPath: 'valid-guide',
          },
          {
            id: 'invalid-guide',
            displayName: 'Invalid Guide',
            folderPath: 'invalid-guide',
          },
        ],
      };

      // Mock file system with valid and invalid guides
      mockedFs.existsSync
        .mockReturnValueOnce(true) // config file exists
        .mockReturnValueOnce(true) // custom guides folder exists
        .mockReturnValueOnce(true) // valid-guide is directory
        .mockReturnValueOnce(true) // valid-guide/developmentGuide.md exists
        .mockReturnValueOnce(true) // valid-guide/.cursorrules exists
        .mockReturnValueOnce(true) // invalid-guide is directory
        .mockReturnValueOnce(false); // invalid-guide/developmentGuide.md doesn't exist

      mockedFs.readFileSync.mockReturnValue(JSON.stringify(config));
      mockedFs.statSync.mockReturnValue({
        isDirectory: () => true,
      } as any);
      mockedFs.readdirSync.mockReturnValue(['valid-guide', 'invalid-guide'] as any);

      const loadedConfig = configManager.loadConfig();
      const customGuides = guideDiscoveryService.discoverCustomGuides(loadedConfig);

      // Should only discover valid guides
      expect(customGuides.length).toBe(1);
      expect(customGuides[0].id).toBe('valid-guide');
      expect(customGuides[0].displayName).toBe('Valid Guide');
    });

    it('should handle guide accessibility checks', () => {
      const guide: GuideInfo = {
        id: 'test-guide',
        displayName: 'Test Guide',
        type: 'custom',
        folderPath: '/test/guide',
        hasCursorRules: true,
      };

      // Mock accessible guide
      mockedFs.existsSync
        .mockReturnValueOnce(true) // guide folder exists
        .mockReturnValueOnce(true); // developmentGuide.md exists
      mockedFs.statSync.mockReturnValue({
        isDirectory: () => true,
      } as any);
      mockedFs.accessSync.mockImplementation(() => undefined);

      const isAccessible = guideDiscoveryService.isGuideAccessible(guide);
      expect(isAccessible).toBe(true);

      // Mock inaccessible guide
      mockedFs.existsSync
        .mockReturnValueOnce(true) // guide folder exists
        .mockReturnValueOnce(false); // developmentGuide.md doesn't exist

      const isInaccessible = guideDiscoveryService.isGuideAccessible(guide);
      expect(isInaccessible).toBe(false);
    });
  });

  describe('File Operations Integration', () => {
    it('should handle file copy operations with conflicts', () => {
      const guide: GuideInfo = {
        id: 'test-guide',
        displayName: 'Test Guide',
        type: 'custom',
        folderPath: '/test/guide',
        hasCursorRules: true,
      };

      // Mock file system with existing files
      mockedFs.existsSync.mockImplementation((path) => {
        const pathStr = path.toString();
        // Return true for directories and existing files
        if (pathStr.includes('/target/project') || pathStr.includes('.memory-bank') || pathStr.includes('developmentGuide.md') || pathStr.includes('.cursorrules')) {
          return true;
        }
        // Return false for backup files (should be created)
        if (pathStr.includes('.backup.')) {
          return false;
        }
        return false;
      });

      mockedFs.statSync.mockReturnValue({
        isDirectory: () => true,
      } as any);

      mockedFs.readFileSync
        .mockReturnValueOnce('Existing guide content')
        .mockReturnValueOnce('New guide content')
        .mockReturnValueOnce('Existing guide content')
        .mockReturnValueOnce('Existing cursor content')
        .mockReturnValueOnce('New cursor content')
        .mockReturnValueOnce('Existing cursor content');

      mockedFs.writeFileSync.mockImplementation(() => undefined);

      const copyResults = fileCopyService.copyGuideFilesWithBackup(guide, '/target/project');

      expect(copyResults.length).toBe(2);
      expect(copyResults.every(result => result.success)).toBe(true);

      const guideResult = copyResults.find(r => r.copiedFilePath?.includes('developmentGuide.md'));
      const cursorResult = copyResults.find(r => r.copiedFilePath?.includes('.cursorrules'));

      expect(guideResult?.overwritten).toBe(true);
      expect(guideResult?.backupPath).toContain('.backup');
      expect(cursorResult?.overwritten).toBe(true);
      expect(cursorResult?.backupPath).toContain('.backup');
    });

    it('should handle target directory validation', () => {
      const guide: GuideInfo = {
        id: 'test-guide',
        displayName: 'Test Guide',
        type: 'custom',
        folderPath: '/test/guide',
        hasCursorRules: false,
      };

      // Mock non-existent target directory
      mockedFs.existsSync.mockReturnValue(false);

      const copyResults = fileCopyService.copyGuideFiles(guide, '/non/existent');

      expect(copyResults.length).toBe(1);
      expect(copyResults[0].success).toBe(false);
      expect(copyResults[0].error).toContain('Target directory does not exist');
    });
  });
}); 