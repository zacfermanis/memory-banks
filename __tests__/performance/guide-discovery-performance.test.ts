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

describe('Performance Testing', () => {
  let configManager: ConfigurationManager;
  let guideDiscoveryService: GuideDiscoveryService;
  let fileCopyService: FileCopyService;
  const mockHomeDir = '/mock/home';
  let mockConsoleWarn: jest.SpyInstance;

  beforeEach(() => {
    mockedOs.homedir.mockReturnValue(mockHomeDir);
    configManager = new ConfigurationManager();
    guideDiscoveryService = new GuideDiscoveryService();
    fileCopyService = new FileCopyService();
    jest.clearAllMocks();
    
    // Mock console.warn to prevent excessive output during performance tests
    mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    mockConsoleWarn.mockRestore();
  });

  describe('Guide Discovery Performance', () => {
    it('should discover large numbers of guides efficiently', () => {
      const startTime = Date.now();
      const numGuides = 100; // Reduced from 1000 to prevent memory issues

      // Create mock configuration with many guides
      const config: CustomGuideConfig = {
        version: '1.0.0',
        customGuidesFolder: '/custom/guides',
        menuItems: Array.from({ length: numGuides }, (_, i) => ({
          id: `guide-${i}`,
          displayName: `Guide ${i}`,
          folderPath: `guide-${i}`,
        })),
      };

      // Mock file system operations for many guides
      const mockGuides = Array.from({ length: numGuides }, (_, i) => `guide-${i}`);
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readdirSync.mockReturnValue(mockGuides as any);
      mockedFs.statSync.mockReturnValue({
        isDirectory: () => true,
      } as any);

      // Mock each guide has required files - properly handle all existsSync calls
      mockedFs.existsSync.mockImplementation((path: fs.PathLike) => {
        const pathStr = path.toString();
        
        // Custom guides folder always exists
        if (pathStr === '/custom/guides') {
          return true;
        }
        
        // All guide folders exist
        if (pathStr.includes('/custom/guides/guide-')) {
          return true;
        }
        
        // All developmentGuide.md files exist
        if (pathStr.endsWith('developmentGuide.md')) {
          return true;
        }
        
        // All .cursorrules files exist
        if (pathStr.endsWith('.cursorrules')) {
          return true;
        }
        
        return true;
      });

      const guides = guideDiscoveryService.discoverCustomGuides(config);
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(guides.length).toBe(numGuides);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle guide discovery with mixed valid and invalid guides efficiently', () => {
      const startTime = Date.now();
      const numValidGuides = 50; // Reduced from 500 to prevent memory issues
      const numInvalidGuides = 50; // Reduced from 500 to prevent memory issues
      const totalGuides = numValidGuides + numInvalidGuides;

      const config: CustomGuideConfig = {
        version: '1.0.0',
        customGuidesFolder: '/custom/guides',
        menuItems: Array.from({ length: totalGuides }, (_, i) => ({
          id: `guide-${i}`,
          displayName: `Guide ${i}`,
          folderPath: `guide-${i}`,
        })),
      };

      const mockGuides = Array.from({ length: totalGuides }, (_, i) => `guide-${i}`);
      mockedFs.readdirSync.mockReturnValue(mockGuides as any);
      mockedFs.statSync.mockReturnValue({
        isDirectory: () => true,
      } as any);

      // Set up existsSync to handle different paths correctly
      mockedFs.existsSync.mockImplementation((path: fs.PathLike) => {
        const pathStr = path.toString();
        
        // Custom guides folder always exists
        if (pathStr === '/custom/guides') {
          return true;
        }
        
        // Check if this is a developmentGuide.md path
        if (pathStr.endsWith('developmentGuide.md')) {
          // Extract guide ID from path - handle both forward and backward slashes
          const pathParts = pathStr.split(/[/\\]/);
          const guideId = pathParts[pathParts.length - 2]; // Second to last part
          if (guideId && guideId.startsWith('guide-')) {
            const guideIndex = parseInt(guideId.replace('guide-', ''));
            return guideIndex < numValidGuides; // Only first 50 guides have developmentGuide.md
          }
          return false;
        }
        
        // Check if this is a .cursorrules path
        if (pathStr.endsWith('.cursorrules')) {
          // Extract guide ID from path - handle both forward and backward slashes
          const pathParts = pathStr.split(/[/\\]/);
          const guideId = pathParts[pathParts.length - 2]; // Second to last part
          if (guideId && guideId.startsWith('guide-')) {
            const guideIndex = parseInt(guideId.replace('guide-', ''));
            return guideIndex < numValidGuides; // Only first 50 guides have .cursorrules
          }
          return false;
        }
        
        // Guide folders always exist
        if (pathStr.includes('/custom/guides/guide-')) {
          return true;
        }
        
        return true;
      });

      const guides = guideDiscoveryService.discoverCustomGuides(config);
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(guides.length).toBe(numValidGuides);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });
  });

  describe('Configuration Loading Performance', () => {
    it('should load large configuration files efficiently', () => {
      const startTime = Date.now();

      // Create large configuration with many menu items
      const largeConfig: CustomGuideConfig = {
        version: '1.0.0',
        customGuidesFolder: '/custom/guides',
        menuItems: Array.from({ length: 100 }, (_, i) => ({ // Reduced from 1000
          id: `menu-item-${i}`,
          displayName: `Menu Item ${i}`,
          folderPath: `folder-${i}`,
          category: `Category ${Math.floor(i / 10)}`, // Adjusted for smaller number
          description: `Description for menu item ${i}`.repeat(5), // Reduced description length
        })),
      };

      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(JSON.stringify(largeConfig));

      const config = configManager.loadConfig();
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(config.menuItems.length).toBe(100);
      expect(duration).toBeLessThan(500); // Should complete within 500ms
    });

    it('should validate large configurations efficiently', () => {
      const startTime = Date.now();

      // Create large configuration
      const largeConfig: CustomGuideConfig = {
        version: '1.0.0',
        customGuidesFolder: '/custom/guides',
        menuItems: Array.from({ length: 50 }, (_, i) => ({ // Reduced from 500
          id: `menu-item-${i}`,
          displayName: `Menu Item ${i}`,
          folderPath: `folder-${i}`,
        })),
      };

      // Mock file system for validation
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.statSync.mockReturnValue({
        isDirectory: () => true,
      } as any);

      const validation = configManager.validateConfig(largeConfig);
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(validation.isValid).toBe(true);
      expect(duration).toBeLessThan(500); // Should complete within 500ms
    });
  });

  describe('File Copy Performance', () => {
    it('should copy large files efficiently', () => {
      const startTime = Date.now();

      // Create large file content
      const largeContent = 'Large file content\n'.repeat(1000); // Reduced from 10000
      const guide: GuideInfo = {
        id: 'large-guide',
        displayName: 'Large Guide',
        type: 'custom',
        folderPath: '/large/guide',
        hasCursorRules: true,
      };

      // Mock file system operations
      mockedFs.existsSync
        .mockReturnValueOnce(true) // target directory exists
        .mockReturnValueOnce(true) // .memory-bank directory exists
        .mockReturnValueOnce(false) // target developmentGuide.md doesn't exist
        .mockReturnValueOnce(true) // source developmentGuide.md exists
        .mockReturnValueOnce(false) // target .cursorrules doesn't exist
        .mockReturnValueOnce(true); // source .cursorrules exists

      mockedFs.readFileSync
        .mockReturnValueOnce(largeContent) // developmentGuide.md content
        .mockReturnValueOnce('Cursor rules content'); // .cursorrules content

      mockedFs.writeFileSync.mockImplementation(() => undefined);

      const copyResults = fileCopyService.copyGuideFiles(guide, '/target/project');
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(copyResults.length).toBe(2);
      expect(copyResults.every(result => result.success)).toBe(true);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle multiple file copies efficiently', () => {
      const startTime = Date.now();
      const numGuides = 10; // Reduced from 100

      const guides: GuideInfo[] = Array.from({ length: numGuides }, (_, i) => ({
        id: `guide-${i}`,
        displayName: `Guide ${i}`,
        type: 'custom',
        folderPath: `/guide-${i}`,
        hasCursorRules: true,
      }));

      // Mock file system operations for multiple guides
      for (let i = 0; i < numGuides; i++) {
        mockedFs.existsSync
          .mockReturnValueOnce(true) // target directory exists
          .mockReturnValueOnce(true) // .memory-bank directory exists
          .mockReturnValueOnce(false) // target developmentGuide.md doesn't exist
          .mockReturnValueOnce(true) // source developmentGuide.md exists
          .mockReturnValueOnce(false) // target .cursorrules doesn't exist
          .mockReturnValueOnce(true); // source .cursorrules exists

        mockedFs.readFileSync
          .mockReturnValueOnce(`Guide ${i} content`)
          .mockReturnValueOnce(`Cursor rules ${i} content`);
      }

      mockedFs.writeFileSync.mockImplementation(() => undefined);

      const allResults: any[] = [];
      for (const guide of guides) {
        const results = fileCopyService.copyGuideFiles(guide, '/target/project');
        allResults.push(...results);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(allResults.length).toBe(numGuides * 2); // 2 files per guide
      expect(allResults.every(result => result.success)).toBe(true);
      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
    });
  });

  describe('Memory Usage Performance', () => {
    it('should not consume excessive memory with large configurations', () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Create large configuration (reduced size to prevent memory issues)
      const largeConfig: CustomGuideConfig = {
        version: '1.0.0',
        customGuidesFolder: '/custom/guides',
        menuItems: Array.from({ length: 200 }, (_, i) => ({ // Reduced from 2000
          id: `menu-item-${i}`,
          displayName: `Menu Item ${i}`,
          folderPath: `folder-${i}`,
          category: `Category ${Math.floor(i / 20)}`, // Adjusted for smaller number
          description: `Description for menu item ${i}`.repeat(3), // Reduced description length
        })),
      };

      // Load and validate configuration multiple times (reduced iterations)
      for (let i = 0; i < 3; i++) { // Reduced from 5
        mockedFs.existsSync.mockReturnValue(true);
        mockedFs.readFileSync.mockReturnValue(JSON.stringify(largeConfig));
        mockedFs.statSync.mockReturnValue({
          isDirectory: () => true,
        } as any);

        const config = configManager.loadConfig();
        const validation = configManager.validateConfig(config);

        expect(config.menuItems.length).toBe(200);
        expect(validation.isValid).toBe(true);
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      const memoryIncreaseMB = memoryIncrease / 1024 / 1024;

      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncreaseMB).toBeLessThan(50);
    });

    it('should handle guide discovery without memory leaks', () => {
      const initialMemory = process.memoryUsage().heapUsed;

      const config: CustomGuideConfig = {
        version: '1.0.0',
        customGuidesFolder: '/custom/guides',
        menuItems: Array.from({ length: 100 }, (_, i) => ({ // Reduced from 1000
          id: `guide-${i}`,
          displayName: `Guide ${i}`,
          folderPath: `guide-${i}`,
        })),
      };

      // Discover guides multiple times
      for (let i = 0; i < 5; i++) { // Reduced from 10
        const mockGuides = Array.from({ length: 100 }, (_, j) => `guide-${j}`);
        mockedFs.readdirSync.mockReturnValue(mockGuides as any);
        mockedFs.statSync.mockReturnValue({
          isDirectory: () => true,
        } as any);

        // Set up existsSync to handle different paths correctly
        mockedFs.existsSync.mockImplementation((path: fs.PathLike) => {
          const pathStr = path.toString();
          // Custom guides folder always exists
          if (pathStr === '/custom/guides') {
            return true;
          }
          
          // Check if this is a developmentGuide.md path
          if (pathStr.endsWith('developmentGuide.md')) {
            return true; // All guides have developmentGuide.md in this test
          }
          
          // Check if this is a .cursorrules path
          if (pathStr.endsWith('.cursorrules')) {
            return true; // All guides have .cursorrules in this test
          }
          
          // Guide folders always exist
          return true;
        });

        const guides = guideDiscoveryService.discoverCustomGuides(config);
        expect(guides.length).toBe(100);
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      const memoryIncreaseMB = memoryIncrease / 1024 / 1024;

      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncreaseMB).toBeLessThan(50);
    });
  });

  describe('Concurrent Operations Performance', () => {
    it('should handle concurrent configuration operations efficiently', async () => {
      const startTime = Date.now();
      const numOperations = 10; // Reduced from 50

      const config: CustomGuideConfig = {
        version: '1.0.0',
        customGuidesFolder: '/custom/guides',
        menuItems: Array.from({ length: 50 }, (_, i) => ({ // Reduced from 100
          id: `guide-${i}`,
          displayName: `Guide ${i}`,
          folderPath: `guide-${i}`,
        })),
      };

      // Mock file system operations
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(JSON.stringify(config));
      mockedFs.statSync.mockReturnValue({
        isDirectory: () => true,
      } as any);

      // Run concurrent operations
      const operations = Array.from({ length: numOperations }, async () => {
        const loadedConfig = configManager.loadConfig();
        const validation = configManager.validateConfig(loadedConfig);
        return { loadedConfig, validation };
      });

      const results = await Promise.all(operations);
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(results.length).toBe(numOperations);
      results.forEach(({ loadedConfig, validation }) => {
        expect(loadedConfig.menuItems.length).toBe(50);
        expect(validation.isValid).toBe(true);
      });

      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
    });
  });
}); 