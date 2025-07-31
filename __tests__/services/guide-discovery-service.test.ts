import * as fs from 'fs';
import * as path from 'path';
import { GuideDiscoveryService } from '../../src/services/guide-discovery-service';
import { CustomGuideConfig, GuideInfo } from '../../src/config/types';

// Mock fs module
jest.mock('fs');
const mockedFs = fs as jest.Mocked<typeof fs>;

describe('GuideDiscoveryService', () => {
  let guideDiscoveryService: GuideDiscoveryService;

  beforeEach(() => {
    guideDiscoveryService = new GuideDiscoveryService();
    jest.clearAllMocks();
    // Reset all mocks to their default behavior
    mockedFs.existsSync.mockReset();
    mockedFs.readFileSync.mockReset();
    mockedFs.writeFileSync.mockReset();
    mockedFs.mkdirSync.mockReset();
    mockedFs.statSync.mockReset();
    mockedFs.readdirSync.mockReset();
    mockedFs.accessSync.mockReset();
  });

  describe('discoverBuiltInGuides', () => {
    it('should return built-in guides', () => {
      const guides = guideDiscoveryService.discoverBuiltInGuides();

      expect(guides).toHaveLength(3);
      expect(guides[0].id).toBe('web');
      expect(guides[0].type).toBe('built-in');
      expect(guides[1].id).toBe('java');
      expect(guides[1].type).toBe('built-in');
      expect(guides[2].id).toBe('lua');
      expect(guides[2].type).toBe('built-in');
    });
  });

  describe('discoverCustomGuides', () => {
    it('should discover custom guides successfully', () => {
      const config: CustomGuideConfig = {
        version: '1.0.0',
        customGuidesFolder: '/custom/guides',
        menuItems: [
          {
            id: 'test-guide',
            displayName: 'Test Guide',
            folderPath: 'test-guide',
          },
        ],
      };

      // Mock file system operations
      mockedFs.existsSync.mockImplementation((path) => {
        const pathStr = path.toString();
        if (pathStr === '/custom/guides') {
          return true; // custom guides folder exists
        }
        if (pathStr.includes('developmentGuide.md')) {
          return true; // developmentGuide.md exists
        }
        if (pathStr.includes('.cursorrules')) {
          return true; // .cursorrules exists
        }
        return false;
      });
      mockedFs.statSync.mockReturnValue({
        isDirectory: () => true,
      } as any);
      mockedFs.readdirSync.mockReturnValue(['test-guide'] as any);

      const guides = guideDiscoveryService.discoverCustomGuides(config);

      expect(guides).toHaveLength(1);
      expect(guides[0].id).toBe('test-guide');
      expect(guides[0].displayName).toBe('Test Guide');
      expect(guides[0].type).toBe('custom');
      expect(guides[0].hasCursorRules).toBe(true);
    });

    it('should return empty array when custom guides folder does not exist', () => {
      const config: CustomGuideConfig = {
        version: '1.0.0',
        customGuidesFolder: '/non/existent',
        menuItems: [],
      };

      mockedFs.existsSync.mockReturnValue(false);

      const guides = guideDiscoveryService.discoverCustomGuides(config);

      expect(guides).toHaveLength(0);
    });

    it('should return empty array when custom guides folder is not a directory', () => {
      const config: CustomGuideConfig = {
        version: '1.0.0',
        customGuidesFolder: '/custom/guides',
        menuItems: [],
      };

      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.statSync.mockReturnValue({
        isDirectory: () => false,
      } as any);

      const guides = guideDiscoveryService.discoverCustomGuides(config);

      expect(guides).toHaveLength(0);
    });

    it('should handle errors gracefully and return empty array', () => {
      const config: CustomGuideConfig = {
        version: '1.0.0',
        customGuidesFolder: '/custom/guides',
        menuItems: [],
      };

      mockedFs.existsSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const guides = guideDiscoveryService.discoverCustomGuides(config);

      expect(guides).toHaveLength(0);
    });

    it('should skip guides without developmentGuide.md', () => {
      const config: CustomGuideConfig = {
        version: '1.0.0',
        customGuidesFolder: '/custom/guides',
        menuItems: [],
      };

      // Mock file system operations
      mockedFs.existsSync
        .mockReturnValueOnce(true) // custom guides folder exists
        .mockReturnValueOnce(true) // item is directory
        .mockReturnValueOnce(false); // developmentGuide.md does not exist
      mockedFs.statSync.mockReturnValue({
        isDirectory: () => true,
      } as any);
      mockedFs.readdirSync.mockReturnValue(['invalid-guide'] as any);

      const guides = guideDiscoveryService.discoverCustomGuides(config);

      expect(guides).toHaveLength(0);
    });

    it('should handle individual guide processing errors gracefully', () => {
      const config: CustomGuideConfig = {
        version: '1.0.0',
        customGuidesFolder: '/custom/guides',
        menuItems: [],
      };

      // Mock file system operations
      mockedFs.existsSync
        .mockReturnValueOnce(true) // custom guides folder exists
        .mockReturnValueOnce(true) // item is directory
        .mockReturnValueOnce(true) // developmentGuide.md exists
        .mockReturnValueOnce(true); // .cursorrules exists
      mockedFs.statSync
        .mockReturnValueOnce({
          isDirectory: () => true,
        } as any) // folder is directory
        .mockImplementation(() => {
          throw new Error('Permission denied');
        }); // item stat fails
      mockedFs.readdirSync.mockReturnValue(['problematic-guide'] as any);

      const guides = guideDiscoveryService.discoverCustomGuides(config);

      expect(guides).toHaveLength(0);
    });
  });

  describe('validateGuide', () => {
    it('should validate guide structure', () => {
      const guidePath = '/test/guide';

      // Mock validation to return success
      const result = guideDiscoveryService.validateGuide(guidePath);

      expect(result).toBeDefined();
      expect(typeof result.isValid).toBe('boolean');
    });
  });

  describe('getAllGuides', () => {
    it('should combine built-in and custom guides', () => {
      const config: CustomGuideConfig = {
        version: '1.0.0',
        customGuidesFolder: '/custom/guides',
        menuItems: [],
      };

      // Mock custom guides discovery
      mockedFs.existsSync.mockReturnValue(false); // no custom guides folder

      const guides = guideDiscoveryService.getAllGuides(config);

      expect(guides).toHaveLength(3); // only built-in guides
      expect(guides.every(guide => guide.type === 'built-in')).toBe(true);
    });
  });

  describe('isGuideAccessible', () => {
    it('should return true for accessible guide', () => {
      const guide: GuideInfo = {
        id: 'test-guide',
        displayName: 'Test Guide',
        type: 'custom',
        folderPath: '/test/guide',
        hasCursorRules: false,
      };

      // Mock file system operations
      mockedFs.existsSync
        .mockReturnValueOnce(true) // guide folder exists
        .mockReturnValueOnce(true); // developmentGuide.md exists
      mockedFs.statSync.mockReturnValue({
        isDirectory: () => true,
      } as any);
      mockedFs.accessSync.mockImplementation(() => undefined);

      const isAccessible = guideDiscoveryService.isGuideAccessible(guide);

      expect(isAccessible).toBe(true);
    });

    it('should return false when guide folder does not exist', () => {
      const guide: GuideInfo = {
        id: 'test-guide',
        displayName: 'Test Guide',
        type: 'custom',
        folderPath: '/test/guide',
        hasCursorRules: false,
      };

      mockedFs.existsSync.mockReturnValue(false);

      const isAccessible = guideDiscoveryService.isGuideAccessible(guide);

      expect(isAccessible).toBe(false);
    });

    it('should return false when guide folder is not a directory', () => {
      const guide: GuideInfo = {
        id: 'test-guide',
        displayName: 'Test Guide',
        type: 'custom',
        folderPath: '/test/guide',
        hasCursorRules: false,
      };

      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.statSync.mockReturnValue({
        isDirectory: () => false,
      } as any);

      const isAccessible = guideDiscoveryService.isGuideAccessible(guide);

      expect(isAccessible).toBe(false);
    });

    it('should return false when developmentGuide.md does not exist', () => {
      const guide: GuideInfo = {
        id: 'test-guide',
        displayName: 'Test Guide',
        type: 'custom',
        folderPath: '/test/guide',
        hasCursorRules: false,
      };

      mockedFs.existsSync
        .mockReturnValueOnce(true) // guide folder exists
        .mockReturnValueOnce(false); // developmentGuide.md does not exist
      mockedFs.statSync.mockReturnValue({
        isDirectory: () => true,
      } as any);

      const isAccessible = guideDiscoveryService.isGuideAccessible(guide);

      expect(isAccessible).toBe(false);
    });

    it('should return false when developmentGuide.md is not readable', () => {
      const guide: GuideInfo = {
        id: 'test-guide',
        displayName: 'Test Guide',
        type: 'custom',
        folderPath: '/test/guide',
        hasCursorRules: false,
      };

      mockedFs.existsSync
        .mockReturnValueOnce(true) // guide folder exists
        .mockReturnValueOnce(true); // developmentGuide.md exists
      mockedFs.statSync.mockReturnValue({
        isDirectory: () => true,
      } as any);
      mockedFs.accessSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const isAccessible = guideDiscoveryService.isGuideAccessible(guide);

      expect(isAccessible).toBe(false);
    });
  });

  describe('getGuideInfo', () => {
    it('should return guide info for valid guide path', () => {
      const guidePath = '/test/guide';

      // Mock file system operations
      mockedFs.existsSync.mockImplementation((path) => {
        const pathStr = path.toString();
        if (pathStr === '/test/guide') {
          return true; // guide folder exists
        }
        if (pathStr.includes('developmentGuide.md')) {
          return true; // developmentGuide.md exists
        }
        if (pathStr.includes('.cursorrules')) {
          return false; // .cursorrules does not exist
        }
        return false;
      });
      mockedFs.statSync.mockReturnValue({
        isDirectory: () => true,
      } as any);

      const guideInfo = guideDiscoveryService.getGuideInfo(guidePath);

      expect(guideInfo).not.toBeNull();
      expect(guideInfo?.id).toBe('guide');
      expect(guideInfo?.displayName).toBe('guide');
      expect(guideInfo?.type).toBe('custom');
      expect(guideInfo?.folderPath).toBe(guidePath);
    });

    it('should return null when guide path does not exist', () => {
      const guidePath = '/test/guide';

      mockedFs.existsSync.mockReturnValue(false);

      const guideInfo = guideDiscoveryService.getGuideInfo(guidePath);

      expect(guideInfo).toBeNull();
    });

    it('should return null when guide path is not a directory', () => {
      const guidePath = '/test/guide';

      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.statSync.mockReturnValue({
        isDirectory: () => false,
      } as any);

      const guideInfo = guideDiscoveryService.getGuideInfo(guidePath);

      expect(guideInfo).toBeNull();
    });

    it('should return null when developmentGuide.md does not exist', () => {
      const guidePath = '/test/guide';

      mockedFs.existsSync
        .mockReturnValueOnce(true) // guide folder exists
        .mockReturnValueOnce(false); // developmentGuide.md does not exist
      mockedFs.statSync.mockReturnValue({
        isDirectory: () => true,
      } as any);

      const guideInfo = guideDiscoveryService.getGuideInfo(guidePath);

      expect(guideInfo).toBeNull();
    });

    it('should handle errors gracefully and return null', () => {
      const guidePath = '/test/guide';

      mockedFs.existsSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const guideInfo = guideDiscoveryService.getGuideInfo(guidePath);

      expect(guideInfo).toBeNull();
    });
  });
}); 