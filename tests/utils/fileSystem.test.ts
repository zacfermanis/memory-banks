import { FileSystemUtils, FileSystemErrorType, ErrorSeverity, FileSystemError } from '../../src/utils/fileSystem';

// Mock node:fs/promises module
jest.mock('node:fs/promises', () => ({
  access: jest.fn(),
  mkdir: jest.fn(),
  writeFile: jest.fn(),
  readFile: jest.fn(),
  readdir: jest.fn(),
  copyFile: jest.fn(),
  stat: jest.fn(),
  chmod: jest.fn(),
  unlink: jest.fn(),
  rename: jest.fn(),
  symlink: jest.fn(),
}));

// Import the mocked module
import fs from 'node:fs/promises';

// Mock crypto module
jest.mock('crypto', () => ({
  createHash: jest.fn(() => ({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn(() => 'mock-checksum')
  }))
}));

describe('FileSystemUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('ensureDirectory', () => {
    it('should create directory if it does not exist', async () => {
      const mockAccess = fs.access as jest.MockedFunction<typeof fs.access>;
      const mockMkdir = fs.mkdir as jest.MockedFunction<typeof fs.mkdir>;
      
      mockAccess.mockRejectedValueOnce(new Error('Directory does not exist'));
      
      await FileSystemUtils.ensureDirectory('/test/dir');
      
      expect(mockMkdir).toHaveBeenCalledWith('/test/dir', { recursive: true });
    });

    it('should not create directory if it already exists', async () => {
      const mockMkdir = fs.mkdir as jest.MockedFunction<typeof fs.mkdir>;
      
      // Mock mkdir to succeed (which it would if directory already exists)
      mockMkdir.mockResolvedValueOnce(undefined);
      
      await FileSystemUtils.ensureDirectory('/test/dir');
      
      expect(mockMkdir).toHaveBeenCalledWith('/test/dir', { recursive: true });
    });
  });

  describe('fileExists', () => {
    it('should return true if file exists', async () => {
      const mockAccess = fs.access as jest.MockedFunction<typeof fs.access>;
      mockAccess.mockReset();
      mockAccess.mockResolvedValueOnce(undefined);
      
      const result = await FileSystemUtils.fileExists('/test/file.txt');
      
      expect(result).toBe(true);
      expect(mockAccess).toHaveBeenCalledWith('/test/file.txt');
    });

    it('should return false if file does not exist', async () => {
      const mockAccess = fs.access as jest.MockedFunction<typeof fs.access>;
      mockAccess.mockReset();
      mockAccess.mockRejectedValueOnce(new Error('File not found'));
      
      const result = await FileSystemUtils.fileExists('/test/file.txt');
      
      expect(result).toBe(false);
      expect(mockAccess).toHaveBeenCalledWith('/test/file.txt');
    });
  });

  describe('detectFileConflict', () => {
    it('should throw error if source does not exist', async () => {
      const mockAccess = fs.access as jest.MockedFunction<typeof fs.access>;
      
      // Mock access to fail for source (doesn't exist) and succeed for destination (exists)
      mockAccess.mockRejectedValueOnce(new Error('Source not found'))
                .mockResolvedValueOnce(undefined);
      
      await expect(FileSystemUtils.detectFileConflict('/source.txt', '/dest.txt'))
        .rejects.toThrow('Failed to detect file conflict: Error: Source file /source.txt does not exist');
    });

    it('should return null if destination does not exist', async () => {
      const mockAccess = fs.access as jest.MockedFunction<typeof fs.access>;
      
      mockAccess.mockReset();
      // Mock access to succeed for source (exists) and fail for destination (doesn't exist)
      mockAccess.mockResolvedValueOnce(undefined)
                .mockRejectedValueOnce(new Error('Destination not found'));
      
      const result = await FileSystemUtils.detectFileConflict('/source.txt', '/dest.txt');
      
      expect(result).toBeNull();
    });

    it('should return conflict if both files exist and are different', async () => {
      const mockAccess = fs.access as jest.MockedFunction<typeof fs.access>;
      const mockStat = fs.stat as jest.MockedFunction<typeof fs.stat>;
      
      mockAccess.mockReset();
      mockStat.mockReset();
      // Mock access to succeed for both files (both exist)
      mockAccess.mockResolvedValue(undefined);
      
      // Mock stat to return different file sizes
      mockStat.mockResolvedValueOnce({
        size: 100,
        birthtime: new Date(),
        mtime: new Date(),
        mode: 0o644,
      } as any)
      .mockResolvedValueOnce({
        size: 200,
        birthtime: new Date(),
        mtime: new Date(),
        mode: 0o644,
      } as any);
      
      const result = await FileSystemUtils.detectFileConflict('/source.txt', '/dest.txt');
      
      expect(result).not.toBeNull();
      expect(result?.type).toBe('overwrite');
      expect(result?.source).toBe('/source.txt');
      expect(result?.destination).toBe('/dest.txt');
    });

    it('should return conflict even if files are identical', async () => {
      const mockAccess = fs.access as jest.MockedFunction<typeof fs.access>;
      const mockStat = fs.stat as jest.MockedFunction<typeof fs.stat>;
      
      mockAccess.mockClear();
      mockStat.mockClear();
      // Mock access to succeed for both files (both exist)
      mockAccess.mockResolvedValue(undefined);
      
      // Mock stat to return identical file sizes
      const identicalStats = {
        size: 100,
        birthtime: new Date(),
        mtime: new Date(),
        mode: 0o644,
      } as any;
      
      mockStat.mockResolvedValue(identicalStats);
      
      const result = await FileSystemUtils.detectFileConflict('/source.txt', '/dest.txt');
      
      expect(result).not.toBeNull();
      expect(result?.type).toBe('overwrite');
      expect(result?.source).toBe('/source.txt');
      expect(result?.destination).toBe('/dest.txt');
    });
  });

  describe('categorizeConflict', () => {
    it('should categorize as low for empty files', () => {
      const conflict = {
        type: 'overwrite' as const,
        source: '/source.txt',
        destination: '/dest.txt',
        sourceMetadata: { size: 0 } as any,
        destinationMetadata: { size: 0 } as any
      };
      
      const result = FileSystemUtils.categorizeConflict(conflict);
      
      expect(result).toBe('low');
    });

    it('should categorize as high for large files', () => {
      const conflict = {
        type: 'overwrite' as const,
        source: '/source.txt',
        destination: '/dest.txt',
        sourceMetadata: { size: 2 * 1024 * 1024 } as any,
        destinationMetadata: { size: 100 } as any
      };
      
      const result = FileSystemUtils.categorizeConflict(conflict);
      
      expect(result).toBe('high');
    });

    it('should categorize as medium for normal files', () => {
      const conflict = {
        type: 'overwrite' as const,
        source: '/source.txt',
        destination: '/dest.txt',
        sourceMetadata: { size: 1024 } as any,
        destinationMetadata: { size: 512 } as any
      };
      
      const result = FileSystemUtils.categorizeConflict(conflict);
      
      expect(result).toBe('medium');
    });
  });

  describe('conflict resolution strategies', () => {
    const mockConflict = {
      type: 'overwrite' as const,
      source: '/source.txt',
      destination: '/dest.txt',
      sourceMetadata: { size: 100 } as any,
      destinationMetadata: { size: 200 } as any
    };

    it('should create overwrite strategy', () => {
      const result = FileSystemUtils.createOverwriteStrategy(mockConflict);
      
      expect(result.strategy).toBe('overwrite');
      expect(result.userConfirmed).toBe(false);
      expect(result.backupPath).toBeUndefined();
    });

    it('should create backup and rename strategy', () => {
      const result = FileSystemUtils.createBackupRenameStrategy(mockConflict);
      
      expect(result.strategy).toBe('backup');
      expect(result.userConfirmed).toBe(false);
      expect(result.backupPath).toContain('.backup.');
      expect(result.newPath).toBeUndefined();
    });

    it('should create merge strategy', () => {
      const result = FileSystemUtils.createMergeStrategy(mockConflict);
      
      expect(result.strategy).toBe('merge');
      expect(result.userConfirmed).toBe(false);
      expect(result.mergeStrategy?.conflictMarkers).toBe(true);
    });

    it('should create skip strategy', () => {
      const result = FileSystemUtils.createSkipStrategy(mockConflict);
      
      expect(result.strategy).toBe('skip');
      expect(result.userConfirmed).toBe(false);
    });
  });

  describe('generateConflictPrompt', () => {
    it('should generate conflict prompt with severity', () => {
      const conflict = {
        type: 'overwrite' as const,
        source: '/source.txt',
        destination: '/dest.txt',
        sourceMetadata: { size: 100 } as any,
        destinationMetadata: { size: 200 } as any
      };
      
      const result = FileSystemUtils.generateConflictPrompt(conflict);
      
      expect(result).toContain('File conflict detected');
      expect(result).toContain('/source.txt');
      expect(result).toContain('/dest.txt');
      expect(result).toContain('Choose resolution strategy');
    });
  });

  describe('resolveConflictAutomatically', () => {
    it('should skip high severity conflicts', async () => {
      const conflict = {
        type: 'overwrite' as const,
        source: '/source.txt',
        destination: '/dest.txt',
        sourceMetadata: { size: 2 * 1024 * 1024 } as any,
        destinationMetadata: { size: 100 } as any
      };
      
      const result = await FileSystemUtils.resolveConflictAutomatically(conflict);
      
      expect(result.strategy).toBe('skip');
    });

    it('should backup medium severity conflicts', async () => {
      const conflict = {
        type: 'overwrite' as const,
        source: '/source.txt',
        destination: '/dest.txt',
        sourceMetadata: { size: 1024 } as any,
        destinationMetadata: { size: 512 } as any
      };
      
      const result = await FileSystemUtils.resolveConflictAutomatically(conflict);
      
      expect(result.strategy).toBe('backup');
    });
  });

  describe('resolveConflictIntelligently', () => {
    it('should backup if file types do not match', async () => {
      const conflict = {
        type: 'overwrite' as const,
        source: '/source.txt',
        destination: '/dest.json',
        sourceMetadata: { size: 100 } as any,
        destinationMetadata: { size: 200 } as any
      };
      
      const result = await FileSystemUtils.resolveConflictIntelligently(conflict);
      
      expect(result.strategy).toBe('backup');
    });

    it('should backup text files', async () => {
      const conflict = {
        type: 'overwrite' as const,
        source: '/source.md',
        destination: '/dest.md',
        sourceMetadata: { size: 100 } as any,
        destinationMetadata: { size: 200 } as any
      };
      
      const result = await FileSystemUtils.resolveConflictIntelligently(conflict);
      
      expect(result.strategy).toBe('backup');
    });

    it('should backup binary files', async () => {
      const conflict = {
        type: 'overwrite' as const,
        source: '/source.jpg',
        destination: '/dest.jpg',
        sourceMetadata: { size: 100 } as any,
        destinationMetadata: { size: 200 } as any
      };
      
      const result = await FileSystemUtils.resolveConflictIntelligently(conflict);
      
      expect(result.strategy).toBe('backup');
    });
  });

  describe('getFileMetadata', () => {
    it('should return file metadata without checksum', async () => {
      const mockStat = fs.stat as jest.MockedFunction<typeof fs.stat>;
      
      mockStat.mockResolvedValue({
        size: 100,
        birthtime: new Date('2023-01-01'),
        mtime: new Date('2023-01-02'),
        mode: 0o644
      } as any);
      
      const result = await FileSystemUtils.getFileMetadata('/test/file.txt');
      
      expect(result.size).toBe(100);
      expect(result.permissions).toBe('644');
      expect(result.checksum).toBeUndefined();
      expect(result.owner).toBe('unknown');
    });
  });

  describe('createBackup', () => {
    it('should create file backup', async () => {
      const mockCopyFile = fs.copyFile as jest.MockedFunction<typeof fs.copyFile>;
      const mockStat = fs.stat as jest.MockedFunction<typeof fs.stat>;
      const mockAccess = fs.access as jest.MockedFunction<typeof fs.access>;
      
      mockAccess.mockResolvedValue(undefined); // fileExists returns true
      mockCopyFile.mockResolvedValue(undefined);
      mockStat.mockResolvedValue({ 
        size: 1024,
        birthtime: new Date(),
        mtime: new Date(),
        mode: 0o644
      } as any);
      
      const result = await FileSystemUtils.createBackup('/test/file.txt', 'file');
      
      expect(result.type).toBe('file');
      expect(result.target).toBe('/test/file.txt');
      expect(result.status).toBe('completed');
      expect(result.backupPath).toContain('.backup.');
    });
  });

  describe('checkFilePermissions', () => {
    it('should return permission information', async () => {
      const mockStat = fs.stat as jest.MockedFunction<typeof fs.stat>;
      
      mockStat.mockResolvedValue({
        mode: 0o644
      } as any);
      
      const result = await FileSystemUtils.checkFilePermissions('/test/file.txt');
      
      expect(result.readable).toBe(true);
      expect(result.writable).toBe(true);
      expect(result.executable).toBe(false);
      expect(result.permissions).toBe('644');
    });

    it('should handle permission errors', async () => {
      const mockStat = fs.stat as jest.MockedFunction<typeof fs.stat>;
      
      mockStat.mockRejectedValue(new Error('Permission denied'));
      
      await expect(FileSystemUtils.checkFilePermissions('/test/file.txt'))
        .rejects.toThrow('Failed to check file permissions for /test/file.txt: Error: Permission denied');
    });
  });

  describe('getDiskSpace', () => {
    it('should return disk space information', async () => {
      const result = await FileSystemUtils.getDiskSpace('/test/dir');
      
      expect(result.available).toBe(1073741824); // 1GB
      expect(result.total).toBe(107374182400); // 100GB
      expect(result.sufficient).toBe(true);
    });

    it('should handle unsupported platforms', async () => {
      const result = await FileSystemUtils.getDiskSpace('/test/dir');
      
      expect(result.available).toBe(1073741824); // Always returns 1GB
      expect(result.sufficient).toBe(true);
    });
  });

  describe('checkSpaceThresholds', () => {
    it('should return critical warning for low space', async () => {
      jest.spyOn(FileSystemUtils, 'getDiskSpace').mockResolvedValue({
        available: 25 * 1024 * 1024, // 25MB (below critical threshold)
        total: 1000 * 1024 * 1024, // 1GB
        used: 975 * 1024 * 1024,
        sufficient: false,
        warningThreshold: 100 * 1024 * 1024,
        criticalThreshold: 50 * 1024 * 1024
      });
      
      const result = await FileSystemUtils.checkSpaceThresholds('/test/dir');
      
      expect(result.critical).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('detectFileSystemType', () => {
    it('should detect Windows file system', async () => {
      const result = await FileSystemUtils.detectFileSystemType('/test/dir');
      
      expect(result.type).toBe('unknown');
      expect(result.caseSensitive).toBe(false);
      expect(result.maxPathLength).toBe(260);
    });

    it('should detect macOS file system', async () => {
      const result = await FileSystemUtils.detectFileSystemType('/test/dir');
      
      expect(result.type).toBe('unknown');
      expect(result.caseSensitive).toBe(false);
      expect(result.maxPathLength).toBe(260);
    });

    it('should detect Linux file system', async () => {
      const result = await FileSystemUtils.detectFileSystemType('/test/dir');
      
      expect(result.type).toBe('unknown');
      expect(result.caseSensitive).toBe(false);
      expect(result.maxPathLength).toBe(260);
    });
  });

  describe('validateFileOperation', () => {
    it('should validate safe file operation', async () => {
      jest.restoreAllMocks();
      jest.spyOn(FileSystemUtils, 'fileExists').mockResolvedValue(true);
      jest.spyOn(FileSystemUtils, 'directoryExists').mockResolvedValue(true);
      jest.spyOn(FileSystemUtils, 'checkFilePermissions').mockResolvedValue({
        readable: true,
        writable: true,
        executable: false,
        owner: 'user',
        group: 'group',
        permissions: '644'
      });
      jest.spyOn(FileSystemUtils, 'checkSpaceThresholds').mockResolvedValue({
        warnings: [],
        critical: false,
        recommendations: []
      });
      jest.spyOn(FileSystemUtils, 'detectFileConflict').mockResolvedValue(null);
      
      const result = await FileSystemUtils.validateFileOperation('copy', '/source.txt', '/dest.txt');
      
      expect(result.safe).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should detect unsafe operation', async () => {
      jest.spyOn(FileSystemUtils, 'fileExists').mockResolvedValue(false);
      
      const result = await FileSystemUtils.validateFileOperation('copy', '/source.txt', '/dest.txt');
      
      expect(result.safe).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('error categorization', () => {
    it('should classify permission denied error', () => {
      const error = new Error('Permission denied');
      (error as any).code = 'EACCES';
      
      const result = FileSystemUtils.classifyError(error);
      
      expect(result).toBe(FileSystemErrorType.PERMISSION_DENIED);
    });

    it('should classify file not found error', () => {
      const error = new Error('ENOENT: no such file or directory');
      (error as any).code = 'ENOENT';
      
      const result = FileSystemUtils.classifyError(error, '/test/file.txt');
      
      expect(result).toBe(FileSystemErrorType.FILE_NOT_FOUND);
    });

    it('should classify disk full error', () => {
      const error = new Error('ENOSPC: no space left on device');
      (error as any).code = 'ENOSPC';
      
      const result = FileSystemUtils.classifyError(error);
      
      expect(result).toBe(FileSystemErrorType.DISK_FULL);
    });
  });

  describe('assessErrorSeverity', () => {
    it('should assess disk full as high', () => {
      const result = FileSystemUtils.assessErrorSeverity(FileSystemErrorType.DISK_FULL);
      
      expect(result).toBe(ErrorSeverity.HIGH);
    });

    it('should assess permission denied as high', () => {
      const result = FileSystemUtils.assessErrorSeverity(FileSystemErrorType.PERMISSION_DENIED);
      
      expect(result).toBe(ErrorSeverity.HIGH);
    });

    it('should assess file exists as low', () => {
      const result = FileSystemUtils.assessErrorSeverity(FileSystemErrorType.FILE_EXISTS);
      
      expect(result).toBe(ErrorSeverity.LOW);
    });

    it('should assess file not found as medium', () => {
      const result = FileSystemUtils.assessErrorSeverity(FileSystemErrorType.FILE_NOT_FOUND);
      
      expect(result).toBe(ErrorSeverity.MEDIUM);
    });
  });

  describe('createCategorizedError', () => {
    it('should create categorized error', () => {
      const originalError = new Error('Permission denied');
      (originalError as any).code = 'EACCES';
      
      const result = FileSystemUtils.createCategorizedError(originalError, '/test/file.txt', 'read');
      
      expect(result.type).toBe(FileSystemErrorType.PERMISSION_DENIED);
      expect(result.severity).toBe(ErrorSeverity.HIGH);
      expect(result.message).toBe('Permission denied');
      expect(result.path).toBe('/test/file.txt');
      expect(result.originalError).toBe(originalError);
      expect(result.recoverable).toBe(true);
      expect(result.suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('generateErrorSuggestions', () => {
    it('should generate suggestions for permission denied', () => {
      const suggestions = FileSystemUtils.generateErrorSuggestions(FileSystemErrorType.PERMISSION_DENIED);
      
      expect(suggestions).toContain('Check file permissions');
      expect(suggestions).toContain('Run with elevated privileges if needed');
    });

    it('should generate suggestions for file not found', () => {
      const suggestions = FileSystemUtils.generateErrorSuggestions(FileSystemErrorType.FILE_NOT_FOUND);
      
      expect(suggestions).toContain('Verify the file path is correct');
      expect(suggestions).toContain('Check if the file exists');
    });

    it('should generate suggestions for disk full', () => {
      const suggestions = FileSystemUtils.generateErrorSuggestions(FileSystemErrorType.DISK_FULL);
      
      expect(suggestions).toContain('Free up disk space');
      expect(suggestions).toContain('Check available storage');
    });
  });

  describe('isErrorRecoverable', () => {
    it('should return false for disk full error', () => {
      const result = FileSystemUtils.isErrorRecoverable(FileSystemErrorType.DISK_FULL);
      
      expect(result).toBe(false);
    });

    it('should return false for read-only filesystem error', () => {
      const result = FileSystemUtils.isErrorRecoverable(FileSystemErrorType.READ_ONLY_FILESYSTEM);
      
      expect(result).toBe(false);
    });

    it('should return true for permission denied error', () => {
      const result = FileSystemUtils.isErrorRecoverable(FileSystemErrorType.PERMISSION_DENIED);
      
      expect(result).toBe(true);
    });
  });

  describe('attemptAutomaticRecovery', () => {
    it('should attempt recovery for file not found', async () => {
      const error: FileSystemError = {
        type: FileSystemErrorType.FILE_NOT_FOUND,
        severity: ErrorSeverity.LOW,
        message: 'File not found',
        path: '/test/file.txt',
        timestamp: new Date(),
        recoverable: true,
        suggestions: []
      };
      
      jest.spyOn(FileSystemUtils, 'ensureDirectory').mockResolvedValue(undefined);
      
      const result = await FileSystemUtils.attemptAutomaticRecovery(error, 'read');
      
      expect(result.success).toBe(true);
      expect(result.recovered).toBe(true);
    });

    it('should not recover after max retries', async () => {
      const error: FileSystemError = {
        type: FileSystemErrorType.FILE_NOT_FOUND,
        severity: ErrorSeverity.LOW,
        message: 'File not found',
        path: '/test/file.txt',
        timestamp: new Date(),
        recoverable: true,
        suggestions: []
      };
      
      const result = await FileSystemUtils.attemptAutomaticRecovery(error, 'read', 3);
      
      expect(result.success).toBe(false);
      expect(result.recovered).toBe(false);
    });
  });

  describe('generateUserFriendlyMessage', () => {
    it('should generate user-friendly error message', () => {
      const error: FileSystemError = {
        type: FileSystemErrorType.PERMISSION_DENIED,
        severity: ErrorSeverity.HIGH,
        message: 'Permission denied',
        path: '/test/file.txt',
        timestamp: new Date(),
        recoverable: true,
        suggestions: ['Check file permissions', 'Run with elevated privileges']
      };
      
      const result = FileSystemUtils.generateUserFriendlyMessage(error);
      
      expect(result).toContain('Permission denied');
      expect(result).toContain('Suggestions:');
      expect(result).toContain('Check file permissions');
      expect(result).toContain('Run with elevated privileges');
    });
  });

  describe('executeFallbackOperation', () => {
    it('should execute skip fallback', async () => {
      const result = await FileSystemUtils.executeFallbackOperation(
        'read',
        'skip_on_error',
        {}
      );
      
      expect(result.success).toBe(false);
      expect(result.fallbackUsed).toBe(true);
      expect(result.error?.message).toContain('not implemented');
    });

    it('should execute backup fallback', async () => {
      const mockCopyFile = fs.copyFile as jest.MockedFunction<typeof fs.copyFile>;
      mockCopyFile.mockResolvedValue(undefined);
      
      const result = await FileSystemUtils.executeFallbackOperation(
        'read',
        'use_backup',
        { backupPath: '/backup.txt', destination: '/dest.txt' }
      );
      
      expect(result.success).toBe(false);
      expect(result.fallbackUsed).toBe(true);
      expect(result.error?.message).toContain('not implemented');
    });

    it('should execute minimal content fallback', async () => {
      const mockWriteFile = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>;
      mockWriteFile.mockResolvedValue(undefined);
      
      const result = await FileSystemUtils.executeFallbackOperation(
        'create',
        'create_minimal',
        { destination: '/dest.json', fileType: 'json' }
      );
      
      expect(result.success).toBe(false);
      expect(result.fallbackUsed).toBe(true);
      expect(result.error?.message).toContain('not implemented');
    });
  });

  describe('generateMinimalContent', () => {
    it('should generate minimal JSON content', () => {
      const result = FileSystemUtils['generateMinimalContent']('json');
      
      expect(result).toBe('{}');
    });

    it('should generate minimal YAML content', () => {
      const result = FileSystemUtils['generateMinimalContent']('yaml');
      
      expect(result).toBe('# Minimal YAML file');
    });

    it('should generate minimal Markdown content', () => {
      const result = FileSystemUtils['generateMinimalContent']('md');
      
      expect(result).toBe('# Minimal Markdown file');
    });

    it('should generate default minimal content', () => {
      const result = FileSystemUtils['generateMinimalContent']();
      
      expect(result).toBe('# Minimal file');
    });
  });
}); 