# File Operations Best Practices Guide

## Overview

This guide provides comprehensive best practices for using the FileSystemUtils class effectively, securely, and efficiently. Following these practices will help you build robust, maintainable, and secure file operations in your applications.

## Table of Contents

1. [File Operation Best Practices](#file-operation-best-practices)
2. [Backup Strategy Best Practices](#backup-strategy-best-practices)
3. [Conflict Resolution Best Practices](#conflict-resolution-best-practices)
4. [Security Best Practices](#security-best-practices)
5. [Performance Best Practices](#performance-best-practices)
6. [Cross-Platform Best Practices](#cross-platform-best-practices)
7. [Error Handling Best Practices](#error-handling-best-practices)

## File Operation Best Practices

### 1. Always Use Safe File Operations

**❌ Don't do this:**
```typescript
import * as fs from 'fs/promises';

// Direct file system access without safety checks
await fs.writeFile('data.txt', 'content');
```

**✅ Do this:**
```typescript
import { FileSystemUtils } from './fileSystem';

// Safe file operations with validation and backup
const result = await FileSystemUtils.createFile(
  'data.txt',
  'content',
  { createBackup: true, validatePath: true }
);

if (!result.success) {
  console.error('File operation failed:', result.errors);
}
```

### 2. Validate Paths Before Operations

**❌ Don't do this:**
```typescript
// No path validation
const userInput = req.body.filePath;
await FileSystemUtils.createFile(userInput, content);
```

**✅ Do this:**
```typescript
// Validate and sanitize paths
const userInput = req.body.filePath;
const validation = FileSystemUtils.validatePath(userInput, {
  allowRelative: false,
  allowedExtensions: ['.txt', '.json'],
  maxLength: 4096
});

if (!validation.valid) {
  throw new Error(`Invalid path: ${validation.errors.join(', ')}`);
}

const result = await FileSystemUtils.createFile(
  validation.sanitized!,
  content,
  { createBackup: true }
);
```

### 3. Use Atomic Operations for Critical Data

**❌ Don't do this:**
```typescript
// Non-atomic operation that could leave file in corrupted state
await FileSystemUtils.createFile('critical-data.db', largeData);
```

**✅ Do this:**
```typescript
// Atomic operation ensures data integrity
const result = await FileSystemUtils.createFileAtomic(
  'critical-data.db',
  largeData,
  { createBackup: true }
);

if (!result.success) {
  // File is either completely written or not written at all
  console.error('Atomic operation failed:', result.errors);
}
```

### 4. Handle Large Files Efficiently

**❌ Don't do this:**
```typescript
// Reading large files into memory
const result = await FileSystemUtils.readFile('large-file.dat');
```

**✅ Do this:**
```typescript
// Use efficient reading for large files
const result = await FileSystemUtils.readFileEfficiently(
  'large-file.dat',
  {
    useStreaming: true,
    maxSize: 100 * 1024 * 1024, // 100MB limit
    encoding: 'utf8'
  }
);
```

### 5. Batch Operations for Multiple Files

**❌ Don't do this:**
```typescript
// Sequential operations
for (const file of files) {
  await FileSystemUtils.createFile(file.path, file.content);
}
```

**✅ Do this:**
```typescript
// Batch operations for better performance
const operations = files.map(file => ({
  type: 'create' as const,
  destination: file.path,
  content: file.content
}));

const batchResult = await FileSystemUtils.batchFileOperations(
  operations,
  {
    concurrency: 3,
    retryAttempts: 2,
    createBackup: true
  }
);
```

### 6. Always Check Operation Results

**❌ Don't do this:**
```typescript
// Ignoring operation results
await FileSystemUtils.createFile('data.txt', 'content');
console.log('File created');
```

**✅ Do this:**
```typescript
// Always check operation results
const result = await FileSystemUtils.createFile('data.txt', 'content');

if (result.success) {
  console.log('File created successfully');
  if (result.backupPath) {
    console.log('Backup created:', result.backupPath);
  }
} else {
  console.error('File creation failed:', result.errors);
  // Handle the error appropriately
}
```

## Backup Strategy Best Practices

### 1. Implement a 3-2-1 Backup Strategy

**✅ Recommended Backup Strategy:**
```typescript
// 3 copies, 2 different media types, 1 off-site
const backupStrategy = {
  local: {
    full: 'daily',
    incremental: 'hourly',
    retention: '30d'
  },
  remote: {
    full: 'weekly',
    incremental: 'daily',
    retention: '90d'
  },
  archive: {
    full: 'monthly',
    retention: '1y'
  }
};
```

### 2. Use Appropriate Backup Types

**✅ Choose the right backup type:**
```typescript
// For frequently changing files
const incrementalBackup = await FileSystemUtils.createIncrementalBackup(
  'database.db',
  'backups/full-backup.db',
  { compression: true, deduplication: true }
);

// For critical configuration files
const fullBackup = await FileSystemUtils.createFullBackup(
  'config.json',
  { compression: true, encryption: true }
);

// For large datasets
const differentialBackup = await FileSystemUtils.createDifferentialBackup(
  'large-dataset.dat',
  'backups/full-backup.dat',
  { compression: true }
);
```

### 3. Implement Backup Verification

**✅ Always verify backups:**
```typescript
const backup = await FileSystemUtils.createBackup('critical-file.txt');

// Verify backup integrity
const verification = await FileSystemUtils.verifyBackup(backup.backupPath, {
  checkChecksum: true,
  checkSize: true,
  checkMetadata: true
});

if (!verification.valid) {
  console.error('Backup verification failed:', verification.errors);
  // Retry backup or alert administrators
}
```

### 4. Use Secure Backups for Sensitive Data

**✅ Encrypt sensitive backups:**
```typescript
const secureBackup = await FileSystemUtils.createSecureBackup(
  'sensitive-data.txt',
  {
    encryption: true,
    encryptionKey: process.env.BACKUP_ENCRYPTION_KEY,
    compression: true,
    integrityCheck: true,
    accessControl: true
  }
);

// Set appropriate permissions
await FileSystemUtils.setBackupAccessControl(secureBackup.backupPath, {
  permissions: 0o600, // Owner read/write only
  owner: process.env.BACKUP_USER
});
```

### 5. Implement Backup Retention Policies

**✅ Manage backup lifecycle:**
```typescript
// Clean up old backups
const cleanupResult = await FileSystemUtils.cleanupOldBackups(
  'backups/',
  {
    retentionDays: 30,
    maxBackups: 100,
    preserveFullBackups: true
  }
);

console.log(`Cleaned up ${cleanupResult.removedCount} old backups`);
```

## Conflict Resolution Best Practices

### 1. Define Clear Conflict Resolution Rules

**✅ Establish resolution policies:**
```typescript
const conflictRules = [
  {
    pattern: '*.config.json',
    strategy: 'backup_rename',
    priority: 1,
    description: 'Always backup configuration files'
  },
  {
    pattern: '*.log',
    strategy: 'overwrite',
    priority: 2,
    description: 'Overwrite log files'
  },
  {
    pattern: '*.data.json',
    strategy: 'merge',
    priority: 3,
    description: 'Merge data files intelligently'
  },
  {
    pattern: '*.tmp',
    strategy: 'skip',
    priority: 4,
    description: 'Skip temporary files'
  }
];
```

### 2. Use Automatic Resolution When Appropriate

**✅ Implement automatic conflict resolution:**
```typescript
const resolution = await FileSystemUtils.resolveConflictAutomatically(
  'data/config.json',
  newContent,
  conflictRules
);

if (resolution.success) {
  console.log(`Conflict resolved using ${resolution.strategy} strategy`);
} else {
  // Fall back to manual resolution
  await handleManualConflictResolution(filePath, newContent);
}
```

### 3. Implement User-Friendly Conflict Handling

**✅ Provide clear conflict information:**
```typescript
const conflict = await FileSystemUtils.detectFileConflict(filePath, newContent);

if (conflict.hasConflict) {
  const severity = FileSystemUtils.assessConflictSeverity(conflict);
  
  console.log(`Conflict detected: ${conflict.conflictType}`);
  console.log(`Severity: ${severity.level}`);
  console.log(`Description: ${severity.description}`);
  
  // Provide user with resolution options
  const options = ['overwrite', 'backup_rename', 'merge', 'skip'];
  const userChoice = await promptUserForResolution(options);
  
  const resolution = await FileSystemUtils.resolveConflictWithStrategy(
    filePath,
    newContent,
    userChoice
  );
}
```

### 4. Log Conflict Resolution Actions

**✅ Track conflict resolution:**
```typescript
const resolution = await FileSystemUtils.resolveConflictWithStrategy(
  filePath,
  newContent,
  strategy
);

// Log the resolution action
await FileSystemUtils.logOperation(
  'conflict_resolution',
  filePath,
  resolution.success,
  {
    metadata: {
      strategy,
      conflictType: conflict.conflictType,
      severity: conflict.severity
    },
    logLevel: 'info'
  }
);
```

## Security Best Practices

### 1. Validate All Input Paths

**✅ Always validate paths:**
```typescript
function validateUserPath(userPath: string): string {
  const validation = FileSystemUtils.validatePath(userPath, {
    allowRelative: false,
    allowedExtensions: ['.txt', '.json', '.csv'],
    maxLength: 4096,
    allowSymlinks: false
  });

  if (!validation.valid) {
    throw new Error(`Invalid path: ${validation.errors.join(', ')}`);
  }

  return validation.sanitized!;
}
```

### 2. Prevent Directory Traversal Attacks

**✅ Use path traversal prevention:**
```typescript
const safePath = FileSystemUtils.preventDirectoryTraversal(
  '/safe/base/path',
  userProvidedPath,
  {
    maxDepth: 5,
    allowSymlinks: false,
    allowedPaths: ['/safe/base/path/data', '/safe/base/path/config']
  }
);

if (!safePath.safe) {
  throw new Error(`Path traversal detected: ${safePath.errors.join(', ')}`);
}
```

### 3. Use Secure File Operations

**✅ Implement secure operations:**
```typescript
const secureResult = await FileSystemUtils.secureFileOperation(
  'read',
  filePath,
  () => FileSystemUtils.readFile(filePath),
  {
    validatePath: true,
    preventTraversal: true,
    basePath: '/safe/base',
    checkPermissions: true,
    requiredPermissions: { read: true },
    allowedExtensions: ['.txt', '.json'],
    maxFileSize: 1024 * 1024, // 1MB
    auditLog: true
  }
);

if (!secureResult.success) {
  console.error('Security check failed:', secureResult.errors);
  // Handle security violation
}
```

### 4. Implement Access Control

**✅ Check permissions before operations:**
```typescript
const accessCheck = await FileSystemUtils.preventUnauthorizedAccess(
  filePath,
  'write',
  {
    allowedUsers: ['app-user', 'admin'],
    allowedGroups: ['app-group'],
    requireOwnership: true,
    auditAccess: true
  }
);

if (!accessCheck.authorized) {
  console.error('Unauthorized access attempt:', accessCheck.errors);
  // Log security event
  FileSystemUtils.logSecurityEvent(
    'unauthorized_access',
    'Attempted unauthorized file access',
    { severity: 'high', path: filePath }
  );
}
```

### 5. Use Secure Temporary Files

**✅ Create secure temporary files:**
```typescript
const tempFile = await FileSystemUtils.createSecureTempFile({
  prefix: 'app-',
  suffix: '.tmp',
  permissions: 0o600, // Owner read/write only
  autoCleanup: true,
  maxAge: 30 * 60 * 1000 // 30 minutes
});

try {
  // Use the temporary file
  await FileSystemUtils.writeFile(tempFile.path, sensitiveData);
  
  // Process the data
  const result = await processSensitiveData(tempFile.path);
  
  return result;
} finally {
  // Always cleanup
  await tempFile.cleanup();
}
```

### 6. Monitor Security Events

**✅ Implement security monitoring:**
```typescript
// Log security events
FileSystemUtils.logSecurityEvent(
  'file_access',
  'File accessed by user',
  {
    severity: 'info',
    path: filePath,
    user: currentUser
  }
);

// Monitor for violations
const violations = FileSystemUtils.detectSecurityViolations({
  timeWindow: 60 * 60 * 1000, // 1 hour
  maxFailedAttempts: 5
});

if (violations.violations.length > 0) {
  // Send security alert
  await FileSystemUtils.sendSecurityAlert(
    'violation',
    {
      title: 'Security Violations Detected',
      description: 'Multiple security violations detected',
      severity: 'high',
      violations: violations.violations
    },
    { channels: ['console', 'email'], immediate: true }
  );
}
```

## Performance Best Practices

### 1. Use Efficient Operations for Large Files

**✅ Optimize for file size:**
```typescript
// For files > 10MB, use streaming
const fileSize = await getFileSize(filePath);
const options = fileSize > 10 * 1024 * 1024 
  ? { useStreaming: true, bufferSize: 64 * 1024 }
  : { useStreaming: false };

const result = await FileSystemUtils.readFileEfficiently(filePath, options);
```

### 2. Implement Caching Strategies

**✅ Use directory caching:**
```typescript
// Cache directory contents
const cachedContents = FileSystemUtils.getCachedDirectoryContents(
  'data/',
  { ttl: 5 * 60 * 1000 } // 5 minutes
);

if (cachedContents.cached) {
  console.log('Using cached directory contents');
} else {
  console.log('Directory contents refreshed');
}
```

### 3. Monitor Performance Metrics

**✅ Track operation performance:**
```typescript
// Time operations
const timing = await FileSystemUtils.timeOperation(
  'file_operation',
  () => FileSystemUtils.createFile(filePath, content),
  { trackMemory: true }
);

// Collect metrics periodically
const metrics = FileSystemUtils.collectPerformanceMetrics();
if (metrics.averageDuration > 1000) {
  console.warn('File operations are slow, consider optimization');
}
```

### 4. Use Batch Operations

**✅ Batch multiple operations:**
```typescript
// Instead of multiple individual operations
const operations = files.map(file => ({
  type: 'create' as const,
  destination: file.path,
  content: file.content
}));

const batchResult = await FileSystemUtils.batchFileOperations(
  operations,
  { concurrency: 3, retryAttempts: 2 }
);
```

## Cross-Platform Best Practices

### 1. Use Platform-Agnostic Paths

**✅ Normalize paths:**
```typescript
// Always normalize paths
const normalizedPath = FileSystemUtils.normalizePath(userPath);

// Use platform detection
const platform = FileSystemUtils.detectPlatform();
const adapter = FileSystemUtils.getPlatformAdapter();

// Use platform-specific optimizations
const optimizedPath = adapter.normalizePath(path);
```

### 2. Handle Platform Differences

**✅ Adapt to platform capabilities:**
```typescript
const compatibility = await FileSystemUtils.testPlatformCompatibility('.');

if (!compatibility.compatible) {
  console.warn('Platform compatibility issues:', compatibility.limitations);
}

// Use platform-specific features when available
if (compatibility.features.includes('long_paths')) {
  // Use long path support
} else {
  // Use alternative approach
}
```

### 3. Test on All Target Platforms

**✅ Comprehensive testing:**
```typescript
// Test cross-platform file creation
const crossPlatformResult = await FileSystemUtils.createFileCrossPlatform(
  'data/test.txt',
  'Cross-platform content',
  { optimizeForPlatform: true }
);

console.log(`Created on ${crossPlatformResult.platform}`);
console.log(`Optimizations: ${crossPlatformResult.optimizations.join(', ')}`);
```

## Error Handling Best Practices

### 1. Implement Comprehensive Error Handling

**✅ Handle all error scenarios:**
```typescript
async function safeFileOperation(filePath: string, content: string) {
  try {
    // Validate input
    const validation = FileSystemUtils.validatePath(filePath);
    if (!validation.valid) {
      throw new Error(`Path validation failed: ${validation.errors.join(', ')}`);
    }

    // Perform operation
    const result = await FileSystemUtils.createFile(filePath, content, {
      createBackup: true,
      validatePath: true
    });

    if (!result.success) {
      throw new Error(`File operation failed: ${result.errors.join(', ')}`);
    }

    return result;

  } catch (error) {
    // Categorize error
    const category = FileSystemUtils.categorizeError(error, {
      operation: 'create',
      path: filePath
    });

    // Handle based on category
    switch (category.type) {
      case 'permission':
        await handlePermissionError(error, filePath);
        break;
      case 'disk_space':
        await handleDiskSpaceError(error, filePath);
        break;
      case 'file_system':
        await handleFileSystemError(error, filePath);
        break;
      default:
        await handleGenericError(error, filePath);
    }

    throw error; // Re-throw for caller to handle
  }
}
```

### 2. Implement Graceful Degradation

**✅ Handle partial failures:**
```typescript
const degradation = await FileSystemUtils.handleGracefulDegradation(
  filePath,
  'write',
  {
    fallbackOperations: ['backup', 'partial_write'],
    enablePartialSuccess: true,
    maintainIntegrity: true
  }
);

if (degradation.degraded) {
  console.warn('Operation completed with reduced functionality');
  // Notify user or log the degradation
}
```

### 3. Log Errors Appropriately

**✅ Comprehensive error logging:**
```typescript
await FileSystemUtils.logOperation(
  'file_operation',
  filePath,
  false, // failed
  {
    errors: [error.message],
    metadata: {
      operation: 'create',
      fileSize: content.length,
      timestamp: new Date().toISOString()
    },
    logLevel: 'error'
  }
);
```

## Summary

Following these best practices will help you:

1. **Ensure Data Safety**: Always use safe file operations with validation and backup
2. **Maintain Security**: Validate paths, prevent attacks, and monitor security events
3. **Optimize Performance**: Use efficient operations, caching, and batch processing
4. **Handle Errors Gracefully**: Implement comprehensive error handling and recovery
5. **Support Multiple Platforms**: Use platform-agnostic code with platform-specific optimizations
6. **Resolve Conflicts Intelligently**: Define clear resolution strategies and implement automatic resolution
7. **Monitor and Maintain**: Track performance, security, and operational metrics

By adhering to these practices, you'll build robust, secure, and maintainable file operations that work reliably across different platforms and handle edge cases gracefully. 