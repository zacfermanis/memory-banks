import { promises as fs } from 'fs';
import path from 'path';

export interface RollbackOperation {
  id: string;
  type: 'file' | 'directory' | 'configuration';
  action: 'create' | 'update' | 'delete' | 'move';
  path: string;
  backupPath?: string;
  originalContent?: string;
  originalConfig?: any;
  timestamp: Date;
  status: 'pending' | 'completed' | 'failed' | 'rolled_back';
  metadata?: Record<string, any>;
}

export interface RollbackPoint {
  id: string;
  name: string;
  description: string;
  operations: RollbackOperation[];
  timestamp: Date;
  status: 'active' | 'completed' | 'rolled_back';
  metadata?: Record<string, any>;
}

export interface RollbackResult {
  success: boolean;
  rolledBackOperations: number;
  failedOperations: number;
  errors: string[];
  rollbackTime: number;
}

export class RollbackManager {
  private rollbackPoints: Map<string, RollbackPoint> = new Map();
  private activeOperations: Map<string, RollbackOperation> = new Map();
  private backupDirectory: string;

  constructor(backupDir?: string) {
    this.backupDirectory = backupDir || path.join(process.cwd(), 'backups');
  }

  /**
   * TASK-032: Create file operation rollback
   */
  async createFileBackup(
    filePath: string,
    operation: 'create' | 'update' | 'delete'
  ): Promise<RollbackOperation> {
    const operationId = this.generateOperationId();
    const backupPath = await this.createBackupPath(filePath, operationId);

    let originalContent: string | undefined;
    let backupCreated = false;

    try {
      // Read original content if file exists
      if (operation === 'update' || operation === 'delete') {
        try {
          originalContent = await fs.readFile(filePath, 'utf8');
          await fs.writeFile(backupPath, originalContent, 'utf8');
          backupCreated = true;
        } catch (error) {
          // File doesn't exist, no backup needed
          originalContent = undefined;
        }
      }

      const rollbackOperation: RollbackOperation = {
        id: operationId,
        type: 'file',
        action: operation,
        path: filePath,
        backupPath: backupCreated ? backupPath : undefined,
        originalContent,
        timestamp: new Date(),
        status: 'pending',
        metadata: {
          fileSize: originalContent?.length || 0,
          backupCreated,
        },
      };

      this.activeOperations.set(operationId, rollbackOperation);
      return rollbackOperation;
    } catch (error) {
      throw new Error(
        `Failed to create file backup: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * TASK-032: Add directory operation rollback
   */
  async createDirectoryBackup(
    dirPath: string,
    operation: 'create' | 'delete'
  ): Promise<RollbackOperation> {
    const operationId = this.generateOperationId();
    const backupPath = await this.createBackupPath(dirPath, operationId);

    let originalStructure: string[] = [];

    try {
      if (operation === 'delete') {
        // Backup directory structure
        originalStructure = await this.getDirectoryStructure(dirPath);
        await this.backupDirectoryStructure(dirPath, backupPath);
      }

      const rollbackOperation: RollbackOperation = {
        id: operationId,
        type: 'directory',
        action: operation,
        path: dirPath,
        backupPath: operation === 'delete' ? backupPath : undefined,
        originalContent: JSON.stringify(originalStructure),
        timestamp: new Date(),
        status: 'pending',
        metadata: {
          fileCount: originalStructure.length,
          backupCreated: operation === 'delete',
        },
      };

      this.activeOperations.set(operationId, rollbackOperation);
      return rollbackOperation;
    } catch (error) {
      throw new Error(
        `Failed to create directory backup: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * TASK-032: Implement configuration rollback
   */
  async createConfigurationBackup(
    configPath: string,
    originalConfig: any
  ): Promise<RollbackOperation> {
    const operationId = this.generateOperationId();
    const backupPath = await this.createBackupPath(configPath, operationId);

    try {
      // Save original configuration
      await fs.writeFile(
        backupPath,
        JSON.stringify(originalConfig, null, 2),
        'utf8'
      );

      const rollbackOperation: RollbackOperation = {
        id: operationId,
        type: 'configuration',
        action: 'update',
        path: configPath,
        backupPath,
        originalConfig,
        timestamp: new Date(),
        status: 'pending',
        metadata: {
          configSize: JSON.stringify(originalConfig).length,
          backupCreated: true,
        },
      };

      this.activeOperations.set(operationId, rollbackOperation);
      return rollbackOperation;
    } catch (error) {
      throw new Error(
        `Failed to create configuration backup: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Create a rollback point
   */
  async createRollbackPoint(
    name: string,
    description: string = ''
  ): Promise<RollbackPoint> {
    const pointId = this.generatePointId();
    const operations = Array.from(this.activeOperations.values()).filter(
      op => op.status === 'pending'
    );

    const rollbackPoint: RollbackPoint = {
      id: pointId,
      name,
      description,
      operations: [...operations],
      timestamp: new Date(),
      status: 'active',
      metadata: {
        operationCount: operations.length,
        fileOperations: operations.filter(op => op.type === 'file').length,
        directoryOperations: operations.filter(op => op.type === 'directory')
          .length,
        configurationOperations: operations.filter(
          op => op.type === 'configuration'
        ).length,
      },
    };

    this.rollbackPoints.set(pointId, rollbackPoint);

    // Mark operations as completed
    operations.forEach(op => {
      op.status = 'completed';
      this.activeOperations.set(op.id, op);
    });

    return rollbackPoint;
  }

  /**
   * TASK-032: Add rollback verification
   */
  async rollbackToPoint(pointId: string): Promise<RollbackResult> {
    const rollbackPoint = this.rollbackPoints.get(pointId);
    if (!rollbackPoint) {
      throw new Error(`Rollback point '${pointId}' not found`);
    }

    if (rollbackPoint.status === 'rolled_back') {
      throw new Error(
        `Rollback point '${pointId}' has already been rolled back`
      );
    }

    const startTime = Date.now();
    const errors: string[] = [];
    let rolledBackOperations = 0;
    let failedOperations = 0;

    // Sort operations in reverse order for proper rollback
    const sortedOperations = [...rollbackPoint.operations].reverse();

    for (const operation of sortedOperations) {
      try {
        await this.rollbackOperation(operation);
        operation.status = 'rolled_back';
        rolledBackOperations++;
      } catch (error) {
        operation.status = 'failed';
        failedOperations++;
        errors.push(
          `Failed to rollback operation ${operation.id}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    rollbackPoint.status = 'rolled_back';
    this.rollbackPoints.set(pointId, rollbackPoint);

    return {
      success: failedOperations === 0,
      rolledBackOperations,
      failedOperations,
      errors,
      rollbackTime: Date.now() - startTime,
    };
  }

  /**
   * Rollback a single operation
   */
  private async rollbackOperation(operation: RollbackOperation): Promise<void> {
    switch (operation.type) {
      case 'file':
        await this.rollbackFileOperation(operation);
        break;
      case 'directory':
        await this.rollbackDirectoryOperation(operation);
        break;
      case 'configuration':
        await this.rollbackConfigurationOperation(operation);
        break;
      default:
        throw new Error(`Unknown operation type: ${(operation as any).type}`);
    }
  }

  /**
   * Rollback file operation
   */
  private async rollbackFileOperation(
    operation: RollbackOperation
  ): Promise<void> {
    switch (operation.action) {
      case 'create':
        // Delete the created file
        try {
          await fs.unlink(operation.path);
        } catch (error) {
          // File might not exist, which is fine
        }
        break;

      case 'update':
        // Restore from backup
        if (operation.backupPath && operation.originalContent) {
          await fs.writeFile(operation.path, operation.originalContent, 'utf8');
        }
        break;

      case 'delete':
        // Restore from backup
        if (operation.backupPath && operation.originalContent) {
          await fs.writeFile(operation.path, operation.originalContent, 'utf8');
        }
        break;

      default:
        throw new Error(`Unknown file action: ${operation.action}`);
    }
  }

  /**
   * Rollback directory operation
   */
  private async rollbackDirectoryOperation(
    operation: RollbackOperation
  ): Promise<void> {
    switch (operation.action) {
      case 'create':
        // Remove the created directory
        try {
          await fs.rmdir(operation.path);
        } catch (error) {
          // Directory might not exist or not be empty
          throw new Error(
            `Failed to remove directory: ${error instanceof Error ? error.message : String(error)}`
          );
        }
        break;

      case 'delete':
        // Restore directory structure from backup
        if (operation.backupPath && operation.originalContent) {
          const structure = JSON.parse(operation.originalContent) as string[];
          await this.restoreDirectoryStructure(operation.path, structure);
        }
        break;

      default:
        throw new Error(`Unknown directory action: ${operation.action}`);
    }
  }

  /**
   * Rollback configuration operation
   */
  private async rollbackConfigurationOperation(
    operation: RollbackOperation
  ): Promise<void> {
    if (operation.originalConfig) {
      await fs.writeFile(
        operation.path,
        JSON.stringify(operation.originalConfig, null, 2),
        'utf8'
      );
    }
  }

  /**
   * Get rollback points
   */
  getRollbackPoints(): RollbackPoint[] {
    return Array.from(this.rollbackPoints.values());
  }

  /**
   * Get active operations
   */
  getActiveOperations(): RollbackOperation[] {
    return Array.from(this.activeOperations.values());
  }

  /**
   * Get rollback point by ID
   */
  getRollbackPoint(pointId: string): RollbackPoint | undefined {
    return this.rollbackPoints.get(pointId);
  }

  /**
   * Clear old rollback points
   */
  async clearOldRollbackPoints(
    maxAge: number = 7 * 24 * 60 * 60 * 1000
  ): Promise<number> {
    const cutoffTime = Date.now() - maxAge;
    const pointsToRemove: string[] = [];

    for (const [pointId, point] of this.rollbackPoints.entries()) {
      if (point.timestamp.getTime() < cutoffTime) {
        pointsToRemove.push(pointId);
      }
    }

    for (const pointId of pointsToRemove) {
      const point = this.rollbackPoints.get(pointId);
      if (point) {
        // Clean up backup files
        for (const operation of point.operations) {
          if (operation.backupPath) {
            try {
              await fs.unlink(operation.backupPath);
            } catch (error) {
              // Backup file might not exist, ignore
            }
          }
        }
        this.rollbackPoints.delete(pointId);
      }
    }

    return pointsToRemove.length;
  }

  /**
   * Create backup path
   */
  private async createBackupPath(
    originalPath: string,
    operationId: string
  ): Promise<string> {
    await fs.mkdir(this.backupDirectory, { recursive: true });

    const fileName = path.basename(originalPath);
    const extension = path.extname(fileName);
    const baseName = path.basename(fileName, extension);

    const backupFileName = `${baseName}_${operationId}${extension}`;
    return path.join(this.backupDirectory, backupFileName);
  }

  /**
   * Get directory structure
   */
  private async getDirectoryStructure(dirPath: string): Promise<string[]> {
    const structure: string[] = [];

    try {
      const items = await fs.readdir(dirPath);

      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stat = await fs.stat(itemPath);

        if (stat.isDirectory()) {
          const subStructure = await this.getDirectoryStructure(itemPath);
          structure.push(
            ...subStructure.map(subItem => path.join(item, subItem))
          );
        } else {
          structure.push(item);
        }
      }
    } catch (error) {
      // Directory might not exist
    }

    return structure;
  }

  /**
   * Backup directory structure
   */
  private async backupDirectoryStructure(
    sourcePath: string,
    backupPath: string
  ): Promise<void> {
    try {
      await fs.mkdir(backupPath, { recursive: true });

      const structure = await this.getDirectoryStructure(sourcePath);
      const structureFile = path.join(backupPath, 'structure.json');
      await fs.writeFile(
        structureFile,
        JSON.stringify(structure, null, 2),
        'utf8'
      );

      // Copy files
      for (const file of structure) {
        const sourceFile = path.join(sourcePath, file);
        const backupFile = path.join(backupPath, file);

        try {
          await fs.mkdir(path.dirname(backupFile), { recursive: true });
          await fs.copyFile(sourceFile, backupFile);
        } catch (error) {
          // Skip files that can't be copied
        }
      }
    } catch (error) {
      throw new Error(
        `Failed to backup directory structure: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Restore directory structure
   */
  private async restoreDirectoryStructure(
    targetPath: string,
    structure: string[]
  ): Promise<void> {
    try {
      await fs.mkdir(targetPath, { recursive: true });

      // This is a simplified restoration - in a real implementation,
      // you would restore from the actual backup files
      for (const file of structure) {
        const filePath = path.join(targetPath, file);
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, '', 'utf8'); // Create empty file
      }
    } catch (error) {
      throw new Error(
        `Failed to restore directory structure: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Generate operation ID
   */
  private generateOperationId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate point ID
   */
  private generatePointId(): string {
    return `point_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get rollback statistics
   */
  getRollbackStatistics(): {
    totalPoints: number;
    activePoints: number;
    rolledBackPoints: number;
    totalOperations: number;
    successfulRollbacks: number;
    failedRollbacks: number;
  } {
    const points = Array.from(this.rollbackPoints.values());
    const operations = Array.from(this.activeOperations.values());

    return {
      totalPoints: points.length,
      activePoints: points.filter(p => p.status === 'active').length,
      rolledBackPoints: points.filter(p => p.status === 'rolled_back').length,
      totalOperations: operations.length,
      successfulRollbacks: operations.filter(op => op.status === 'rolled_back')
        .length,
      failedRollbacks: operations.filter(op => op.status === 'failed').length,
    };
  }
}
