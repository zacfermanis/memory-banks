# File Operations API Documentation

## Overview

The FileSystemUtils class provides a comprehensive, secure, and cross-platform file operations system with advanced features including backup management, conflict resolution, safety validation, and performance optimization.

## Table of Contents

1. [Core File Operations](#core-file-operations)
2. [Directory Operations](#directory-operations)
3. [Path Resolution](#path-resolution)
4. [File Metadata Management](#file-metadata-management)
5. [Backup and Rollback System](#backup-and-rollback-system)
6. [Conflict Resolution Engine](#conflict-resolution-engine)
7. [Safety Validation System](#safety-validation-system)
8. [Error Handling and Recovery](#error-handling-and-recovery)
9. [Cross-Platform Support](#cross-platform-support)
10. [Performance Optimization](#performance-optimization)
11. [Security Implementation](#security-implementation)

## Core File Operations

### File Creation

#### `createFile(filePath: string, content: string, options?: FileOperationOptions): Promise<FileOperationResult>`

Creates a file safely with automatic backup and validation.

**Parameters:**
- `filePath`: Path to the file to create
- `content`: Content to write to the file
- `options`: Optional configuration (backup, permissions, etc.)

**Returns:**
```typescript
{
  success: boolean;
  path: string;
  backupPath?: string;
  errors: string[];
  warnings: string[];
}
```

**Example:**
```typescript
const result = await FileSystemUtils.createFile(
  'data/config.json',
  JSON.stringify({ version: '1.0.0' }),
  { createBackup: true, permissions: 0o644 }
);

if (result.success) {
  console.log(`File created: ${result.path}`);
  console.log(`Backup created: ${result.backupPath}`);
}
```

#### `createFileAtomic(filePath: string, content: string, options?: FileOperationOptions): Promise<FileOperationResult>`

Creates a file atomically using temporary files to ensure data integrity.

**Example:**
```typescript
const result = await FileSystemUtils.createFileAtomic(
  'critical-data.txt',
  'Important data that must not be corrupted'
);
```

#### `modifyFile(filePath: string, content: string, options?: FileOperationOptions): Promise<FileOperationResult>`

Modifies an existing file with automatic backup creation.

**Example:**
```typescript
const result = await FileSystemUtils.modifyFile(
  'data/config.json',
  JSON.stringify({ version: '1.1.0' }),
  { createBackup: true }
);
```

#### `removeFile(filePath: string, options?: FileOperationOptions): Promise<FileOperationResult>`

Safely removes a file with optional backup creation.

**Example:**
```typescript
const result = await FileSystemUtils.removeFile(
  'temp-file.txt',
  { createBackup: true }
);
```

### File Reading

#### `readFile(filePath: string, options?: FileReadOptions): Promise<FileReadResult>`

Reads a file safely with validation and error handling.

**Parameters:**
- `filePath`: Path to the file to read
- `options`: Optional configuration (encoding, maxSize, etc.)

**Returns:**
```typescript
{
  success: boolean;
  content: string;
  metadata: FileMetadata;
  errors: string[];
  warnings: string[];
}
```

**Example:**
```typescript
const result = await FileSystemUtils.readFile(
  'data/config.json',
  { encoding: 'utf8', maxSize: 1024 * 1024 }
);

if (result.success) {
  const config = JSON.parse(result.content);
  console.log(`File size: ${result.metadata.size} bytes`);
}
```

#### `readFileEfficiently(filePath: string, options?: FileReadOptions): Promise<FileReadResult>`

Reads a file efficiently using streaming for large files.

**Example:**
```typescript
const result = await FileSystemUtils.readFileEfficiently(
  'large-file.dat',
  { 
    encoding: 'utf8',
    maxSize: 100 * 1024 * 1024, // 100MB
    useStreaming: true
  }
);
```

## Directory Operations

### Directory Creation

#### `createDirectory(dirPath: string, permissions?: number, options?: DirectoryOptions): Promise<DirectoryOperationResult>`

Creates a directory with specified permissions.

**Parameters:**
- `dirPath`: Path to the directory to create
- `permissions`: Unix-style permissions (default: 0o755)
- `options`: Optional configuration

**Returns:**
```typescript
{
  success: boolean;
  path: string;
  permissions: string;
  errors: string[];
  warnings: string[];
}
```

**Example:**
```typescript
const result = await FileSystemUtils.createDirectory(
  'data/logs',
  0o755,
  { createBackup: false }
);
```

#### `createDirectoryRecursive(dirPath: string, permissions?: number, options?: DirectoryOptions): Promise<DirectoryOperationResult>`

Creates a directory and all parent directories recursively.

**Example:**
```typescript
const result = await FileSystemUtils.createDirectoryRecursive(
  'data/logs/2024/01/15',
  0o755
);
```

### Directory Management

#### `removeDirectory(dirPath: string, options?: DirectoryOptions): Promise<DirectoryOperationResult>`

Removes a directory and all its contents safely.

**Example:**
```typescript
const result = await FileSystemUtils.removeDirectory(
  'temp-data',
  { recursive: true, createBackup: true }
);
```

#### `traverseDirectoryEfficiently(dirPath: string, options?: TraversalOptions): Promise<TraversalResult>`

Efficiently traverses a directory with filtering and progress tracking.

**Parameters:**
- `dirPath`: Path to the directory to traverse
- `options`: Traversal configuration

**Returns:**
```typescript
{
  success: boolean;
  files: string[];
  directories: string[];
  totalCount: number;
  duration: number;
  errors: string[];
}
```

**Example:**
```typescript
const result = await FileSystemUtils.traverseDirectoryEfficiently(
  'data',
  {
    includeFiles: true,
    includeDirectories: true,
    maxDepth: 3,
    filter: (path) => path.endsWith('.txt'),
    onProgress: (progress) => console.log(`Progress: ${progress}%`)
  }
);
```

## Path Resolution

### Path Normalization

#### `normalizePath(filePath: string): string`

Normalizes a file path for cross-platform compatibility.

**Example:**
```typescript
const normalized = FileSystemUtils.normalizePath('C:\\Users\\Test\\file.txt');
// Returns: 'C:/Users/Test/file.txt'
```

#### `validatePath(filePath: string, options?: PathValidationOptions): PathValidationResult`

Validates and sanitizes a file path for security.

**Parameters:**
- `filePath`: Path to validate
- `options`: Validation options

**Returns:**
```typescript
{
  valid: boolean;
  sanitized?: string;
  errors: string[];
  warnings: string[];
}
```

**Example:**
```typescript
const validation = FileSystemUtils.validatePath(
  'data/config.json',
  {
    allowRelative: true,
    allowedExtensions: ['.json', '.txt'],
    maxLength: 4096
  }
);

if (!validation.valid) {
  console.error('Path validation failed:', validation.errors);
}
```

### Path Resolution

#### `resolveRelativePath(basePath: string, relativePath: string): string`

Resolves a relative path against a base path.

**Example:**
```typescript
const resolved = FileSystemUtils.resolveRelativePath(
  '/home/user',
  'data/file.txt'
);
// Returns: '/home/user/data/file.txt'
```

#### `preventDirectoryTraversal(basePath: string, targetPath: string, options?: TraversalOptions): TraversalCheckResult`

Prevents directory traversal attacks.

**Example:**
```typescript
const check = FileSystemUtils.preventDirectoryTraversal(
  '/safe/base',
  'data/file.txt',
  { maxDepth: 10, allowSymlinks: false }
);

if (!check.safe) {
  console.error('Directory traversal detected:', check.errors);
}
```

## File Metadata Management

### Metadata Extraction

#### `extractFileMetadata(filePath: string, options?: MetadataOptions): Promise<MetadataResult>`

Extracts comprehensive metadata from a file.

**Returns:**
```typescript
{
  success: boolean;
  metadata?: FileMetadata;
  errors: string[];
}
```

**Example:**
```typescript
const result = await FileSystemUtils.extractFileMetadata(
  'data/file.txt',
  { includeChecksum: true, includePermissions: true }
);

if (result.success) {
  console.log(`Size: ${result.metadata!.size} bytes`);
  console.log(`Created: ${result.metadata!.created}`);
  console.log(`Checksum: ${result.metadata!.checksum}`);
}
```

### Checksum Calculation

#### `calculateFileChecksum(filePath: string, algorithm?: string): Promise<ChecksumResult>`

Calculates a file's checksum for integrity verification.

**Example:**
```typescript
const checksum = await FileSystemUtils.calculateFileChecksum(
  'data/file.txt',
  'sha256'
);

console.log(`SHA256: ${checksum.checksum}`);
```

### Metadata Comparison

#### `compareFileMetadata(filePath1: string, filePath2: string, options?: ComparisonOptions): Promise<ComparisonResult>`

Compares metadata between two files.

**Example:**
```typescript
const comparison = await FileSystemUtils.compareFileMetadata(
  'file1.txt',
  'file2.txt',
  { compareChecksum: true, compareSize: true }
);

if (comparison.sameChecksum) {
  console.log('Files are identical');
}
```

## Backup and Rollback System

### Backup Creation

#### `createBackup(filePath: string, options?: BackupOptions): Promise<BackupResult>`

Creates an automatic backup of a file.

**Parameters:**
- `filePath`: Path to the file to backup
- `options`: Backup configuration

**Returns:**
```typescript
{
  success: boolean;
  backupPath: string;
  metadata: BackupMetadata;
  errors: string[];
}
```

**Example:**
```typescript
const backup = await FileSystemUtils.createBackup(
  'data/config.json',
  {
    compression: true,
    encryption: true,
    encryptionKey: 'secure-key',
    retention: '7d'
  }
);
```

#### `createFullBackup(filePath: string, options?: BackupOptions): Promise<BackupResult>`

Creates a full backup of a file.

**Example:**
```typescript
const fullBackup = await FileSystemUtils.createFullBackup(
  'data/database.db',
  { compression: true }
);
```

#### `createIncrementalBackup(filePath: string, baseBackupPath: string, options?: BackupOptions): Promise<BackupResult>`

Creates an incremental backup based on a previous backup.

**Example:**
```typescript
const incremental = await FileSystemUtils.createIncrementalBackup(
  'data/database.db',
  'backups/full-backup.db',
  { compression: true, deduplication: true }
);
```

### Backup Management

#### `verifyBackup(backupPath: string, options?: VerificationOptions): Promise<VerificationResult>`

Verifies the integrity of a backup.

**Example:**
```typescript
const verification = await FileSystemUtils.verifyBackup(
  'backups/config.json.backup',
  { checkChecksum: true, checkSize: true }
);

if (verification.valid) {
  console.log('Backup is valid');
}
```

#### `restoreFromBackup(filePath: string, backupPath: string, options?: RestoreOptions): Promise<RestoreResult>`

Restores a file from a backup.

**Example:**
```typescript
const restore = await FileSystemUtils.restoreFromBackup(
  'data/config.json',
  'backups/config.json.backup',
  { createBackup: true }
);
```

### Rollback Operations

#### `rollbackFile(filePath: string, backupPath: string, options?: RollbackOptions): Promise<RollbackResult>`

Rolls back a file to a previous state using a backup.

**Example:**
```typescript
const rollback = await FileSystemUtils.rollbackFile(
  'data/config.json',
  'backups/config.json.backup',
  { createBackup: true }
);
```

## Conflict Resolution Engine

### Conflict Detection

#### `detectFileConflict(filePath: string, newContent: string, options?: ConflictOptions): Promise<ConflictResult>`

Detects conflicts when attempting to modify a file.

**Returns:**
```typescript
{
  hasConflict: boolean;
  conflictType: string;
  existingPath?: string;
  severity: string;
  description: string;
}
```

**Example:**
```typescript
const conflict = await FileSystemUtils.detectFileConflict(
  'data/config.json',
  '{"new": "content"}'
);

if (conflict.hasConflict) {
  console.log(`Conflict detected: ${conflict.conflictType}`);
}
```

### Conflict Resolution

#### `resolveConflictWithStrategy(filePath: string, newContent: string, strategy: string, options?: ResolutionOptions): Promise<ResolutionResult>`

Resolves a conflict using a specified strategy.

**Strategies:**
- `overwrite`: Replace existing file
- `backup_rename`: Backup existing and create new
- `merge`: Merge content intelligently
- `skip`: Skip the operation

**Example:**
```typescript
const resolution = await FileSystemUtils.resolveConflictWithStrategy(
  'data/config.json',
  '{"new": "content"}',
  'backup_rename',
  { createBackup: true }
);
```

#### `resolveConflictAutomatically(filePath: string, newContent: string, rules: ResolutionRule[]): Promise<ResolutionResult>`

Automatically resolves conflicts based on predefined rules.

**Example:**
```typescript
const rules = [
  {
    pattern: '*.json',
    strategy: 'merge',
    priority: 1
  },
  {
    pattern: '*.txt',
    strategy: 'backup_rename',
    priority: 2
  }
];

const resolution = await FileSystemUtils.resolveConflictAutomatically(
  'data/config.json',
  '{"new": "content"}',
  rules
);
```

## Safety Validation System

### Permission Validation

#### `validateFilePermissions(filePath: string, requiredPermissions: PermissionSet, options?: ValidationOptions): Promise<PermissionValidationResult>`

Validates file permissions for required operations.

**Example:**
```typescript
const validation = await FileSystemUtils.validateFilePermissions(
  'data/config.json',
  { read: true, write: true },
  { strictMode: true }
);

if (!validation.valid) {
  console.error('Permission validation failed:', validation.errors);
}
```

### Disk Space Checking

#### `calculateDiskSpace(dirPath: string): Promise<DiskSpaceResult>`

Calculates available disk space.

**Example:**
```typescript
const space = await FileSystemUtils.calculateDiskSpace('/data');

console.log(`Available: ${space.available} bytes`);
console.log(`Total: ${space.total} bytes`);
console.log(`Used: ${space.used} bytes`);
```

#### `checkSpaceThreshold(dirPath: string, options?: SpaceOptions): Promise<SpaceCheckResult>`

Checks if available space meets thresholds.

**Example:**
```typescript
const check = await FileSystemUtils.checkSpaceThreshold(
  '/data',
  {
    minAvailable: 1024 * 1024 * 100, // 100MB
    warningThreshold: 0.9 // 90%
  }
);

if (!check.success) {
  console.warn('Low disk space:', check.warnings);
}
```

### File System Validation

#### `detectFileSystemType(dirPath: string): Promise<FileSystemResult>`

Detects the file system type.

**Example:**
```typescript
const fsInfo = await FileSystemUtils.detectFileSystemType('/data');

console.log(`File system: ${fsInfo.type}`);
console.log(`Features: ${fsInfo.features.join(', ')}`);
```

## Error Handling and Recovery

### Error Categorization

#### `categorizeError(error: Error, context?: ErrorContext): ErrorCategory`

Categorizes errors for appropriate handling.

**Example:**
```typescript
try {
  await FileSystemUtils.createFile('/invalid/path/file.txt', 'content');
} catch (error) {
  const category = FileSystemUtils.categorizeError(error, {
    operation: 'create',
    path: '/invalid/path/file.txt'
  });
  
  console.log(`Error category: ${category.type}`);
  console.log(`Severity: ${category.severity}`);
}
```

### Error Recovery

#### `handleFileOperationError(operation: string, filePath: string, error: Error, options?: RecoveryOptions): Promise<RecoveryResult>`

Handles file operation errors with recovery strategies.

**Example:**
```typescript
const recovery = await FileSystemUtils.handleFileOperationError(
  'write',
  'data/file.txt',
  new Error('Permission denied'),
  {
    enableRecovery: true,
    createBackup: true,
    retryAttempts: 3
  }
);

if (recovery.handled) {
  console.log('Error was handled successfully');
}
```

### Graceful Degradation

#### `handleGracefulDegradation(filePath: string, operation: string, options?: DegradationOptions): Promise<DegradationResult>`

Handles operations when full functionality is not available.

**Example:**
```typescript
const degradation = await FileSystemUtils.handleGracefulDegradation(
  'data/file.txt',
  'write',
  {
    fallbackOperations: ['backup', 'partial_write'],
    enablePartialSuccess: true,
    maintainIntegrity: true
  }
);

if (degradation.degraded) {
  console.log('Operation completed with reduced functionality');
}
```

## Cross-Platform Support

### Platform Detection

#### `detectPlatform(): PlatformInfo`

Detects the current platform and its capabilities.

**Returns:**
```typescript
{
  platform: string;
  arch: string;
  version: string;
  features: string[];
}
```

**Example:**
```typescript
const platform = FileSystemUtils.detectPlatform();

console.log(`Platform: ${platform.platform}`);
console.log(`Architecture: ${platform.arch}`);
console.log(`Features: ${platform.features.join(', ')}`);
```

### Platform-Specific Operations

#### `createFileCrossPlatform(filePath: string, content: string, options?: FileOperationOptions): Promise<CrossPlatformResult>`

Creates a file using platform-optimized methods.

**Example:**
```typescript
const result = await FileSystemUtils.createFileCrossPlatform(
  'data/file.txt',
  'Cross-platform content',
  { optimizeForPlatform: true }
);

console.log(`Platform: ${result.platform}`);
console.log(`Optimizations: ${result.optimizations.join(', ')}`);
```

## Performance Optimization

### Efficient Operations

#### `readFileEfficiently(filePath: string, options?: FileReadOptions): Promise<FileReadResult>`

Reads files efficiently using streaming for large files.

#### `writeFileOptimized(filePath: string, content: string, options?: FileWriteOptions): Promise<FileWriteResult>`

Writes files with optimization for performance.

#### `batchFileOperations(operations: FileOperation[], options?: BatchOptions): Promise<BatchResult>`

Processes multiple file operations in batches.

**Example:**
```typescript
const batchResult = await FileSystemUtils.batchFileOperations([
  { type: 'read', source: 'file1.txt' },
  { type: 'write', destination: 'file2.txt', content: 'content' },
  { type: 'delete', source: 'temp.txt' }
], {
  concurrency: 3,
  retryAttempts: 2
});
```

### Performance Monitoring

#### `timeOperation<T>(operationName: string, operation: () => Promise<T>, options?: TimingOptions): Promise<TimingResult<T>>`

Times operations for performance monitoring.

**Example:**
```typescript
const timing = await FileSystemUtils.timeOperation(
  'file_read',
  () => FileSystemUtils.readFile('large-file.txt'),
  { trackMemory: true }
);

console.log(`Duration: ${timing.duration}ms`);
console.log(`Memory usage: ${timing.memoryUsage} bytes`);
```

#### `collectPerformanceMetrics(): PerformanceMetrics`

Collects performance metrics from all timed operations.

**Example:**
```typescript
const metrics = FileSystemUtils.collectPerformanceMetrics();

console.log(`Total operations: ${metrics.totalOperations}`);
console.log(`Average duration: ${metrics.averageDuration}ms`);
console.log(`Success rate: ${metrics.successRate}%`);
```

#### `generatePerformanceReport(options?: ReportOptions): string`

Generates a performance report in various formats.

**Example:**
```typescript
const report = FileSystemUtils.generatePerformanceReport({
  format: 'html',
  includeDetails: true,
  timeRange: 24 * 60 * 60 * 1000 // 24 hours
});

// Save report to file
await FileSystemUtils.writeFile('performance-report.html', report);
```

## Security Implementation

### Path Security

#### `validatePath(filePath: string, options?: PathValidationOptions): PathValidationResult`

Validates paths for security threats.

#### `preventDirectoryTraversal(basePath: string, targetPath: string, options?: TraversalOptions): TraversalCheckResult`

Prevents directory traversal attacks.

### Secure Operations

#### `secureFileOperation<T>(operation: string, filePath: string, operationFn: () => Promise<T>, securityOptions?: SecurityOptions): Promise<SecureOperationResult<T>>`

Executes file operations with comprehensive security checks.

**Example:**
```typescript
const secureResult = await FileSystemUtils.secureFileOperation(
  'read',
  'data/sensitive.txt',
  () => FileSystemUtils.readFile('data/sensitive.txt'),
  {
    validatePath: true,
    preventTraversal: true,
    basePath: '/safe/base',
    checkPermissions: true,
    requiredPermissions: { read: true },
    auditLog: true
  }
);

if (secureResult.success) {
  console.log('Secure operation completed');
  console.log('Security checks passed:', secureResult.securityChecks);
}
```

### Backup Security

#### `createSecureBackup(filePath: string, options?: SecureBackupOptions): Promise<SecureBackupResult>`

Creates encrypted and integrity-checked backups.

**Example:**
```typescript
const secureBackup = await FileSystemUtils.createSecureBackup(
  'data/sensitive.txt',
  {
    encryption: true,
    encryptionKey: 'secure-key-123',
    compression: true,
    integrityCheck: true,
    accessControl: true
  }
);
```

### Security Monitoring

#### `logSecurityEvent(eventType: string, description: string, options?: SecurityEventOptions): void`

Logs security events for monitoring.

**Example:**
```typescript
FileSystemUtils.logSecurityEvent(
  'unauthorized_access',
  'Attempted access to restricted file',
  {
    severity: 'high',
    path: '/restricted/file.txt',
    user: 'unknown-user'
  }
);
```

#### `generateSecurityReport(options?: SecurityReportOptions): string`

Generates security reports.

**Example:**
```typescript
const securityReport = FileSystemUtils.generateSecurityReport({
  timeRange: 24 * 60 * 60 * 1000, // 24 hours
  includeDetails: true,
  format: 'json'
});
```

## Best Practices

### File Operations
1. Always use `createFile` instead of direct file system calls
2. Enable backups for critical files
3. Validate paths before operations
4. Use atomic operations for critical data
5. Handle errors gracefully

### Security
1. Validate all input paths
2. Use secure file operations for sensitive data
3. Enable audit logging for security monitoring
4. Implement proper access controls
5. Use encryption for sensitive backups

### Performance
1. Use efficient operations for large files
2. Batch operations when possible
3. Monitor performance metrics
4. Use appropriate caching strategies
5. Optimize for your specific platform

### Cross-Platform
1. Use platform-agnostic path handling
2. Test on all target platforms
3. Use platform-specific optimizations when available
4. Handle platform differences gracefully
5. Validate compatibility requirements

## Error Handling

The FileSystemUtils class provides comprehensive error handling with:
- Detailed error categorization
- Automatic recovery strategies
- Graceful degradation options
- Comprehensive error reporting
- Audit logging for debugging

## Performance Considerations

- Use streaming for large files (>10MB)
- Batch operations for multiple files
- Enable compression for backups
- Use incremental backups for efficiency
- Monitor memory usage for large operations

## Security Considerations

- Always validate input paths
- Use secure operations for sensitive data
- Enable audit logging
- Implement proper access controls
- Use encryption for sensitive backups
- Monitor for security violations 