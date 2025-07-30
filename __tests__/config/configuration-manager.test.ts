import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { ConfigurationManager } from '../../src/config/configuration-manager';
import { CustomGuideConfig } from '../../src/config/types';

// Mock fs and os modules
jest.mock('fs');
jest.mock('os');
const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedOs = os as jest.Mocked<typeof os>;

describe('ConfigurationManager', () => {
  let configManager: ConfigurationManager;
  const mockHomeDir = '/mock/home';
  const mockConfigDir = path.join(mockHomeDir, '.memory-bank');
  const mockConfigPath = path.join(mockConfigDir, 'config.json');
  const mockBackupPath = path.join(mockConfigDir, 'config.backup.json');

  beforeEach(() => {
    mockedOs.homedir.mockReturnValue(mockHomeDir);
    configManager = new ConfigurationManager();
    jest.clearAllMocks();
  });

  describe('getDefaultConfig', () => {
    it('should return default configuration', () => {
      const config = configManager.getDefaultConfig();

      expect(config.version).toBe('1.0.0');
      expect(config.customGuidesFolder).toBe(path.join(mockHomeDir, 'custom-dev-guides'));
      expect(config.menuItems).toEqual([]);
    });
  });

  describe('loadConfig', () => {
    it('should return default config when config file does not exist', () => {
      mockedFs.existsSync.mockReturnValue(false);

      const config = configManager.loadConfig();

      expect(config.version).toBe('1.0.0');
      expect(config.customGuidesFolder).toBe(path.join(mockHomeDir, 'custom-dev-guides'));
      expect(config.menuItems).toEqual([]);
    });

    it('should load valid configuration from file', () => {
      const validConfig: CustomGuideConfig = {
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

      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(JSON.stringify(validConfig));

      const config = configManager.loadConfig();

      expect(config).toEqual(validConfig);
    });

    it('should return default config when config file is invalid JSON', () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue('invalid json');

      const config = configManager.loadConfig();

      expect(config.version).toBe('1.0.0');
      expect(config.customGuidesFolder).toBe(path.join(mockHomeDir, 'custom-dev-guides'));
    });

    it('should return default config when config structure is invalid', () => {
      const invalidConfig = {
        version: '1.0.0',
        // missing customGuidesFolder and menuItems
      };

      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(JSON.stringify(invalidConfig));

      const config = configManager.loadConfig();

      expect(config.version).toBe('1.0.0');
      expect(config.customGuidesFolder).toBe(path.join(mockHomeDir, 'custom-dev-guides'));
    });

    it('should restore from backup when main config is corrupted', () => {
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

      // Mock main config file exists but is corrupted
      mockedFs.existsSync
        .mockReturnValueOnce(true) // main config exists
        .mockReturnValueOnce(true); // backup exists
      mockedFs.readFileSync
        .mockReturnValueOnce('invalid json') // main config is corrupted
        .mockReturnValueOnce(JSON.stringify(backupConfig)); // backup is valid

      const config = configManager.loadConfig();

      expect(config).toEqual(backupConfig);
      expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
        mockConfigPath,
        JSON.stringify(backupConfig, null, 2),
        'utf8'
      );
    });

    it('should return default config when both main and backup are corrupted', () => {
      // Mock both main and backup config files exist but are corrupted
      mockedFs.existsSync
        .mockReturnValueOnce(true) // main config exists
        .mockReturnValueOnce(true); // backup exists
      mockedFs.readFileSync
        .mockReturnValueOnce('invalid json') // main config is corrupted
        .mockReturnValueOnce('invalid json'); // backup is also corrupted

      const config = configManager.loadConfig();

      expect(config.version).toBe('1.0.0');
      expect(config.customGuidesFolder).toBe(path.join(mockHomeDir, 'custom-dev-guides'));
    });

    it('should handle file read errors gracefully', () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const config = configManager.loadConfig();

      expect(config.version).toBe('1.0.0');
      expect(config.customGuidesFolder).toBe(path.join(mockHomeDir, 'custom-dev-guides'));
    });
  });

  describe('saveConfig', () => {
    it('should save configuration with backup', () => {
      const config: CustomGuideConfig = {
        version: '1.0.0',
        customGuidesFolder: '/custom/guides',
        menuItems: [],
      };

      // Mock existing config file
      mockedFs.existsSync
        .mockReturnValueOnce(true) // config directory exists
        .mockReturnValueOnce(true); // existing config file exists
      mockedFs.readFileSync.mockReturnValue('existing config content');

      configManager.saveConfig(config);

      expect(mockedFs.mkdirSync).toHaveBeenCalledWith(mockConfigDir, { recursive: true });
      expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
        mockBackupPath,
        'existing config content',
        'utf8'
      );
      expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
        mockConfigPath,
        JSON.stringify(config, null, 2),
        'utf8'
      );
    });

    it('should create config directory if it does not exist', () => {
      const config: CustomGuideConfig = {
        version: '1.0.0',
        customGuidesFolder: '/custom/guides',
        menuItems: [],
      };

      mockedFs.existsSync.mockReturnValue(false); // config directory does not exist

      configManager.saveConfig(config);

      expect(mockedFs.mkdirSync).toHaveBeenCalledWith(mockConfigDir, { recursive: true });
    });

    it('should handle backup creation failure gracefully', () => {
      const config: CustomGuideConfig = {
        version: '1.0.0',
        customGuidesFolder: '/custom/guides',
        menuItems: [],
      };

      // Mock existing config file but backup creation fails
      mockedFs.existsSync
        .mockReturnValueOnce(true) // config directory exists
        .mockReturnValueOnce(true); // existing config file exists
      mockedFs.readFileSync.mockReturnValue('existing config content');
      mockedFs.writeFileSync
        .mockImplementationOnce(() => {
          throw new Error('Backup failed');
        }) // backup fails
        .mockImplementationOnce(() => undefined); // main save succeeds

      // Should not throw error
      expect(() => configManager.saveConfig(config)).not.toThrow();

      expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
        mockConfigPath,
        JSON.stringify(config, null, 2),
        'utf8'
      );
    });
  });

  describe('validateConfig', () => {
    it('should validate correct configuration', () => {
      const config: CustomGuideConfig = {
        version: '1.0.0',
        customGuidesFolder: '/custom/guides',
        menuItems: [],
      };

      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.statSync.mockReturnValue({
        isDirectory: () => true,
      } as any);

      const result = configManager.validateConfig(config);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject invalid version', () => {
      const config: CustomGuideConfig = {
        version: '2.0.0',
        customGuidesFolder: '/custom/guides',
        menuItems: [],
      };

      const result = configManager.validateConfig(config);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid version');
    });

    it('should reject empty custom guides folder path', () => {
      const config: CustomGuideConfig = {
        version: '1.0.0',
        customGuidesFolder: '',
        menuItems: [],
      };

      const result = configManager.validateConfig(config);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('cannot be empty');
    });

    it('should provide warning when custom guides folder does not exist', () => {
      const config: CustomGuideConfig = {
        version: '1.0.0',
        customGuidesFolder: '/non/existent',
        menuItems: [],
      };

      mockedFs.existsSync.mockReturnValue(false);

      const result = configManager.validateConfig(config);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Custom guides folder does not exist');
    });

    it('should reject when custom guides folder is not a directory', () => {
      const config: CustomGuideConfig = {
        version: '1.0.0',
        customGuidesFolder: '/custom/guides',
        menuItems: [],
      };

      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.statSync.mockReturnValue({
        isDirectory: () => false,
      } as any);

      const result = configManager.validateConfig(config);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('is not a directory');
    });

    it('should handle file system errors during validation', () => {
      const config: CustomGuideConfig = {
        version: '1.0.0',
        customGuidesFolder: '/custom/guides',
        menuItems: [],
      };

      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.statSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const result = configManager.validateConfig(config);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Cannot access custom guides folder');
    });

    it('should validate menu items', () => {
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

      mockedFs.existsSync
        .mockReturnValueOnce(true) // custom guides folder exists
        .mockReturnValueOnce(true); // menu item folder exists
      mockedFs.statSync.mockReturnValue({
        isDirectory: () => true,
      } as any);

      const result = configManager.validateConfig(config);

      expect(result.isValid).toBe(true);
    });

    it('should reject menu item with empty ID', () => {
      const config: CustomGuideConfig = {
        version: '1.0.0',
        customGuidesFolder: '/custom/guides',
        menuItems: [
          {
            id: '',
            displayName: 'Test Guide',
            folderPath: 'test-guide',
          },
        ],
      };

      const result = configManager.validateConfig(config);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('empty ID');
    });

    it('should reject menu item with empty display name', () => {
      const config: CustomGuideConfig = {
        version: '1.0.0',
        customGuidesFolder: '/custom/guides',
        menuItems: [
          {
            id: 'test-guide',
            displayName: '',
            folderPath: 'test-guide',
          },
        ],
      };

      const result = configManager.validateConfig(config);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('empty display name');
    });

    it('should provide warnings for menu item issues', () => {
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

      mockedFs.existsSync
        .mockReturnValueOnce(true) // custom guides folder exists
        .mockReturnValueOnce(false); // menu item folder does not exist

      const result = configManager.validateConfig(config);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Menu item folder does not exist');
    });
  });

  describe('resetToDefault', () => {
    it('should reset configuration to default values', () => {
      configManager.resetToDefault();

      expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
        mockConfigPath,
        JSON.stringify(configManager.getDefaultConfig(), null, 2),
        'utf8'
      );
    });
  });

  describe('getBackupConfig', () => {
    it('should return backup config when available and valid', () => {
      const backupConfig: CustomGuideConfig = {
        version: '1.0.0',
        customGuidesFolder: '/backup/guides',
        menuItems: [],
      };

      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(JSON.stringify(backupConfig));

      const result = configManager.getBackupConfig();

      expect(result).toEqual(backupConfig);
    });

    it('should return null when backup does not exist', () => {
      mockedFs.existsSync.mockReturnValue(false);

      const result = configManager.getBackupConfig();

      expect(result).toBeNull();
    });

    it('should return null when backup is corrupted', () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue('invalid json');

      const result = configManager.getBackupConfig();

      expect(result).toBeNull();
    });
  });

  describe('restoreFromBackup', () => {
    it('should restore configuration from backup', () => {
      const backupConfig: CustomGuideConfig = {
        version: '1.0.0',
        customGuidesFolder: '/backup/guides',
        menuItems: [],
      };

      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(JSON.stringify(backupConfig));

      const result = configManager.restoreFromBackup();

      expect(result).toBe(true);
      expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
        mockConfigPath,
        JSON.stringify(backupConfig, null, 2),
        'utf8'
      );
    });

    it('should return false when backup is not available', () => {
      mockedFs.existsSync.mockReturnValue(false);

      const result = configManager.restoreFromBackup();

      expect(result).toBe(false);
    });
  });

  describe('getConfigPath', () => {
    it('should return configuration file path', () => {
      const configPath = configManager.getConfigPath();

      expect(configPath).toBe(mockConfigPath);
    });
  });

  describe('getBackupPath', () => {
    it('should return backup file path', () => {
      const backupPath = configManager.getBackupPath();

      expect(backupPath).toBe(mockBackupPath);
    });
  });
}); 