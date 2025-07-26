# File Operations Usage Examples

## Overview

This document provides practical examples of how to use the FileSystemUtils class for various file operations scenarios. Each example includes complete code snippets that you can run directly.

## Table of Contents

1. [Basic File Operations](#basic-file-operations)
2. [Backup and Rollback Examples](#backup-and-rollback-examples)
3. [Conflict Resolution Examples](#conflict-resolution-examples)
4. [Cross-Platform Examples](#cross-platform-examples)
5. [Advanced Scenarios](#advanced-scenarios)

## Basic File Operations

### Example 1: Simple File Creation and Reading

```typescript
import { FileSystemUtils } from './fileSystem';

async function basicFileOperations() {
  try {
    // Create a simple text file
    const createResult = await FileSystemUtils.createFile(
      'data/hello.txt',
      'Hello, World!',
      { createBackup: true }
    );

    if (createResult.success) {
      console.log('File created successfully');
      console.log(`Path: ${createResult.path}`);
      console.log(`Backup: ${createResult.backupPath}`);
    } else {
      console.error('Failed to create file:', createResult.errors);
    }

    // Read the file back
    const readResult = await FileSystemUtils.readFile('data/hello.txt');
    
    if (readResult.success) {
      console.log('File content:', readResult.content);
      console.log('File size:', readResult.metadata.size);
    } else {
      console.error('Failed to read file:', readResult.errors);
    }

  } catch (error) {
    console.error('Error in basic file operations:', error);
  }
}

// Run the example
basicFileOperations();
```

### Example 2: Working with JSON Files

```typescript
import { FileSystemUtils } from './fileSystem';

async function jsonFileOperations() {
  try {
    // Create a configuration file
    const config = {
      appName: 'MyApp',
      version: '1.0.0',
      settings: {
        theme: 'dark',
        language: 'en',
        autoSave: true
      }
    };

    const createResult = await FileSystemUtils.createFile(
      'config/app.json',
      JSON.stringify(config, null, 2),
      { 
        createBackup: true,
        permissions: 0o644
      }
    );

    if (createResult.success) {
      console.log('Configuration file created');
    }

    // Read and modify the configuration
    const readResult = await FileSystemUtils.readFile('config/app.json');
    
    if (readResult.success) {
      const currentConfig = JSON.parse(readResult.content);
      
      // Update the configuration
      currentConfig.version = '1.1.0';
      currentConfig.settings.theme = 'light';

      // Save the updated configuration
      const updateResult = await FileSystemUtils.modifyFile(
        'config/app.json',
        JSON.stringify(currentConfig, null, 2),
        { createBackup: true }
      );

      if (updateResult.success) {
        console.log('Configuration updated successfully');
      }
    }

  } catch (error) {
    console.error('Error in JSON file operations:', error);
  }
}

jsonFileOperations();
```

### Example 3: Directory Operations

```typescript
import { FileSystemUtils } from './fileSystem';

async function directoryOperations() {
  try {
    // Create a complex directory structure
    const dirResult = await FileSystemUtils.createDirectoryRecursive(
      'data/logs/2024/01/15',
      0o755
    );

    if (dirResult.success) {
      console.log('Directory structure created');
    }

    // Create multiple files in the directory
    const files = [
      { name: 'app.log', content: 'Application log content' },
      { name: 'error.log', content: 'Error log content' },
      { name: 'access.log', content: 'Access log content' }
    ];

    for (const file of files) {
      const result = await FileSystemUtils.createFile(
        `data/logs/2024/01/15/${file.name}`,
        file.content
      );

      if (result.success) {
        console.log(`Created: ${file.name}`);
      }
    }

    // Traverse the directory
    const traversal = await FileSystemUtils.traverseDirectoryEfficiently(
      'data/logs',
      {
        includeFiles: true,
        includeDirectories: true,
        maxDepth: 4,
        filter: (path) => path.endsWith('.log')
      }
    );

    if (traversal.success) {
      console.log(`Found ${traversal.files.length} log files`);
      console.log(`Found ${traversal.directories.length} directories`);
    }

  } catch (error) {
    console.error('Error in directory operations:', error);
  }
}

directoryOperations();
```

### Example 4: Batch File Operations

```typescript
import { FileSystemUtils } from './fileSystem';

async function batchOperations() {
  try {
    // Define batch operations
    const operations = [
      {
        type: 'create' as const,
        destination: 'data/file1.txt',
        content: 'Content for file 1'
      },
      {
        type: 'create' as const,
        destination: 'data/file2.txt',
        content: 'Content for file 2'
      },
      {
        type: 'create' as const,
        destination: 'data/file3.txt',
        content: 'Content for file 3'
      }
    ];

    // Execute batch operations
    const batchResult = await FileSystemUtils.batchFileOperations(
      operations,
      {
        concurrency: 2,
        retryAttempts: 3,
        createBackup: true
      }
    );

    if (batchResult.success) {
      console.log(`Successfully processed ${batchResult.results.length} operations`);
      
      batchResult.results.forEach((result, index) => {
        if (result.success) {
          console.log(`Operation ${index + 1}: Success`);
        } else {
          console.log(`Operation ${index + 1}: Failed - ${result.error}`);
        }
      });
    }

  } catch (error) {
    console.error('Error in batch operations:', error);
  }
}

batchOperations();
```

## Backup and Rollback Examples

### Example 1: Basic Backup and Restore

```typescript
import { FileSystemUtils } from './fileSystem';

async function basicBackupRestore() {
  try {
    const filePath = 'data/important.txt';
    
    // Create initial file
    await FileSystemUtils.createFile(filePath, 'Important data version 1');
    
    // Create a backup
    const backup = await FileSystemUtils.createBackup(filePath, {
      compression: true,
      retention: '7d'
    });

    if (backup.success) {
      console.log(`Backup created: ${backup.backupPath}`);
    }

    // Modify the file
    await FileSystemUtils.modifyFile(filePath, 'Important data version 2');
    console.log('File modified');

    // Verify backup integrity
    const verification = await FileSystemUtils.verifyBackup(backup.backupPath);
    
    if (verification.valid) {
      console.log('Backup is valid');
    }

    // Restore from backup
    const restore = await FileSystemUtils.restoreFromBackup(
      filePath,
      backup.backupPath,
      { createBackup: true }
    );

    if (restore.success) {
      console.log('File restored from backup');
      
      // Verify the content
      const content = await FileSystemUtils.readFile(filePath);
      console.log('Restored content:', content.content);
    }

  } catch (error) {
    console.error('Error in backup/restore:', error);
  }
}

basicBackupRestore();
```

### Example 2: Incremental Backup Strategy

```typescript
import { FileSystemUtils } from './fileSystem';

async function incrementalBackupStrategy() {
  try {
    const filePath = 'data/database.json';
    
    // Create initial file
    const initialData = {
      users: ['user1', 'user2'],
      version: '1.0.0'
    };
    
    await FileSystemUtils.createFile(
      filePath,
      JSON.stringify(initialData, null, 2)
    );

    // Create full backup
    const fullBackup = await FileSystemUtils.createFullBackup(filePath, {
      compression: true
    });

    console.log(`Full backup created: ${fullBackup.backupPath}`);

    // Simulate multiple changes
    const changes = [
      { users: ['user1', 'user2', 'user3'], version: '1.1.0' },
      { users: ['user1', 'user2', 'user3', 'user4'], version: '1.2.0' },
      { users: ['user1', 'user2', 'user3', 'user4', 'user5'], version: '1.3.0' }
    ];

    const incrementalBackups = [];

    for (const change of changes) {
      // Apply change
      await FileSystemUtils.modifyFile(
        filePath,
        JSON.stringify(change, null, 2)
      );

      // Create incremental backup
      const incremental = await FileSystemUtils.createIncrementalBackup(
        filePath,
        fullBackup.backupPath,
        {
          compression: true,
          deduplication: true
        }
      );

      if (incremental.success) {
        incrementalBackups.push(incremental);
        console.log(`Incremental backup created: ${incremental.backupPath}`);
      }
    }

    // Rollback to specific version
    const targetVersion = '1.2.0';
    const targetBackup = incrementalBackups[1]; // Version 1.2.0

    const rollback = await FileSystemUtils.rollbackFile(
      filePath,
      targetBackup.backupPath,
      { createBackup: true }
    );

    if (rollback.success) {
      console.log(`Rolled back to version ${targetVersion}`);
      
      const content = await FileSystemUtils.readFile(filePath);
      const data = JSON.parse(content.content);
      console.log('Current version:', data.version);
    }

  } catch (error) {
    console.error('Error in incremental backup strategy:', error);
  }
}

incrementalBackupStrategy();
```

### Example 3: Secure Backup with Encryption

```typescript
import { FileSystemUtils } from './fileSystem';

async function secureBackupExample() {
  try {
    const filePath = 'data/sensitive.txt';
    const sensitiveData = 'This is highly sensitive information';
    
    // Create sensitive file
    await FileSystemUtils.createFile(filePath, sensitiveData);

    // Create secure backup with encryption
    const secureBackup = await FileSystemUtils.createSecureBackup(filePath, {
      encryption: true,
      encryptionKey: 'my-secure-key-123',
      compression: true,
      integrityCheck: true,
      accessControl: true
    });

    if (secureBackup.success) {
      console.log('Secure backup created with following features:');
      console.log(`- Encrypted: ${secureBackup.securityFeatures.encrypted}`);
      console.log(`- Compressed: ${secureBackup.securityFeatures.compressed}`);
      console.log(`- Integrity checked: ${secureBackup.securityFeatures.integrityChecked}`);
      console.log(`- Access controlled: ${secureBackup.securityFeatures.accessControlled}`);
    }

    // Set additional access controls
    const accessControl = await FileSystemUtils.setBackupAccessControl(
      secureBackup.backupPath,
      {
        permissions: 0o600, // Owner read/write only
        owner: process.env.USER
      }
    );

    if (accessControl.success) {
      console.log('Access controls applied');
    }

    // Validate backup integrity
    const integrity = await FileSystemUtils.validateBackupIntegrity(
      secureBackup.backupPath,
      {
        checkHash: true,
        verifySize: true,
        checkMetadata: true
      }
    );

    if (integrity.valid) {
      console.log('Backup integrity validated');
    } else {
      console.error('Backup integrity check failed:', integrity.errors);
    }

  } catch (error) {
    console.error('Error in secure backup example:', error);
  }
}

secureBackupExample();
```

## Conflict Resolution Examples

### Example 1: Basic Conflict Detection and Resolution

```typescript
import { FileSystemUtils } from './fileSystem';

async function basicConflictResolution() {
  try {
    const filePath = 'data/config.json';
    
    // Create initial file
    await FileSystemUtils.createFile(
      filePath,
      JSON.stringify({ theme: 'dark', language: 'en' }, null, 2)
    );

    // Simulate external modification (conflict)
    const externalContent = JSON.stringify({ theme: 'light', language: 'es' }, null, 2);
    
    // Detect conflict
    const conflict = await FileSystemUtils.detectFileConflict(filePath, externalContent);
    
    if (conflict.hasConflict) {
      console.log(`Conflict detected: ${conflict.conflictType}`);
      console.log(`Severity: ${conflict.severity}`);
      
      // Categorize the conflict
      const category = FileSystemUtils.categorizeConflict(conflict);
      console.log(`Category: ${category.type}`);
      
      // Assess severity
      const severity = FileSystemUtils.assessConflictSeverity(conflict);
      console.log(`Severity level: ${severity.level}`);
      console.log(`Description: ${severity.description}`);
      
      // Resolve with different strategies
      const strategies = ['overwrite', 'backup_rename', 'merge', 'skip'];
      
      for (const strategy of strategies) {
        console.log(`\nTesting strategy: ${strategy}`);
        
        // Reset file to original state
        await FileSystemUtils.modifyFile(
          filePath,
          JSON.stringify({ theme: 'dark', language: 'en' }, null, 2)
        );
        
        // Apply resolution strategy
        const resolution = await FileSystemUtils.resolveConflictWithStrategy(
          filePath,
          externalContent,
          strategy as any
        );
        
        if (resolution.success) {
          console.log(`Strategy ${strategy} applied successfully`);
          
          // Check result
          const content = await FileSystemUtils.readFile(filePath);
          const data = JSON.parse(content.content);
          console.log(`Result: theme=${data.theme}, language=${data.language}`);
        }
      }
    }

  } catch (error) {
    console.error('Error in basic conflict resolution:', error);
  }
}

basicConflictResolution();
```

### Example 2: Automatic Conflict Resolution with Rules

```typescript
import { FileSystemUtils } from './fileSystem';

async function automaticConflictResolution() {
  try {
    const filePath = 'data/settings.json';
    
    // Create initial file
    await FileSystemUtils.createFile(
      filePath,
      JSON.stringify({ autoSave: true, notifications: false }, null, 2)
    );

    // Define resolution rules
    const rules = [
      {
        pattern: '*.json',
        strategy: 'merge',
        priority: 1,
        description: 'Merge JSON files by default'
      },
      {
        pattern: 'settings.json',
        strategy: 'backup_rename',
        priority: 2,
        description: 'Backup settings before overwriting'
      },
      {
        pattern: '*.log',
        strategy: 'overwrite',
        priority: 3,
        description: 'Overwrite log files'
      },
      {
        pattern: '*.tmp',
        strategy: 'skip',
        priority: 4,
        description: 'Skip temporary files'
      }
    ];

    // Simulate conflicting content
    const conflictingContent = JSON.stringify({ 
      autoSave: false, 
      notifications: true,
      newSetting: 'value'
    }, null, 2);

    // Apply automatic resolution
    const resolution = await FileSystemUtils.resolveConflictAutomatically(
      filePath,
      conflictingContent,
      rules
    );

    if (resolution.success) {
      console.log(`Automatic resolution applied: ${resolution.strategy}`);
      console.log(`Rule used: ${resolution.rule?.description}`);
      
      // Check the result
      const content = await FileSystemUtils.readFile(filePath);
      const data = JSON.parse(content.content);
      console.log('Final settings:', data);
    }

  } catch (error) {
    console.error('Error in automatic conflict resolution:', error);
  }
}

automaticConflictResolution();
```

### Example 3: Directory Conflict Resolution

```typescript
import { FileSystemUtils } from './fileSystem';

async function directoryConflictResolution() {
  try {
    const dirPath = 'data/project';
    
    // Create initial directory structure
    await FileSystemUtils.createDirectoryRecursive(dirPath);
    
    // Create some files in the directory
    await FileSystemUtils.createFile(`${dirPath}/main.js`, 'console.log("Hello");');
    await FileSystemUtils.createFile(`${dirPath}/config.json`, '{"debug": true}');
    
    // Simulate directory conflict (directory already exists with different content)
    const conflict = await FileSystemUtils.detectDirectoryConflict(dirPath);
    
    if (conflict.hasConflict) {
      console.log(`Directory conflict detected: ${conflict.conflictType}`);
      
      // Resolve with backup strategy
      const resolution = await FileSystemUtils.resolveDirectoryConflictWithStrategy(
        dirPath,
        'backup_rename'
      );
      
      if (resolution.success) {
        console.log('Directory conflict resolved');
        console.log(`Backup created: ${resolution.backupPath}`);
        
        // Verify backup contains original structure
        const backupValidation = await FileSystemUtils.validateDirectoryStructure(
          resolution.backupPath
        );
        
        if (backupValidation.valid) {
          console.log('Backup directory structure is valid');
        }
      }
    }

  } catch (error) {
    console.error('Error in directory conflict resolution:', error);
  }
}

directoryConflictResolution();
```

## Cross-Platform Examples

### Example 1: Platform Detection and Optimization

```typescript
import { FileSystemUtils } from './fileSystem';

async function platformDetectionExample() {
  try {
    // Detect current platform
    const platform = FileSystemUtils.detectPlatform();
    
    console.log('Platform Information:');
    console.log(`- Platform: ${platform.platform}`);
    console.log(`- Architecture: ${platform.arch}`);
    console.log(`- Version: ${platform.version}`);
    console.log(`- Features: ${platform.features.join(', ')}`);

    // Get platform-specific adapter
    const adapter = FileSystemUtils.getPlatformAdapter();
    
    // Test platform-specific operations
    const testPath = 'data/test-file.txt';
    const normalizedPath = adapter.normalizePath(testPath);
    console.log(`Normalized path: ${normalizedPath}`);

    // Test cross-platform file creation
    const crossPlatformResult = await FileSystemUtils.createFileCrossPlatform(
      testPath,
      'Cross-platform content',
      { optimizeForPlatform: true }
    );

    if (crossPlatformResult.success) {
      console.log(`File created on ${crossPlatformResult.platform}`);
      console.log(`Optimizations applied: ${crossPlatformResult.optimizations.join(', ')}`);
      
      if (crossPlatformResult.warnings.length > 0) {
        console.log(`Warnings: ${crossPlatformResult.warnings.join(', ')}`);
      }
    }

    // Test platform compatibility
    const compatibility = await FileSystemUtils.testPlatformCompatibility('.');
    
    console.log('\nPlatform Compatibility:');
    console.log(`- Compatible: ${compatibility.compatible}`);
    console.log(`- Features: ${compatibility.features.join(', ')}`);
    console.log(`- Limitations: ${compatibility.limitations.join(', ')}`);
    console.log(`- Recommendations: ${compatibility.recommendations.join(', ')}`);

  } catch (error) {
    console.error('Error in platform detection example:', error);
  }
}

platformDetectionExample();
```

### Example 2: Windows-Specific Operations

```typescript
import { FileSystemUtils } from './fileSystem';

async function windowsSpecificExample() {
  try {
    // Test Windows path handling
    const windowsPaths = [
      'C:\\Users\\Test\\file.txt',
      'C:\\Program Files\\App\\config.ini',
      '\\\\server\\share\\file.txt'
    ];

    for (const winPath of windowsPaths) {
      console.log(`\nProcessing Windows path: ${winPath}`);
      
      // Normalize Windows path
      const normalized = FileSystemUtils.normalizeWindowsPath(winPath);
      console.log(`Normalized: ${normalized}`);
      
      // Get Windows permissions
      const permissions = await FileSystemUtils.getWindowsPermissions(normalized);
      console.log(`Permissions: ${permissions.permissions}`);
      
      // Get Windows file system features
      const features = await FileSystemUtils.getWindowsFileSystemFeatures('.');
      console.log(`Long path support: ${features.supportsLongPaths}`);
      console.log(`Symlink support: ${features.supportsSymlinks}`);
      
      // Optimize for Windows
      const optimization = await FileSystemUtils.optimizeForWindows(normalized);
      console.log(`Optimized: ${optimization.optimized}`);
      if (optimization.optimizations.length > 0) {
        console.log(`Optimizations: ${optimization.optimizations.join(', ')}`);
      }
    }

  } catch (error) {
    console.error('Error in Windows-specific example:', error);
  }
}

windowsSpecificExample();
```

### Example 3: macOS-Specific Operations

```typescript
import { FileSystemUtils } from './fileSystem';

async function macOSSpecificExample() {
  try {
    // Test macOS path handling
    const macPaths = [
      '/Users/test/file.txt',
      '~/Documents/file.txt',
      '/System/Library/file.txt'
    ];

    for (const macPath of macPaths) {
      console.log(`\nProcessing macOS path: ${macPath}`);
      
      // Normalize macOS path
      const normalized = FileSystemUtils.normalizeMacOSPath(macPath);
      console.log(`Normalized: ${normalized}`);
      
      // Get macOS permissions
      const permissions = await FileSystemUtils.getMacOSPermissions(normalized);
      console.log(`Permissions: ${permissions.permissions}`);
      
      // Get macOS file system features
      const features = await FileSystemUtils.getMacOSFileSystemFeatures('.');
      console.log(`APFS support: ${features.supportsAPFS}`);
      console.log(`Extended attributes: ${features.supportsExtendedAttributes}`);
      
      // Optimize for macOS
      const optimization = await FileSystemUtils.optimizeForMacOS(normalized);
      console.log(`Optimized: ${optimization.optimized}`);
      if (optimization.optimizations.length > 0) {
        console.log(`Optimizations: ${optimization.optimizations.join(', ')}`);
      }
    }

  } catch (error) {
    console.error('Error in macOS-specific example:', error);
  }
}

macOSSpecificExample();
```

### Example 4: Linux-Specific Operations

```typescript
import { FileSystemUtils } from './fileSystem';

async function linuxSpecificExample() {
  try {
    // Test Linux path handling
    const linuxPaths = [
      '/home/user/file.txt',
      '~/config/file.conf',
      '/etc/systemd/file.service'
    ];

    for (const linuxPath of linuxPaths) {
      console.log(`\nProcessing Linux path: ${linuxPath}`);
      
      // Normalize Linux path
      const normalized = FileSystemUtils.normalizeLinuxPath(linuxPath);
      console.log(`Normalized: ${normalized}`);
      
      // Get Linux permissions
      const permissions = await FileSystemUtils.getLinuxPermissions(normalized);
      console.log(`Permissions: ${permissions.permissions}`);
      
      // Get Linux file system features
      const features = await FileSystemUtils.getLinuxFileSystemFeatures('.');
      console.log(`Ext4 support: ${features.supportsExt4}`);
      console.log(`ACL support: ${features.supportsACLs}`);
      
      // Optimize for Linux
      const optimization = await FileSystemUtils.optimizeForLinux(normalized);
      console.log(`Optimized: ${optimization.optimized}`);
      if (optimization.optimizations.length > 0) {
        console.log(`Optimizations: ${optimization.optimizations.join(', ')}`);
      }
    }

  } catch (error) {
    console.error('Error in Linux-specific example:', error);
  }
}

linuxSpecificExample();
```

## Advanced Scenarios

### Example 1: Performance Monitoring and Optimization

```typescript
import { FileSystemUtils } from './fileSystem';

async function performanceMonitoringExample() {
  try {
    // Clear previous performance data
    FileSystemUtils.clearPerformanceData();

    // Perform various operations with timing
    const operations = [
      () => FileSystemUtils.createFile('data/large-file.txt', 'A'.repeat(1024 * 1024)),
      () => FileSystemUtils.readFileEfficiently('data/large-file.txt'),
      () => FileSystemUtils.createBackup('data/large-file.txt'),
      () => FileSystemUtils.compressBackup('data/large-file.txt.backup')
    ];

    for (let i = 0; i < operations.length; i++) {
      const timing = await FileSystemUtils.timeOperation(
        `operation_${i}`,
        operations[i],
        { trackMemory: true }
      );
      
      console.log(`Operation ${i} completed in ${timing.duration}ms`);
    }

    // Collect performance metrics
    const metrics = FileSystemUtils.collectPerformanceMetrics();
    
    console.log('\nPerformance Metrics:');
    console.log(`Total operations: ${metrics.totalOperations}`);
    console.log(`Total duration: ${metrics.totalDuration}ms`);
    console.log(`Average duration: ${metrics.averageDuration}ms`);
    console.log(`Success rate: ${metrics.successRate}%`);

    // Generate performance report
    const report = FileSystemUtils.generatePerformanceReport({
      format: 'text',
      includeDetails: true
    });
    
    console.log('\nPerformance Report:');
    console.log(report);

    // Get optimization suggestions
    const suggestions = FileSystemUtils.generateOptimizationSuggestions();
    
    console.log('\nOptimization Suggestions:');
    suggestions.forEach((suggestion, index) => {
      console.log(`${index + 1}. ${suggestion.description} (${suggestion.priority} priority)`);
    });

  } catch (error) {
    console.error('Error in performance monitoring example:', error);
  }
}

performanceMonitoringExample();
```

### Example 2: Security Monitoring and Alerting

```typescript
import { FileSystemUtils } from './fileSystem';

async function securityMonitoringExample() {
  try {
    // Clear previous security data
    FileSystemUtils.clearAuditLog();

    // Simulate various security events
    const securityEvents = [
      {
        eventType: 'unauthorized_access',
        description: 'Attempted access to restricted file',
        severity: 'high' as const,
        path: '/restricted/file.txt'
      },
      {
        eventType: 'permission_violation',
        description: 'Permission denied for file operation',
        severity: 'medium' as const,
        path: '/data/config.json'
      },
      {
        eventType: 'directory_traversal',
        description: 'Directory traversal attempt detected',
        severity: 'critical' as const,
        path: '../../../etc/passwd'
      }
    ];

    // Log security events
    for (const event of securityEvents) {
      FileSystemUtils.logSecurityEvent(
        event.eventType,
        event.description,
        {
          severity: event.severity,
          path: event.path,
          user: 'test-user'
        }
      );
    }

    // Log some operations for audit
    await FileSystemUtils.logOperation('read', '/data/file.txt', true, {
      logLevel: 'info'
    });

    await FileSystemUtils.logOperation('write', '/data/sensitive.txt', false, {
      logLevel: 'security',
      errors: ['Permission denied']
    });

    // Detect security violations
    const violations = FileSystemUtils.detectSecurityViolations({
      timeWindow: 60 * 60 * 1000, // 1 hour
      maxFailedAttempts: 3
    });

    console.log('Security Violations Detected:');
    violations.violations.forEach(violation => {
      console.log(`- ${violation.type}: ${violation.description} (${violation.severity})`);
    });

    console.log('\nRecommendations:');
    violations.recommendations.forEach(rec => {
      console.log(`- ${rec}`);
    });

    // Generate security report
    const securityReport = FileSystemUtils.generateSecurityReport({
      timeRange: 24 * 60 * 60 * 1000, // 24 hours
      includeDetails: true,
      format: 'json'
    });

    console.log('\nSecurity Report:');
    console.log(securityReport);

    // Send security alert
    if (violations.violations.length > 0) {
      const alertResult = await FileSystemUtils.sendSecurityAlert(
        'violation',
        {
          title: 'Security Violations Detected',
          description: 'Multiple security violations have been detected',
          severity: 'high',
          violations: violations.violations,
          recommendations: violations.recommendations
        },
        {
          channels: ['console'],
          immediate: true
        }
      );

      console.log(`Security alert sent: ${alertResult.sent}`);
    }

  } catch (error) {
    console.error('Error in security monitoring example:', error);
  }
}

securityMonitoringExample();
```

### Example 3: Complete Application Workflow

```typescript
import { FileSystemUtils } from './fileSystem';

async function completeApplicationWorkflow() {
  try {
    console.log('Starting complete application workflow...');

    // 1. Setup application directory structure
    const appDirs = [
      'app/data',
      'app/config',
      'app/logs',
      'app/backups'
    ];

    for (const dir of appDirs) {
      await FileSystemUtils.createDirectoryRecursive(dir, 0o755);
    }

    // 2. Create initial configuration
    const config = {
      appName: 'MyApplication',
      version: '1.0.0',
      database: {
        host: 'localhost',
        port: 5432,
        name: 'myapp'
      },
      logging: {
        level: 'info',
        file: 'app/logs/app.log'
      }
    };

    const configResult = await FileSystemUtils.createFile(
      'app/config/config.json',
      JSON.stringify(config, null, 2),
      { createBackup: true }
    );

    if (configResult.success) {
      console.log('Configuration created with backup');
    }

    // 3. Create initial data file
    const data = {
      users: [],
      sessions: [],
      lastUpdate: new Date().toISOString()
    };

    await FileSystemUtils.createFile(
      'app/data/database.json',
      JSON.stringify(data, null, 2),
      { createBackup: true }
    );

    // 4. Create secure backup
    const secureBackup = await FileSystemUtils.createSecureBackup(
      'app/config/config.json',
      {
        encryption: true,
        encryptionKey: 'app-secure-key-456',
        compression: true,
        integrityCheck: true
      }
    );

    if (secureBackup.success) {
      console.log('Secure backup created');
    }

    // 5. Simulate application usage
    for (let i = 1; i <= 5; i++) {
      // Add a user
      const userData = await FileSystemUtils.readFile('app/data/database.json');
      const currentData = JSON.parse(userData.content);
      
      currentData.users.push({ id: i, name: `User ${i}` });
      currentData.lastUpdate = new Date().toISOString();

      // Check for conflicts (simulate concurrent access)
      const conflict = await FileSystemUtils.detectFileConflict(
        'app/data/database.json',
        JSON.stringify(currentData, null, 2)
      );

      if (conflict.hasConflict) {
        console.log(`Conflict detected on iteration ${i}, resolving...`);
        
        const resolution = await FileSystemUtils.resolveConflictWithStrategy(
          'app/data/database.json',
          JSON.stringify(currentData, null, 2),
          'merge'
        );

        if (resolution.success) {
          console.log('Conflict resolved successfully');
        }
      } else {
        await FileSystemUtils.modifyFile(
          'app/data/database.json',
          JSON.stringify(currentData, null, 2),
          { createBackup: true }
        );
      }

      // Create incremental backup every 2 iterations
      if (i % 2 === 0) {
        const incremental = await FileSystemUtils.createIncrementalBackup(
          'app/data/database.json',
          secureBackup.backupPath,
          { compression: true }
        );

        if (incremental.success) {
          console.log(`Incremental backup ${i/2} created`);
        }
      }

      // Log operation
      await FileSystemUtils.logOperation(
        'update',
        'app/data/database.json',
        true,
        { logLevel: 'info' }
      );
    }

    // 6. Performance monitoring
    const metrics = FileSystemUtils.collectPerformanceMetrics();
    console.log(`\nWorkflow completed. Total operations: ${metrics.totalOperations}`);

    // 7. Generate reports
    const performanceReport = FileSystemUtils.generatePerformanceReport({
      format: 'html',
      includeDetails: true
    });

    const securityReport = FileSystemUtils.generateSecurityReport({
      format: 'json',
      includeDetails: true
    });

    // Save reports
    await FileSystemUtils.createFile('app/logs/performance-report.html', performanceReport);
    await FileSystemUtils.createFile('app/logs/security-report.json', securityReport);

    console.log('Complete application workflow finished successfully!');

  } catch (error) {
    console.error('Error in complete application workflow:', error);
  }
}

completeApplicationWorkflow();
```

## Running the Examples

To run these examples:

1. Make sure you have the FileSystemUtils class available
2. Create a test directory for the examples
3. Run each example function individually
4. Check the console output for results
5. Examine generated files and logs

## Notes

- All examples include proper error handling
- Examples demonstrate best practices for file operations
- Security features are enabled where appropriate
- Performance monitoring is included in advanced examples
- Cross-platform compatibility is demonstrated
- Backup and rollback strategies are shown
- Conflict resolution is thoroughly demonstrated

These examples provide a comprehensive guide to using the FileSystemUtils class for various real-world scenarios. 