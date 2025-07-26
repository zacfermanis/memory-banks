# API Reference

Complete API documentation for memory-banks internal interfaces, types, and functions.

## Table of Contents

- [CLI Interface](#cli-interface)
- [Template System](#template-system)
- [File Operations](#file-operations)
- [Validation System](#validation-system)
- [Error Handling](#error-handling)
- [Logging System](#logging-system)
- [Configuration](#configuration)
- [Types](#types)

## CLI Interface

### Main CLI Entry Point

```typescript
// src/cli/index.ts
import { Command } from 'commander';

const program = new Command();

program
  .name('memory-banks')
  .description('A CLI tool for creating and managing memory bank systems')
  .version('0.1.0');

// Add commands
program.addCommand(initCommand);
program.addCommand(listCommand);
program.addCommand(infoCommand);
program.addCommand(validateCommand);
program.addCommand(updateCommand);

program.parse();
```

### Command Structure

```typescript
// src/cli/commands/init.ts
import { Command } from 'commander';
import { initMemoryBank } from '../../services/templateRenderer';

export const initCommand = new Command('init')
  .description('Initialize a new memory bank system')
  .option('-t, --template <template>', 'Template to use', 'typescript')
  .option('-y, --yes', 'Skip interactive prompts')
  .option('--dry-run', 'Show what would be created')
  .option('-f, --force', 'Overwrite existing files')
  .option('-o, --output-dir <path>', 'Output directory', '.memory-bank')
  .action(async (options) => {
    // Command implementation
  });
```

## Template System

### Template Registry

```typescript
// src/services/templateRegistry.ts
export interface Template {
  name: string;
  description: string;
  version: string;
  language: string;
  files: TemplateFile[];
  options: TemplateOption[];
}

export interface TemplateFile {
  path: string;
  content: string;
  overwrite: boolean;
}

export interface TemplateOption {
  name: string;
  type: 'string' | 'boolean' | 'number' | 'select';
  description: string;
  default?: any;
  choices?: string[];
  required: boolean;
}

export class TemplateRegistry {
  /**
   * Load all available templates
   */
  static async loadTemplates(): Promise<Template[]>;

  /**
   * Load a specific template by name
   */
  static async loadTemplate(name: string): Promise<Template>;

  /**
   * List templates with optional filtering
   */
  static async listTemplates(language?: string): Promise<Template[]>;

  /**
   * Validate template structure
   */
  static validateTemplate(template: Template): boolean;
}
```

### Template Renderer

```typescript
// src/services/templateRenderer.ts
export interface RenderOptions {
  template: Template;
  variables: Record<string, any>;
  outputDir: string;
  dryRun?: boolean;
  force?: boolean;
}

export interface RenderResult {
  success: boolean;
  files: string[];
  errors: string[];
  warnings: string[];
}

export class TemplateRenderer {
  /**
   * Render a template with variables
   */
  static async renderTemplate(options: RenderOptions): Promise<RenderResult>;

  /**
   * Substitute variables in content
   */
  static substituteVariables(content: string, variables: Record<string, any>): string;

  /**
   * Validate required variables
   */
  static validateVariables(template: Template, variables: Record<string, any>): string[];

  /**
   * Generate default variables
   */
  static generateDefaults(template: Template): Record<string, any>;
}
```

## File Operations

### File System Utilities

```typescript
// src/utils/fileSystem.ts
export interface FileOperation {
  path: string;
  content: string;
  overwrite: boolean;
}

export interface FileOperationResult {
  success: boolean;
  path: string;
  error?: string;
  backupPath?: string;
}

export class FileSystem {
  /**
   * Create directory if it doesn't exist
   */
  static ensureDirectory(path: string): Promise<void>;

  /**
   * Write file with backup creation
   */
  static writeFile(path: string, content: string, overwrite?: boolean): Promise<FileOperationResult>;

  /**
   * Read file content
   */
  static readFile(path: string): Promise<string>;

  /**
   * Check if file exists
   */
  static fileExists(path: string): Promise<boolean>;

  /**
   * Create backup of existing file
   */
  static createBackup(path: string): Promise<string>;

  /**
   * List files in directory
   */
  static listFiles(dir: string): Promise<string[]>;

  /**
   * Remove directory recursively
   */
  static removeDirectory(path: string): Promise<void>;
}
```

### Batch Processing

```typescript
// src/utils/batchProcessor.ts
export interface BatchOperation<T> {
  items: T[];
  processor: (item: T) => Promise<any>;
  onProgress?: (completed: number, total: number) => void;
  onError?: (item: T, error: Error) => void;
}

export interface BatchResult<T> {
  successful: T[];
  failed: Array<{ item: T; error: Error }>;
  total: number;
  completed: number;
}

export class BatchProcessor {
  /**
   * Process items in batches
   */
  static async processBatch<T>(operation: BatchOperation<T>): Promise<BatchResult<T>>;

  /**
   * Process items sequentially
   */
  static async processSequential<T>(operation: BatchOperation<T>): Promise<BatchResult<T>>;

  /**
   * Process items in parallel with concurrency limit
   */
  static async processParallel<T>(
    operation: BatchOperation<T>,
    concurrency: number
  ): Promise<BatchResult<T>>;
}
```

## Validation System

### Memory Bank Validator

```typescript
// src/utils/validation.ts
export interface ValidationRule {
  name: string;
  validate: (context: ValidationContext) => Promise<ValidationResult>;
}

export interface ValidationContext {
  outputDir: string;
  template?: Template;
  variables?: Record<string, any>;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  details?: any;
}

export class MemoryBankValidator {
  /**
   * Validate memory bank structure
   */
  static async validateStructure(outputDir: string): Promise<ValidationResult>;

  /**
   * Validate template configuration
   */
  static async validateTemplate(template: Template): Promise<ValidationResult>;

  /**
   * Validate variables against template
   */
  static async validateVariables(
    template: Template,
    variables: Record<string, any>
  ): Promise<ValidationResult>;

  /**
   * Run all validation rules
   */
  static async validateAll(context: ValidationContext): Promise<ValidationResult>;
}
```

### Validation Rules

```typescript
// Built-in validation rules
export const validationRules: ValidationRule[] = [
  {
    name: 'required-files',
    validate: async (context) => {
      // Check for required memory bank files
    }
  },
  {
    name: 'file-structure',
    validate: async (context) => {
      // Validate file structure and content
    }
  },
  {
    name: 'template-compatibility',
    validate: async (context) => {
      // Check template compatibility
    }
  }
];
```

## Error Handling

### Error Types

```typescript
// src/utils/errorHandling.ts
export class MemoryBankError extends Error {
  constructor(message: string, public code: string, public details?: any) {
    super(message);
    this.name = 'MemoryBankError';
  }
}

export class TemplateError extends MemoryBankError {
  constructor(message: string, public templateName?: string) {
    super(message, 'TEMPLATE_ERROR', { templateName });
    this.name = 'TemplateError';
  }
}

export class FileOperationError extends MemoryBankError {
  constructor(message: string, public path?: string) {
    super(message, 'FILE_OPERATION_ERROR', { path });
    this.name = 'FileOperationError';
  }
}

export class ValidationError extends MemoryBankError {
  constructor(message: string, public validationErrors: string[]) {
    super(message, 'VALIDATION_ERROR', { validationErrors });
    this.name = 'ValidationError';
  }
}
```

### Error Handling Utilities

```typescript
export class ErrorHandler {
  /**
   * Handle and format errors for CLI output
   */
  static handleError(error: Error, verbose?: boolean): string;

  /**
   * Check if error is recoverable
   */
  static isRecoverable(error: Error): boolean;

  /**
   * Get user-friendly error message
   */
  static getUserMessage(error: Error): string;

  /**
   * Get detailed error information for debugging
   */
  static getDebugInfo(error: Error): any;
}
```

## Logging System

### Logger Interface

```typescript
// src/utils/logger.ts
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  VERBOSE = 4
}

export interface LogOptions {
  level?: LogLevel;
  timestamp?: boolean;
  prefix?: string;
  colors?: boolean;
}

export interface Logger {
  error(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  debug(message: string, ...args: any[]): void;
  verbose(message: string, ...args: any[]): void;
  
  setLevel(level: LogLevel): void;
  setOptions(options: LogOptions): void;
}

export class ConsoleLogger implements Logger {
  constructor(options?: LogOptions);
  
  error(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  debug(message: string, ...args: any[]): void;
  verbose(message: string, ...args: any[]): void;
  
  setLevel(level: LogLevel): void;
  setOptions(options: LogOptions): void;
}
```

## Configuration

### Configuration Manager

```typescript
// src/utils/configManager.ts
export interface GlobalConfig {
  defaultTemplate: string;
  defaultOutputDir: string;
  autoBackup: boolean;
  verbose: boolean;
  logLevel: LogLevel;
}

export interface ProjectConfig {
  template: string;
  outputDir: string;
  options: Record<string, any>;
}

export class ConfigManager {
  /**
   * Load global configuration
   */
  static loadGlobalConfig(): Promise<GlobalConfig>;

  /**
   * Save global configuration
   */
  static saveGlobalConfig(config: GlobalConfig): Promise<void>;

  /**
   * Load project configuration
   */
  static loadProjectConfig(projectDir: string): Promise<ProjectConfig | null>;

  /**
   * Save project configuration
   */
  static saveProjectConfig(projectDir: string, config: ProjectConfig): Promise<void>;

  /**
   * Get configuration value with fallbacks
   */
  static getConfigValue<T>(
    key: string,
    projectDir?: string,
    defaultValue?: T
  ): Promise<T>;
}
```

### Configuration Files

```typescript
// Global configuration file: ~/.memory-banks/config.json
export interface GlobalConfigFile {
  defaultTemplate: string;
  defaultOutputDir: string;
  autoBackup: boolean;
  verbose: boolean;
  logLevel: LogLevel;
  templates?: {
    [name: string]: {
      enabled: boolean;
      customOptions?: Record<string, any>;
    };
  };
}

// Project configuration file: .memory-banks.json
export interface ProjectConfigFile {
  template: string;
  outputDir: string;
  options: Record<string, any>;
  version: string;
  lastUpdated: string;
}
```

## Types

### Core Types

```typescript
// src/types/index.ts

// Template-related types
export interface Template {
  name: string;
  description: string;
  version: string;
  language: string;
  files: TemplateFile[];
  options: TemplateOption[];
  metadata?: Record<string, any>;
}

export interface TemplateFile {
  path: string;
  content: string;
  overwrite: boolean;
  permissions?: number;
}

export interface TemplateOption {
  name: string;
  type: 'string' | 'boolean' | 'number' | 'select' | 'multiselect';
  description: string;
  default?: any;
  choices?: string[];
  required: boolean;
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    custom?: (value: any) => boolean;
  };
}

// CLI-related types
export interface CLIOptions {
  template?: string;
  yes?: boolean;
  dryRun?: boolean;
  force?: boolean;
  outputDir?: string;
  verbose?: boolean;
  quiet?: boolean;
  debug?: boolean;
}

export interface CommandContext {
  options: CLIOptions;
  logger: Logger;
  config: GlobalConfig;
}

// File operation types
export interface FileOperation {
  path: string;
  content: string;
  overwrite: boolean;
  backup?: boolean;
}

export interface FileOperationResult {
  success: boolean;
  path: string;
  error?: string;
  backupPath?: string;
  size?: number;
}

// Validation types
export interface ValidationContext {
  outputDir: string;
  template?: Template;
  variables?: Record<string, any>;
  config?: ProjectConfig;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  details?: Record<string, any>;
}

// Error types
export interface ErrorDetails {
  code: string;
  message: string;
  details?: any;
  stack?: string;
}

// Configuration types
export interface GlobalConfig {
  defaultTemplate: string;
  defaultOutputDir: string;
  autoBackup: boolean;
  verbose: boolean;
  logLevel: LogLevel;
  templates?: Record<string, TemplateConfig>;
}

export interface TemplateConfig {
  enabled: boolean;
  customOptions?: Record<string, any>;
}

export interface ProjectConfig {
  template: string;
  outputDir: string;
  options: Record<string, any>;
  version: string;
  lastUpdated: string;
}
```

### Utility Types

```typescript
// Utility type definitions
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type CommandResult = {
  success: boolean;
  message: string;
  data?: any;
  errors?: string[];
};

export type AsyncResult<T> = Promise<{
  success: boolean;
  data?: T;
  error?: Error;
}>;
```

## Usage Examples

### Creating a Custom Template

```typescript
import { Template, TemplateFile, TemplateOption } from 'memory-banks';

const customTemplate: Template = {
  name: 'my-custom-template',
  description: 'My custom project template',
  version: '1.0.0',
  language: 'typescript',
  files: [
    {
      path: 'projectBrief.md',
      content: `# Project: {{projectName}}

{{projectDescription}}

## Requirements
- {{requirement1}}
- {{requirement2}}`,
      overwrite: false
    }
  ],
  options: [
    {
      name: 'projectName',
      type: 'string',
      description: 'Name of your project',
      default: 'my-project',
      required: true
    },
    {
      name: 'projectDescription',
      type: 'string',
      description: 'Project description',
      default: 'A new project',
      required: true
    }
  ]
};
```

### Using the Template Renderer

```typescript
import { TemplateRenderer, RenderOptions } from 'memory-banks';

const options: RenderOptions = {
  template: customTemplate,
  variables: {
    projectName: 'My Awesome Project',
    projectDescription: 'A revolutionary new application'
  },
  outputDir: './my-memory-bank',
  dryRun: false,
  force: false
};

const result = await TemplateRenderer.renderTemplate(options);

if (result.success) {
  console.log('Template rendered successfully!');
  console.log('Created files:', result.files);
} else {
  console.error('Template rendering failed:', result.errors);
}
```

### Custom Validation Rule

```typescript
import { ValidationRule, ValidationContext, ValidationResult } from 'memory-banks';

const customValidationRule: ValidationRule = {
  name: 'custom-project-structure',
  validate: async (context: ValidationContext): Promise<ValidationResult> => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if project has specific files
    const requiredFiles = ['package.json', 'README.md'];
    
    for (const file of requiredFiles) {
      const exists = await FileSystem.fileExists(file);
      if (!exists) {
        warnings.push(`Missing recommended file: ${file}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
};
```

### Error Handling

```typescript
import { ErrorHandler, MemoryBankError } from 'memory-banks';

try {
  // Your code here
} catch (error) {
  if (error instanceof MemoryBankError) {
    const userMessage = ErrorHandler.getUserMessage(error);
    console.error(userMessage);
    
    if (verbose) {
      const debugInfo = ErrorHandler.getDebugInfo(error);
      console.error('Debug info:', debugInfo);
    }
  } else {
    console.error('Unexpected error:', error);
  }
}
```

---

For more detailed information about specific APIs, see the individual documentation files in the `docs/` directory. 