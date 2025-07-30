import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  CustomGuideConfig,
  ValidationResult,
} from './types';

/**
 * Manages configuration for custom development guides
 */
export class ConfigurationManager {
  private readonly configDir: string;
  private readonly configPath: string;
  private readonly backupPath: string;

  constructor() {
    this.configDir = path.join(os.homedir(), '.memory-bank');
    this.configPath = path.join(this.configDir, 'config.json');
    this.backupPath = path.join(this.configDir, 'config.backup.json');
  }

  /**
   * Get the default configuration
   */
  getDefaultConfig(): CustomGuideConfig {
    return {
      version: '1.0.0',
      customGuidesFolder: path.join(os.homedir(), 'custom-dev-guides'),
      menuItems: [],
    };
  }

  /**
   * Load configuration from file or return default if file doesn't exist
   */
  loadConfig(): CustomGuideConfig {
    if (!fs.existsSync(this.configPath)) {
      return this.getDefaultConfig();
    }

    try {
      const configData = fs.readFileSync(this.configPath, 'utf8');
      const config = JSON.parse(configData) as CustomGuideConfig;

      // Validate the loaded config has the required structure
      if (
        typeof config === 'object' &&
        config !== null &&
        typeof config.version === 'string' &&
        typeof config.customGuidesFolder === 'string' &&
        Array.isArray(config.menuItems)
      ) {
        return config;
      }

      // If config structure is invalid, try to recover from backup
      if (fs.existsSync(this.backupPath)) {
        try {
          const backupData = fs.readFileSync(this.backupPath, 'utf8');
          const backupConfig = JSON.parse(backupData) as CustomGuideConfig;
          
          if (
            typeof backupConfig === 'object' &&
            backupConfig !== null &&
            typeof backupConfig.version === 'string' &&
            typeof backupConfig.customGuidesFolder === 'string' &&
            Array.isArray(backupConfig.menuItems)
          ) {
            // Restore from backup
            this.saveConfig(backupConfig);
            return backupConfig;
          }
        } catch (backupError) {
          // Backup is also corrupted, continue to default
        }
      }

      return this.getDefaultConfig();
    } catch (error) {
      // If there's any error reading or parsing the file, try backup
      if (fs.existsSync(this.backupPath)) {
        try {
          const backupData = fs.readFileSync(this.backupPath, 'utf8');
          const backupConfig = JSON.parse(backupData) as CustomGuideConfig;
          
          if (
            typeof backupConfig === 'object' &&
            backupConfig !== null &&
            typeof backupConfig.version === 'string' &&
            typeof backupConfig.customGuidesFolder === 'string' &&
            Array.isArray(backupConfig.menuItems)
          ) {
            // Restore from backup
            this.saveConfig(backupConfig);
            return backupConfig;
          }
        } catch (backupError) {
          // Backup is also corrupted, continue to default
        }
      }
      
      return this.getDefaultConfig();
    }
  }

  /**
   * Save configuration to file with backup
   */
  saveConfig(config: CustomGuideConfig): void {
    // Ensure the config directory exists
    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { recursive: true });
    }

    // Create backup of existing config if it exists
    if (fs.existsSync(this.configPath)) {
      try {
        const existingConfig = fs.readFileSync(this.configPath, 'utf8');
        fs.writeFileSync(this.backupPath, existingConfig, 'utf8');
      } catch (error) {
        // If backup fails, continue anyway
      }
    }

    // Write the configuration file
    fs.writeFileSync(
      this.configPath,
      JSON.stringify(config, null, 2),
      'utf8'
    );
  }

  /**
   * Validate configuration with detailed error reporting
   */
  validateConfig(config: CustomGuideConfig): ValidationResult {
    const warnings: string[] = [];

    // Validate version
    if (config.version !== '1.0.0') {
      return {
        isValid: false,
        error: `Invalid version: ${config.version}. Expected: 1.0.0`,
      };
    }

    // Validate custom guides folder path
    if (!config.customGuidesFolder || config.customGuidesFolder.trim() === '') {
      return {
        isValid: false,
        error: 'Custom guides folder path cannot be empty',
      };
    }

    // Check if custom guides folder exists
    if (!fs.existsSync(config.customGuidesFolder)) {
      warnings.push(`Custom guides folder does not exist: ${config.customGuidesFolder}`);
    } else {
      // Check if custom guides folder is a directory
      try {
        const stats = fs.statSync(config.customGuidesFolder);
        if (!stats.isDirectory()) {
          return {
            isValid: false,
            error: `Custom guides folder is not a directory: ${config.customGuidesFolder}`,
          };
        }
      } catch (error) {
        return {
          isValid: false,
          error: `Cannot access custom guides folder: ${config.customGuidesFolder}`,
        };
      }
    }

    // Validate menu items
    for (const menuItem of config.menuItems) {
      if (!menuItem.id || menuItem.id.trim() === '') {
        return {
          isValid: false,
          error: `Menu item has empty ID`,
        };
      }

      if (!menuItem.displayName || menuItem.displayName.trim() === '') {
        return {
          isValid: false,
          error: `Menu item '${menuItem.id}' has empty display name`,
        };
      }

      if (!menuItem.folderPath || menuItem.folderPath.trim() === '') {
        return {
          isValid: false,
          error: `Menu item '${menuItem.id}' has empty folder path`,
        };
      }

      // Check if menu item folder exists (only if custom guides folder exists)
      if (fs.existsSync(config.customGuidesFolder)) {
        const menuItemPath = path.join(config.customGuidesFolder, menuItem.folderPath);
        if (!fs.existsSync(menuItemPath)) {
          warnings.push(`Menu item folder does not exist: ${menuItemPath}`);
        } else {
          // Check if it has required developmentGuide.md file
          const developmentGuidePath = path.join(menuItemPath, 'developmentGuide.md');
          if (!fs.existsSync(developmentGuidePath)) {
            warnings.push(`Menu item '${menuItem.displayName}' missing required file: developmentGuide.md`);
          }
        }
      }
    }

    return {
      isValid: true,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Reset configuration to default values
   */
  resetToDefault(): void {
    const defaultConfig = this.getDefaultConfig();
    this.saveConfig(defaultConfig);
  }

  /**
   * Get configuration backup if available
   */
  getBackupConfig(): CustomGuideConfig | null {
    if (!fs.existsSync(this.backupPath)) {
      return null;
    }

    try {
      const backupData = fs.readFileSync(this.backupPath, 'utf8');
      const backupConfig = JSON.parse(backupData) as CustomGuideConfig;
      
      if (
        typeof backupConfig === 'object' &&
        backupConfig !== null &&
        typeof backupConfig.version === 'string' &&
        typeof backupConfig.customGuidesFolder === 'string' &&
        Array.isArray(backupConfig.menuItems)
      ) {
        return backupConfig;
      }
    } catch (error) {
      // Backup is corrupted
    }

    return null;
  }

  /**
   * Restore configuration from backup
   */
  restoreFromBackup(): boolean {
    const backupConfig = this.getBackupConfig();
    if (backupConfig) {
      this.saveConfig(backupConfig);
      return true;
    }
    return false;
  }

  /**
   * Get configuration file path for debugging
   */
  getConfigPath(): string {
    return this.configPath;
  }

  /**
   * Get backup file path for debugging
   */
  getBackupPath(): string {
    return this.backupPath;
  }
} 