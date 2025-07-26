import { FileSystemUtils } from './fileSystem';
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from '@jest/globals';

// Mock fs module for testing
jest.mock('fs/promises');
const mockedFs = fs as jest.Mocked<typeof fs>;

describe('FileSystemUtils', () => {
  const testDir = path.join(__dirname, 'test-temp');

  beforeEach(async () => {
    // Clean up test directory before each test
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {}
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test directory after each test
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {}
  });

  describe('TASK-033: Unit Tests for File Operations', () => {
    describe('File Creation and Modification', () => {
      it('should create a file safely', async () => {
        const filePath = path.join(testDir, 'test-file.txt');
        const content = 'Hello, World!';

        const result = await FileSystemUtils.createFile(filePath, content);

        expect(result.success).toBe(true);
        expect(result.path).toBe(filePath);
        expect(result.backupPath).toBeDefined();

        // Verify file was created
        const fileContent = await fs.readFile(filePath, 'utf8');
        expect(fileContent).toBe(content);
      });

      it('should modify a file with backup', async () => {
        const filePath = path.join(testDir, 'modify-test.txt');
        const originalContent = 'Original content';
        const newContent = 'Modified content';

        // Create initial file
        await FileSystemUtils.createFile(filePath, originalContent);

        // Modify file
        const result = await FileSystemUtils.modifyFile(filePath, newContent);

        expect(result.success).toBe(true);
        expect(result.backupPath).toBeDefined();

        // Verify file was modified
        const fileContent = await fs.readFile(filePath, 'utf8');
        expect(fileContent).toBe(newContent);

        // Verify backup exists
        const backupContent = await fs.readFile(result.backupPath!, 'utf8');
        expect(backupContent).toBe(originalContent);
      });

      it('should perform atomic file operations', async () => {
        const filePath = path.join(testDir, 'atomic-test.txt');
        const content = 'Atomic content';

        const result = await FileSystemUtils.createFileAtomic(
          filePath,
          content
        );

        expect(result.success).toBe(true);
        expect(result.path).toBe(filePath);

        // Verify file was created atomically
        const fileContent = await fs.readFile(filePath, 'utf8');
        expect(fileContent).toBe(content);
      });

      it('should handle file permission operations', async () => {
        const filePath = path.join(testDir, 'permission-test.txt');
        await FileSystemUtils.createFile(filePath, 'test');

        // Set permissions
        const result = await FileSystemUtils.setFilePermissions(
          filePath,
          0o644
        );

        expect(result.success).toBe(true);
        expect(result.permissions).toBe('644');

        // Verify permissions
        const stats = await fs.stat(filePath);
        expect(stats.mode & 0o777).toBe(0o644);
      });
    });

    describe('Directory Operations', () => {
      it('should create directory with permissions', async () => {
        const dirPath = path.join(testDir, 'test-dir');

        const result = await FileSystemUtils.createDirectory(dirPath, 0o755);

        expect(result.success).toBe(true);
        expect(result.path).toBe(dirPath);

        // Verify directory was created
        const stats = await fs.stat(dirPath);
        expect(stats.isDirectory()).toBe(true);
        expect(stats.mode & 0o777).toBe(0o755);
      });

      it('should perform recursive directory operations', async () => {
        const deepDir = path.join(testDir, 'deep', 'nested', 'directory');

        const result = await FileSystemUtils.createDirectoryRecursive(deepDir);

        expect(result.success).toBe(true);
        expect(result.path).toBe(deepDir);

        // Verify all parent directories were created
        const stats = await fs.stat(deepDir);
        expect(stats.isDirectory()).toBe(true);
      });

      it('should validate directory structure', async () => {
        const validDir = path.join(testDir, 'valid-dir');
        await FileSystemUtils.createDirectory(validDir);

        const result =
          await FileSystemUtils.validateDirectoryStructure(validDir);

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should clean up and remove directories', async () => {
        const dirToRemove = path.join(testDir, 'remove-test');
        await FileSystemUtils.createDirectory(dirToRemove);

        // Create some files in the directory
        await FileSystemUtils.createFile(
          path.join(dirToRemove, 'file1.txt'),
          'content1'
        );
        await FileSystemUtils.createFile(
          path.join(dirToRemove, 'file2.txt'),
          'content2'
        );

        const result = await FileSystemUtils.removeDirectory(dirToRemove);

        expect(result.success).toBe(true);

        // Verify directory was removed
        await expect(fs.stat(dirToRemove)).rejects.toThrow();
      });
    });

    describe('Path Resolution', () => {
      it('should normalize cross-platform paths', () => {
        const windowsPath = 'C:\\Users\\Test\\file.txt';
        const unixPath = '/home/user/file.txt';

        const normalizedWindows = FileSystemUtils.normalizePath(windowsPath);
        const normalizedUnix = FileSystemUtils.normalizePath(unixPath);

        expect(normalizedWindows).toBe('C:/Users/Test/file.txt');
        expect(normalizedUnix).toBe('/home/user/file.txt');
      });

      it('should validate and sanitize paths', () => {
        const validPath = 'test/file.txt';
        const invalidPath = 'test/../file.txt';

        const validResult = FileSystemUtils.validatePath(validPath);
        const invalidResult = FileSystemUtils.validatePath(invalidPath);

        expect(validResult.valid).toBe(true);
        expect(invalidResult.valid).toBe(false);
        expect(invalidResult.errors).toContain(
          'Path contains directory traversal attempts'
        );
      });

      it('should resolve relative paths', () => {
        const basePath = '/base/path';
        const relativePath = 'subdir/file.txt';

        const resolved = FileSystemUtils.resolveRelativePath(
          basePath,
          relativePath
        );

        expect(resolved).toBe(path.join(basePath, relativePath));
      });

      it('should detect path conflicts', async () => {
        const filePath = path.join(testDir, 'conflict-test.txt');
        await FileSystemUtils.createFile(filePath, 'content');

        const result = await FileSystemUtils.detectPathConflict(filePath);

        expect(result.hasConflict).toBe(true);
        expect(result.existingPath).toBe(filePath);
      });
    });

    describe('File Metadata Management', () => {
      it('should extract file metadata', async () => {
        const filePath = path.join(testDir, 'metadata-test.txt');
        const content = 'Test content for metadata';
        await FileSystemUtils.createFile(filePath, content);

        const metadata = await FileSystemUtils.extractFileMetadata(filePath);

        expect(metadata.success).toBe(true);
        expect(metadata.metadata).toBeDefined();
        expect(metadata.metadata!.size).toBe(content.length);
        expect(metadata.metadata!.created).toBeDefined();
        expect(metadata.metadata!.modified).toBeDefined();
      });

      it('should calculate file checksum', async () => {
        const filePath = path.join(testDir, 'checksum-test.txt');
        const content = 'Test content for checksum';
        await FileSystemUtils.createFile(filePath, content);

        const checksum = await FileSystemUtils.calculateFileChecksum(filePath);

        expect(checksum.success).toBe(true);
        expect(checksum.checksum).toBeDefined();
        expect(checksum.algorithm).toBe('sha256');
      });

      it('should compare file metadata', async () => {
        const file1 = path.join(testDir, 'compare1.txt');
        const file2 = path.join(testDir, 'compare2.txt');
        const content = 'Same content';

        await FileSystemUtils.createFile(file1, content);
        await FileSystemUtils.createFile(file2, content);

        const comparison = await FileSystemUtils.compareFileMetadata(
          file1,
          file2
        );

        expect(comparison.sameSize).toBe(true);
        expect(comparison.sameChecksum).toBe(true);
      });

      it('should validate file metadata', async () => {
        const filePath = path.join(testDir, 'validate-test.txt');
        await FileSystemUtils.createFile(filePath, 'test');

        const validation = await FileSystemUtils.validateFileMetadata(filePath);

        expect(validation.valid).toBe(true);
        expect(validation.errors).toHaveLength(0);
      });
    });
  });

  describe('TASK-034: Unit Tests for Backup System', () => {
    describe('Backup Creation and Verification', () => {
      it('should create automatic file backup', async () => {
        const filePath = path.join(testDir, 'backup-test.txt');
        const content = 'Original content';
        await FileSystemUtils.createFile(filePath, content);

        const backup = await FileSystemUtils.createBackup(filePath);

        expect(backup.success).toBe(true);
        expect(backup.backupPath).toBeDefined();

        // Verify backup content
        const backupContent = await fs.readFile(backup.backupPath!, 'utf8');
        expect(backupContent).toBe(content);
      });

      it('should verify backup integrity', async () => {
        const filePath = path.join(testDir, 'verify-test.txt');
        const content = 'Test content';
        await FileSystemUtils.createFile(filePath, content);

        const backup = await FileSystemUtils.createBackup(filePath);
        const verification = await FileSystemUtils.verifyBackup(
          backup.backupPath!
        );

        expect(verification.valid).toBe(true);
        expect(verification.checksum).toBeDefined();
      });

      it('should manage backup metadata', async () => {
        const filePath = path.join(testDir, 'metadata-backup.txt');
        await FileSystemUtils.createFile(filePath, 'test');

        const backup = await FileSystemUtils.createBackup(filePath);
        const metadata = await FileSystemUtils.getBackupMetadata(
          backup.backupPath!
        );

        expect(metadata.success).toBe(true);
        expect(metadata.metadata).toBeDefined();
        expect(metadata.metadata!.originalPath).toBe(filePath);
      });
    });

    describe('Rollback Operations', () => {
      it('should track rollback operations', async () => {
        const filePath = path.join(testDir, 'rollback-test.txt');
        await FileSystemUtils.createFile(filePath, 'original');

        const backup = await FileSystemUtils.createBackup(filePath);
        await FileSystemUtils.modifyFile(filePath, 'modified');

        const rollback = await FileSystemUtils.rollbackFile(
          filePath,
          backup.backupPath!
        );

        expect(rollback.success).toBe(true);
        expect(rollback.rollbackPath).toBeDefined();

        // Verify rollback restored original content
        const content = await fs.readFile(filePath, 'utf8');
        expect(content).toBe('original');
      });

      it('should execute rollback steps', async () => {
        const filePath = path.join(testDir, 'steps-test.txt');
        await FileSystemUtils.createFile(filePath, 'step1');

        const backup1 = await FileSystemUtils.createBackup(filePath);
        await FileSystemUtils.modifyFile(filePath, 'step2');

        const backup2 = await FileSystemUtils.createBackup(filePath);
        await FileSystemUtils.modifyFile(filePath, 'step3');

        const rollback = await FileSystemUtils.rollbackToStep(
          filePath,
          [backup1.backupPath!, backup2.backupPath!],
          1
        );

        expect(rollback.success).toBe(true);

        const content = await fs.readFile(filePath, 'utf8');
        expect(content).toBe('step2');
      });
    });

    describe('Backup Strategies', () => {
      it('should create incremental backup', async () => {
        const filePath = path.join(testDir, 'incremental-test.txt');
        await FileSystemUtils.createFile(filePath, 'base');

        const fullBackup = await FileSystemUtils.createFullBackup(filePath);
        await FileSystemUtils.modifyFile(filePath, 'modified');

        const incremental = await FileSystemUtils.createIncrementalBackup(
          filePath,
          fullBackup.backupPath!
        );

        expect(incremental.success).toBe(true);
        expect(incremental.incremental).toBe(true);
      });

      it('should create differential backup', async () => {
        const filePath = path.join(testDir, 'differential-test.txt');
        await FileSystemUtils.createFile(filePath, 'base');

        const fullBackup = await FileSystemUtils.createFullBackup(filePath);
        await FileSystemUtils.modifyFile(filePath, 'modified1');
        await FileSystemUtils.modifyFile(filePath, 'modified2');

        const differential = await FileSystemUtils.createDifferentialBackup(
          filePath,
          fullBackup.backupPath!
        );

        expect(differential.success).toBe(true);
        expect(differential.differential).toBe(true);
      });

      it('should compress backups', async () => {
        const filePath = path.join(testDir, 'compress-test.txt');
        const content = 'A'.repeat(1000); // Create larger content
        await FileSystemUtils.createFile(filePath, content);

        const backup = await FileSystemUtils.createBackup(filePath);
        const compressed = await FileSystemUtils.compressBackup(
          backup.backupPath!
        );

        expect(compressed.success).toBe(true);
        expect(compressed.compressedPath).toBeDefined();

        // Verify compressed file is smaller
        const originalStats = await fs.stat(backup.backupPath!);
        const compressedStats = await fs.stat(compressed.compressedPath!);
        expect(compressedStats.size).toBeLessThan(originalStats.size);
      });
    });
  });

  describe('TASK-035: Unit Tests for Conflict Resolution', () => {
    describe('Conflict Detection', () => {
      it('should detect file conflicts', async () => {
        const filePath = path.join(testDir, 'conflict-detect.txt');
        await FileSystemUtils.createFile(filePath, 'existing');

        const conflict = await FileSystemUtils.detectFileConflict(
          filePath,
          'new content'
        );

        expect(conflict.hasConflict).toBe(true);
        expect(conflict.conflictType).toBe('file_exists');
      });

      it('should detect directory conflicts', async () => {
        const dirPath = path.join(testDir, 'conflict-dir');
        await FileSystemUtils.createDirectory(dirPath);

        const conflict = await FileSystemUtils.detectDirectoryConflict(dirPath);

        expect(conflict.hasConflict).toBe(true);
        expect(conflict.conflictType).toBe('directory_exists');
      });

      it('should categorize conflicts', async () => {
        const filePath = path.join(testDir, 'categorize-test.txt');
        await FileSystemUtils.createFile(filePath, 'existing');

        const conflict = await FileSystemUtils.detectFileConflict(
          filePath,
          'new content'
        );
        const category = FileSystemUtils.categorizeConflict(conflict);

        expect(category.type).toBe('file_exists');
        expect(category.severity).toBeDefined();
      });

      it('should assess conflict severity', async () => {
        const filePath = path.join(testDir, 'severity-test.txt');
        await FileSystemUtils.createFile(filePath, 'existing');

        const conflict = await FileSystemUtils.detectFileConflict(
          filePath,
          'new content'
        );
        const severity = FileSystemUtils.assessConflictSeverity(conflict);

        expect(severity.level).toBeDefined();
        expect(severity.description).toBeDefined();
      });
    });

    describe('Conflict Resolution Strategies', () => {
      it('should implement overwrite strategy', async () => {
        const filePath = path.join(testDir, 'overwrite-test.txt');
        await FileSystemUtils.createFile(filePath, 'existing');

        const result = await FileSystemUtils.resolveConflictWithStrategy(
          filePath,
          'new content',
          'overwrite'
        );

        expect(result.success).toBe(true);
        expect(result.strategy).toBe('overwrite');

        const content = await fs.readFile(filePath, 'utf8');
        expect(content).toBe('new content');
      });

      it('should implement backup and rename strategy', async () => {
        const filePath = path.join(testDir, 'backup-rename-test.txt');
        await FileSystemUtils.createFile(filePath, 'existing');

        const result = await FileSystemUtils.resolveConflictWithStrategy(
          filePath,
          'new content',
          'backup_rename'
        );

        expect(result.success).toBe(true);
        expect(result.strategy).toBe('backup_rename');
        expect(result.backupPath).toBeDefined();

        const content = await fs.readFile(filePath, 'utf8');
        expect(content).toBe('new content');
      });

      it('should implement merge strategy', async () => {
        const filePath = path.join(testDir, 'merge-test.txt');
        await FileSystemUtils.createFile(filePath, 'existing content');

        const result = await FileSystemUtils.resolveConflictWithStrategy(
          filePath,
          'new content',
          'merge'
        );

        expect(result.success).toBe(true);
        expect(result.strategy).toBe('merge');

        const content = await fs.readFile(filePath, 'utf8');
        expect(content).toContain('existing content');
        expect(content).toContain('new content');
      });

      it('should implement skip strategy', async () => {
        const filePath = path.join(testDir, 'skip-test.txt');
        const originalContent = 'existing';
        await FileSystemUtils.createFile(filePath, originalContent);

        const result = await FileSystemUtils.resolveConflictWithStrategy(
          filePath,
          'new content',
          'skip'
        );

        expect(result.success).toBe(true);
        expect(result.strategy).toBe('skip');

        const content = await fs.readFile(filePath, 'utf8');
        expect(content).toBe(originalContent); // Should remain unchanged
      });
    });
  });

  describe('TASK-036: Unit Tests for Safety Validation', () => {
    describe('Permission Validation', () => {
      it('should check file permissions', async () => {
        const filePath = path.join(testDir, 'permission-check.txt');
        await FileSystemUtils.createFile(filePath, 'test');
        await FileSystemUtils.setFilePermissions(filePath, 0o644);

        const validation = await FileSystemUtils.validateFilePermissions(
          filePath,
          {
            read: true,
            write: true,
          }
        );

        expect(validation.valid).toBe(true);
        expect(validation.permissions.readable).toBe(true);
        expect(validation.permissions.writable).toBe(true);
      });

      it('should validate directory permissions', async () => {
        const dirPath = path.join(testDir, 'dir-permission');
        await FileSystemUtils.createDirectory(dirPath, 0o755);

        const validation = await FileSystemUtils.validateDirectoryPermissions(
          dirPath,
          {
            read: true,
            write: true,
            execute: true,
          }
        );

        expect(validation.valid).toBe(true);
      });

      it('should handle permission escalation', async () => {
        const filePath = path.join(testDir, 'escalation-test.txt');
        await FileSystemUtils.createFile(filePath, 'test');
        await FileSystemUtils.setFilePermissions(filePath, 0o000);

        const escalation = await FileSystemUtils.handlePermissionEscalation(
          filePath,
          {
            requiredPermissions: { read: true, write: true },
            escalationMethod: 'chmod',
          }
        );

        expect(escalation.success).toBe(true);
        expect(escalation.escalated).toBe(true);
      });
    });

    describe('Disk Space Checking', () => {
      it('should calculate disk space', async () => {
        const space = await FileSystemUtils.calculateDiskSpace(testDir);

        expect(space.success).toBe(true);
        expect(space.total).toBeGreaterThan(0);
        expect(space.available).toBeGreaterThan(0);
        expect(space.used).toBeGreaterThan(0);
      });

      it('should estimate space requirements', async () => {
        const filePath = path.join(testDir, 'space-estimate.txt');
        const content = 'Test content for space estimation';
        await FileSystemUtils.createFile(filePath, content);

        const estimate =
          await FileSystemUtils.estimateSpaceRequirements(filePath);

        expect(estimate.success).toBe(true);
        expect(estimate.required).toBeGreaterThan(0);
      });

      it('should check space thresholds', async () => {
        const threshold = await FileSystemUtils.checkSpaceThreshold(testDir, {
          minAvailable: 1024 * 1024, // 1MB
          warningThreshold: 0.9, // 90%
        });

        expect(threshold.success).toBe(true);
        expect(threshold.warnings).toBeDefined();
      });
    });

    describe('File System Validation', () => {
      it('should detect file system type', async () => {
        const fsInfo = await FileSystemUtils.detectFileSystemType(testDir);

        expect(fsInfo.success).toBe(true);
        expect(fsInfo.type).toBeDefined();
      });

      it('should check file system compatibility', async () => {
        const compatibility =
          await FileSystemUtils.checkFileSystemCompatibility(testDir, {
            requiredFeatures: ['case_sensitive', 'unicode_support'],
          });

        expect(compatibility.compatible).toBeDefined();
        expect(compatibility.features).toBeDefined();
      });

      it('should validate file system features', async () => {
        const features = await FileSystemUtils.validateFileSystemFeatures(
          testDir,
          {
            requiredFeatures: ['read', 'write'],
          }
        );

        expect(features.valid).toBe(true);
        expect(features.features).toBeDefined();
      });
    });

    describe('Operation Safety Checks', () => {
      it('should validate operations', async () => {
        const filePath = path.join(testDir, 'safety-test.txt');
        await FileSystemUtils.createFile(filePath, 'test');

        const validation = await FileSystemUtils.validateOperation(
          'read',
          filePath
        );

        expect(validation.valid).toBe(true);
        expect(validation.errors).toHaveLength(0);
      });

      it('should execute safety checks', async () => {
        const filePath = path.join(testDir, 'safety-execute.txt');
        await FileSystemUtils.createFile(filePath, 'test');

        const checks = await FileSystemUtils.executeSafetyChecks(filePath, {
          checkPermissions: true,
          checkDiskSpace: true,
          checkFileSystem: true,
        });

        expect(checks.success).toBe(true);
        expect(checks.checks).toBeDefined();
      });

      it('should generate safety reports', async () => {
        const filePath = path.join(testDir, 'safety-report.txt');
        await FileSystemUtils.createFile(filePath, 'test');

        const report = await FileSystemUtils.generateSafetyReport(filePath, {
          includeDetails: true,
          format: 'json',
        });

        expect(report.success).toBe(true);
        expect(report.report).toBeDefined();
      });
    });
  });
});
