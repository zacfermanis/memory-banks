import { promises as fs } from 'fs';
import path from 'path';
// ProjectConfig import removed as it's not used in this implementation

export interface ConfigDefaults {
  projectName?: string;
  projectType?: string;
  projectDescription?: string;
  version?: string;
  author?: string;
  license?: string;
  framework?: string;
  buildTool?: string;
  [key: string]: any;
}

export interface ConfigFile {
  defaults: ConfigDefaults;
  templates?: Record<string, ConfigDefaults>;
}

export class ConfigManager {
  private static readonly CONFIG_FILE_NAME = '.memory-banks.json';
  private static readonly GLOBAL_CONFIG_PATH = path.join(
    process.env['HOME'] || process.env['USERPROFILE'] || '',
    '.memory-banks.json'
  );

  /**
   * Load configuration from file
   */
  static async loadConfig(configPath?: string): Promise<ConfigFile | null> {
    try {
      const filePath = configPath || this.CONFIG_FILE_NAME;
      const content = await fs.readFile(filePath, 'utf8');
      return JSON.parse(content) as ConfigFile;
    } catch {
      return null;
    }
  }

  /**
   * Load global configuration
   */
  static async loadGlobalConfig(): Promise<ConfigFile | null> {
    try {
      const content = await fs.readFile(this.GLOBAL_CONFIG_PATH, 'utf8');
      return JSON.parse(content) as ConfigFile;
    } catch {
      return null;
    }
  }

  /**
   * Save configuration to file
   */
  static async saveConfig(
    config: ConfigFile,
    configPath?: string
  ): Promise<void> {
    const filePath = configPath || this.CONFIG_FILE_NAME;
    await fs.writeFile(filePath, JSON.stringify(config, null, 2), 'utf8');
  }

  /**
   * Get default configuration for non-interactive mode
   */
  static async getDefaultConfig(templateId?: string): Promise<ConfigDefaults> {
    // Try to load local config first
    let config = await this.loadConfig();

    // Fall back to global config
    if (!config) {
      config = await this.loadGlobalConfig();
    }

    // Get template-specific defaults
    let defaults: ConfigDefaults = {};
    if (config) {
      defaults = { ...config.defaults };
      if (templateId && config.templates?.[templateId]) {
        defaults = { ...defaults, ...config.templates[templateId] };
      }
    }

    // Override with environment variables
    const envDefaults = this.getEnvironmentDefaults();
    defaults = { ...defaults, ...envDefaults };

    // Provide intelligent defaults for missing values
    return this.getIntelligentDefaults(defaults);
  }

  /**
   * Get configuration from environment variables
   */
  private static getEnvironmentDefaults(): ConfigDefaults {
    const envDefaults: ConfigDefaults = {};

    if (process.env['MEMORY_BANKS_PROJECT_NAME']) {
      envDefaults.projectName = process.env['MEMORY_BANKS_PROJECT_NAME'];
    }
    if (process.env['MEMORY_BANKS_PROJECT_TYPE']) {
      envDefaults.projectType = process.env['MEMORY_BANKS_PROJECT_TYPE'];
    }
    if (process.env['MEMORY_BANKS_PROJECT_DESCRIPTION']) {
      envDefaults.projectDescription =
        process.env['MEMORY_BANKS_PROJECT_DESCRIPTION'];
    }
    if (process.env['MEMORY_BANKS_VERSION']) {
      envDefaults.version = process.env['MEMORY_BANKS_VERSION'];
    }
    if (process.env['MEMORY_BANKS_AUTHOR']) {
      envDefaults.author = process.env['MEMORY_BANKS_AUTHOR'];
    }
    if (process.env['MEMORY_BANKS_LICENSE']) {
      envDefaults.license = process.env['MEMORY_BANKS_LICENSE'];
    }
    if (process.env['MEMORY_BANKS_FRAMEWORK']) {
      envDefaults.framework = process.env['MEMORY_BANKS_FRAMEWORK'];
    }
    if (process.env['MEMORY_BANKS_BUILD_TOOL']) {
      envDefaults.buildTool = process.env['MEMORY_BANKS_BUILD_TOOL'];
    }

    return envDefaults;
  }

  /**
   * Get intelligent defaults based on context
   */
  private static getIntelligentDefaults(
    partialDefaults: ConfigDefaults
  ): ConfigDefaults {
    const defaults: ConfigDefaults = {
      // Basic project info
      projectName: partialDefaults.projectName || 'My Project',
      projectType: partialDefaults.projectType || 'Web Application',
      projectDescription:
        partialDefaults.projectDescription ||
        'A new project with memory bank system',
      version: partialDefaults.version || '1.0.0',
      author: partialDefaults.author || this.getDefaultAuthor(),
      license: partialDefaults.license || 'MIT',
      framework: partialDefaults.framework || 'React',
      buildTool: partialDefaults.buildTool || 'Vite',

      // Requirements
      ['requirement1']:
        partialDefaults['requirement1'] || 'Implement core functionality',
      ['requirement2']:
        partialDefaults['requirement2'] ||
        'Ensure code quality and maintainability',
      ['requirement3']:
        partialDefaults['requirement3'] || 'Provide excellent user experience',

      // Success criteria
      ['success1']:
        partialDefaults['success1'] || 'All features work as expected',
      ['success2']: partialDefaults['success2'] || 'Code passes all tests',
      ['success3']: partialDefaults['success3'] || 'User feedback is positive',

      // Problem and solution
      ['problemStatement']:
        partialDefaults['problemStatement'] ||
        'Addresses a specific need in the target domain',
      ['solutionOverview']:
        partialDefaults['solutionOverview'] ||
        'Provides a comprehensive solution using modern technologies',

      // UX goals
      ['uxGoal1']: partialDefaults['uxGoal1'] || 'Intuitive and easy to use',
      ['uxGoal2']: partialDefaults['uxGoal2'] || 'Fast and responsive',
      ['uxGoal3']: partialDefaults['uxGoal3'] || 'Accessible to all users',

      // Architecture
      ['architectureOverview']:
        partialDefaults['architectureOverview'] ||
        'Modern, scalable architecture following best practices',
      ['pattern1']:
        partialDefaults['pattern1'] || 'Component-based architecture',
      ['pattern2']: partialDefaults['pattern2'] || 'Separation of concerns',
      ['pattern3']: partialDefaults['pattern3'] || 'Clean code principles',
      ['componentRelationships']:
        partialDefaults['componentRelationships'] ||
        'Well-defined interfaces and clear data flow',

      // Development
      ['devSetup']:
        partialDefaults['devSetup'] ||
        'Standard Node.js development environment with TypeScript',
      ['dependencies']:
        partialDefaults['dependencies'] ||
        'Core framework and essential development tools',

      // Project status
      ['currentFocus']:
        partialDefaults['currentFocus'] ||
        'Initial project setup and core feature development',
      ['recentChanges']:
        partialDefaults['recentChanges'] ||
        'Project initialization and basic structure',
      ['nextSteps']:
        partialDefaults['nextSteps'] ||
        'Implement core features and establish development workflow',
      ['activeDecisions']:
        partialDefaults['activeDecisions'] ||
        'Technology stack and architecture choices',
      ['whatWorks']:
        partialDefaults['whatWorks'] || 'Project structure and basic setup',
      ['whatsLeft']:
        partialDefaults['whatsLeft'] || 'Core functionality and features',
      ['currentStatus']:
        partialDefaults['currentStatus'] ||
        'In development - initial setup phase',
      ['knownIssues']: partialDefaults['knownIssues'] || 'None at this stage',
    };

    return defaults;
  }

  /**
   * Get default author from git config or system
   */
  private static getDefaultAuthor(): string {
    // Try to get from git config
    try {
      const { execSync } = require('child_process');
      const gitName = execSync('git config user.name', {
        encoding: 'utf8',
      }).trim();
      const gitEmail = execSync('git config user.email', {
        encoding: 'utf8',
      }).trim();
      if (gitName && gitEmail) {
        return `${gitName} <${gitEmail}>`;
      }
    } catch {
      // Git config not available
    }

    // Fall back to system user
    return process.env['USER'] || process.env['USERNAME'] || 'Developer';
  }

  /**
   * Create a new configuration file with defaults
   */
  static async createDefaultConfig(configPath?: string): Promise<void> {
    const defaultConfig: ConfigFile = {
      defaults: {
        projectName: 'My Project',
        projectType: 'Web Application',
        projectDescription: 'A new project with memory bank system',
        version: '1.0.0',
        author: this.getDefaultAuthor(),
        license: 'MIT',
        framework: 'React',
        buildTool: 'Vite',
      },
      templates: {
        typescript: {
          framework: 'React',
          buildTool: 'Vite',
          requirement1: 'Implement core functionality',
          requirement2: 'Ensure code quality and maintainability',
          requirement3: 'Provide excellent user experience',
        },
      },
    };

    await this.saveConfig(defaultConfig, configPath);
  }

  /**
   * Validate configuration
   */
  static validateConfig(config: ConfigFile): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!config.defaults) {
      errors.push('Configuration must have a "defaults" section');
    }

    if (config.templates) {
      for (const [templateId, templateConfig] of Object.entries(
        config.templates
      )) {
        if (typeof templateConfig !== 'object') {
          errors.push(
            `Template "${templateId}" configuration must be an object`
          );
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Merge configurations with priority order
   */
  static mergeConfigs(
    ...configs: (ConfigDefaults | undefined)[]
  ): ConfigDefaults {
    const merged: ConfigDefaults = {};
    for (const config of configs) {
      if (config) {
        Object.assign(merged, config);
      }
    }
    return merged;
  }
}
