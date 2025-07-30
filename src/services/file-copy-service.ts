import * as fs from 'fs';
import * as path from 'path';
import { GuideInfo, CopyResult, ValidationResult } from '../config/types';

/**
 * Service for copying development guide files
 */
export class FileCopyService {
  /**
   * Copy developmentGuide.md from guide to target directory
   */
  copyGuide(guide: GuideInfo, targetDir: string): CopyResult {
    try {
      const sourcePath = path.join(guide.folderPath, 'developmentGuide.md');
      const targetPath = path.join(targetDir, '.memory-bank', 'developmentGuide.md');

      // Ensure target directory exists first
      const targetDirectory = path.dirname(targetPath);
      if (!fs.existsSync(targetDirectory)) {
        fs.mkdirSync(targetDirectory, { recursive: true });
      }

      // Check if target file already exists
      const overwritten = fs.existsSync(targetPath);

      // Check if source file exists
      if (!fs.existsSync(sourcePath)) {
        return {
          success: false,
          error: `Source file not found: ${sourcePath}`,
        };
      }

      // Read source file
      const content = fs.readFileSync(sourcePath, 'utf8');

      // Write to target file
      fs.writeFileSync(targetPath, content, 'utf8');

      return {
        success: true,
        copiedFilePath: targetPath,
        overwritten,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during file copy',
      };
    }
  }

  /**
   * Copy .cursorrules from guide to target directory
   */
  copyCursorRules(guide: GuideInfo, targetDir: string): CopyResult {
    try {
      const sourcePath = path.join(guide.folderPath, '.cursorrules');
      const targetPath = path.join(targetDir, '.cursorrules');

      // Check if target file already exists
      const overwritten = fs.existsSync(targetPath);

      // Check if source file exists
      if (!fs.existsSync(sourcePath)) {
        return {
          success: false,
          error: `Source file not found: ${sourcePath}`,
        };
      }

      // Read source file
      const content = fs.readFileSync(sourcePath, 'utf8');

      // Write to target file
      fs.writeFileSync(targetPath, content, 'utf8');

      return {
        success: true,
        copiedFilePath: targetPath,
        overwritten,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during file copy',
      };
    }
  }

  /**
   * Validate target directory for file operations
   */
  validateTargetDirectory(targetDir: string): ValidationResult {
    try {
      // Check for empty directory
      if (!targetDir || targetDir.trim() === '') {
        return {
          isValid: false,
          error: 'Target directory cannot be empty',
        };
      }

      // Check if directory exists
      if (!fs.existsSync(targetDir)) {
        return {
          isValid: false,
          error: `Target directory does not exist: ${targetDir}`,
        };
      }

      // Check if path is a directory
      const stats = fs.statSync(targetDir);
      if (!stats.isDirectory()) {
        return {
          isValid: false,
          error: `Target path is not a directory: ${targetDir}`,
        };
      }

      return {
        isValid: true,
      };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown error during validation',
      };
    }
  }

  /**
   * Copy all guide files (developmentGuide.md and .cursorrules if available)
   */
  copyGuideFiles(guide: GuideInfo, targetDir: string): CopyResult[] {
    const results: CopyResult[] = [];

    // Validate target directory first
    const validation = this.validateTargetDirectory(targetDir);
    if (!validation.isValid) {
      return [{
        success: false,
        error: validation.error || 'Target directory validation failed',
      }];
    }

    // Always copy developmentGuide.md
    const guideResult = this.copyGuide(guide, targetDir);
    results.push(guideResult);

    // Copy .cursorrules if available
    if (guide.hasCursorRules) {
      const cursorResult = this.copyCursorRules(guide, targetDir);
      results.push(cursorResult);
    }

    return results;
  }

  /**
   * Copy developmentGuide.md with backup and rollback support
   */
  copyGuideWithBackup(guide: GuideInfo, targetDir: string): CopyResult {
    try {
      const sourcePath = path.join(guide.folderPath, 'developmentGuide.md');
      const targetPath = path.join(targetDir, '.memory-bank', 'developmentGuide.md');

      // Ensure target directory exists first
      const targetDirectory = path.dirname(targetPath);
      if (!fs.existsSync(targetDirectory)) {
        fs.mkdirSync(targetDirectory, { recursive: true });
      }

      // Check if target file already exists
      const overwritten = fs.existsSync(targetPath);

      // Check if source file exists
      if (!fs.existsSync(sourcePath)) {
        return {
          success: false,
          error: `Source file not found: ${sourcePath}`,
        };
      }

      let backupPath: string | undefined;

      // Create backup if overwriting
      if (overwritten) {
        backupPath = this.generateBackupPath(targetPath, Date.now());
        const existingContent = fs.readFileSync(targetPath, 'utf8');
        fs.writeFileSync(backupPath, existingContent, 'utf8');
      }

      // Read source file
      const content = fs.readFileSync(sourcePath, 'utf8');

      try {
        // Write to target file
        fs.writeFileSync(targetPath, content, 'utf8');

        return {
          success: true,
          copiedFilePath: targetPath,
          overwritten,
          backupPath,
        };
      } catch (writeError) {
        // Rollback if write fails and we have a backup
        if (backupPath) {
          try {
            const restoreResult = this.restoreFromBackup(targetPath, backupPath);
            if (restoreResult.success) {
              return {
                success: false,
                error: writeError instanceof Error ? writeError.message : 'Unknown write error',
                rolledBack: true,
                backupPath,
              };
            } else {
              return {
                success: false,
                error: writeError instanceof Error ? writeError.message : 'Unknown write error',
                rolledBack: false,
                rollbackError: restoreResult.error || 'Rollback failed',
                backupPath,
              };
            }
          } catch (rollbackError) {
            return {
              success: false,
              error: writeError instanceof Error ? writeError.message : 'Unknown write error',
              rolledBack: false,
              rollbackError: rollbackError instanceof Error ? rollbackError.message : 'Rollback failed',
              backupPath,
            };
          }
        }

        return {
          success: false,
          error: writeError instanceof Error ? writeError.message : 'Unknown write error',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during file copy',
      };
    }
  }

  /**
   * Copy .cursorrules with backup and rollback support
   */
  copyCursorRulesWithBackup(guide: GuideInfo, targetDir: string): CopyResult {
    try {
      const sourcePath = path.join(guide.folderPath, '.cursorrules');
      const targetPath = path.join(targetDir, '.cursorrules');

      // Check if target file already exists
      const overwritten = fs.existsSync(targetPath);

      // Check if source file exists
      if (!fs.existsSync(sourcePath)) {
        return {
          success: false,
          error: `Source file not found: ${sourcePath}`,
        };
      }

      let backupPath: string | undefined;

      // Create backup if overwriting
      if (overwritten) {
        backupPath = this.generateBackupPath(targetPath, Date.now());
        const existingContent = fs.readFileSync(targetPath, 'utf8');
        fs.writeFileSync(backupPath, existingContent, 'utf8');
      }

      // Read source file
      const content = fs.readFileSync(sourcePath, 'utf8');

      try {
        // Write to target file
        fs.writeFileSync(targetPath, content, 'utf8');

        return {
          success: true,
          copiedFilePath: targetPath,
          overwritten,
          backupPath,
        };
      } catch (writeError) {
        // Rollback if write fails and we have a backup
        if (backupPath) {
          try {
            const restoreResult = this.restoreFromBackup(targetPath, backupPath);
            if (restoreResult.success) {
              return {
                success: false,
                error: writeError instanceof Error ? writeError.message : 'Unknown write error',
                rolledBack: true,
                backupPath,
              };
            } else {
              return {
                success: false,
                error: writeError instanceof Error ? writeError.message : 'Unknown write error',
                rolledBack: false,
                rollbackError: restoreResult.error || 'Rollback failed',
                backupPath,
              };
            }
          } catch (rollbackError) {
            return {
              success: false,
              error: writeError instanceof Error ? writeError.message : 'Unknown write error',
              rolledBack: false,
              rollbackError: rollbackError instanceof Error ? rollbackError.message : 'Rollback failed',
              backupPath,
            };
          }
        }

        return {
          success: false,
          error: writeError instanceof Error ? writeError.message : 'Unknown write error',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during file copy',
      };
    }
  }

  /**
   * Copy all guide files with backup and rollback support
   */
  copyGuideFilesWithBackup(guide: GuideInfo, targetDir: string): CopyResult[] {
    const results: CopyResult[] = [];

    // Validate target directory first
    const validation = this.validateTargetDirectory(targetDir);
    if (!validation.isValid) {
      return [{
        success: false,
        error: validation.error || 'Target directory validation failed',
      }];
    }

    // Always copy developmentGuide.md with backup
    const guideResult = this.copyGuideWithBackup(guide, targetDir);
    results.push(guideResult);

    // Copy .cursorrules with backup if available
    if (guide.hasCursorRules) {
      const cursorResult = this.copyCursorRulesWithBackup(guide, targetDir);
      results.push(cursorResult);
    }

    return results;
  }

  /**
   * Detect if a file conflict exists at the target path
   */
  detectConflict(targetPath: string): boolean {
    return fs.existsSync(targetPath);
  }

  /**
   * Generate a unique backup path for a file
   */
  generateBackupPath(originalPath: string, timestamp: number): string {
    const dir = path.dirname(originalPath);
    const ext = path.extname(originalPath);
    const base = path.basename(originalPath, ext);
    return path.join(dir, `${base}.backup.${timestamp}${ext}`);
  }

  /**
   * Restore a file from its backup
   */
  restoreFromBackup(originalPath: string, backupPath: string): CopyResult {
    try {
      // Check if backup file exists
      if (!fs.existsSync(backupPath)) {
        return {
          success: false,
          error: `Backup file not found: ${backupPath}`,
        };
      }

      // Read backup content
      const content = fs.readFileSync(backupPath, 'utf8');

      // Write to original location
      fs.writeFileSync(originalPath, content, 'utf8');

      return {
        success: true,
        copiedFilePath: originalPath,
        overwritten: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during restore',
      };
    }
  }
} 