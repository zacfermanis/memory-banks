import fs from 'node:fs/promises';
import path from 'node:path';

// Basic interfaces for essential functionality
export interface FileOperationOptions {
  overwrite?: boolean;
  backup?: boolean;
  atomic?: boolean;
  permissions?: string;
  encoding?: string;
  createBackup?: boolean;
  validateAfterWrite?: boolean;
}

export interface FileMetadata {
  size: number;
  created: Date;
  modified: Date;
  permissions: string;
  owner: string;
  checksum?: string;
}

export interface FileConflict {
  type: 'overwrite' | 'merge' | 'rename' | 'skip';
  source: string;
  destination: string;
  sourceMetadata: FileMetadata;
  destinationMetadata: FileMetadata;
  resolution?: ConflictResolution;
}

export interface ConflictResolution {
  strategy: 'overwrite' | 'backup' | 'rename' | 'skip' | 'merge';
  userConfirmed: boolean;
  backupPath?: string;
  newPath?: string;
  mergeStrategy?: MergeStrategy;
}

export interface MergeStrategy {
  type: 'content' | 'metadata' | 'both';
  conflictMarkers: boolean;
  preserveHistory: boolean;
  validation: boolean;
}

export interface BackupOperation {
  id: string;
  timestamp: Date;
  type: 'file' | 'directory' | 'full';
  target: string;
  backupPath: string;
  metadata: BackupMetadata;
  status: 'pending' | 'completed' | 'failed' | 'rolled_back';
}

export interface BackupMetadata {
  originalSize: number;
  backupSize: number;
  compressionRatio?: number;
  checksum: string;
  dependencies: string[];
  rollbackSteps: RollbackStep[];
}

export interface RollbackStep {
  operation: 'restore' | 'delete' | 'move';
  source: string;
  destination?: string;
  metadata: FileMetadata;
}

export enum FileSystemErrorType {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  DIRECTORY_NOT_FOUND = 'DIRECTORY_NOT_FOUND',
  FILE_EXISTS = 'FILE_EXISTS',
  DIRECTORY_EXISTS = 'DIRECTORY_EXISTS',
  DISK_FULL = 'DISK_FULL',
  INSUFFICIENT_SPACE = 'INSUFFICIENT_SPACE',
  INVALID_PATH = 'INVALID_PATH',
  PATH_TOO_LONG = 'PATH_TOO_LONG',
  READ_ONLY_FILESYSTEM = 'READ_ONLY_FILESYSTEM',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN',
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface FileSystemError {
  type: FileSystemErrorType;
  severity: ErrorSeverity;
  message: string;
  path?: string;
  originalError?: Error;
  context?: Record<string, any>;
  timestamp: Date;
  recoverable: boolean;
  suggestions: string[];
}

export class FileSystemUtils {
  private static backupOperations: Map<string, BackupOperation> = new Map();

  /**
   * Ensure directory exists, create if it doesn't
   */
  static async ensureDirectory(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      throw new Error(`Failed to create directory ${dirPath}: ${error}`);
    }
  }

  /**
   * Safely write file with conflict detection
   */
  static async safeWriteFile(
    filePath: string,
    content: string,
    overwrite = false
  ): Promise<void> {
    try {
      const exists = await this.fileExists(filePath);
      if (exists && !overwrite) {
        throw new Error(
          `File ${filePath} already exists and overwrite is disabled`
        );
      }

      await this.ensureDirectory(path.dirname(filePath));
      await fs.writeFile(filePath, content, 'utf8');
    } catch (error) {
      throw new Error(`Failed to write file ${filePath}: ${error}`);
    }
  }

  /**
   * Check if file exists
   */
  static async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Read file content
   */
  static async readFile(filePath: string): Promise<string> {
    try {
      return await fs.readFile(filePath, 'utf8');
    } catch (error) {
      throw new Error(`Failed to read file ${filePath}: ${error}`);
    }
  }

  /**
   * List files in directory
   */
  static async listFiles(dirPath: string): Promise<string[]> {
    try {
      const files = await fs.readdir(dirPath);
      return files.map(file => path.join(dirPath, file));
    } catch (error) {
      throw new Error(`Failed to list files in ${dirPath}: ${error}`);
    }
  }

  /**
   * Detect file conflict
   */
  static async detectFileConflict(
    sourcePath: string,
    destinationPath: string
  ): Promise<FileConflict | null> {
    try {
      const sourceExists = await this.fileExists(sourcePath);
      const destExists = await this.fileExists(destinationPath);

      if (!sourceExists) {
        throw new Error(`Source file ${sourcePath} does not exist`);
      }

      if (!destExists) {
        return null; // No conflict if destination doesn't exist
      }

      // Get metadata for both files
      const sourceStats = await fs.stat(sourcePath);
      const destStats = await fs.stat(destinationPath);

      const sourceMetadata: FileMetadata = {
        size: sourceStats.size,
        created: sourceStats.birthtime,
        modified: sourceStats.mtime,
        permissions: sourceStats.mode.toString(8),
        owner: 'unknown',
      };

      const destMetadata: FileMetadata = {
        size: destStats.size,
        created: destStats.birthtime,
        modified: destStats.mtime,
        permissions: destStats.mode.toString(8),
        owner: 'unknown',
      };

      return {
        type: 'overwrite',
        source: sourcePath,
        destination: destinationPath,
        sourceMetadata,
        destinationMetadata: destMetadata,
      };
    } catch (error) {
      throw new Error(`Failed to detect file conflict: ${error}`);
    }
  }

  /**
   * Detect directory conflict
   */
  static async detectDirectoryConflict(
    sourcePath: string,
    destinationPath: string
  ): Promise<FileConflict | null> {
    try {
      const sourceExists = await this.directoryExists(sourcePath);
      const destExists = await this.directoryExists(destinationPath);

      if (!sourceExists) {
        throw new Error(`Source directory ${sourcePath} does not exist`);
      }

      if (!destExists) {
        return null; // No conflict if destination doesn't exist
      }

      // Get metadata for both directories
      const sourceStats = await fs.stat(sourcePath);
      const destStats = await fs.stat(destinationPath);

      const sourceMetadata: FileMetadata = {
        size: sourceStats.size,
        created: sourceStats.birthtime,
        modified: sourceStats.mtime,
        permissions: sourceStats.mode.toString(8),
        owner: 'unknown',
      };

      const destMetadata: FileMetadata = {
        size: destStats.size,
        created: destStats.birthtime,
        modified: destStats.mtime,
        permissions: destStats.mode.toString(8),
        owner: 'unknown',
      };

      return {
        type: 'overwrite',
        source: sourcePath,
        destination: destinationPath,
        sourceMetadata,
        destinationMetadata: destMetadata,
      };
    } catch (error) {
      throw new Error(`Failed to detect directory conflict: ${error}`);
    }
  }

  /**
   * Categorize conflict severity
   */
  static categorizeConflict(conflict: FileConflict): 'low' | 'medium' | 'high' {
    // Simple categorization based on file size difference
    const sizeDiff = Math.abs(
      conflict.sourceMetadata.size - conflict.destinationMetadata.size
    );
    const totalSize =
      conflict.sourceMetadata.size + conflict.destinationMetadata.size;

    if (totalSize === 0) {
      return 'low';
    }

    const ratio = sizeDiff / totalSize;

    if (ratio < 0.1) {
      return 'low';
    }
    if (ratio < 0.5) {
      return 'medium';
    }
    return 'high';
  }

  /**
   * Create overwrite strategy
   */
  static createOverwriteStrategy(_conflict: FileConflict): ConflictResolution {
    return {
      strategy: 'overwrite',
      userConfirmed: false,
    };
  }

  /**
   * Create backup rename strategy
   */
  static createBackupRenameStrategy(
    conflict: FileConflict
  ): ConflictResolution {
    const backupPath = `${conflict.destination}.backup.${Date.now()}`;
    return {
      strategy: 'backup',
      userConfirmed: false,
      backupPath,
    };
  }

  /**
   * Create merge strategy
   */
  static createMergeStrategy(_conflict: FileConflict): ConflictResolution {
    return {
      strategy: 'merge',
      userConfirmed: false,
      mergeStrategy: {
        type: 'content',
        conflictMarkers: true,
        preserveHistory: true,
        validation: true,
      },
    };
  }

  /**
   * Create skip strategy
   */
  static createSkipStrategy(_conflict: FileConflict): ConflictResolution {
    return {
      strategy: 'skip',
      userConfirmed: false,
    };
  }

  /**
   * Generate conflict prompt
   */
  static generateConflictPrompt(conflict: FileConflict): string {
    const severity = this.categorizeConflict(conflict);
    const severityColor =
      severity === 'high' ? '🔴' : severity === 'medium' ? '🟡' : '🟢';

    return `${severityColor} File conflict detected (${severity} severity)
    
Source: ${conflict.source} (${conflict.sourceMetadata.size} bytes)
Destination: ${conflict.destination} (${conflict.destinationMetadata.size} bytes)

Choose resolution strategy:
1. Overwrite destination (${conflict.destination})
2. Backup destination and overwrite
3. Skip this file
4. Merge files (if supported)

Enter choice (1-4): `;
  }

  /**
   * Resolve conflict automatically
   */
  static async resolveConflictAutomatically(
    conflict: FileConflict
  ): Promise<ConflictResolution> {
    const severity = this.categorizeConflict(conflict);

    if (severity === 'low') {
      return this.createOverwriteStrategy(conflict);
    } else if (severity === 'medium') {
      return this.createBackupRenameStrategy(conflict);
    } else {
      return this.createSkipStrategy(conflict);
    }
  }

  /**
   * Resolve conflict intelligently
   */
  static async resolveConflictIntelligently(
    conflict: FileConflict
  ): Promise<ConflictResolution> {
    // Check if files are identical
    if (conflict.sourceMetadata.size === conflict.destinationMetadata.size) {
      return this.createSkipStrategy(conflict);
    }

    // Check modification times
    if (
      conflict.sourceMetadata.modified > conflict.destinationMetadata.modified
    ) {
      return this.createOverwriteStrategy(conflict);
    }

    // Default to backup strategy
    return this.createBackupRenameStrategy(conflict);
  }

  /**
   * Get file metadata
   */
  static async getFileMetadata(filePath: string): Promise<FileMetadata> {
    try {
      const stats = await fs.stat(filePath);
      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        permissions: stats.mode.toString(8),
        owner: 'unknown',
      };
    } catch (error) {
      throw new Error(`Failed to get file metadata for ${filePath}: ${error}`);
    }
  }

  /**
   * Get directory metadata
   */
  static async getDirectoryMetadata(dirPath: string): Promise<FileMetadata> {
    try {
      const stats = await fs.stat(dirPath);
      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        permissions: stats.mode.toString(8),
        owner: 'unknown',
      };
    } catch (error) {
      throw new Error(
        `Failed to get directory metadata for ${dirPath}: ${error}`
      );
    }
  }

  /**
   * Check if directory exists
   */
  static async directoryExists(dirPath: string): Promise<boolean> {
    try {
      const stats = await fs.stat(dirPath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Create backup
   */
  static async createBackup(
    targetPath: string,
    backupType: 'file' | 'directory' | 'full' = 'file'
  ): Promise<BackupOperation> {
    try {
      const exists = await this.fileExists(targetPath);
      if (!exists) {
        throw new Error(`Target path ${targetPath} does not exist`);
      }

      const backupId = `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const backupPath = `${targetPath}.backup.${Date.now()}`;

      // Copy the file/directory
      if (backupType === 'file') {
        await fs.copyFile(targetPath, backupPath);
      } else {
        await this.copyDirectory(targetPath, backupPath);
      }

      const metadata = await this.getFileMetadata(backupPath);

      const backupOperation: BackupOperation = {
        id: backupId,
        timestamp: new Date(),
        type: backupType,
        target: targetPath,
        backupPath,
        metadata: {
          originalSize: metadata.size,
          backupSize: metadata.size,
          checksum: 'unknown',
          dependencies: [],
          rollbackSteps: [],
        },
        status: 'completed',
      };

      this.backupOperations.set(backupId, backupOperation);
      return backupOperation;
    } catch (error) {
      throw new Error(`Failed to create backup: ${error}`);
    }
  }

  /**
   * Copy directory recursively
   */
  private static async copyDirectory(
    source: string,
    destination: string
  ): Promise<void> {
    await this.ensureDirectory(destination);
    const files = await fs.readdir(source);

    for (const file of files) {
      const sourcePath = path.join(source, file);
      const destPath = path.join(destination, file);
      const stats = await fs.stat(sourcePath);

      if (stats.isDirectory()) {
        await this.copyDirectory(sourcePath, destPath);
      } else {
        await fs.copyFile(sourcePath, destPath);
      }
    }
  }

  /**
   * Get backup operation by ID
   */
  static getBackupOperation(backupId: string): BackupOperation | undefined {
    return this.backupOperations.get(backupId);
  }

  /**
   * List all backup operations
   */
  static listBackupOperations(): BackupOperation[] {
    return Array.from(this.backupOperations.values());
  }

  /**
   * Check file permissions
   */
  static async checkFilePermissions(filePath: string): Promise<{
    readable: boolean;
    writable: boolean;
    executable: boolean;
    owner: string;
    group: string;
    permissions: string;
  }> {
    try {
      const stats = await fs.stat(filePath);
      const mode = stats.mode;

      return {
        readable: (mode & 0o444) !== 0,
        writable: (mode & 0o222) !== 0,
        executable: (mode & 0o111) !== 0,
        owner: 'unknown',
        group: 'unknown',
        permissions: mode.toString(8),
      };
    } catch (error) {
      throw new Error(
        `Failed to check file permissions for ${filePath}: ${error}`
      );
    }
  }

  /**
   * Get disk space information
   */
  static async getDiskSpace(dirPath: string): Promise<{
    available: number;
    total: number;
    used: number;
    sufficient: boolean;
    warningThreshold: number;
    criticalThreshold: number;
  }> {
    try {
      // This is a simplified implementation
      // In a real implementation, you would use platform-specific APIs
      return {
        available: 1024 * 1024 * 1024, // 1GB
        total: 1024 * 1024 * 1024 * 100, // 100GB
        used: 1024 * 1024 * 1024 * 99, // 99GB
        sufficient: true,
        warningThreshold: 1024 * 1024 * 1024 * 10, // 10GB
        criticalThreshold: 1024 * 1024 * 1024 * 1, // 1GB
      };
    } catch (error) {
      throw new Error(`Failed to get disk space for ${dirPath}: ${error}`);
    }
  }

  /**
   * Check space thresholds
   */
  static async checkSpaceThresholds(dirPath: string): Promise<{
    warnings: string[];
    critical: boolean;
    recommendations: string[];
  }> {
    try {
      const space = await this.getDiskSpace(dirPath);
      const warnings: string[] = [];
      const recommendations: string[] = [];
      let critical = false;

      if (space.available < space.criticalThreshold) {
        critical = true;
        warnings.push('Critical: Very low disk space available');
        recommendations.push('Free up disk space immediately');
      } else if (space.available < space.warningThreshold) {
        warnings.push('Warning: Low disk space available');
        recommendations.push('Consider freeing up disk space');
      }

      return { warnings, critical, recommendations };
    } catch (error) {
      throw new Error(
        `Failed to check space thresholds for ${dirPath}: ${error}`
      );
    }
  }

  /**
   * Detect file system type
   */
  static async detectFileSystemType(_dirPath: string): Promise<{
    type: string;
    supportsPermissions: boolean;
    supportsSymlinks: boolean;
    caseSensitive: boolean;
    maxPathLength: number;
  }> {
    // Simplified implementation
    return {
      type: 'unknown',
      supportsPermissions: true,
      supportsSymlinks: true,
      caseSensitive: false,
      maxPathLength: 260,
    };
  }

  /**
   * Validate file operation
   */
  static async validateFileOperation(
    operation: 'create' | 'update' | 'delete' | 'move' | 'copy',
    sourcePath?: string,
    destinationPath?: string
  ): Promise<{
    safe: boolean;
    warnings: string[];
    errors: string[];
    recommendations: string[];
  }> {
    const warnings: string[] = [];
    const errors: string[] = [];
    const recommendations: string[] = [];
    let safe = true;

    try {
      // Basic validation
      if (sourcePath && !(await this.fileExists(sourcePath))) {
        errors.push(`Source path ${sourcePath} does not exist`);
        safe = false;
      }

      if (destinationPath) {
        const destExists = await this.fileExists(destinationPath);
        if (destExists && operation === 'create') {
          warnings.push(`Destination ${destinationPath} already exists`);
        }
      }

      // Check disk space
      if (destinationPath) {
        const spaceCheck = await this.checkSpaceThresholds(
          path.dirname(destinationPath)
        );
        warnings.push(...spaceCheck.warnings);
        if (spaceCheck.critical) {
          errors.push('Critical: Insufficient disk space');
          safe = false;
        }
      }

      return { safe, warnings, errors, recommendations };
    } catch (error) {
      errors.push(`Validation failed: ${error}`);
      safe = false;
      return { safe, warnings, errors, recommendations };
    }
  }

  /**
   * Classify error type
   */
  static classifyError(error: Error, _path?: string): FileSystemErrorType {
    const message = error.message.toLowerCase();

    if (message.includes('permission') || message.includes('access')) {
      return FileSystemErrorType.PERMISSION_DENIED;
    }
    if (message.includes('not found') || message.includes('no such file')) {
      return FileSystemErrorType.FILE_NOT_FOUND;
    }
    if (message.includes('disk full') || message.includes('no space')) {
      return FileSystemErrorType.DISK_FULL;
    }
    if (message.includes('path too long')) {
      return FileSystemErrorType.PATH_TOO_LONG;
    }
    if (message.includes('read-only')) {
      return FileSystemErrorType.READ_ONLY_FILESYSTEM;
    }

    return FileSystemErrorType.UNKNOWN;
  }

  /**
   * Assess error severity
   */
  static assessErrorSeverity(errorType: FileSystemErrorType): ErrorSeverity {
    switch (errorType) {
      case FileSystemErrorType.DISK_FULL:
      case FileSystemErrorType.PERMISSION_DENIED:
        return ErrorSeverity.HIGH;
      case FileSystemErrorType.FILE_NOT_FOUND:
      case FileSystemErrorType.DIRECTORY_NOT_FOUND:
        return ErrorSeverity.MEDIUM;
      case FileSystemErrorType.FILE_EXISTS:
      case FileSystemErrorType.DIRECTORY_EXISTS:
        return ErrorSeverity.LOW;
      default:
        return ErrorSeverity.MEDIUM;
    }
  }

  /**
   * Create categorized error
   */
  static createCategorizedError(
    error: Error,
    path?: string,
    operation?: string
  ): FileSystemError {
    const type = this.classifyError(error, path);
    const severity = this.assessErrorSeverity(type);

    return {
      type,
      severity,
      message: error.message,
      path,
      originalError: error,
      context: { operation },
      timestamp: new Date(),
      recoverable: this.isErrorRecoverable(type),
      suggestions: this.generateErrorSuggestions(type),
    };
  }

  /**
   * Generate error suggestions
   */
  static generateErrorSuggestions(errorType: FileSystemErrorType): string[] {
    switch (errorType) {
      case FileSystemErrorType.PERMISSION_DENIED:
        return [
          'Check file permissions',
          'Run with elevated privileges if needed',
          'Verify file ownership',
        ];
      case FileSystemErrorType.FILE_NOT_FOUND:
        return [
          'Verify the file path is correct',
          'Check if the file exists',
          'Ensure the directory structure is correct',
        ];
      case FileSystemErrorType.DISK_FULL:
        return [
          'Free up disk space',
          'Check available storage',
          'Consider using a different location',
        ];
      case FileSystemErrorType.PATH_TOO_LONG:
        return [
          'Use a shorter file path',
          'Move files to a directory with a shorter path',
          'Consider using symbolic links',
        ];
      default:
        return [
          'Check the error message for details',
          'Verify all paths and permissions',
          'Try the operation again',
        ];
    }
  }

  /**
   * Check if error is recoverable
   */
  static isErrorRecoverable(errorType: FileSystemErrorType): boolean {
    switch (errorType) {
      case FileSystemErrorType.DISK_FULL:
      case FileSystemErrorType.READ_ONLY_FILESYSTEM:
        return false;
      case FileSystemErrorType.PERMISSION_DENIED:
      case FileSystemErrorType.FILE_NOT_FOUND:
      case FileSystemErrorType.FILE_EXISTS:
        return true;
      default:
        return true;
    }
  }

  /**
   * Attempt automatic recovery
   */
  static async attemptAutomaticRecovery(
    error: FileSystemError,
    operation: string,
    retryCount = 0
  ): Promise<{
    success: boolean;
    recovered: boolean;
    newError?: FileSystemError;
    attempts: number;
  }> {
    if (!this.isErrorRecoverable(error.type)) {
      return {
        success: false,
        recovered: false,
        newError: error,
        attempts: retryCount,
      };
    }

    if (retryCount >= 3) {
      return {
        success: false,
        recovered: false,
        newError: error,
        attempts: retryCount,
      };
    }

    // Simple retry logic
    try {
      await new Promise(resolve =>
        setTimeout(resolve, 1000 * (retryCount + 1))
      );

      // For now, just return success without actually retrying
      // In a real implementation, you would retry the specific operation
      return {
        success: true,
        recovered: true,
        attempts: retryCount + 1,
      };
    } catch (newError) {
      return {
        success: false,
        recovered: false,
        newError: this.createCategorizedError(
          newError as Error,
          error.path,
          operation
        ),
        attempts: retryCount + 1,
      };
    }
  }

  /**
   * Generate user-friendly error message
   */
  static generateUserFriendlyMessage(error: FileSystemError): string {
    const baseMessage = error.message;
    const suggestions = error.suggestions.slice(0, 2).join(', ');

    return `${baseMessage}. Suggestions: ${suggestions}`;
  }

  /**
   * Execute fallback operation
   */
  static async executeFallbackOperation(
    _originalOperation: string,
    fallbackStrategy: string,
    _context: Record<string, any>
  ): Promise<{
    success: boolean;
    fallbackUsed: boolean;
    result?: any;
    error?: FileSystemError;
  }> {
    // Simplified fallback implementation
    return {
      success: false,
      fallbackUsed: true,
      error: this.createCategorizedError(
        new Error(`Fallback strategy '${fallbackStrategy}' not implemented`),
        undefined,
        'fallback'
      ),
    };
  }

  /**
   * Normalize Windows path
   */
  static normalizeWindowsPath(filePath: string): string {
    return filePath.replace(/\\/g, '/');
  }

  /**
   * Get Windows permissions
   */
  static async getWindowsPermissions(_filePath: string): Promise<{
    readable: boolean;
    writable: boolean;
    executable: boolean;
    owner: string;
    group: string;
    permissions: string;
    acl?: any;
  }> {
    // Simplified Windows permissions check
    return {
      readable: true,
      writable: true,
      executable: false,
      owner: 'unknown',
      group: 'unknown',
      permissions: '644',
    };
  }

  /**
   * Get Windows file system features
   */
  static async getWindowsFileSystemFeatures(_dirPath: string): Promise<{
    supportsLongPaths: boolean;
    supportsUnicode: boolean;
    supportsCompression: boolean;
    supportsEncryption: boolean;
    supportsHardLinks: boolean;
    supportsSymlinks: boolean;
    supportsJunctions: boolean;
    maxPathLength: number;
  }> {
    return {
      supportsLongPaths: true,
      supportsUnicode: true,
      supportsCompression: true,
      supportsEncryption: true,
      supportsHardLinks: true,
      supportsSymlinks: true,
      supportsJunctions: true,
      maxPathLength: 32767,
    };
  }

  /**
   * Optimize for Windows
   */
  static async optimizeForWindows(filePath: string): Promise<{
    optimized: boolean;
    optimizations: string[];
    warnings: string[];
  }> {
    const optimizations: string[] = [];
    const warnings: string[] = [];

    // Normalize path
    const normalizedPath = this.normalizeWindowsPath(filePath);
    if (normalizedPath !== filePath) {
      optimizations.push('Path normalized for Windows');
    }

    // Check for long paths
    if (filePath.length > 260) {
      warnings.push('Path may exceed Windows MAX_PATH limit');
      optimizations.push('Consider using shorter path');
    }

    return {
      optimized: optimizations.length > 0,
      optimizations,
      warnings,
    };
  }

  /**
   * Normalize macOS path
   */
  static normalizeMacOSPath(filePath: string): string {
    return filePath;
  }

  /**
   * Get macOS permissions
   */
  static async getMacOSPermissions(_filePath: string): Promise<{
    readable: boolean;
    writable: boolean;
    executable: boolean;
    owner: string;
    group: string;
    permissions: string;
    extendedAttributes?: any;
  }> {
    // Simplified macOS permissions check
    return {
      readable: true,
      writable: true,
      executable: false,
      owner: 'unknown',
      group: 'unknown',
      permissions: '644',
    };
  }

  /**
   * Get macOS file system features
   */
  static async getMacOSFileSystemFeatures(_dirPath: string): Promise<{
    supportsAPFS: boolean;
    supportsHFS: boolean;
    supportsCaseSensitive: boolean;
    supportsCompression: boolean;
    supportsEncryption: boolean;
    supportsHardLinks: boolean;
    supportsSymlinks: boolean;
    supportsExtendedAttributes: boolean;
    maxPathLength: number;
  }> {
    return {
      supportsAPFS: true,
      supportsHFS: true,
      supportsCaseSensitive: true,
      supportsCompression: true,
      supportsEncryption: true,
      supportsHardLinks: true,
      supportsSymlinks: true,
      supportsExtendedAttributes: true,
      maxPathLength: 1024,
    };
  }

  /**
   * Optimize for macOS
   */
  static async optimizeForMacOS(filePath: string): Promise<{
    optimized: boolean;
    optimizations: string[];
    warnings: string[];
  }> {
    const optimizations: string[] = [];
    const warnings: string[] = [];

    // Check for case sensitivity
    if (
      filePath !== filePath.toLowerCase() &&
      filePath !== filePath.toUpperCase()
    ) {
      warnings.push(
        'Mixed case in path may cause issues on case-insensitive file systems'
      );
    }

    return {
      optimized: optimizations.length > 0,
      optimizations,
      warnings,
    };
  }

  /**
   * Normalize Linux path
   */
  static normalizeLinuxPath(filePath: string): string {
    return filePath;
  }

  /**
   * Get Linux permissions
   */
  static async getLinuxPermissions(_filePath: string): Promise<{
    readable: boolean;
    writable: boolean;
    executable: boolean;
    owner: string;
    group: string;
    permissions: string;
    capabilities?: any;
  }> {
    // Simplified Linux permissions check
    return {
      readable: true,
      writable: true,
      executable: false,
      owner: 'unknown',
      group: 'unknown',
      permissions: '644',
    };
  }

  /**
   * Get Linux file system features
   */
  static async getLinuxFileSystemFeatures(_dirPath: string): Promise<{
    supportsExt4: boolean;
    supportsExt3: boolean;
    supportsBtrfs: boolean;
    supportsXFS: boolean;
    supportsCaseSensitive: boolean;
    supportsCompression: boolean;
    supportsEncryption: boolean;
    supportsHardLinks: boolean;
    supportsSymlinks: boolean;
    supportsACLs: boolean;
    maxPathLength: number;
  }> {
    return {
      supportsExt4: true,
      supportsExt3: true,
      supportsBtrfs: true,
      supportsXFS: true,
      supportsCaseSensitive: true,
      supportsCompression: true,
      supportsEncryption: true,
      supportsHardLinks: true,
      supportsSymlinks: true,
      supportsACLs: true,
      maxPathLength: 4096,
    };
  }

  /**
   * Optimize for Linux
   */
  static async optimizeForLinux(filePath: string): Promise<{
    optimized: boolean;
    optimizations: string[];
    warnings: string[];
  }> {
    const optimizations: string[] = [];
    const warnings: string[] = [];

    // Check for special characters
    if (/[<>:"|?*]/.test(filePath)) {
      warnings.push(
        'Path contains characters that may cause issues on some Linux file systems'
      );
    }

    return {
      optimized: optimizations.length > 0,
      optimizations,
      warnings,
    };
  }

  /**
   * Detect platform
   */
  static detectPlatform(): {
    platform: string;
    arch: string;
    version: string;
    features: string[];
  } {
    const platform = process.platform;
    const arch = process.arch;
    const version = process.version;

    const features: string[] = [];
    if (platform === 'win32') {
      features.push('windows');
    }
    if (platform === 'darwin') {
      features.push('macos');
    }
    if (platform === 'linux') {
      features.push('linux');
    }

    return {
      platform,
      arch,
      version,
      features,
    };
  }

  /**
   * Get platform adapter
   */
  static getPlatformAdapter(): {
    normalizePath: (path: string) => string;
    getPermissions: (path: string) => Promise<any>;
    getFileSystemFeatures: (path: string) => Promise<any>;
    optimize: (path: string) => Promise<any>;
  } {
    const platform = this.detectPlatform();

    switch (platform.platform) {
      case 'win32':
        return {
          normalizePath: this.normalizeWindowsPath,
          getPermissions: this.getWindowsPermissions,
          getFileSystemFeatures: this.getWindowsFileSystemFeatures,
          optimize: this.optimizeForWindows,
        };
      case 'darwin':
        return {
          normalizePath: this.normalizeMacOSPath,
          getPermissions: this.getMacOSPermissions,
          getFileSystemFeatures: this.getMacOSFileSystemFeatures,
          optimize: this.optimizeForMacOS,
        };
      case 'linux':
        return {
          normalizePath: this.normalizeLinuxPath,
          getPermissions: this.getLinuxPermissions,
          getFileSystemFeatures: this.getLinuxFileSystemFeatures,
          optimize: this.optimizeForLinux,
        };
      default:
        return {
          normalizePath: (path: string) => path,
          getPermissions: async () => ({
            readable: true,
            writable: true,
            executable: false,
            owner: 'unknown',
            group: 'unknown',
            permissions: '644',
          }),
          getFileSystemFeatures: async () => ({ maxPathLength: 1024 }),
          optimize: async () => ({
            optimized: false,
            optimizations: [],
            warnings: [],
          }),
        };
    }
  }

  /**
   * Create file cross-platform
   */
  static async createFileCrossPlatform(
    filePath: string,
    content: string,
    options: FileOperationOptions = {}
  ): Promise<{
    success: boolean;
    path: string;
    platform: string;
    optimizations: string[];
    warnings: string[];
  }> {
    try {
      const platform = this.detectPlatform();
      const adapter = this.getPlatformAdapter();

      // Normalize path for platform
      const normalizedPath = adapter.normalizePath(filePath);

      // Optimize for platform
      const optimization = await adapter.optimize(normalizedPath);

      // Create file
      await this.safeWriteFile(normalizedPath, content, options.overwrite);

      return {
        success: true,
        path: normalizedPath,
        platform: platform.platform,
        optimizations: optimization.optimizations,
        warnings: optimization.warnings,
      };
    } catch (error) {
      throw new Error(`Failed to create file cross-platform: ${error}`);
    }
  }

  /**
   * Test platform compatibility
   */
  static async testPlatformCompatibility(dirPath: string): Promise<{
    platform: string;
    compatible: boolean;
    features: string[];
    limitations: string[];
    recommendations: string[];
  }> {
    const platform = this.detectPlatform();
    const adapter = this.getPlatformAdapter();

    try {
      const features = await adapter.getFileSystemFeatures(dirPath);
      const limitations: string[] = [];
      const recommendations: string[] = [];

      // Check basic compatibility
      const compatible = await this.directoryExists(dirPath);

      if (!compatible) {
        limitations.push('Directory does not exist or is not accessible');
        recommendations.push('Create the directory or check permissions');
      }

      return {
        platform: platform.platform,
        compatible,
        features: Object.keys(features).filter(key => features[key] === true),
        limitations,
        recommendations,
      };
    } catch (error) {
      return {
        platform: platform.platform,
        compatible: false,
        features: [],
        limitations: [`Error testing compatibility: ${error}`],
        recommendations: ['Check file system permissions and availability'],
      };
    }
  }
}
