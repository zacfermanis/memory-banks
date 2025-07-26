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

// Mock fs module for integration testing
jest.mock('fs/promises');
const mockedFs = fs as jest.Mocked<typeof fs>;

describe('FileSystemUtils Integration Tests', () => {
  const testDir = path.join(__dirname, 'integration-test-temp');

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

  describe('TASK-037: Integration Tests', () => {
    describe('Complete File Operation Workflows', () => {
      it('should handle complete file lifecycle workflow', async () => {
        const baseDir = path.join(testDir, 'lifecycle');
        const filePath = path.join(baseDir, 'workflow-test.txt');

        // 1. Create directory structure
        const dirResult =
          await FileSystemUtils.createDirectoryRecursive(baseDir);
        expect(dirResult.success).toBe(true);

        // 2. Create file with validation
        const createResult = await FileSystemUtils.createFile(
          filePath,
          'Initial content'
        );
        expect(createResult.success).toBe(true);
        expect(createResult.backupPath).toBeDefined();

        // 3. Modify file with backup
        const modifyResult = await FileSystemUtils.modifyFile(
          filePath,
          'Modified content'
        );
        expect(modifyResult.success).toBe(true);
        expect(modifyResult.backupPath).toBeDefined();

        // 4. Verify file content
        const content = await fs.readFile(filePath, 'utf8');
        expect(content).toBe('Modified content');

        // 5. Check metadata
        const metadata = await FileSystemUtils.extractFileMetadata(filePath);
        expect(metadata.success).toBe(true);
        expect(metadata.metadata!.size).toBe('Modified content'.length);

        // 6. Verify backup integrity
        const backupVerification = await FileSystemUtils.verifyBackup(
          createResult.backupPath!
        );
        expect(backupVerification.valid).toBe(true);

        // 7. Clean up
        const cleanupResult = await FileSystemUtils.removeFile(filePath);
        expect(cleanupResult.success).toBe(true);
      });

      it('should handle complex directory operations workflow', async () => {
        const baseDir = path.join(testDir, 'complex-dir');
        const subDir1 = path.join(baseDir, 'subdir1', 'nested');
        const subDir2 = path.join(baseDir, 'subdir2');
        const file1 = path.join(subDir1, 'file1.txt');
        const file2 = path.join(subDir2, 'file2.txt');

        // 1. Create complex directory structure
        const dir1Result =
          await FileSystemUtils.createDirectoryRecursive(subDir1);
        const dir2Result =
          await FileSystemUtils.createDirectoryRecursive(subDir2);
        expect(dir1Result.success).toBe(true);
        expect(dir2Result.success).toBe(true);

        // 2. Create files in different directories
        const file1Result = await FileSystemUtils.createFile(
          file1,
          'Content 1'
        );
        const file2Result = await FileSystemUtils.createFile(
          file2,
          'Content 2'
        );
        expect(file1Result.success).toBe(true);
        expect(file2Result.success).toBe(true);

        // 3. Validate directory structure
        const validation =
          await FileSystemUtils.validateDirectoryStructure(baseDir);
        expect(validation.valid).toBe(true);

        // 4. Traverse directory
        const traversal = await FileSystemUtils.traverseDirectoryEfficiently(
          baseDir,
          {
            includeFiles: true,
            includeDirectories: true,
            maxDepth: 3,
          }
        );
        expect(traversal.success).toBe(true);
        expect(traversal.files.length).toBeGreaterThan(0);
        expect(traversal.directories.length).toBeGreaterThan(0);

        // 5. Batch operations
        const batchResult = await FileSystemUtils.batchFileOperations([
          { type: 'read', source: file1 },
          { type: 'read', source: file2 },
          {
            type: 'write',
            destination: path.join(baseDir, 'combined.txt'),
            content: 'Combined content',
          },
        ]);
        expect(batchResult.success).toBe(true);
        expect(batchResult.results.length).toBe(3);

        // 6. Clean up entire structure
        const cleanupResult = await FileSystemUtils.removeDirectory(baseDir);
        expect(cleanupResult.success).toBe(true);
      });

      it('should handle cross-platform path operations workflow', async () => {
        const testPaths = [
          'test/file.txt',
          'test\\file.txt',
          '/absolute/path/file.txt',
          'C:\\Windows\\file.txt',
          '~/home/file.txt',
        ];

        for (const testPath of testPaths) {
          // 1. Normalize path
          const normalized = FileSystemUtils.normalizePath(testPath);
          expect(normalized).toBeDefined();

          // 2. Validate path
          const validation = FileSystemUtils.validatePath(normalized);
          expect(validation.valid).toBe(true);

          // 3. Resolve relative path
          const resolved = FileSystemUtils.resolveRelativePath(
            testDir,
            normalized
          );
          expect(resolved).toBeDefined();

          // 4. Check platform compatibility
          const compatibility =
            await FileSystemUtils.testPlatformCompatibility(testDir);
          expect(compatibility.compatible).toBe(true);
        }
      });
    });

    describe('Backup and Rollback Workflows', () => {
      it('should handle complete backup and rollback workflow', async () => {
        const filePath = path.join(testDir, 'backup-rollback-test.txt');
        const originalContent = 'Original content';
        const modifiedContent = 'Modified content';
        const finalContent = 'Final content';

        // 1. Create initial file
        const createResult = await FileSystemUtils.createFile(
          filePath,
          originalContent
        );
        expect(createResult.success).toBe(true);

        // 2. Create full backup
        const fullBackup = await FileSystemUtils.createFullBackup(filePath);
        expect(fullBackup.success).toBe(true);
        expect(fullBackup.backupPath).toBeDefined();

        // 3. Modify file
        const modifyResult = await FileSystemUtils.modifyFile(
          filePath,
          modifiedContent
        );
        expect(modifyResult.success).toBe(true);

        // 4. Create incremental backup
        const incrementalBackup = await FileSystemUtils.createIncrementalBackup(
          filePath,
          fullBackup.backupPath!
        );
        expect(incrementalBackup.success).toBe(true);
        expect(incrementalBackup.incremental).toBe(true);

        // 5. Modify file again
        const modify2Result = await FileSystemUtils.modifyFile(
          filePath,
          finalContent
        );
        expect(modify2Result.success).toBe(true);

        // 6. Rollback to original state
        const rollbackResult = await FileSystemUtils.rollbackFile(
          filePath,
          fullBackup.backupPath!
        );
        expect(rollbackResult.success).toBe(true);

        // 7. Verify rollback
        const content = await fs.readFile(filePath, 'utf8');
        expect(content).toBe(originalContent);

        // 8. Verify backup integrity
        const integrity = await FileSystemUtils.validateBackupIntegrity(
          fullBackup.backupPath!
        );
        expect(integrity.valid).toBe(true);
      });

      it('should handle differential backup workflow', async () => {
        const filePath = path.join(testDir, 'differential-test.txt');
        const contents = ['Version 1', 'Version 2', 'Version 3', 'Version 4'];

        // 1. Create initial file and full backup
        await FileSystemUtils.createFile(filePath, contents[0]);
        const fullBackup = await FileSystemUtils.createFullBackup(filePath);
        expect(fullBackup.success).toBe(true);

        // 2. Create multiple versions with differential backups
        const differentialBackups = [];
        for (let i = 1; i < contents.length; i++) {
          await FileSystemUtils.modifyFile(filePath, contents[i]);
          const diffBackup = await FileSystemUtils.createDifferentialBackup(
            filePath,
            fullBackup.backupPath!
          );
          expect(diffBackup.success).toBe(true);
          differentialBackups.push(diffBackup);
        }

        // 3. Rollback to each version
        for (let i = differentialBackups.length - 1; i >= 0; i--) {
          const rollbackResult = await FileSystemUtils.rollbackFile(
            filePath,
            differentialBackups[i].backupPath!
          );
          expect(rollbackResult.success).toBe(true);

          const content = await fs.readFile(filePath, 'utf8');
          expect(content).toBe(contents[i + 1]);
        }

        // 4. Rollback to original
        const finalRollback = await FileSystemUtils.rollbackFile(
          filePath,
          fullBackup.backupPath!
        );
        expect(finalRollback.success).toBe(true);

        const finalContent = await fs.readFile(filePath, 'utf8');
        expect(finalContent).toBe(contents[0]);
      });

      it('should handle backup compression and encryption workflow', async () => {
        const filePath = path.join(testDir, 'secure-backup-test.txt');
        const content = 'Sensitive content that needs protection';

        // 1. Create file
        await FileSystemUtils.createFile(filePath, content);

        // 2. Create secure backup with encryption and compression
        const secureBackup = await FileSystemUtils.createSecureBackup(
          filePath,
          {
            encryption: true,
            encryptionKey: 'test-key-123',
            compression: true,
            integrityCheck: true,
            accessControl: true,
          }
        );
        expect(secureBackup.success).toBe(true);
        expect(secureBackup.securityFeatures.encrypted).toBe(true);
        expect(secureBackup.securityFeatures.compressed).toBe(true);
        expect(secureBackup.securityFeatures.integrityChecked).toBe(true);
        expect(secureBackup.securityFeatures.accessControlled).toBe(true);

        // 3. Verify backup integrity
        const integrity = await FileSystemUtils.validateBackupIntegrity(
          secureBackup.backupPath
        );
        expect(integrity.valid).toBe(true);

        // 4. Set access controls
        const accessControl = await FileSystemUtils.setBackupAccessControl(
          secureBackup.backupPath,
          {
            permissions: 0o600,
          }
        );
        expect(accessControl.success).toBe(true);
      });
    });

    describe('Conflict Resolution Workflows', () => {
      it('should handle file conflict resolution workflow', async () => {
        const filePath = path.join(testDir, 'conflict-resolution.txt');
        const originalContent = 'Original content';
        const newContent = 'New content from external source';

        // 1. Create initial file
        await FileSystemUtils.createFile(filePath, originalContent);

        // 2. Simulate external modification (conflict)
        const conflict = await FileSystemUtils.detectFileConflict(
          filePath,
          newContent
        );
        expect(conflict.hasConflict).toBe(true);

        // 3. Categorize conflict
        const category = FileSystemUtils.categorizeConflict(conflict);
        expect(category.type).toBe('file_exists');

        // 4. Assess severity
        const severity = FileSystemUtils.assessConflictSeverity(conflict);
        expect(severity.level).toBeDefined();

        // 5. Resolve with different strategies
        const strategies = ['overwrite', 'backup_rename', 'merge', 'skip'];

        for (const strategy of strategies) {
          // Reset file to original state
          await FileSystemUtils.modifyFile(filePath, originalContent);

          // Apply resolution strategy
          const resolution = await FileSystemUtils.resolveConflictWithStrategy(
            filePath,
            newContent,
            strategy as any
          );
          expect(resolution.success).toBe(true);
          expect(resolution.strategy).toBe(strategy);

          // Verify result based on strategy
          const content = await fs.readFile(filePath, 'utf8');
          switch (strategy) {
            case 'overwrite':
              expect(content).toBe(newContent);
              break;
            case 'backup_rename':
              expect(content).toBe(newContent);
              expect(resolution.backupPath).toBeDefined();
              break;
            case 'merge':
              expect(content).toContain(originalContent);
              expect(content).toContain(newContent);
              break;
            case 'skip':
              expect(content).toBe(originalContent);
              break;
          }
        }
      });

      it('should handle directory conflict resolution workflow', async () => {
        const dirPath = path.join(testDir, 'dir-conflict');
        const subDirPath = path.join(dirPath, 'subdir');
        const filePath = path.join(subDirPath, 'file.txt');

        // 1. Create directory structure
        await FileSystemUtils.createDirectoryRecursive(subDirPath);
        await FileSystemUtils.createFile(filePath, 'Original file');

        // 2. Simulate directory conflict
        const conflict = await FileSystemUtils.detectDirectoryConflict(dirPath);
        expect(conflict.hasConflict).toBe(true);

        // 3. Resolve with backup strategy
        const resolution =
          await FileSystemUtils.resolveDirectoryConflictWithStrategy(
            dirPath,
            'backup_rename'
          );
        expect(resolution.success).toBe(true);
        expect(resolution.backupPath).toBeDefined();

        // 4. Verify backup contains original structure
        const backupValidation =
          await FileSystemUtils.validateDirectoryStructure(
            resolution.backupPath!
          );
        expect(backupValidation.valid).toBe(true);
      });

      it('should handle automatic conflict resolution workflow', async () => {
        const filePath = path.join(testDir, 'auto-resolution.txt');
        const originalContent = 'Original content';
        const conflictingContent = 'Conflicting content';

        // 1. Create file
        await FileSystemUtils.createFile(filePath, originalContent);

        // 2. Set up automatic resolution rules
        const rules = [
          {
            pattern: '*.txt',
            strategy: 'backup_rename',
            priority: 1,
          },
          {
            pattern: 'auto-resolution.*',
            strategy: 'merge',
            priority: 2,
          },
        ];

        // 3. Apply automatic resolution
        const autoResolution =
          await FileSystemUtils.resolveConflictAutomatically(
            filePath,
            conflictingContent,
            rules
          );
        expect(autoResolution.success).toBe(true);
        expect(autoResolution.strategy).toBe('merge'); // Higher priority rule should apply

        // 4. Verify automatic resolution worked
        const content = await fs.readFile(filePath, 'utf8');
        expect(content).toContain(originalContent);
        expect(content).toContain(conflictingContent);
      });
    });

    describe('Error Handling Workflows', () => {
      it('should handle file operation error recovery workflow', async () => {
        const filePath = path.join(testDir, 'error-recovery.txt');
        const content = 'Test content for error recovery';

        // 1. Create file
        await FileSystemUtils.createFile(filePath, content);

        // 2. Simulate error during modification
        const errorResult = await FileSystemUtils.handleFileOperationError(
          'modify',
          filePath,
          new Error('Simulated error'),
          {
            enableRecovery: true,
            createBackup: true,
            retryAttempts: 3,
          }
        );

        expect(errorResult.handled).toBe(true);
        expect(errorResult.recoveryAttempted).toBe(true);

        // 3. Verify file integrity maintained
        const finalContent = await fs.readFile(filePath, 'utf8');
        expect(finalContent).toBe(content); // Should remain unchanged after error
      });

      it('should handle disk space error workflow', async () => {
        const filePath = path.join(testDir, 'disk-space-error.txt');
        const largeContent = 'A'.repeat(1024 * 1024); // 1MB content

        // 1. Check available space
        const spaceCheck = await FileSystemUtils.calculateDiskSpace(testDir);
        expect(spaceCheck.success).toBe(true);

        // 2. Simulate disk space error
        const errorResult = await FileSystemUtils.handleDiskSpaceError(
          filePath,
          largeContent.length,
          {
            enableCleanup: true,
            enableCompression: true,
            fallbackLocation: path.join(testDir, 'fallback'),
          }
        );

        expect(errorResult.handled).toBe(true);
        expect(errorResult.solutions).toBeDefined();
      });

      it('should handle permission error workflow', async () => {
        const filePath = path.join(testDir, 'permission-error.txt');
        await FileSystemUtils.createFile(filePath, 'test');

        // 1. Set restrictive permissions
        await FileSystemUtils.setFilePermissions(filePath, 0o000);

        // 2. Attempt operation that should fail
        const errorResult = await FileSystemUtils.handlePermissionError(
          filePath,
          'write',
          {
            enableEscalation: true,
            escalationMethod: 'chmod',
            fallbackUser: process.env['USER'],
          }
        );

        expect(errorResult.handled).toBe(true);
        expect(errorResult.escalated).toBe(true);

        // 3. Verify operation can now succeed
        const writeResult = await FileSystemUtils.modifyFile(
          filePath,
          'New content'
        );
        expect(writeResult.success).toBe(true);
      });

      it('should handle graceful degradation workflow', async () => {
        const filePath = path.join(testDir, 'graceful-degradation.txt');
        const content = 'Original content';

        // 1. Create file
        await FileSystemUtils.createFile(filePath, content);

        // 2. Simulate partial operation failure
        const degradationResult =
          await FileSystemUtils.handleGracefulDegradation(filePath, 'modify', {
            fallbackOperations: ['backup', 'partial_write'],
            enablePartialSuccess: true,
            maintainIntegrity: true,
          });

        expect(degradationResult.degraded).toBe(true);
        expect(degradationResult.partialSuccess).toBe(true);
        expect(degradationResult.integrityMaintained).toBe(true);

        // 3. Verify file is still accessible
        const finalContent = await fs.readFile(filePath, 'utf8');
        expect(finalContent).toBeDefined();
      });
    });
  });

  describe('TASK-038: Cross-Platform Tests', () => {
    describe('Windows Compatibility', () => {
      it('should handle Windows path operations', async () => {
        const windowsPaths = [
          'C:\\Users\\Test\\file.txt',
          'C:\\Program Files\\App\\config.ini',
          '\\\\server\\share\\file.txt',
        ];

        for (const winPath of windowsPaths) {
          // 1. Normalize Windows path
          const normalized = FileSystemUtils.normalizeWindowsPath(winPath);
          expect(normalized).toBeDefined();
          expect(normalized).toContain('/'); // Should convert to forward slashes

          // 2. Get Windows permissions
          const permissions =
            await FileSystemUtils.getWindowsPermissions(normalized);
          expect(permissions).toBeDefined();

          // 3. Get Windows file system features
          const features =
            await FileSystemUtils.getWindowsFileSystemFeatures(testDir);
          expect(features).toBeDefined();
          expect(features.supportsLongPaths).toBeDefined();

          // 4. Optimize for Windows
          const optimization =
            await FileSystemUtils.optimizeForWindows(normalized);
          expect(optimization.optimized).toBeDefined();
        }
      });
    });

    describe('macOS Compatibility', () => {
      it('should handle macOS path operations', async () => {
        const macPaths = [
          '/Users/test/file.txt',
          '~/Documents/file.txt',
          '/System/Library/file.txt',
        ];

        for (const macPath of macPaths) {
          // 1. Normalize macOS path
          const normalized = FileSystemUtils.normalizeMacOSPath(macPath);
          expect(normalized).toBeDefined();

          // 2. Get macOS permissions
          const permissions =
            await FileSystemUtils.getMacOSPermissions(normalized);
          expect(permissions).toBeDefined();

          // 3. Get macOS file system features
          const features =
            await FileSystemUtils.getMacOSFileSystemFeatures(testDir);
          expect(features).toBeDefined();
          expect(features.supportsAPFS).toBeDefined();

          // 4. Optimize for macOS
          const optimization =
            await FileSystemUtils.optimizeForMacOS(normalized);
          expect(optimization.optimized).toBeDefined();
        }
      });
    });

    describe('Linux Compatibility', () => {
      it('should handle Linux path operations', async () => {
        const linuxPaths = [
          '/home/user/file.txt',
          '~/config/file.conf',
          '/etc/systemd/file.service',
        ];

        for (const linuxPath of linuxPaths) {
          // 1. Normalize Linux path
          const normalized = FileSystemUtils.normalizeLinuxPath(linuxPath);
          expect(normalized).toBeDefined();

          // 2. Get Linux permissions
          const permissions =
            await FileSystemUtils.getLinuxPermissions(normalized);
          expect(permissions).toBeDefined();

          // 3. Get Linux file system features
          const features =
            await FileSystemUtils.getLinuxFileSystemFeatures(testDir);
          expect(features).toBeDefined();
          expect(features.supportsExt4).toBeDefined();

          // 4. Optimize for Linux
          const optimization =
            await FileSystemUtils.optimizeForLinux(normalized);
          expect(optimization.optimized).toBeDefined();
        }
      });
    });

    describe('Cross-Platform Validation', () => {
      it('should validate cross-platform compatibility', async () => {
        // 1. Detect platform
        const platform = FileSystemUtils.detectPlatform();
        expect(platform.platform).toBeDefined();
        expect(platform.arch).toBeDefined();
        expect(platform.features).toBeDefined();

        // 2. Get platform adapter
        const adapter = FileSystemUtils.getPlatformAdapter();
        expect(adapter.normalizePath).toBeDefined();
        expect(adapter.getPermissions).toBeDefined();
        expect(adapter.getFileSystemFeatures).toBeDefined();
        expect(adapter.optimize).toBeDefined();

        // 3. Test cross-platform file creation
        const crossPlatformResult =
          await FileSystemUtils.createFileCrossPlatform(
            path.join(testDir, 'cross-platform.txt'),
            'Cross-platform content'
          );
        expect(crossPlatformResult.success).toBe(true);
        expect(crossPlatformResult.platform).toBeDefined();

        // 4. Test platform compatibility
        const compatibility =
          await FileSystemUtils.testPlatformCompatibility(testDir);
        expect(compatibility.compatible).toBe(true);
        expect(compatibility.features).toBeDefined();
      });
    });
  });

  describe('TASK-039: Performance Tests', () => {
    describe('File Operation Performance', () => {
      it('should test file operation performance', async () => {
        const filePath = path.join(testDir, 'performance-test.txt');
        const content = 'A'.repeat(1024 * 1024); // 1MB content

        // 1. Time file creation
        const createTiming = await FileSystemUtils.timeOperation(
          'file_create',
          () => FileSystemUtils.createFile(filePath, content)
        );
        expect(createTiming.duration).toBeGreaterThan(0);
        expect(createTiming.success).toBe(true);

        // 2. Time file reading
        const readTiming = await FileSystemUtils.timeOperation(
          'file_read',
          () => FileSystemUtils.readFileEfficiently(filePath)
        );
        expect(readTiming.duration).toBeGreaterThan(0);
        expect(readTiming.success).toBe(true);

        // 3. Time file modification
        const modifyTiming = await FileSystemUtils.timeOperation(
          'file_modify',
          () => FileSystemUtils.modifyFile(filePath, 'Modified content')
        );
        expect(modifyTiming.duration).toBeGreaterThan(0);
        expect(modifyTiming.success).toBe(true);

        // 4. Collect performance metrics
        const metrics = FileSystemUtils.collectPerformanceMetrics();
        expect(metrics.operations).toBeDefined();
        expect(metrics.totalDuration).toBeGreaterThan(0);
      });
    });

    describe('Backup Operation Performance', () => {
      it('should test backup operation performance', async () => {
        const filePath = path.join(testDir, 'backup-performance.txt');
        const content = 'A'.repeat(512 * 1024); // 512KB content
        await FileSystemUtils.createFile(filePath, content);

        // 1. Time full backup
        const fullBackupTiming = await FileSystemUtils.timeOperation(
          'full_backup',
          () => FileSystemUtils.createFullBackup(filePath)
        );
        expect(fullBackupTiming.duration).toBeGreaterThan(0);
        expect(fullBackupTiming.success).toBe(true);

        // 2. Time incremental backup
        await FileSystemUtils.modifyFile(filePath, 'Modified content');
        const incrementalTiming = await FileSystemUtils.timeOperation(
          'incremental_backup',
          () =>
            FileSystemUtils.createIncrementalBackup(
              filePath,
              fullBackupTiming.result!.backupPath
            )
        );
        expect(incrementalTiming.duration).toBeGreaterThan(0);
        expect(incrementalTiming.success).toBe(true);

        // 3. Time backup compression
        const compressionTiming = await FileSystemUtils.timeOperation(
          'backup_compression',
          () =>
            FileSystemUtils.compressBackup(fullBackupTiming.result!.backupPath)
        );
        expect(compressionTiming.duration).toBeGreaterThan(0);
        expect(compressionTiming.success).toBe(true);
      });
    });

    describe('Memory Usage Tests', () => {
      it('should test memory usage optimization', async () => {
        const filePath = path.join(testDir, 'memory-test.txt');
        const largeContent = 'A'.repeat(10 * 1024 * 1024); // 10MB content

        // 1. Monitor memory usage during large file operations
        const memoryBefore = process.memoryUsage();

        await FileSystemUtils.createFile(filePath, largeContent);
        const backup = await FileSystemUtils.createFullBackup(filePath);
        await FileSystemUtils.compressBackup(backup.backupPath);

        const memoryAfter = process.memoryUsage();

        // 2. Check memory optimization
        const optimization = FileSystemUtils.optimizeMemoryUsage();
        expect(optimization.recommendations).toBeDefined();

        // 3. Verify memory usage is reasonable
        const memoryIncrease = memoryAfter.heapUsed - memoryBefore.heapUsed;
        expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Should not increase by more than 50MB
      });
    });

    describe('Scalability Tests', () => {
      it('should test scalability with multiple operations', async () => {
        const numFiles = 100;
        const fileSize = 1024; // 1KB per file

        // 1. Create multiple files
        const createPromises = [];
        for (let i = 0; i < numFiles; i++) {
          const filePath = path.join(testDir, `scalability-${i}.txt`);
          createPromises.push(
            FileSystemUtils.createFile(filePath, 'A'.repeat(fileSize))
          );
        }

        const createResults = await Promise.all(createPromises);
        expect(createResults.length).toBe(numFiles);
        expect(createResults.every(r => r.success)).toBe(true);

        // 2. Batch operations
        const batchOperations = createResults.map(result => ({
          type: 'read' as const,
          source: result.path,
        }));

        const batchResult =
          await FileSystemUtils.batchFileOperations(batchOperations);
        expect(batchResult.success).toBe(true);
        expect(batchResult.results.length).toBe(numFiles);

        // 3. Performance monitoring
        const metrics = FileSystemUtils.collectPerformanceMetrics();
        expect(metrics.operations['file_create']).toBeDefined();
        expect(metrics.operations['file_read']).toBeDefined();
      });
    });
  });

  describe('TASK-040: Security Tests', () => {
    describe('File System Security', () => {
      it('should test path validation security', async () => {
        const maliciousPaths = [
          '../../../etc/passwd',
          'C:\\Windows\\System32\\config\\SAM',
          'file:///etc/passwd',
          'javascript:alert(1)',
          'file.txt\0',
          'file.txt<script>alert(1)</script>',
        ];

        for (const maliciousPath of maliciousPaths) {
          const validation = FileSystemUtils.validatePath(maliciousPath);
          expect(validation.valid).toBe(false);
          expect(validation.errors.length).toBeGreaterThan(0);
        }
      });

      it('should test directory traversal prevention', async () => {
        const basePath = testDir;
        const traversalAttempts = [
          '../outside',
          '..\\outside',
          '....//....//etc/passwd',
          'normal/path/../../../outside',
        ];

        for (const traversal of traversalAttempts) {
          const prevention = FileSystemUtils.preventDirectoryTraversal(
            basePath,
            traversal
          );
          expect(prevention.safe).toBe(false);
          expect(prevention.errors.length).toBeGreaterThan(0);
        }
      });

      it('should test secure file operations', async () => {
        const filePath = path.join(testDir, 'secure-test.txt');
        const content = 'Secure content';

        const secureResult = await FileSystemUtils.secureFileOperation(
          'create',
          filePath,
          () => FileSystemUtils.createFile(filePath, content),
          {
            validatePath: true,
            preventTraversal: true,
            basePath: testDir,
            checkPermissions: true,
            auditLog: true,
          }
        );

        expect(secureResult.success).toBe(true);
        expect(secureResult.securityChecks.pathValid).toBe(true);
        expect(secureResult.securityChecks.traversalSafe).toBe(true);
        expect(secureResult.auditEntry).toBeDefined();
      });
    });

    describe('Backup Security', () => {
      it('should test secure backup creation', async () => {
        const filePath = path.join(testDir, 'secure-backup-test.txt');
        await FileSystemUtils.createFile(filePath, 'Sensitive data');

        const secureBackup = await FileSystemUtils.createSecureBackup(
          filePath,
          {
            encryption: true,
            encryptionKey: 'test-secure-key-123',
            compression: true,
            integrityCheck: true,
            accessControl: true,
          }
        );

        expect(secureBackup.success).toBe(true);
        expect(secureBackup.securityFeatures.encrypted).toBe(true);
        expect(secureBackup.securityFeatures.compressed).toBe(true);
        expect(secureBackup.securityFeatures.integrityChecked).toBe(true);
        expect(secureBackup.securityFeatures.accessControlled).toBe(true);
      });

      it('should test backup encryption', async () => {
        const filePath = path.join(testDir, 'encryption-test.txt');
        await FileSystemUtils.createFile(filePath, 'Secret content');

        const backup = await FileSystemUtils.createBackup(filePath);
        const encryptedBackup = await FileSystemUtils.encryptBackup(
          backup.backupPath,
          'encryption-key-456',
          {
            algorithm: 'aes-256-cbc',
            keyDerivation: true,
          }
        );

        expect(encryptedBackup.success).toBe(true);
        expect(encryptedBackup.algorithm).toBe('aes-256-cbc');
      });

      it('should test backup access control', async () => {
        const filePath = path.join(testDir, 'access-control-test.txt');
        await FileSystemUtils.createFile(filePath, 'Protected content');

        const backup = await FileSystemUtils.createBackup(filePath);
        const accessControl = await FileSystemUtils.setBackupAccessControl(
          backup.backupPath,
          {
            permissions: 0o600,
            owner: process.env['USER'],
          }
        );

        expect(accessControl.success).toBe(true);
        expect(accessControl.appliedControls.permissions).toBe('600');
      });
    });

    describe('Operation Security', () => {
      it('should test operation validation', async () => {
        const filePath = path.join(testDir, 'operation-validation.txt');
        await FileSystemUtils.createFile(filePath, 'test');

        const validation = FileSystemUtils.validateOperation(
          'read',
          filePath,
          undefined,
          {
            allowedOperations: ['read', 'write'],
            restrictedPaths: ['/restricted'],
            maxFileSize: 1024 * 1024,
            requireAuthentication: true,
          }
        );

        expect(validation.valid).toBe(true);
        expect(validation.securityLevel).toBeDefined();
      });

      it('should test unauthorized access prevention', async () => {
        const filePath = path.join(testDir, 'unauthorized-test.txt');
        await FileSystemUtils.createFile(filePath, 'test');

        const accessCheck = await FileSystemUtils.preventUnauthorizedAccess(
          filePath,
          'read',
          {
            allowedUsers: ['different-user'],
            allowedGroups: ['different-group'],
            requireOwnership: true,
            auditAccess: true,
          }
        );

        expect(accessCheck.authorized).toBe(false);
        expect(accessCheck.errors.length).toBeGreaterThan(0);
        expect(accessCheck.auditEntry).toBeDefined();
      });

      it('should test secure temporary files', async () => {
        const tempFile = await FileSystemUtils.createSecureTempFile({
          prefix: 'secure-',
          suffix: '.tmp',
          permissions: 0o600,
          autoCleanup: true,
          maxAge: 60000, // 1 minute
        });

        expect(tempFile.path).toBeDefined();
        expect(tempFile.security.permissions).toBe('600');
        expect(tempFile.security.autoCleanup).toBe(true);

        // Test cleanup
        await tempFile.cleanup();
      });
    });

    describe('Security Monitoring', () => {
      it('should test security event logging', async () => {
        // Log various security events
        FileSystemUtils.logSecurityEvent(
          'unauthorized_access',
          'Test unauthorized access',
          {
            severity: 'high',
            path: '/test/path',
          }
        );

        FileSystemUtils.logSecurityEvent(
          'permission_violation',
          'Test permission violation',
          {
            severity: 'medium',
            user: 'test-user',
          }
        );

        // Verify events were logged
        const violations = FileSystemUtils.detectSecurityViolations();
        expect(violations.violations.length).toBeGreaterThan(0);
      });

      it('should test security violation detection', async () => {
        // Simulate multiple failed access attempts
        for (let i = 0; i < 6; i++) {
          FileSystemUtils.logSecurityEvent(
            'unauthorized_access',
            `Failed attempt ${i}`,
            {
              severity: 'high',
              path: '/sensitive/file.txt',
            }
          );
        }

        const violations = FileSystemUtils.detectSecurityViolations({
          timeWindow: 60 * 60 * 1000, // 1 hour
          maxFailedAttempts: 5,
        });

        expect(violations.violations.length).toBeGreaterThan(0);
        expect(violations.recommendations.length).toBeGreaterThan(0);
      });

      it('should test security reporting', async () => {
        // Generate security report
        const report = FileSystemUtils.generateSecurityReport({
          timeRange: 24 * 60 * 60 * 1000, // 24 hours
          includeDetails: true,
          format: 'json',
        });

        expect(report).toBeDefined();
        expect(report).toContain('"summary"');
        expect(report).toContain('"violations"');
      });

      it('should test security alerting', async () => {
        const alertResult = await FileSystemUtils.sendSecurityAlert(
          'violation',
          {
            title: 'Test Security Alert',
            description: 'This is a test security alert',
            severity: 'high',
            violations: [],
            recommendations: ['Test recommendation'],
          },
          {
            channels: ['console'],
            immediate: true,
          }
        );

        expect(alertResult.sent).toBe(true);
        expect(alertResult.channels).toContain('console');
      });
    });
  });
});
