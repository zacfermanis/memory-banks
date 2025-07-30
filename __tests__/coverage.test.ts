import * as fs from 'fs';
import * as path from 'path';

// Mock inquirer
jest.mock('inquirer', () => ({
  prompt: jest.fn(),
}));

// Mock fs
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  copyFileSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
}));

// Mock the services
jest.mock('../src/config/configuration-manager');
jest.mock('../src/services/guide-discovery-service');
jest.mock('../src/services/file-copy-service');

// Import after mocking
import inquirer from 'inquirer';
import { ConfigurationManager } from '../src/config/configuration-manager';
import { GuideDiscoveryService } from '../src/services/guide-discovery-service';
import { FileCopyService } from '../src/services/file-copy-service';

describe('Main Function Coverage Testing', () => {
  let mockPrompt: jest.MockedFunction<typeof inquirer.prompt>;
  let mockExistsSync: jest.MockedFunction<typeof fs.existsSync>;
  let mockMkdirSync: jest.MockedFunction<typeof fs.mkdirSync>;
  let mockCopyFileSync: jest.MockedFunction<typeof fs.copyFileSync>;
  let mockConsoleLog: jest.SpyInstance;
  let mockConsoleError: jest.SpyInstance;
  let mockProcessCwd: jest.SpyInstance;
  let mockProcessExit: jest.SpyInstance;
  let mockConfigManager: jest.Mocked<ConfigurationManager>;
  let mockGuideDiscoveryService: jest.Mocked<GuideDiscoveryService>;
  let mockFileCopyService: jest.Mocked<FileCopyService>;

  beforeEach(() => {
    // Get mocked functions
    mockPrompt = inquirer.prompt as jest.MockedFunction<typeof inquirer.prompt>;
    mockExistsSync = fs.existsSync as jest.MockedFunction<typeof fs.existsSync>;
    mockMkdirSync = fs.mkdirSync as jest.MockedFunction<typeof fs.mkdirSync>;
    mockCopyFileSync = fs.copyFileSync as jest.MockedFunction<typeof fs.copyFileSync>;

    // Mock console and process
    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
    mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
    mockProcessCwd = jest.spyOn(process, 'cwd').mockReturnValue('/test/project');
    mockProcessExit = jest.spyOn(process, 'exit').mockImplementation();

    // Mock services
    mockConfigManager = {
      loadConfig: jest.fn(),
      validateConfig: jest.fn(),
      getDefaultConfig: jest.fn(),
    } as any;

    mockGuideDiscoveryService = {
      discoverBuiltInGuides: jest.fn(),
      discoverCustomGuides: jest.fn(),
    } as any;

    mockFileCopyService = {
      copyGuideFilesWithBackup: jest.fn(),
    } as any;

    // Mock service constructors
    (ConfigurationManager as jest.MockedClass<typeof ConfigurationManager>).mockImplementation(() => mockConfigManager);
    (GuideDiscoveryService as jest.MockedClass<typeof GuideDiscoveryService>).mockImplementation(() => mockGuideDiscoveryService);
    (FileCopyService as jest.MockedClass<typeof FileCopyService>).mockImplementation(() => mockFileCopyService);

    // Reset mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Import the main function
  const { main } = require('../src/index');

  describe('Successful execution paths', () => {
    it('should successfully execute lua memory bank setup', async () => {
      // Mock successful configuration loading
      mockConfigManager.loadConfig.mockReturnValue({
        version: '1.0.0',
        customGuidesFolder: '/custom/guides',
        menuItems: []
      });
      mockConfigManager.validateConfig.mockReturnValue({ isValid: true });

      // Mock guide discovery
      mockGuideDiscoveryService.discoverBuiltInGuides.mockReturnValue([
        {
          id: 'lua',
          displayName: 'Lua - For Lua/Love2D game development',
          type: 'built-in',
          folderPath: path.join(__dirname, '..', 'src', 'developmentGuides', 'Lua'),
          hasCursorRules: true,
        }
      ]);
      mockGuideDiscoveryService.discoverCustomGuides.mockReturnValue([]);

      // Mock file system operations
      mockExistsSync
        .mockReturnValueOnce(false) // .memory-bank does not exist
        .mockReturnValueOnce(false); // .specs does not exist

      // Mock file copy service
      mockFileCopyService.copyGuideFilesWithBackup.mockReturnValue([
        {
          success: true,
          copiedFilePath: path.join('/test/project', '.memory-bank', 'developmentGuide.md'),
          overwritten: false,
        },
        {
          success: true,
          copiedFilePath: path.join('/test/project', '.cursorrules'),
          overwritten: false,
        }
      ]);

      mockPrompt.mockResolvedValue({ selectedGuideId: 'lua' });

      await main();

      expect(mockConsoleLog).toHaveBeenCalledWith('🚀 Memory Bank Initializer');
      expect(mockConsoleLog).toHaveBeenCalledWith('==========================\n');
      expect(mockConsoleLog).toHaveBeenCalledWith('📋 Loading configuration...');
      expect(mockConsoleLog).toHaveBeenCalledWith('✅ Configuration loaded successfully');
      expect(mockConsoleLog).toHaveBeenCalledWith('🔍 Discovering development guides...');
      expect(mockConsoleLog).toHaveBeenCalledWith('✅ Found 1 built-in guides');
      expect(mockConsoleLog).toHaveBeenCalledWith('ℹ️  No custom guides found');
      expect(mockConsoleLog).toHaveBeenCalledWith('\n📦 Installing Lua - For Lua/Love2D game development Memory Bank...\n');
      expect(mockConsoleLog).toHaveBeenCalledWith('📁 Creating project directories...');
      expect(mockConsoleLog).toHaveBeenCalledWith('✅ Created .memory-bank directory');
      expect(mockConsoleLog).toHaveBeenCalledWith('✅ Created .specs directory');
      expect(mockConsoleLog).toHaveBeenCalledWith('📄 Copying guide files...');
      expect(mockConsoleLog).toHaveBeenCalledWith('✅ File copy operations completed successfully:');
      expect(mockConsoleLog).toHaveBeenCalledWith('   📖 Copied development guide to .memory-bank directory');
      expect(mockConsoleLog).toHaveBeenCalledWith('   ⚙️  Copied .cursorrules to project root');
      expect(mockConsoleLog).toHaveBeenCalledWith('\n🎉 Memory Bank setup complete!');

      expect(mockMkdirSync).toHaveBeenCalledWith(
        path.join('/test/project', '.memory-bank'),
        { recursive: true }
      );
      expect(mockMkdirSync).toHaveBeenCalledWith(
        path.join('/test/project', '.specs'),
        { recursive: true }
      );
    });

    it('should successfully execute web memory bank setup', async () => {
      // Mock successful configuration loading
      mockConfigManager.loadConfig.mockReturnValue({
        version: '1.0.0',
        customGuidesFolder: '/custom/guides',
        menuItems: []
      });
      mockConfigManager.validateConfig.mockReturnValue({ isValid: true });

      // Mock guide discovery
      mockGuideDiscoveryService.discoverBuiltInGuides.mockReturnValue([
        {
          id: 'web',
          displayName: 'Web - For TypeScript/React/Next.js development',
          type: 'built-in',
          folderPath: path.join(__dirname, '..', 'src', 'developmentGuides', 'Web'),
          hasCursorRules: true,
        }
      ]);
      mockGuideDiscoveryService.discoverCustomGuides.mockReturnValue([]);

      // Mock file system operations
      mockExistsSync
        .mockReturnValueOnce(false) // .memory-bank does not exist
        .mockReturnValueOnce(false); // .specs does not exist

      // Mock file copy service
      mockFileCopyService.copyGuideFilesWithBackup.mockReturnValue([
        {
          success: true,
          copiedFilePath: path.join('/test/project', '.memory-bank', 'developmentGuide.md'),
          overwritten: false,
        },
        {
          success: true,
          copiedFilePath: path.join('/test/project', '.cursorrules'),
          overwritten: false,
        }
      ]);

      mockPrompt.mockResolvedValue({ selectedGuideId: 'web' });

      await main();

      expect(mockConsoleLog).toHaveBeenCalledWith('\n📦 Installing Web - For TypeScript/React/Next.js development Memory Bank...\n');
    });

    it('should skip directory creation when directories already exist', async () => {
      // Mock successful configuration loading
      mockConfigManager.loadConfig.mockReturnValue({
        version: '1.0.0',
        customGuidesFolder: '/custom/guides',
        menuItems: []
      });
      mockConfigManager.validateConfig.mockReturnValue({ isValid: true });

      // Mock guide discovery
      mockGuideDiscoveryService.discoverBuiltInGuides.mockReturnValue([
        {
          id: 'lua',
          displayName: 'Lua - For Lua/Love2D game development',
          type: 'built-in',
          folderPath: path.join(__dirname, '..', 'src', 'developmentGuides', 'Lua'),
          hasCursorRules: true,
        }
      ]);
      mockGuideDiscoveryService.discoverCustomGuides.mockReturnValue([]);

      // Mock file system operations - directories already exist
      mockExistsSync
        .mockReturnValueOnce(true) // .memory-bank exists
        .mockReturnValueOnce(true); // .specs exists

      // Mock file copy service
      mockFileCopyService.copyGuideFilesWithBackup.mockReturnValue([
        {
          success: true,
          copiedFilePath: path.join('/test/project', '.memory-bank', 'developmentGuide.md'),
          overwritten: false,
        },
        {
          success: true,
          copiedFilePath: path.join('/test/project', '.cursorrules'),
          overwritten: false,
        }
      ]);

      mockPrompt.mockResolvedValue({ selectedGuideId: 'lua' });

      await main();

      expect(mockMkdirSync).not.toHaveBeenCalled();
      expect(mockConsoleLog).toHaveBeenCalledWith('ℹ️  .memory-bank directory already exists');
      expect(mockConsoleLog).toHaveBeenCalledWith('ℹ️  .specs directory already exists');
    });
  });

  describe('Error handling paths', () => {
    it('should handle unknown memory bank type', async () => {
      // Mock successful configuration loading
      mockConfigManager.loadConfig.mockReturnValue({
        version: '1.0.0',
        customGuidesFolder: '/custom/guides',
        menuItems: []
      });
      mockConfigManager.validateConfig.mockReturnValue({ isValid: true });

      // Mock guide discovery
      mockGuideDiscoveryService.discoverBuiltInGuides.mockReturnValue([
        {
          id: 'lua',
          displayName: 'Lua - For Lua/Love2D game development',
          type: 'built-in',
          folderPath: path.join(__dirname, '..', 'src', 'developmentGuides', 'Lua'),
          hasCursorRules: true,
        }
      ]);
      mockGuideDiscoveryService.discoverCustomGuides.mockReturnValue([]);

      mockPrompt.mockResolvedValue({ selectedGuideId: 'unknown' });

      await main();

      expect(mockConsoleError).toHaveBeenCalledWith('\n❌ Error:', 'Selected guide not found: unknown. Please try again.');
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });

    it('should handle missing cursor rules file', async () => {
      // Mock successful configuration loading
      mockConfigManager.loadConfig.mockReturnValue({
        version: '1.0.0',
        customGuidesFolder: '/custom/guides',
        menuItems: []
      });
      mockConfigManager.validateConfig.mockReturnValue({ isValid: true });

      // Mock guide discovery
      mockGuideDiscoveryService.discoverBuiltInGuides.mockReturnValue([
        {
          id: 'lua',
          displayName: 'Lua - For Lua/Love2D game development',
          type: 'built-in',
          folderPath: path.join(__dirname, '..', 'src', 'developmentGuides', 'Lua'),
          hasCursorRules: true,
        }
      ]);
      mockGuideDiscoveryService.discoverCustomGuides.mockReturnValue([]);

      // Mock file system operations
      mockExistsSync
        .mockReturnValueOnce(false) // .memory-bank does not exist
        .mockReturnValueOnce(false); // .specs does not exist

      // Mock file copy service failure
      mockFileCopyService.copyGuideFilesWithBackup.mockReturnValue([
        {
          success: false,
          error: 'Source file not found: /source/cursorrules/.cursorrules',
        }
      ]);

      mockPrompt.mockResolvedValue({ selectedGuideId: 'lua' });

      await main();

      expect(mockConsoleError).toHaveBeenCalledWith('\n❌ Some files failed to copy:');
      expect(mockConsoleError).toHaveBeenCalledWith('   - Source file not found: /source/cursorrules/.cursorrules');
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });

    it('should handle missing development guide file', async () => {
      // Mock successful configuration loading
      mockConfigManager.loadConfig.mockReturnValue({
        version: '1.0.0',
        customGuidesFolder: '/custom/guides',
        menuItems: []
      });
      mockConfigManager.validateConfig.mockReturnValue({ isValid: true });

      // Mock guide discovery
      mockGuideDiscoveryService.discoverBuiltInGuides.mockReturnValue([
        {
          id: 'web',
          displayName: 'Web - For TypeScript/React/Next.js development',
          type: 'built-in',
          folderPath: path.join(__dirname, '..', 'src', 'developmentGuides', 'Web'),
          hasCursorRules: true,
        }
      ]);
      mockGuideDiscoveryService.discoverCustomGuides.mockReturnValue([]);

      // Mock file system operations
      mockExistsSync
        .mockReturnValueOnce(false) // .memory-bank does not exist
        .mockReturnValueOnce(false); // .specs does not exist

      // Mock file copy service failure
      mockFileCopyService.copyGuideFilesWithBackup.mockReturnValue([
        {
          success: false,
          error: 'Source file not found: /source/developmentGuides/Web/developmentGuide.md',
        }
      ]);

      mockPrompt.mockResolvedValue({ selectedGuideId: 'web' });

      await main();

      expect(mockConsoleError).toHaveBeenCalledWith('\n❌ Some files failed to copy:');
      expect(mockConsoleError).toHaveBeenCalledWith('   - Source file not found: /source/developmentGuides/Web/developmentGuide.md');
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });
  });

  describe('Path construction testing', () => {
    it('should construct correct paths for lua memory bank', async () => {
      // Mock successful configuration loading
      mockConfigManager.loadConfig.mockReturnValue({
        version: '1.0.0',
        customGuidesFolder: '/custom/guides',
        menuItems: []
      });
      mockConfigManager.validateConfig.mockReturnValue({ isValid: true });

      // Mock guide discovery
      mockGuideDiscoveryService.discoverBuiltInGuides.mockReturnValue([
        {
          id: 'lua',
          displayName: 'Lua - For Lua/Love2D game development',
          type: 'built-in',
          folderPath: path.join(__dirname, '..', 'src', 'developmentGuides', 'Lua'),
          hasCursorRules: true,
        }
      ]);
      mockGuideDiscoveryService.discoverCustomGuides.mockReturnValue([]);

      // Mock file system operations
      mockExistsSync
        .mockReturnValueOnce(false) // .memory-bank does not exist
        .mockReturnValueOnce(false); // .specs does not exist

      // Mock file copy service
      mockFileCopyService.copyGuideFilesWithBackup.mockReturnValue([
        {
          success: true,
          copiedFilePath: path.join('/test/project', '.memory-bank', 'developmentGuide.md'),
          overwritten: false,
        },
        {
          success: true,
          copiedFilePath: path.join('/test/project', '.cursorrules'),
          overwritten: false,
        }
      ]);

      mockPrompt.mockResolvedValue({ selectedGuideId: 'lua' });

      await main();

      expect(mockFileCopyService.copyGuideFilesWithBackup).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'lua',
          folderPath: path.join(__dirname, '..', 'src', 'developmentGuides', 'Lua'),
        }),
        '/test/project'
      );
    });

    it('should construct correct paths for web memory bank', async () => {
      // Mock successful configuration loading
      mockConfigManager.loadConfig.mockReturnValue({
        version: '1.0.0',
        customGuidesFolder: '/custom/guides',
        menuItems: []
      });
      mockConfigManager.validateConfig.mockReturnValue({ isValid: true });

      // Mock guide discovery
      mockGuideDiscoveryService.discoverBuiltInGuides.mockReturnValue([
        {
          id: 'web',
          displayName: 'Web - For TypeScript/React/Next.js development',
          type: 'built-in',
          folderPath: path.join(__dirname, '..', 'src', 'developmentGuides', 'Web'),
          hasCursorRules: true,
        }
      ]);
      mockGuideDiscoveryService.discoverCustomGuides.mockReturnValue([]);

      // Mock file system operations
      mockExistsSync
        .mockReturnValueOnce(false) // .memory-bank does not exist
        .mockReturnValueOnce(false); // .specs does not exist

      // Mock file copy service
      mockFileCopyService.copyGuideFilesWithBackup.mockReturnValue([
        {
          success: true,
          copiedFilePath: path.join('/test/project', '.memory-bank', 'developmentGuide.md'),
          overwritten: false,
        },
        {
          success: true,
          copiedFilePath: path.join('/test/project', '.cursorrules'),
          overwritten: false,
        }
      ]);

      mockPrompt.mockResolvedValue({ selectedGuideId: 'web' });

      await main();

      expect(mockFileCopyService.copyGuideFilesWithBackup).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'web',
          folderPath: path.join(__dirname, '..', 'src', 'developmentGuides', 'Web'),
        }),
        '/test/project'
      );
    });
  });

  describe('File system operation testing', () => {
    it('should create directories with correct paths', async () => {
      // Mock successful configuration loading
      mockConfigManager.loadConfig.mockReturnValue({
        version: '1.0.0',
        customGuidesFolder: '/custom/guides',
        menuItems: []
      });
      mockConfigManager.validateConfig.mockReturnValue({ isValid: true });

      // Mock guide discovery
      mockGuideDiscoveryService.discoverBuiltInGuides.mockReturnValue([
        {
          id: 'lua',
          displayName: 'Lua - For Lua/Love2D game development',
          type: 'built-in',
          folderPath: path.join(__dirname, '..', 'src', 'developmentGuides', 'Lua'),
          hasCursorRules: true,
        }
      ]);
      mockGuideDiscoveryService.discoverCustomGuides.mockReturnValue([]);

      // Mock file system operations
      mockExistsSync
        .mockReturnValueOnce(false) // .memory-bank does not exist
        .mockReturnValueOnce(false); // .specs does not exist

      // Mock file copy service
      mockFileCopyService.copyGuideFilesWithBackup.mockReturnValue([
        {
          success: true,
          copiedFilePath: path.join('/test/project', '.memory-bank', 'developmentGuide.md'),
          overwritten: false,
        },
        {
          success: true,
          copiedFilePath: path.join('/test/project', '.cursorrules'),
          overwritten: false,
        }
      ]);

      mockPrompt.mockResolvedValue({ selectedGuideId: 'lua' });

      await main();

      expect(mockMkdirSync).toHaveBeenCalledWith(
        path.join('/test/project', '.memory-bank'),
        { recursive: true }
      );
      expect(mockMkdirSync).toHaveBeenCalledWith(
        path.join('/test/project', '.specs'),
        { recursive: true }
      );
    });

    it('should copy files to correct destinations', async () => {
      // Mock successful configuration loading
      mockConfigManager.loadConfig.mockReturnValue({
        version: '1.0.0',
        customGuidesFolder: '/custom/guides',
        menuItems: []
      });
      mockConfigManager.validateConfig.mockReturnValue({ isValid: true });

      // Mock guide discovery
      mockGuideDiscoveryService.discoverBuiltInGuides.mockReturnValue([
        {
          id: 'lua',
          displayName: 'Lua - For Lua/Love2D game development',
          type: 'built-in',
          folderPath: path.join(__dirname, '..', 'src', 'developmentGuides', 'Lua'),
          hasCursorRules: true,
        }
      ]);
      mockGuideDiscoveryService.discoverCustomGuides.mockReturnValue([]);

      // Mock file system operations
      mockExistsSync
        .mockReturnValueOnce(false) // .memory-bank does not exist
        .mockReturnValueOnce(false); // .specs does not exist

      // Mock file copy service
      mockFileCopyService.copyGuideFilesWithBackup.mockReturnValue([
        {
          success: true,
          copiedFilePath: path.join('/test/project', '.memory-bank', 'developmentGuide.md'),
          overwritten: false,
        },
        {
          success: true,
          copiedFilePath: path.join('/test/project', '.cursorrules'),
          overwritten: false,
        }
      ]);

      mockPrompt.mockResolvedValue({ selectedGuideId: 'lua' });

      await main();

      expect(mockFileCopyService.copyGuideFilesWithBackup).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'lua',
          folderPath: path.join(__dirname, '..', 'src', 'developmentGuides', 'Lua'),
        }),
        '/test/project'
      );
    });
  });

  describe('Console output testing', () => {
    it('should output all expected console messages for successful execution', async () => {
      // Mock successful configuration loading
      mockConfigManager.loadConfig.mockReturnValue({
        version: '1.0.0',
        customGuidesFolder: '/custom/guides',
        menuItems: []
      });
      mockConfigManager.validateConfig.mockReturnValue({ isValid: true });

      // Mock guide discovery
      mockGuideDiscoveryService.discoverBuiltInGuides.mockReturnValue([
        {
          id: 'lua',
          displayName: 'Lua - For Lua/Love2D game development',
          type: 'built-in',
          folderPath: path.join(__dirname, '..', 'src', 'developmentGuides', 'Lua'),
          hasCursorRules: true,
        }
      ]);
      mockGuideDiscoveryService.discoverCustomGuides.mockReturnValue([]);

      // Mock file system operations
      mockExistsSync
        .mockReturnValueOnce(false) // .memory-bank does not exist
        .mockReturnValueOnce(false); // .specs does not exist

      // Mock file copy service
      mockFileCopyService.copyGuideFilesWithBackup.mockReturnValue([
        {
          success: true,
          copiedFilePath: path.join('/test/project', '.memory-bank', 'developmentGuide.md'),
          overwritten: false,
        },
        {
          success: true,
          copiedFilePath: path.join('/test/project', '.cursorrules'),
          overwritten: false,
        }
      ]);

      mockPrompt.mockResolvedValue({ selectedGuideId: 'lua' });

      await main();

      const expectedCalls = [
        '🚀 Memory Bank Initializer',
        '==========================\n',
        '📋 Loading configuration...',
        '✅ Configuration loaded successfully',
        '🔍 Discovering development guides...',
        '✅ Found 1 built-in guides',
        'ℹ️  No custom guides found',
        '\n📦 Installing Lua - For Lua/Love2D game development Memory Bank...\n',
        '📁 Creating project directories...',
        '✅ Created .memory-bank directory',
        '✅ Created .specs directory',
        '📄 Copying guide files...',
        '✅ File copy operations completed successfully:',
        '   📖 Copied development guide to .memory-bank directory',
        '   ⚙️  Copied .cursorrules to project root',
        '\n🎉 Memory Bank setup complete!',
        '\n📁 Project structure:',
        '   📂 .memory-bank/ (contains developmentGuide.md)',
        '   📂 .specs/ (for feature specifications)',
        '   📄 .cursorrules (project-specific rules)',
        '\n🚀 You can now start using your Memory Bank!',
        '\n📋 Next steps:',
        '   1. Review the developmentGuide.md file in .memory-bank/',
        '   2. Customize the .cursorrules file for your project',
        '   3. Start using the memory bank in your development workflow',
        '   4. Create feature specifications in the .specs/ directory'
      ];

      expectedCalls.forEach(expectedCall => {
        expect(mockConsoleLog).toHaveBeenCalledWith(expectedCall);
      });
    });

    it('should output error messages correctly', async () => {
      // Mock configuration loading failure
      mockConfigManager.loadConfig.mockImplementation(() => {
        throw new Error('Config error');
      });

      await main();

      expect(mockConsoleError).toHaveBeenCalledWith('\n❌ Error:', 'Cannot read properties of undefined (reading \'length\')');
    });
  });
}); 