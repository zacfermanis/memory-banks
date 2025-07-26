# File Operations Troubleshooting Guide

## Overview

This troubleshooting guide helps you diagnose and resolve common issues when using the FileSystemUtils class. It provides solutions for typical problems, explains error messages, and offers debugging strategies.

## Table of Contents

1. [Common Issues and Solutions](#common-issues-and-solutions)
2. [Error Message Explanations](#error-message-explanations)
3. [Debugging Guidelines](#debugging-guidelines)
4. [Performance Troubleshooting](#performance-troubleshooting)
5. [Security Issues](#security-issues)
6. [Cross-Platform Issues](#cross-platform-issues)
7. [Backup and Recovery Issues](#backup-and-recovery-issues)

## Common Issues and Solutions

### Issue 1: File Creation Fails

**Symptoms:**
- `createFile` returns `success: false`
- Error messages about permissions or path issues

**Common Causes and Solutions:**

#### Permission Denied
```typescript
// Error: EACCES: permission denied
const result = await FileSystemUtils.createFile('/root/system-file.txt', 'content');
```

**Solution:**
```typescript
// Check permissions first
const permissionCheck = await FileSystemUtils.validateFilePermissions(
  '/target/directory',
  { write: true },
  { strictMode: true }
);

if (!permissionCheck.valid) {
  // Use a writable directory
  const result = await FileSystemUtils.createFile(
    './data/file.txt', // Use relative path
    'content',
    { permissions: 0o644 }
  );
}
```

#### Path Validation Fails
```typescript
// Error: Path contains dangerous characters
const result = await FileSystemUtils.createFile('file<>.txt', 'content');
```

**Solution:**
```typescript
// Validate and sanitize path
const validation = FileSystemUtils.validatePath('file<>.txt');
if (!validation.valid) {
  const sanitizedPath = validation.sanitized || 'file.txt';
  const result = await FileSystemUtils.createFile(sanitizedPath, 'content');
}
```

#### Directory Doesn't Exist
```typescript
// Error: ENOENT: no such file or directory
const result = await FileSystemUtils.createFile('nonexistent/file.txt', 'content');
```

**Solution:**
```typescript
// Create directory first
await FileSystemUtils.createDirectoryRecursive('nonexistent');
const result = await FileSystemUtils.createFile('nonexistent/file.txt', 'content');
```

### Issue 2: Backup Operations Fail

**Symptoms:**
- Backup creation returns `success: false`
- Backup verification fails
- Restore operations fail

**Common Causes and Solutions:**

#### Insufficient Disk Space
```typescript
// Error: ENOSPC: no space left on device
const backup = await FileSystemUtils.createBackup('large-file.dat');
```

**Solution:**
```typescript
// Check disk space before backup
const space = await FileSystemUtils.calculateDiskSpace('.');
const fileSize = await getFileSize('large-file.dat');

if (space.available < fileSize * 2) { // Need space for file + backup
  // Use compression
  const backup = await FileSystemUtils.createBackup('large-file.dat', {
    compression: true
  });
  
  // Or use incremental backup
  const incremental = await FileSystemUtils.createIncrementalBackup(
    'large-file.dat',
    'existing-backup.dat'
  );
}
```

#### Backup Corruption
```typescript
// Error: Backup integrity check failed
const verification = await FileSystemUtils.verifyBackup('backup.dat');
```

**Solution:**
```typescript
// Recreate backup with integrity checks
const backup = await FileSystemUtils.createSecureBackup('file.txt', {
  integrityCheck: true,
  compression: true
});

// Verify immediately
const verification = await FileSystemUtils.validateBackupIntegrity(
  backup.backupPath,
  { checkHash: true, verifySize: true }
);
```

### Issue 3: Conflict Resolution Problems

**Symptoms:**
- Conflict detection doesn't work as expected
- Resolution strategies fail
- Automatic resolution doesn't apply

**Common Causes and Solutions:**

#### Conflict Detection Not Working
```typescript
// Conflict not detected when it should be
const conflict = await FileSystemUtils.detectFileConflict('file.txt', 'new content');
// Returns hasConflict: false when file exists
```

**Solution:**
```typescript
// Ensure file exists first
const fileExists = await FileSystemUtils.fileExists('file.txt');
if (fileExists) {
  const conflict = await FileSystemUtils.detectFileConflict('file.txt', 'new content');
  console.log('Conflict detected:', conflict.hasConflict);
}
```

#### Resolution Strategy Fails
```typescript
// Error: Resolution strategy 'merge' failed
const resolution = await FileSystemUtils.resolveConflictWithStrategy(
  'file.txt',
  'new content',
  'merge'
);
```

**Solution:**
```typescript
// Check if merge is appropriate for file type
const fileExt = path.extname('file.txt');
if (fileExt === '.json') {
  // JSON files can be merged
  const resolution = await FileSystemUtils.resolveConflictWithStrategy(
    'file.txt',
    'new content',
    'merge'
  );
} else {
  // Use backup_rename for other file types
  const resolution = await FileSystemUtils.resolveConflictWithStrategy(
    'file.txt',
    'new content',
    'backup_rename'
  );
}
```

### Issue 4: Performance Problems

**Symptoms:**
- File operations are slow
- High memory usage
- Timeout errors

**Common Causes and Solutions:**

#### Large File Operations
```typescript
// Slow file reading
const result = await FileSystemUtils.readFile('large-file.dat'); // 1GB file
```

**Solution:**
```typescript
// Use efficient reading for large files
const result = await FileSystemUtils.readFileEfficiently('large-file.dat', {
  useStreaming: true,
  maxSize: 100 * 1024 * 1024, // 100MB limit
  bufferSize: 64 * 1024 // 64KB buffer
});
```

#### Multiple Sequential Operations
```typescript
// Slow batch processing
for (const file of files) {
  await FileSystemUtils.createFile(file.path, file.content);
}
```

**Solution:**
```typescript
// Use batch operations
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

## Error Message Explanations

### Permission Errors

#### `EACCES: permission denied`
**Meaning:** The operation requires permissions that the current user doesn't have.

**Common Causes:**
- Trying to write to system directories
- File has restrictive permissions
- Running without sufficient privileges

**Solutions:**
```typescript
// Check permissions before operation
const permissions = await FileSystemUtils.validateFilePermissions(
  filePath,
  { write: true }
);

// Use appropriate directory
const result = await FileSystemUtils.createFile(
  './data/file.txt', // Use relative path
  content
);

// Set appropriate permissions
await FileSystemUtils.setFilePermissions(filePath, 0o644);
```

#### `EISDIR: is a directory`
**Meaning:** Trying to perform a file operation on a directory.

**Solutions:**
```typescript
// Check if path is a directory
const stats = await FileSystemUtils.getFileStats(path);
if (stats.isDirectory) {
  // Use directory operations instead
  await FileSystemUtils.createDirectoryRecursive(path);
} else {
  // Use file operations
  await FileSystemUtils.createFile(path, content);
}
```

### Path Errors

#### `ENOENT: no such file or directory`
**Meaning:** The specified path doesn't exist.

**Solutions:**
```typescript
// Create directory structure first
await FileSystemUtils.createDirectoryRecursive(path.dirname(filePath));

// Check if file exists before reading
const exists = await FileSystemUtils.fileExists(filePath);
if (!exists) {
  console.log('File does not exist');
}
```

#### `ENAMETOOLONG: name too long`
**Meaning:** The file path exceeds the system's maximum length limit.

**Solutions:**
```typescript
// Validate path length
const validation = FileSystemUtils.validatePath(filePath, {
  maxLength: 4096 // Adjust based on platform
});

// Use shorter paths
const shortPath = path.basename(filePath);
```

### Disk Space Errors

#### `ENOSPC: no space left on device`
**Meaning:** Insufficient disk space for the operation.

**Solutions:**
```typescript
// Check available space
const space = await FileSystemUtils.calculateDiskSpace('.');
const requiredSpace = await estimateRequiredSpace(filePath);

if (space.available < requiredSpace) {
  // Use compression
  const backup = await FileSystemUtils.createBackup(filePath, {
    compression: true
  });
  
  // Or clean up old files
  await FileSystemUtils.cleanupOldBackups('./backups', {
    retentionDays: 7
  });
}
```

## Debugging Guidelines

### 1. Enable Debug Logging

```typescript
// Enable detailed logging
const result = await FileSystemUtils.createFile(filePath, content, {
  debug: true,
  logLevel: 'debug'
});

// Check operation logs
const logs = FileSystemUtils.getAuditLog({
  startTime: new Date(Date.now() - 60000).toISOString(), // Last minute
  operation: 'create'
});

console.log('Recent operations:', logs);
```

### 2. Use Performance Monitoring

```typescript
// Monitor operation performance
const timing = await FileSystemUtils.timeOperation(
  'debug_operation',
  () => FileSystemUtils.createFile(filePath, content),
  { trackMemory: true }
);

console.log(`Operation took ${timing.duration}ms`);
console.log(`Memory usage: ${timing.memoryUsage} bytes`);

// Get performance metrics
const metrics = FileSystemUtils.collectPerformanceMetrics();
console.log('Performance summary:', metrics);
```

### 3. Validate Input and State

```typescript
// Validate all inputs
function debugFileOperation(filePath: string, content: string) {
  // Validate path
  const pathValidation = FileSystemUtils.validatePath(filePath);
  console.log('Path validation:', pathValidation);

  // Check file system state
  const space = await FileSystemUtils.calculateDiskSpace('.');
  console.log('Disk space:', space);

  // Check permissions
  const permissions = await FileSystemUtils.validateFilePermissions(
    path.dirname(filePath),
    { write: true }
  );
  console.log('Permissions:', permissions);

  // Perform operation with detailed logging
  const result = await FileSystemUtils.createFile(filePath, content, {
    debug: true
  });

  console.log('Operation result:', result);
  return result;
}
```

### 4. Use Security Monitoring

```typescript
// Monitor security events
FileSystemUtils.logSecurityEvent(
  'debug_operation',
  'Debugging file operation',
  { severity: 'info', path: filePath }
);

// Check for security violations
const violations = FileSystemUtils.detectSecurityViolations({
  timeWindow: 60 * 60 * 1000 // 1 hour
});

if (violations.violations.length > 0) {
  console.log('Security violations detected:', violations.violations);
}
```

## Performance Troubleshooting

### 1. Identify Performance Bottlenecks

```typescript
// Profile file operations
async function profileFileOperations() {
  const operations = [
    { name: 'create', fn: () => FileSystemUtils.createFile('test1.txt', 'content') },
    { name: 'read', fn: () => FileSystemUtils.readFile('test1.txt') },
    { name: 'modify', fn: () => FileSystemUtils.modifyFile('test1.txt', 'new content') },
    { name: 'backup', fn: () => FileSystemUtils.createBackup('test1.txt') }
  ];

  for (const op of operations) {
    const timing = await FileSystemUtils.timeOperation(
      op.name,
      op.fn,
      { trackMemory: true }
    );
    
    console.log(`${op.name}: ${timing.duration}ms, ${timing.memoryUsage} bytes`);
  }
}
```

### 2. Optimize Large File Operations

```typescript
// Use streaming for large files
const largeFileOptions = {
  useStreaming: true,
  bufferSize: 64 * 1024, // 64KB buffer
  maxSize: 100 * 1024 * 1024 // 100MB limit
};

const result = await FileSystemUtils.readFileEfficiently(
  'large-file.dat',
  largeFileOptions
);
```

### 3. Implement Caching

```typescript
// Cache directory contents
const cachedContents = FileSystemUtils.getCachedDirectoryContents(
  'data/',
  { ttl: 5 * 60 * 1000 } // 5 minutes
);

if (cachedContents.cached) {
  console.log('Using cached directory contents');
} else {
  console.log('Refreshing directory contents');
}
```

### 4. Use Batch Operations

```typescript
// Batch multiple operations
const operations = files.map(file => ({
  type: 'create' as const,
  destination: file.path,
  content: file.content
}));

const batchResult = await FileSystemUtils.batchFileOperations(
  operations,
  {
    concurrency: 3, // Process 3 files simultaneously
    retryAttempts: 2,
    timeout: 30000 // 30 second timeout
  }
);
```

## Security Issues

### 1. Path Traversal Attacks

**Symptoms:**
- Access to files outside intended directory
- Security violations logged

**Detection:**
```typescript
// Check for path traversal attempts
const traversalCheck = FileSystemUtils.preventDirectoryTraversal(
  '/safe/base',
  userProvidedPath,
  { maxDepth: 5, allowSymlinks: false }
);

if (!traversalCheck.safe) {
  console.error('Path traversal detected:', traversalCheck.errors);
  // Log security event
  FileSystemUtils.logSecurityEvent(
    'directory_traversal',
    'Path traversal attempt detected',
    { severity: 'high', path: userProvidedPath }
  );
}
```

**Prevention:**
```typescript
// Always validate user input
const validation = FileSystemUtils.validatePath(userPath, {
  allowRelative: false,
  allowedExtensions: ['.txt', '.json'],
  maxLength: 4096
});

if (!validation.valid) {
  throw new Error(`Invalid path: ${validation.errors.join(', ')}`);
}
```

### 2. Unauthorized Access

**Symptoms:**
- Permission denied errors
- Security audit logs show unauthorized attempts

**Detection:**
```typescript
// Check access before operations
const accessCheck = await FileSystemUtils.preventUnauthorizedAccess(
  filePath,
  'write',
  {
    allowedUsers: ['app-user'],
    allowedGroups: ['app-group'],
    requireOwnership: true,
    auditAccess: true
  }
);

if (!accessCheck.authorized) {
  console.error('Unauthorized access attempt:', accessCheck.errors);
}
```

**Prevention:**
```typescript
// Use secure file operations
const secureResult = await FileSystemUtils.secureFileOperation(
  'read',
  filePath,
  () => FileSystemUtils.readFile(filePath),
  {
    validatePath: true,
    preventTraversal: true,
    basePath: '/safe/base',
    checkPermissions: true,
    auditLog: true
  }
);
```

### 3. Sensitive Data Exposure

**Symptoms:**
- Sensitive files accessible to unauthorized users
- Backup files not encrypted

**Prevention:**
```typescript
// Use secure backups for sensitive data
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

// Set restrictive permissions
await FileSystemUtils.setBackupAccessControl(secureBackup.backupPath, {
  permissions: 0o600, // Owner read/write only
  owner: process.env.BACKUP_USER
});
```

## Cross-Platform Issues

### 1. Path Separator Problems

**Symptoms:**
- Paths not working on different platforms
- File not found errors

**Solutions:**
```typescript
// Always normalize paths
const normalizedPath = FileSystemUtils.normalizePath(userPath);

// Use platform detection
const platform = FileSystemUtils.detectPlatform();
console.log(`Running on: ${platform.platform}`);

// Use platform-specific path handling
const adapter = FileSystemUtils.getPlatformAdapter();
const platformPath = adapter.normalizePath(path);
```

### 2. Permission Model Differences

**Symptoms:**
- Permission errors on different platforms
- Different behavior between Windows, macOS, and Linux

**Solutions:**
```typescript
// Test platform compatibility
const compatibility = await FileSystemUtils.testPlatformCompatibility('.');

if (!compatibility.compatible) {
  console.warn('Platform compatibility issues:', compatibility.limitations);
}

// Use cross-platform file creation
const crossPlatformResult = await FileSystemUtils.createFileCrossPlatform(
  'data/file.txt',
  'content',
  { optimizeForPlatform: true }
);
```

### 3. File System Feature Differences

**Symptoms:**
- Features not available on all platforms
- Performance differences

**Solutions:**
```typescript
// Check platform-specific features
if (platform.platform === 'win32') {
  const features = await FileSystemUtils.getWindowsFileSystemFeatures('.');
  console.log('Windows features:', features);
} else if (platform.platform === 'darwin') {
  const features = await FileSystemUtils.getMacOSFileSystemFeatures('.');
  console.log('macOS features:', features);
} else {
  const features = await FileSystemUtils.getLinuxFileSystemFeatures('.');
  console.log('Linux features:', features);
}
```

## Backup and Recovery Issues

### 1. Backup Corruption

**Symptoms:**
- Backup verification fails
- Restore operations fail
- Checksum mismatches

**Diagnosis:**
```typescript
// Verify backup integrity
const integrity = await FileSystemUtils.validateBackupIntegrity(
  backupPath,
  {
    checkHash: true,
    verifySize: true,
    checkMetadata: true
  }
);

if (!integrity.valid) {
  console.error('Backup corruption detected:', integrity.errors);
  
  // Check if backup can be repaired
  const repairResult = await FileSystemUtils.repairBackup(backupPath);
  if (!repairResult.success) {
    console.error('Backup cannot be repaired, recreate backup');
  }
}
```

**Prevention:**
```typescript
// Use secure backups with integrity checks
const secureBackup = await FileSystemUtils.createSecureBackup(
  filePath,
  {
    integrityCheck: true,
    compression: true,
    encryption: true
  }
);

// Verify immediately after creation
const verification = await FileSystemUtils.verifyBackup(secureBackup.backupPath);
```

### 2. Backup Space Issues

**Symptoms:**
- Backup creation fails due to insufficient space
- Backup compression not working

**Solutions:**
```typescript
// Check space before backup
const space = await FileSystemUtils.calculateDiskSpace('.');
const fileSize = await getFileSize(filePath);

if (space.available < fileSize * 2) {
  // Use compression
  const compressedBackup = await FileSystemUtils.createBackup(filePath, {
    compression: true
  });
  
  // Or use incremental backup
  const incrementalBackup = await FileSystemUtils.createIncrementalBackup(
    filePath,
    existingBackupPath
  );
}
```

### 3. Restore Failures

**Symptoms:**
- Restore operations fail
- Data corruption after restore

**Diagnosis:**
```typescript
// Verify backup before restore
const verification = await FileSystemUtils.verifyBackup(backupPath);
if (!verification.valid) {
  console.error('Cannot restore from corrupted backup');
  return;
}

// Create backup before restore
const preRestoreBackup = await FileSystemUtils.createBackup(filePath);

// Perform restore
const restore = await FileSystemUtils.restoreFromBackup(
  filePath,
  backupPath,
  { createBackup: true }
);

// Verify restore
const restoreVerification = await FileSystemUtils.verifyFileIntegrity(filePath);
```

## Getting Help

### 1. Collect Diagnostic Information

```typescript
// Generate diagnostic report
async function generateDiagnosticReport() {
  const report = {
    timestamp: new Date().toISOString(),
    platform: FileSystemUtils.detectPlatform(),
    performance: FileSystemUtils.collectPerformanceMetrics(),
    security: FileSystemUtils.generateSecurityReport({ format: 'json' }),
    audit: FileSystemUtils.getAuditLog({ limit: 100 })
  };

  return JSON.stringify(report, null, 2);
}
```

### 2. Enable Debug Mode

```typescript
// Enable comprehensive debugging
const debugResult = await FileSystemUtils.createFile(
  filePath,
  content,
  {
    debug: true,
    logLevel: 'debug',
    auditLog: true
  }
);
```

### 3. Check System Resources

```typescript
// Monitor system resources
const space = await FileSystemUtils.calculateDiskSpace('.');
const memory = process.memoryUsage();
const platform = FileSystemUtils.detectPlatform();

console.log('System resources:', {
  diskSpace: space,
  memory: memory,
  platform: platform
});
```

## Summary

This troubleshooting guide covers the most common issues you'll encounter when using the FileSystemUtils class. Remember to:

1. **Always validate inputs** before file operations
2. **Check permissions and disk space** before operations
3. **Use appropriate error handling** and logging
4. **Monitor performance** and security events
5. **Test on all target platforms** for cross-platform compatibility
6. **Implement proper backup strategies** for data safety
7. **Use secure operations** for sensitive data

When in doubt, enable debug logging and collect diagnostic information to help identify the root cause of issues. 