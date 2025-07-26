import path from 'path';
import {
  FileSystemUtils,
  FileOperationOptions,
  FileConflict,
  ConflictResolution,
} from '../utils/fileSystem';
import { TemplateRenderer } from './templateRenderer';

export interface FileGenerationOptions {
  outputDir: string;
  overwrite?: boolean;
  backup?: boolean;
  dryRun?: boolean;
  force?: boolean;
  validatePaths?: boolean;
  createBackups?: boolean;
  conflictStrategy?: 'ask' | 'overwrite' | 'backup' | 'skip' | 'rename';
}

export interface FileGenerationResult {
  success: boolean;
  files: GeneratedFile[];
  directories: GeneratedDirectory[];
  conflicts: FileConflict[];
  errors: string[];
  warnings: string[];
  summary: {
    totalFiles: number;
    createdFiles: number;
    updatedFiles: number;
    skippedFiles: number;
    totalDirectories: number;
    createdDirectories: number;
    skippedDirectories: number;
  };
}

export interface GeneratedFile {
  path: string;
  content: string;
  originalPath?: string;
  backupPath?: string;
  permissions?: string;
  overwritten: boolean;
  size: number;
  checksum?: string;
}

export interface GeneratedDirectory {
  path: string;
  permissions?: string;
  created: boolean;
  existing: boolean;
}

export interface TemplateFileDefinition {
  path: string;
  content: string;
  overwrite?: boolean;
  permissions?: string;
  condition?: string;
}

export class FileGenerator {
  private renderer: TemplateRenderer;

  constructor() {
    this.renderer = new TemplateRenderer();
  }

  /**
   * Generate files from template with variables
   */
  async generateFiles(
    templateFiles: TemplateFileDefinition[],
    variables: Record<string, any>,
    options: FileGenerationOptions
  ): Promise<FileGenerationResult> {
    const result: FileGenerationResult = {
      success: true,
      files: [],
      directories: [],
      conflicts: [],
      errors: [],
      warnings: [],
      summary: {
        totalFiles: templateFiles.length,
        createdFiles: 0,
        updatedFiles: 0,
        skippedFiles: 0,
        totalDirectories: 0,
        createdDirectories: 0,
        skippedDirectories: 0,
      },
    };

    try {
      // Ensure output directory exists
      await this.ensureOutputDirectory(options.outputDir);

      // Process each template file
      for (const templateFile of templateFiles) {
        try {
          const fileResult = await this.processTemplateFile(
            templateFile,
            variables,
            options
          );

          if (fileResult.success && fileResult.file) {
            result.files.push(fileResult.file);
            if (fileResult.file.overwritten) {
              result.summary.updatedFiles++;
            } else {
              result.summary.createdFiles++;
            }
            // Add conflict if detected
            if (fileResult.conflict) {
              result.conflicts.push(fileResult.conflict);
            }
          } else {
            result.summary.skippedFiles++;
            if (fileResult.error) {
              result.errors.push(fileResult.error);
            }
            if (fileResult.warning) {
              result.warnings.push(fileResult.warning);
            }
            // Add conflict if detected even for skipped files
            if (fileResult.conflict) {
              result.conflicts.push(fileResult.conflict);
            }
          }
        } catch (error) {
          result.errors.push(
            `Failed to process ${templateFile.path}: ${error}`
          );
          result.summary.skippedFiles++;
        }
      }

      result.success = result.errors.length === 0;
    } catch (error) {
      result.success = false;
      result.errors.push(`File generation failed: ${error}`);
    }

    return result;
  }

  /**
   * Process a single template file
   */
  private async processTemplateFile(
    templateFile: TemplateFileDefinition,
    variables: Record<string, any>,
    options: FileGenerationOptions
  ): Promise<{
    success: boolean;
    file?: GeneratedFile;
    error?: string;
    warning?: string;
    conflict?: FileConflict;
  }> {
    try {
      // Resolve file path with variable substitution
      const resolvedPath = await this.resolveFilePath(
        templateFile.path,
        variables,
        options
      );

      // Check if file should be generated based on condition
      if (templateFile.condition) {
        const shouldGenerate = await this.evaluateCondition(
          templateFile.condition,
          variables
        );
        if (!shouldGenerate) {
          return {
            success: false,
            warning: `Skipped ${templateFile.path} (condition not met: ${templateFile.condition})`,
          };
        }
      }

      // Render file content
      const renderedContent = await this.renderer.renderTemplate(
        templateFile.content,
        variables
      );

      // Handle file conflicts
      const conflict = await this.detectFileConflict(resolvedPath, options);
      if (conflict) {
        const resolution = await this.resolveConflict(conflict, options);
        if (resolution.strategy === 'skip') {
          return {
            success: false,
            warning: `Skipped ${templateFile.path} (conflict resolution: skip)`,
            conflict,
          };
        }
      }

      // Create file
      const fileResult = await this.createFile(
        resolvedPath,
        renderedContent.content,
        templateFile,
        options
      );
      return {
        success: true,
        file: fileResult,
        conflict: conflict || undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to process ${templateFile.path}: ${error}`,
      };
    }
  }

  /**
   * Resolve file path with variable substitution
   */
  private async resolveFilePath(
    templatePath: string,
    variables: Record<string, any>,
    options: FileGenerationOptions
  ): Promise<string> {
    // Render the path template to substitute variables
    const renderedPath = await this.renderer.renderTemplate(
      templatePath,
      variables
    );

    // Normalize path
    const normalizedPath = path.normalize(renderedPath.content);

    // Validate path before joining with output directory
    if (options.validatePaths) {
      await this.validatePath(normalizedPath);
    }

    // Join with output directory
    const fullPath = path.join(options.outputDir, normalizedPath);

    return fullPath;
  }

  /**
   * Evaluate condition for conditional file generation
   */
  private async evaluateCondition(
    condition: string,
    variables: Record<string, any>
  ): Promise<boolean> {
    // Use the template renderer's conditional evaluation
    const testTemplate = `{% if ${condition} %}true{% endif %}`;
    const result = await this.renderer.renderTemplate(testTemplate, variables);
    return result.content === 'true';
  }

  /**
   * Detect file conflicts
   */
  private async detectFileConflict(
    filePath: string,
    _options: FileGenerationOptions
  ): Promise<FileConflict | null> {
    const exists = await FileSystemUtils.fileExists(filePath);
    if (!exists) {
      return null;
    }

    // Create a mock source for conflict detection
    const mockSource = {
      path: filePath,
      content: 'mock content',
      size: 0,
      created: new Date(),
      modified: new Date(),
      permissions: '644',
      owner: 'user',
    };

    return await FileSystemUtils.detectFileConflict(mockSource.path, filePath);
  }

  /**
   * Resolve file conflicts
   */
  private async resolveConflict(
    conflict: FileConflict,
    options: FileGenerationOptions
  ): Promise<ConflictResolution> {
    switch (options.conflictStrategy) {
      case 'overwrite':
        return FileSystemUtils.createOverwriteStrategy(conflict);
      case 'backup':
        return FileSystemUtils.createBackupRenameStrategy(conflict);
      case 'skip':
        return FileSystemUtils.createSkipStrategy(conflict);
      case 'rename':
        return this.createRenameStrategy(conflict);
      case 'ask':
      default:
        return await FileSystemUtils.resolveConflictIntelligently(conflict);
    }
  }

  /**
   * Create rename strategy for conflicts
   */
  private createRenameStrategy(conflict: FileConflict): ConflictResolution {
    const dir = path.dirname(conflict.destination);
    const ext = path.extname(conflict.destination);
    const base = path.basename(conflict.destination, ext);
    const timestamp = Date.now();
    const newPath = path.join(dir, `${base}_${timestamp}${ext}`);

    return {
      strategy: 'rename',
      userConfirmed: true,
      newPath,
    };
  }

  /**
   * Create a file
   */
  private async createFile(
    filePath: string,
    content: string,
    templateFile: TemplateFileDefinition,
    options: FileGenerationOptions
  ): Promise<GeneratedFile> {
    const exists = await FileSystemUtils.fileExists(filePath);
    let backupPath: string | undefined;
    let overwritten = exists; // Set to true if file exists (will be overwritten)

    // Handle backup if needed
    if (exists && options.createBackups) {
      const backup = await FileSystemUtils.createBackup(filePath, 'file');
      backupPath = backup.backupPath;
    }

    // Create file with platform-specific optimizations
    const fileOptions: FileOperationOptions = {
      overwrite: options.overwrite || templateFile.overwrite || false,
      backup: options.backup,
      permissions: templateFile.permissions,
    };

    await FileSystemUtils.createFileCrossPlatform(
      filePath,
      content,
      fileOptions
    );

    // Get file metadata
    const metadata = await FileSystemUtils.getFileMetadata(filePath);

    return {
      path: filePath,
      content,
      originalPath: exists ? filePath : undefined,
      backupPath,
      permissions: metadata.permissions,
      overwritten,
      size: metadata.size,
      checksum: metadata.checksum,
    };
  }

  /**
   * Ensure output directory exists
   */
  private async ensureOutputDirectory(outputDir: string): Promise<void> {
    await FileSystemUtils.ensureDirectory(outputDir);
  }

  /**
   * Validate file path
   */
  private async validatePath(filePath: string): Promise<void> {
    // Check for path traversal attempts
    const normalized = path.normalize(filePath);
    if (normalized.includes('..')) {
      throw new Error(`Invalid path: ${filePath} (contains path traversal)`);
    }

    // Check path length
    if (filePath.length > 260) {
      throw new Error(`Path too long: ${filePath}`);
    }

    // Check for invalid characters
    const invalidChars = /[<>:"|?*]/;
    if (invalidChars.test(filePath)) {
      throw new Error(`Invalid characters in path: ${filePath}`);
    }
  }

  /**
   * Generate directory structure
   */
  async generateDirectories(
    directories: string[],
    options: FileGenerationOptions
  ): Promise<GeneratedDirectory[]> {
    const results: GeneratedDirectory[] = [];

    for (const dirPath of directories) {
      try {
        const fullPath = path.join(options.outputDir, dirPath);
        const exists = await FileSystemUtils.directoryExists(fullPath);

        if (!exists) {
          await FileSystemUtils.ensureDirectory(fullPath);
          results.push({
            path: fullPath,
            created: true,
            existing: false,
          });
        } else {
          results.push({
            path: fullPath,
            created: false,
            existing: true,
          });
        }
      } catch (error) {
        throw new Error(`Failed to create directory ${dirPath}: ${error}`);
      }
    }

    return results;
  }

  /**
   * Preview file generation without creating files
   */
  async previewGeneration(
    templateFiles: TemplateFileDefinition[],
    variables: Record<string, any>,
    options: FileGenerationOptions
  ): Promise<{
    files: Array<{
      path: string;
      content: string;
      wouldCreate: boolean;
      wouldOverwrite: boolean;
    }>;
    directories: string[];
    conflicts: FileConflict[];
    warnings: string[];
  }> {
    const files: Array<{
      path: string;
      content: string;
      wouldCreate: boolean;
      wouldOverwrite: boolean;
    }> = [];
    const directories: string[] = [];
    const conflicts: FileConflict[] = [];
    const warnings: string[] = [];

    for (const templateFile of templateFiles) {
      try {
        // Resolve path
        const resolvedPath = await this.resolveFilePath(
          templateFile.path,
          variables,
          options
        );

        // Check condition
        if (templateFile.condition) {
          const shouldGenerate = await this.evaluateCondition(
            templateFile.condition,
            variables
          );
          if (!shouldGenerate) {
            warnings.push(
              `Would skip ${templateFile.path} (condition not met: ${templateFile.condition})`
            );
            continue;
          }
        }

        // Render content
        const renderedContent = await this.renderer.renderTemplate(
          templateFile.content,
          variables
        );

        // Check if file exists
        const exists = await FileSystemUtils.fileExists(resolvedPath);

        // Check for conflicts
        if (exists) {
          const conflict = await this.detectFileConflict(resolvedPath, options);
          if (conflict) {
            conflicts.push(conflict);
          }
        }

        files.push({
          path: resolvedPath,
          content: renderedContent.content,
          wouldCreate: !exists,
          wouldOverwrite:
            exists && (options.overwrite || templateFile.overwrite || false),
        });

        // Add directory to list
        const dir = path.dirname(resolvedPath);
        if (!directories.includes(dir)) {
          directories.push(dir);
        }
      } catch (error) {
        warnings.push(`Failed to preview ${templateFile.path}: ${error}`);
      }
    }

    return { files, directories, conflicts, warnings };
  }

  /**
   * Rollback file generation
   */
  async rollbackGeneration(
    generatedFiles: GeneratedFile[],
    _options: FileGenerationOptions
  ): Promise<{
    success: boolean;
    rolledBack: number;
    errors: string[];
  }> {
    let rolledBack = 0;
    const errors: string[] = [];

    for (const file of generatedFiles) {
      try {
        if (file.backupPath && file.overwritten) {
          // Restore from backup
          await FileSystemUtils.safeWriteFile(
            file.path,
            await FileSystemUtils.readFile(file.backupPath),
            true
          );
          await FileSystemUtils.safeWriteFile(file.backupPath, '', true); // Clean up backup
        } else if (!file.overwritten) {
          // Delete newly created file
          await FileSystemUtils.safeWriteFile(file.path, '', true);
        }
        rolledBack++;
      } catch (error) {
        errors.push(`Failed to rollback ${file.path}: ${error}`);
      }
    }

    return {
      success: errors.length === 0,
      rolledBack,
      errors,
    };
  }
}
