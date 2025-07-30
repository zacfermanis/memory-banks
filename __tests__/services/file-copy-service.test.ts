import * as fs from 'fs';
import * as path from 'path';
import { FileCopyService } from '../../src/services/file-copy-service';
import { GuideInfo, CopyResult } from '../../src/config/types';

// Mock fs module
jest.mock('fs');
const mockedFs = fs as jest.Mocked<typeof fs>;

describe('FileCopyService', () => {
  let fileCopyService: FileCopyService;

  beforeEach(() => {
    fileCopyService = new FileCopyService();
    jest.clearAllMocks();
    // Reset all mocks to their default behavior
    mockedFs.existsSync.mockReset();
    mockedFs.readFileSync.mockReset();
    mockedFs.writeFileSync.mockReset();
    mockedFs.mkdirSync.mockReset();
    mockedFs.statSync.mockReset();
  });

  describe('copyGuide', () => {
    it('should copy developmentGuide.md successfully', () => {
      const guide: GuideInfo = {
        id: 'test-guide',
        displayName: 'Test Guide',
        type: 'custom',
        folderPath: '/source/guide',
        hasCursorRules: false,
      };

      const targetDir = '/target/directory';

      // Mock file operations
      mockedFs.existsSync
        .mockReturnValueOnce(true) // .memory-bank directory exists
        .mockReturnValueOnce(false) // target file doesn't exist (not overwritten)
        .mockReturnValueOnce(true); // source file exists
      mockedFs.readFileSync.mockReturnValue('Guide content' as any);
      mockedFs.writeFileSync.mockImplementation(() => undefined);

      const result = fileCopyService.copyGuide(guide, targetDir);

      expect(result.success).toBe(true);
      expect(result.copiedFilePath).toBe(path.join(targetDir, '.memory-bank', 'developmentGuide.md'));
      expect(result.overwritten).toBe(false);
      expect(mockedFs.readFileSync).toHaveBeenCalledWith(
        path.join('/source/guide', 'developmentGuide.md'),
        'utf8'
      );
      expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
        path.join(targetDir, '.memory-bank', 'developmentGuide.md'),
        'Guide content',
        'utf8'
      );
    });

    it('should create target directory if it does not exist', () => {
      const guide: GuideInfo = {
        id: 'test-guide',
        displayName: 'Test Guide',
        type: 'custom',
        folderPath: '/source/guide',
        hasCursorRules: false,
      };

      const targetDir = '/target/directory';

      // Mock directory doesn't exist initially
      mockedFs.existsSync
        .mockReturnValueOnce(false) // .memory-bank directory doesn't exist
        .mockReturnValueOnce(false) // target file doesn't exist
        .mockReturnValueOnce(true); // source file exists
      mockedFs.readFileSync.mockReturnValue('Guide content' as any);
      mockedFs.writeFileSync.mockImplementation(() => undefined);
      mockedFs.mkdirSync.mockImplementation(() => undefined);

      const result = fileCopyService.copyGuide(guide, targetDir);

      expect(result.success).toBe(true);
      expect(mockedFs.mkdirSync).toHaveBeenCalledWith(
        path.join(targetDir, '.memory-bank'),
        { recursive: true }
      );
    });

    it('should handle source file not found', () => {
      const guide: GuideInfo = {
        id: 'test-guide',
        displayName: 'Test Guide',
        type: 'custom',
        folderPath: '/source/guide',
        hasCursorRules: false,
      };

      const targetDir = '/target/directory';

      // Mock source file doesn't exist
      mockedFs.existsSync
        .mockReturnValueOnce(true) // .memory-bank directory exists
        .mockReturnValueOnce(false) // target file doesn't exist
        .mockReturnValueOnce(false); // source file doesn't exist

      const result = fileCopyService.copyGuide(guide, targetDir);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Source file not found');
      expect(mockedFs.readFileSync).not.toHaveBeenCalled();
      expect(mockedFs.writeFileSync).not.toHaveBeenCalled();
    });

    it('should handle file read errors', () => {
      const guide: GuideInfo = {
        id: 'test-guide',
        displayName: 'Test Guide',
        type: 'custom',
        folderPath: '/source/guide',
        hasCursorRules: false,
      };

      const targetDir = '/target/directory';

      // Mock file exists but read fails
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const result = fileCopyService.copyGuide(guide, targetDir);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Permission denied');
      expect(mockedFs.writeFileSync).not.toHaveBeenCalled();
    });

    it('should handle file write errors', () => {
      const guide: GuideInfo = {
        id: 'test-guide',
        displayName: 'Test Guide',
        type: 'custom',
        folderPath: '/source/guide',
        hasCursorRules: false,
      };

      const targetDir = '/target/directory';

      // Mock file operations
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue('Guide content' as any);
      mockedFs.writeFileSync.mockImplementation(() => {
        throw new Error('Disk full');
      });

      const result = fileCopyService.copyGuide(guide, targetDir);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Disk full');
    });

    it('should detect when overwriting existing file', () => {
      const guide: GuideInfo = {
        id: 'test-guide',
        displayName: 'Test Guide',
        type: 'custom',
        folderPath: '/source/guide',
        hasCursorRules: false,
      };

      const targetDir = '/target/directory';

      // Mock target file already exists
      mockedFs.existsSync
        .mockReturnValueOnce(true) // .memory-bank directory exists
        .mockReturnValueOnce(true) // target file exists
        .mockReturnValueOnce(true); // source file exists
      mockedFs.readFileSync.mockReturnValue('Guide content' as any);
      mockedFs.writeFileSync.mockImplementation(() => undefined);

      const result = fileCopyService.copyGuide(guide, targetDir);

      expect(result.success).toBe(true);
      expect(result.overwritten).toBe(true);
    });

    it('should create backup when overwriting existing file', () => {
      const guide: GuideInfo = {
        id: 'test-guide',
        displayName: 'Test Guide',
        type: 'custom',
        folderPath: '/source/guide',
        hasCursorRules: false,
      };

      const targetDir = '/target/directory';

      // Mock target file already exists
      mockedFs.existsSync
        .mockReturnValueOnce(true) // .memory-bank directory exists
        .mockReturnValueOnce(true) // target file exists
        .mockReturnValueOnce(true) // source file exists
        .mockReturnValueOnce(false); // backup file doesn't exist
      mockedFs.readFileSync
        .mockReturnValueOnce('Existing content' as any) // existing file content
        .mockReturnValueOnce('New content' as any); // new file content
      mockedFs.writeFileSync.mockImplementation(() => undefined);

      const result = fileCopyService.copyGuideWithBackup(guide, targetDir);

      expect(result.success).toBe(true);
      expect(result.overwritten).toBe(true);
      expect(result.backupPath).toContain('.backup');
      expect(mockedFs.writeFileSync).toHaveBeenCalledTimes(2); // backup + new file
    });

    it('should handle backup creation failure', () => {
      const guide: GuideInfo = {
        id: 'test-guide',
        displayName: 'Test Guide',
        type: 'custom',
        folderPath: '/source/guide',
        hasCursorRules: false,
      };

      const targetDir = '/target/directory';

      // Mock target file exists but backup creation fails
      mockedFs.existsSync
        .mockReturnValueOnce(true) // .memory-bank directory exists
        .mockReturnValueOnce(true) // target file exists
        .mockReturnValueOnce(true) // source file exists
        .mockReturnValueOnce(false); // backup file doesn't exist
      mockedFs.readFileSync.mockReturnValue('Existing content' as any);
      mockedFs.writeFileSync
        .mockImplementationOnce(() => {
          throw new Error('Backup failed');
        });

      const result = fileCopyService.copyGuideWithBackup(guide, targetDir);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Backup failed');
    });

    it('should rollback on write failure after backup', () => {
      const guide: GuideInfo = {
        id: 'test-guide',
        displayName: 'Test Guide',
        type: 'custom',
        folderPath: '/source/guide',
        hasCursorRules: false,
      };

      const targetDir = '/target/directory';

      // Mock operations: backup succeeds, new file write fails, rollback succeeds
      mockedFs.existsSync.mockImplementation((path) => {
        const pathStr = path.toString();
        // Return true for any backup file path
        if (pathStr.includes('.backup.')) {
          return true;
        }
        // Return true for directory, target file, and source file
        if (pathStr.includes('.memory-bank') || pathStr.includes('developmentGuide.md')) {
          return true;
        }
        return false;
      });
      mockedFs.readFileSync
        .mockReturnValueOnce('Existing content' as any) // existing file content
        .mockReturnValueOnce('New content' as any) // new file content
        .mockReturnValueOnce('Existing content' as any); // backup content for restore
      mockedFs.writeFileSync
        .mockImplementationOnce(() => undefined) // backup succeeds
        .mockImplementationOnce(() => {
          throw new Error('Write failed');
        }) // new file write fails
        .mockImplementationOnce(() => undefined); // rollback succeeds

      const result = fileCopyService.copyGuideWithBackup(guide, targetDir);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Write failed');
      expect(result.rolledBack).toBe(true);
      expect(mockedFs.writeFileSync).toHaveBeenCalledTimes(3); // backup + failed write + rollback
    });

    it('should handle rollback failure', () => {
      const guide: GuideInfo = {
        id: 'test-guide',
        displayName: 'Test Guide',
        type: 'custom',
        folderPath: '/source/guide',
        hasCursorRules: false,
      };

      const targetDir = '/target/directory';

      // Mock operations: backup succeeds, new file write fails, rollback fails
      mockedFs.existsSync.mockImplementation((path) => {
        const pathStr = path.toString();
        // Return true for any backup file path
        if (pathStr.includes('.backup.')) {
          return true;
        }
        // Return true for directory, target file, and source file
        if (pathStr.includes('.memory-bank') || pathStr.includes('developmentGuide.md')) {
          return true;
        }
        return false;
      });
      mockedFs.readFileSync
        .mockReturnValueOnce('Existing content' as any) // existing file content
        .mockReturnValueOnce('New content' as any) // new file content
        .mockReturnValueOnce('Existing content' as any); // backup content for restore
      mockedFs.writeFileSync
        .mockImplementationOnce(() => undefined) // backup succeeds
        .mockImplementationOnce(() => {
          throw new Error('Write failed');
        }) // new file write fails
        .mockImplementationOnce(() => {
          throw new Error('Rollback failed');
        }); // rollback fails

      const result = fileCopyService.copyGuideWithBackup(guide, targetDir);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Write failed');
      expect(result.rolledBack).toBe(false);
      expect(result.rollbackError).toContain('Rollback failed');
    });
  });

  describe('copyCursorRules', () => {
    it('should copy .cursorrules successfully', () => {
      const guide: GuideInfo = {
        id: 'test-guide',
        displayName: 'Test Guide',
        type: 'custom',
        folderPath: '/source/guide',
        hasCursorRules: true,
      };

      const targetDir = '/target/directory';

      // Mock file operations
      mockedFs.existsSync
        .mockReturnValueOnce(false) // target file doesn't exist (not overwritten)
        .mockReturnValueOnce(true); // source file exists
      mockedFs.readFileSync.mockReturnValue('Cursor rules content' as any);
      mockedFs.writeFileSync.mockImplementation(() => undefined);

      const result = fileCopyService.copyCursorRules(guide, targetDir);

      expect(result.success).toBe(true);
      expect(result.copiedFilePath).toBe(path.join(targetDir, '.cursorrules'));
      expect(result.overwritten).toBe(false);
      expect(mockedFs.readFileSync).toHaveBeenCalledWith(
        path.join('/source/guide', '.cursorrules'),
        'utf8'
      );
      expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
        path.join(targetDir, '.cursorrules'),
        'Cursor rules content',
        'utf8'
      );
    });

    it('should handle source file not found', () => {
      const guide: GuideInfo = {
        id: 'test-guide',
        displayName: 'Test Guide',
        type: 'custom',
        folderPath: '/source/guide',
        hasCursorRules: true,
      };

      const targetDir = '/target/directory';

      // Mock file operations
      mockedFs.existsSync
        .mockReturnValueOnce(false) // target file doesn't exist
        .mockReturnValueOnce(false); // source file doesn't exist
      mockedFs.readFileSync.mockImplementation(() => {
        throw new Error('File not found');
      });
      mockedFs.writeFileSync.mockImplementation(() => undefined);

      const result = fileCopyService.copyCursorRules(guide, targetDir);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Source file not found');
      expect(mockedFs.readFileSync).not.toHaveBeenCalled();
      expect(mockedFs.writeFileSync).not.toHaveBeenCalled();
    });

    it('should handle file read errors', () => {
      const guide: GuideInfo = {
        id: 'test-guide',
        displayName: 'Test Guide',
        type: 'custom',
        folderPath: '/source/guide',
        hasCursorRules: true,
      };

      const targetDir = '/target/directory';

      // Mock file operations
      mockedFs.existsSync
        .mockReturnValueOnce(false) // target file doesn't exist
        .mockReturnValueOnce(true); // source file exists
      mockedFs.readFileSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });
      mockedFs.writeFileSync.mockImplementation(() => undefined);

      const result = fileCopyService.copyCursorRules(guide, targetDir);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Permission denied');
      expect(mockedFs.writeFileSync).not.toHaveBeenCalled();
    });

    it('should handle file write errors', () => {
      const guide: GuideInfo = {
        id: 'test-guide',
        displayName: 'Test Guide',
        type: 'custom',
        folderPath: '/source/guide',
        hasCursorRules: true,
      };

      const targetDir = '/target/directory';

      // Mock file operations
      mockedFs.existsSync
        .mockReturnValueOnce(false) // target file doesn't exist
        .mockReturnValueOnce(true); // source file exists
      mockedFs.readFileSync.mockReturnValue('Cursor rules content' as any);
      mockedFs.writeFileSync.mockImplementation(() => {
        throw new Error('Disk full');
      });

      const result = fileCopyService.copyCursorRules(guide, targetDir);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Disk full');
    });

    it('should detect when overwriting existing file', () => {
      const guide: GuideInfo = {
        id: 'test-guide',
        displayName: 'Test Guide',
        type: 'custom',
        folderPath: '/source/guide',
        hasCursorRules: true,
      };

      const targetDir = '/target/directory';

      // Mock file operations
      mockedFs.existsSync
        .mockReturnValueOnce(true) // target file exists (overwritten)
        .mockReturnValueOnce(true); // source file exists
      mockedFs.readFileSync.mockReturnValue('Cursor rules content' as any);
      mockedFs.writeFileSync.mockImplementation(() => undefined);

      const result = fileCopyService.copyCursorRules(guide, targetDir);

      expect(result.success).toBe(true);
      expect(result.overwritten).toBe(true);
    });

    it('should create backup when overwriting cursor rules', () => {
      const guide: GuideInfo = {
        id: 'test-guide',
        displayName: 'Test Guide',
        type: 'custom',
        folderPath: '/source/guide',
        hasCursorRules: true,
      };

      const targetDir = '/target/directory';

      // Mock target file already exists
      mockedFs.existsSync
        .mockReturnValueOnce(true) // target file exists
        .mockReturnValueOnce(true) // source file exists
        .mockReturnValueOnce(false); // backup file doesn't exist
      mockedFs.readFileSync
        .mockReturnValueOnce('Existing cursor rules' as any) // existing file content
        .mockReturnValueOnce('New cursor rules' as any); // new file content
      mockedFs.writeFileSync.mockImplementation(() => undefined);

      const result = fileCopyService.copyCursorRulesWithBackup(guide, targetDir);

      expect(result.success).toBe(true);
      expect(result.overwritten).toBe(true);
      expect(result.backupPath).toContain('.backup');
      expect(mockedFs.writeFileSync).toHaveBeenCalledTimes(2); // backup + new file
    });
  });

  describe('validateTargetDirectory', () => {
    it('should validate a valid target directory', () => {
      const targetDir = '/valid/target/directory';

      // Mock directory exists and is writable
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.statSync.mockReturnValue({
        isDirectory: () => true,
      } as fs.Stats);

      const result = fileCopyService.validateTargetDirectory(targetDir);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject empty target directory', () => {
      const result = fileCopyService.validateTargetDirectory('');

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Target directory cannot be empty');
    });

    it('should reject non-existent directory', () => {
      const targetDir = '/non/existent/path';

      mockedFs.existsSync.mockReturnValue(false);

      const result = fileCopyService.validateTargetDirectory(targetDir);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Target directory does not exist');
    });

    it('should reject path that is not a directory', () => {
      const targetDir = '/path/to/file';

      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.statSync.mockReturnValue({
        isDirectory: () => false,
      } as fs.Stats);

      const result = fileCopyService.validateTargetDirectory(targetDir);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Target path is not a directory');
    });

    it('should handle file system errors gracefully', () => {
      const targetDir = '/problematic/directory';

      mockedFs.existsSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const result = fileCopyService.validateTargetDirectory(targetDir);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Permission denied');
    });
  });

  describe('copyGuideFiles', () => {
    it('should copy both guide and cursor rules successfully', () => {
      const guide: GuideInfo = {
        id: 'test-guide',
        displayName: 'Test Guide',
        type: 'custom',
        folderPath: '/source/guide',
        hasCursorRules: true,
      };

      const targetDir = '/target/directory';

      // Mock target directory validation (validateTargetDirectory calls)
      mockedFs.existsSync
        .mockReturnValueOnce(true) // target directory exists (validateTargetDirectory)
        .mockReturnValueOnce(true) // .memory-bank directory exists (copyGuide)
        .mockReturnValueOnce(false) // target guide file doesn't exist (copyGuide)
        .mockReturnValueOnce(true) // source guide file exists (copyGuide)
        .mockReturnValueOnce(false) // target cursor rules file doesn't exist (copyCursorRules)
        .mockReturnValueOnce(true); // source cursor rules file exists (copyCursorRules)
      
      mockedFs.statSync.mockReturnValue({
        isDirectory: () => true,
      } as fs.Stats);
      mockedFs.readFileSync.mockReturnValue('File content' as any);
      mockedFs.writeFileSync.mockImplementation(() => undefined);

      const results = fileCopyService.copyGuideFiles(guide, targetDir);

      expect(results).toHaveLength(2);
      
      // The first result should be the guide copy, second should be cursor rules
      const guideResult = results[0];
      const cursorResult = results[1];

      expect(guideResult.success).toBe(true);
      expect(guideResult.copiedFilePath).toContain('developmentGuide.md');
      expect(cursorResult.success).toBe(true);
      expect(cursorResult.copiedFilePath).toContain('.cursorrules');
    });

    it('should copy only guide when cursor rules are not available', () => {
      const guide: GuideInfo = {
        id: 'test-guide',
        displayName: 'Test Guide',
        type: 'custom',
        folderPath: '/source/guide',
        hasCursorRules: false,
      };

      const targetDir = '/target/directory';

      // Mock target directory validation and guide copy
      mockedFs.existsSync
        .mockReturnValueOnce(true) // target directory exists
        .mockReturnValueOnce(true) // .memory-bank directory exists
        .mockReturnValueOnce(false) // target guide file doesn't exist
        .mockReturnValueOnce(true); // source guide file exists
      mockedFs.statSync.mockReturnValue({
        isDirectory: () => true,
      } as fs.Stats);
      mockedFs.readFileSync.mockReturnValue('Guide content' as any);
      mockedFs.writeFileSync.mockImplementation(() => undefined);

      const results = fileCopyService.copyGuideFiles(guide, targetDir);

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
      expect(results[0].copiedFilePath).toContain('developmentGuide.md');
    });

    it('should handle errors in guide copy but continue with cursor rules', () => {
      const guide: GuideInfo = {
        id: 'test-guide',
        displayName: 'Test Guide',
        type: 'custom',
        folderPath: '/source/guide',
        hasCursorRules: true,
      };

      const targetDir = '/target/directory';

      // Mock target directory validation and file operations
      mockedFs.existsSync
        .mockReturnValueOnce(true) // target directory exists
        .mockReturnValueOnce(true) // .memory-bank directory exists
        .mockReturnValueOnce(false) // target guide file doesn't exist
        .mockReturnValueOnce(true) // source guide file exists (but read will fail)
        .mockReturnValueOnce(false) // target cursor rules file doesn't exist
        .mockReturnValueOnce(true); // source cursor rules file exists
      mockedFs.statSync.mockReturnValue({
        isDirectory: () => true,
      } as fs.Stats);
      mockedFs.readFileSync
        .mockImplementationOnce(() => {
          throw new Error('Guide read error');
        })
        .mockReturnValueOnce('Cursor rules content' as any);
      mockedFs.writeFileSync.mockImplementation(() => undefined);

      const results = fileCopyService.copyGuideFiles(guide, targetDir);

      expect(results).toHaveLength(2);
      
      // The first result should be the guide copy (failed), second should be cursor rules (success)
      const guideResult = results[0];
      const cursorResult = results[1];

      expect(guideResult.success).toBe(false);
      expect(guideResult.error).toContain('Guide read error');
      expect(cursorResult.success).toBe(true);
    });

    it('should validate target directory before copying', () => {
      const guide: GuideInfo = {
        id: 'test-guide',
        displayName: 'Test Guide',
        type: 'custom',
        folderPath: '/source/guide',
        hasCursorRules: false,
      };

      const targetDir = '/invalid/directory';

      // Mock invalid target directory - validateTargetDirectory will fail
      mockedFs.existsSync.mockReturnValue(false);

      const results = fileCopyService.copyGuideFiles(guide, targetDir);

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toContain('Target directory does not exist');
      expect(mockedFs.readFileSync).not.toHaveBeenCalled();
    });

    it('should copy files with backup when conflicts exist', () => {
      const guide: GuideInfo = {
        id: 'test-guide',
        displayName: 'Test Guide',
        type: 'custom',
        folderPath: '/source/guide',
        hasCursorRules: true,
      };

      const targetDir = '/target/directory';

      // Mock directory validation
      mockedFs.existsSync.mockImplementation((path) => {
        const pathStr = path.toString();
        // Return true for any backup file path
        if (pathStr.includes('.backup.')) {
          return true;
        }
        // Return true for directory, target file, and source file
        if (pathStr.includes('.memory-bank') || pathStr.includes('developmentGuide.md') || pathStr.includes('.cursorrules') || pathStr.includes('/target/directory')) {
          return true;
        }
        return false;
      });

      mockedFs.statSync.mockReturnValue({
        isDirectory: () => true,
      } as any);

      mockedFs.readFileSync
        .mockReturnValueOnce('Existing guide content' as any)
        .mockReturnValueOnce('New guide content' as any)
        .mockReturnValueOnce('Existing guide content' as any)
        .mockReturnValueOnce('Existing cursor content' as any)
        .mockReturnValueOnce('New cursor content' as any)
        .mockReturnValueOnce('Existing cursor content' as any);

      mockedFs.writeFileSync.mockImplementation(() => undefined);

      const results = fileCopyService.copyGuideFilesWithBackup(guide, targetDir);

      expect(results).toHaveLength(2);
      
      // The first result should be the guide copy, second should be cursor rules
      const guideResult = results[0];
      const cursorResult = results[1];

      expect(guideResult.success).toBe(true);
      expect(guideResult.overwritten).toBe(true);
      expect(guideResult.backupPath).toContain('.backup');
      expect(cursorResult.success).toBe(true);
      expect(cursorResult.overwritten).toBe(true);
      expect(cursorResult.backupPath).toContain('.backup');
    });
  });

  describe('conflict resolution', () => {
    it('should detect file conflicts correctly', () => {
      const targetPath = '/target/file.txt';
      
      mockedFs.existsSync.mockReturnValue(true);

      const hasConflict = fileCopyService.detectConflict(targetPath);

      expect(hasConflict).toBe(true);
      expect(mockedFs.existsSync).toHaveBeenCalledWith(targetPath);
    });

    it('should not detect conflicts for non-existent files', () => {
      const targetPath = '/target/file.txt';
      
      mockedFs.existsSync.mockReturnValue(false);

      const hasConflict = fileCopyService.detectConflict(targetPath);

      expect(hasConflict).toBe(false);
    });

    it('should generate unique backup paths', () => {
      const originalPath = '/target/file.txt';
      const timestamp = Date.now();
      
      const backupPath = fileCopyService.generateBackupPath(originalPath, timestamp);

      expect(backupPath).toContain('.backup');
      expect(backupPath).toContain(timestamp.toString());
      expect(backupPath).not.toBe(originalPath);
    });

    it('should restore from backup successfully', () => {
      const originalPath = '/target/file.txt';
      const backupPath = '/target/file.backup.123.txt';
      const content = 'Restored content';

      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(content as any);
      mockedFs.writeFileSync.mockImplementation(() => undefined);

      const result = fileCopyService.restoreFromBackup(originalPath, backupPath);

      expect(result.success).toBe(true);
      expect(mockedFs.readFileSync).toHaveBeenCalledWith(backupPath, 'utf8');
      expect(mockedFs.writeFileSync).toHaveBeenCalledWith(originalPath, content, 'utf8');
    });

    it('should handle backup restoration failure', () => {
      const originalPath = '/target/file.txt';
      const backupPath = '/target/file.txt.backup.1234567890';

      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockImplementation(() => {
        throw new Error('Backup read failed');
      });

      const result = fileCopyService.restoreFromBackup(originalPath, backupPath);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Backup read failed');
    });

    it('should handle missing backup file', () => {
      const originalPath = '/target/file.txt';
      const backupPath = '/target/file.txt.backup.1234567890';

      mockedFs.existsSync.mockReturnValue(false);

      const result = fileCopyService.restoreFromBackup(originalPath, backupPath);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Backup file not found');
    });
  });
}); 