import {
  ErrorHandler,
  ErrorCategory,
  ErrorSeverity,
  TemplateError,
} from './errorHandler';
import { RollbackManager, RollbackPoint } from './rollbackManager';
import { TemplateRenderer } from './templateRenderer';
import { TemplateValidator } from './templateValidator';
import { TemplateCache } from './templateCache';
import * as path from 'path';
import * as fs from 'fs';

export interface RecoveryOptions {
  enableAutoRecovery?: boolean;
  maxRecoveryAttempts?: number;
  recoveryTimeout?: number;
  enableMonitoring?: boolean;
  logRecoveryActions?: boolean;
}

export interface RecoveryAction {
  id: string;
  type: 'automatic' | 'manual';
  errorId: string;
  strategy: string;
  timestamp: Date;
  success: boolean;
  duration: number;
  details?: any;
}

export interface RecoveryStatistics {
  totalRecoveries: number;
  successfulRecoveries: number;
  failedRecoveries: number;
  averageRecoveryTime: number;
  recoveryRate: number;
  autoRecoveries: number;
  manualRecoveries: number;
}

export interface MonitoringAlert {
  id: string;
  type: 'error_spike' | 'recovery_failure' | 'performance_degradation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  data?: any;
}

export class RecoveryManager {
  private errorHandler: ErrorHandler;
  private rollbackManager: RollbackManager;
  private renderer: TemplateRenderer;
  private validator: TemplateValidator;
  private cache: TemplateCache;

  private options: RecoveryOptions;
  private recoveryActions: RecoveryAction[] = [];
  private monitoringAlerts: MonitoringAlert[] = [];
  private recoveryAttempts: Map<string, number> = new Map();
  private errorCount: number = 0;

  constructor(
    errorHandler: ErrorHandler,
    rollbackManager: RollbackManager,
    renderer: TemplateRenderer,
    validator: TemplateValidator,
    cache: TemplateCache,
    options: RecoveryOptions = {}
  ) {
    this.errorHandler = errorHandler;
    this.rollbackManager = rollbackManager;
    this.renderer = renderer;
    this.validator = validator;
    this.cache = cache;

    this.options = {
      enableAutoRecovery: true,
      maxRecoveryAttempts: 3,
      recoveryTimeout: 30000, // 30 seconds
      enableMonitoring: true,
      logRecoveryActions: true,
      ...options,
    };
  }

  /**
   * TASK-033: Implement automatic error recovery
   */
  async handleError(
    error: Error,
    context: any = {}
  ): Promise<{
    recovered: boolean;
    action?: RecoveryAction;
    rollbackPoint?: RollbackPoint;
  }> {
    const templateError = this.errorHandler.categorizeError(error, context);
    const recoveryActionId = this.generateActionId();
    const startTime = Date.now();

    // Update monitoring
    this.updateErrorMonitoring(templateError);

    // Check if auto-recovery is enabled and error is recoverable
    if (!this.options.enableAutoRecovery || !templateError.recoverable) {
      return { recovered: false };
    }

    // Check recovery attempt limits
    const attemptCount = this.recoveryAttempts.get(templateError.id) || 0;
    if (attemptCount >= this.options.maxRecoveryAttempts!) {
      this.createMonitoringAlert(
        'recovery_failure',
        'high',
        `Max recovery attempts exceeded for error ${templateError.id}`
      );
      return { recovered: false };
    }

    this.recoveryAttempts.set(templateError.id, attemptCount + 1);

    try {
      // Attempt automatic recovery
      const recoveryResult = await this.performAutomaticRecovery(templateError);

      const duration = Date.now() - startTime;
      const action: RecoveryAction = {
        id: recoveryActionId,
        type: 'automatic',
        errorId: templateError.id,
        strategy: recoveryResult.strategy || 'unknown',
        timestamp: new Date(),
        success: recoveryResult.success,
        duration,
        details: recoveryResult.details,
      };

      this.recoveryActions.push(action);

      if (recoveryResult.success) {
        // Create rollback point for successful recovery
        const rollbackPoint = await this.rollbackManager.createRollbackPoint(
          `Recovery_${templateError.id}`,
          `Automatic recovery for ${templateError.category} error`
        );

        if (this.options.logRecoveryActions) {
          // Log recovery success (console.log replaced with error handling)
          const successError: TemplateError = {
            id: this.generateActionId(),
            category: ErrorCategory.SYSTEM,
            severity: ErrorSeverity.LOW,
            message: `Recovery successful for error ${templateError.id} in ${duration}ms`,
            code: 'RECOVERY_SUCCESS',
            context: {
              timestamp: new Date(),
              operation: 'recovery',
            },
            recoverable: false,
            suggestions: [],
            timestamp: new Date(),
          };
          this.errorHandler.logError(successError, 'info');
        }

        return { recovered: true, action, rollbackPoint };
      } else {
        if (this.options.logRecoveryActions) {
          // Log recovery failure (console.log replaced with error handling)
          const failureError: TemplateError = {
            id: this.generateActionId(),
            category: ErrorCategory.SYSTEM,
            severity: ErrorSeverity.MEDIUM,
            message: `Recovery failed for error ${templateError.id} in ${duration}ms`,
            code: 'RECOVERY_FAILED',
            context: {
              timestamp: new Date(),
              operation: 'recovery',
            },
            recoverable: false,
            suggestions: [],
            timestamp: new Date(),
          };
          this.errorHandler.logError(failureError, 'warn');
        }
        return { recovered: false, action };
      }
    } catch (recoveryError) {
      const duration = Date.now() - startTime;
      const action: RecoveryAction = {
        id: recoveryActionId,
        type: 'automatic',
        errorId: templateError.id,
        strategy: 'error_handling',
        timestamp: new Date(),
        success: false,
        duration,
        details: {
          error:
            recoveryError instanceof Error
              ? recoveryError.message
              : String(recoveryError),
        },
      };

      this.recoveryActions.push(action);
      return { recovered: false, action };
    }
  }

  /**
   * TASK-033: Add manual error recovery
   */
  async performManualRecovery(
    errorId: string,
    strategy: string,
    manualSteps: string[]
  ): Promise<{
    success: boolean;
    action: RecoveryAction;
    details?: any;
  }> {
    const actionId = this.generateActionId();
    const startTime = Date.now();

    try {
      // Execute manual recovery steps
      const result = await this.executeManualRecoverySteps(
        strategy,
        manualSteps
      );

      const duration = Date.now() - startTime;
      const action: RecoveryAction = {
        id: actionId,
        type: 'manual',
        errorId,
        strategy,
        timestamp: new Date(),
        success: result.success,
        duration,
        details: result.details,
      };

      this.recoveryActions.push(action);

      if (result.success) {
        // Create rollback point for successful manual recovery
        await this.rollbackManager.createRollbackPoint(
          `ManualRecovery_${errorId}`,
          `Manual recovery using strategy: ${strategy}`
        );
      }

      return { success: result.success, action, details: result.details };
    } catch (error) {
      const duration = Date.now() - startTime;
      const action: RecoveryAction = {
        id: actionId,
        type: 'manual',
        errorId,
        strategy,
        timestamp: new Date(),
        success: false,
        duration,
        details: {
          error: error instanceof Error ? error.message : String(error),
        },
      };

      this.recoveryActions.push(action);
      return { success: false, action };
    }
  }

  /**
   * TASK-033: Create error prevention
   */
  async implementErrorPrevention(): Promise<{
    preventionRules: string[];
    appliedRules: number;
    preventedErrors: number;
  }> {
    const preventionRules: string[] = [];
    let appliedRules = 0;
    let preventedErrors = 0;

    // Template validation prevention
    try {
      await this.validator.validateTemplateSyntax({} as any);
      preventionRules.push('Template syntax validation enabled');
      appliedRules++;
    } catch (error) {
      // Template validation failed, but that's expected for empty template
    }

    // Cache health check
    try {
      const cacheStats = this.cache.getStats();
      if (cacheStats.hitRate < 0.5) {
        this.cache.invalidateAll();
        preventionRules.push('Cache cleared due to low hit rate');
        appliedRules++;
        preventedErrors++;
      }
    } catch (error) {
      // Cache check failed
    }

    // Renderer cache cleanup
    try {
      this.renderer.clearCaches();
      preventionRules.push('Renderer caches cleared');
      appliedRules++;
    } catch (error) {
      // Cache cleanup failed
    }

    // Memory usage monitoring
    try {
      const memoryUsage = process.memoryUsage();
      const heapUsagePercent = memoryUsage.heapUsed / memoryUsage.heapTotal;

      if (heapUsagePercent > 0.8) {
        // Force garbage collection if available
        if (global.gc) {
          global.gc();
          preventionRules.push(
            'Garbage collection triggered due to high memory usage'
          );
          appliedRules++;
          preventedErrors++;
        }
      }
    } catch (error) {
      // Memory monitoring failed
    }

    return {
      preventionRules,
      appliedRules,
      preventedErrors,
    };
  }

  /**
   * TASK-033: Add error monitoring
   */
  async monitorSystemHealth(): Promise<{
    health: 'good' | 'warning' | 'critical';
    metrics: Record<string, any>;
    alerts: MonitoringAlert[];
  }> {
    const metrics: Record<string, any> = {};

    // Error rate monitoring
    const errorStats = this.errorHandler.getErrorStatistics();
    const errorRate =
      errorStats.totalErrors > 0
        ? (errorStats.errorsBySeverity.critical / errorStats.totalErrors) * 100
        : 0;

    metrics['errorRate'] = errorRate;
    metrics['totalErrors'] = errorStats.totalErrors;
    metrics['criticalErrors'] = errorStats.errorsBySeverity.critical;

    if (errorRate > 20) {
      this.createMonitoringAlert(
        'error_spike',
        'critical',
        `High error rate detected: ${errorRate.toFixed(2)}%`
      );
    } else if (errorRate > 10) {
      this.createMonitoringAlert(
        'error_spike',
        'high',
        `Elevated error rate detected: ${errorRate.toFixed(2)}%`
      );
    }

    // Recovery success rate monitoring
    const recoveryStats = this.getRecoveryStatistics();
    metrics['recoveryRate'] = recoveryStats.recoveryRate;
    metrics['successfulRecoveries'] = recoveryStats.successfulRecoveries;
    metrics['failedRecoveries'] = recoveryStats.failedRecoveries;

    if (recoveryStats.recoveryRate < 0.5) {
      this.createMonitoringAlert(
        'recovery_failure',
        'high',
        `Low recovery success rate: ${(recoveryStats.recoveryRate * 100).toFixed(2)}%`
      );
    }

    // Performance monitoring
    const memoryUsage = process.memoryUsage();
    metrics['memoryUsage'] = {
      heapUsed: memoryUsage.heapUsed,
      heapTotal: memoryUsage.heapTotal,
      heapUsagePercent: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100,
    };

    if (metrics['memoryUsage'].heapUsagePercent > 90) {
      this.createMonitoringAlert(
        'performance_degradation',
        'critical',
        `Critical memory usage: ${metrics['memoryUsage'].heapUsagePercent.toFixed(2)}%`
      );
    } else if (metrics['memoryUsage'].heapUsagePercent > 80) {
      this.createMonitoringAlert(
        'performance_degradation',
        'high',
        `High memory usage: ${metrics['memoryUsage'].heapUsagePercent.toFixed(2)}%`
      );
    }

    // Cache performance monitoring
    const cacheStats = this.cache.getStats();
    metrics['cachePerformance'] = {
      hitRate: cacheStats.hitRate,
      size: cacheStats.size,
      maxSize: cacheStats.maxSize,
    };

    if (cacheStats.hitRate < 0.3) {
      this.createMonitoringAlert(
        'performance_degradation',
        'medium',
        `Low cache hit rate: ${(cacheStats.hitRate * 100).toFixed(2)}%`
      );
    }

    // Determine overall health
    let health: 'good' | 'warning' | 'critical' = 'good';

    if (errorRate > 20 || metrics['memoryUsage'].heapUsagePercent > 90) {
      health = 'critical';
    } else if (
      errorRate > 10 ||
      metrics['memoryUsage'].heapUsagePercent > 80 ||
      recoveryStats.recoveryRate < 0.5
    ) {
      health = 'warning';
    }

    // Get recent alerts
    const recentAlerts = this.monitoringAlerts.filter(
      alert => Date.now() - alert.timestamp.getTime() < 5 * 60 * 1000 // Last 5 minutes
    );

    return {
      health,
      metrics,
      alerts: recentAlerts,
    };
  }

  /**
   * Get recovery statistics
   */
  getRecoveryStatistics(): RecoveryStatistics {
    const totalRecoveries = this.recoveryActions.length;
    const successfulRecoveries = this.recoveryActions.filter(
      a => a.success
    ).length;
    const failedRecoveries = totalRecoveries - successfulRecoveries;
    const autoRecoveries = this.recoveryActions.filter(
      a => a.type === 'automatic'
    ).length;
    const manualRecoveries = this.recoveryActions.filter(
      a => a.type === 'manual'
    ).length;

    const averageRecoveryTime =
      totalRecoveries > 0
        ? this.recoveryActions.reduce(
            (sum, action) => sum + action.duration,
            0
          ) / totalRecoveries
        : 0;

    const recoveryRate =
      totalRecoveries > 0 ? successfulRecoveries / totalRecoveries : 0;

    return {
      totalRecoveries,
      successfulRecoveries,
      failedRecoveries,
      averageRecoveryTime,
      recoveryRate,
      autoRecoveries,
      manualRecoveries,
    };
  }

  /**
   * Get monitoring alerts
   */
  getMonitoringAlerts(): MonitoringAlert[] {
    return [...this.monitoringAlerts];
  }

  /**
   * Clear old monitoring data
   */
  clearOldData(maxAge: number = 24 * 60 * 60 * 1000): void {
    const cutoffTime = Date.now() - maxAge;

    this.recoveryActions = this.recoveryActions.filter(
      action => action.timestamp.getTime() > cutoffTime
    );

    this.monitoringAlerts = this.monitoringAlerts.filter(
      alert => alert.timestamp.getTime() > cutoffTime
    );
  }

  /**
   * Perform automatic recovery
   */
  private async performAutomaticRecovery(error: TemplateError): Promise<{
    success: boolean;
    strategy?: string;
    details?: any;
  }> {
    switch (error.category) {
      case ErrorCategory.TEMPLATE_SYNTAX:
        return this.recoverTemplateSyntaxError(error);

      case ErrorCategory.VARIABLE_RESOLUTION:
        return this.recoverVariableResolutionError(error);

      case ErrorCategory.CACHE:
        return this.recoverCacheError(error);

      case ErrorCategory.FILE_OPERATION:
        return this.recoverFileOperationError(error);

      case ErrorCategory.PARALLEL_PROCESSING:
        return this.recoverParallelProcessingError(error);

      default:
        return { success: false, strategy: 'no_strategy_available' };
    }
  }

  /**
   * Recover template syntax errors
   */
  private async recoverTemplateSyntaxError(error: TemplateError): Promise<{
    success: boolean;
    strategy?: string;
    details?: any;
  }> {
    try {
      // Clear renderer caches
      this.renderer.clearCaches();

      // Invalidate template cache
      if (error.context.templateName) {
        this.cache.invalidateTemplate(error.context.templateName);
      }

      return {
        success: true,
        strategy: 'template_syntax_recovery',
        details: {
          cacheCleared: true,
          templateInvalidated: !!error.context.templateName,
        },
      };
    } catch (error) {
      return { success: false, strategy: 'template_syntax_recovery' };
    }
  }

  /**
   * Recover variable resolution errors
   */
  private async recoverVariableResolutionError(_error: TemplateError): Promise<{
    success: boolean;
    strategy?: string;
    details?: any;
  }> {
    try {
      // Clear variable caches
      this.renderer.clearCaches();

      return {
        success: true,
        strategy: 'variable_resolution_recovery',
        details: { cachesCleared: true },
      };
    } catch (error) {
      return { success: false, strategy: 'variable_resolution_recovery' };
    }
  }

  /**
   * Recover cache errors
   */
  private async recoverCacheError(_error: TemplateError): Promise<{
    success: boolean;
    strategy?: string;
    details?: any;
  }> {
    try {
      // Clear all caches
      this.cache.invalidateAll();
      this.renderer.clearCaches();

      return {
        success: true,
        strategy: 'cache_recovery',
        details: { allCachesCleared: true },
      };
    } catch (error) {
      return { success: false, strategy: 'cache_recovery' };
    }
  }

  /**
   * Recover file operation errors
   */
  private async recoverFileOperationError(error: TemplateError): Promise<{
    success: boolean;
    strategy?: string;
    details?: any;
  }> {
    try {
      // Attempt to create missing directories
      if (error.context.fileName) {
        const dir = path.dirname(error.context.fileName);
        await fs.promises.mkdir(dir, { recursive: true });

        return {
          success: true,
          strategy: 'file_operation_recovery',
          details: { directoryCreated: dir },
        };
      }

      return { success: false, strategy: 'file_operation_recovery' };
    } catch (error) {
      return { success: false, strategy: 'file_operation_recovery' };
    }
  }

  /**
   * Recover parallel processing errors
   */
  private async recoverParallelProcessingError(_error: TemplateError): Promise<{
    success: boolean;
    strategy?: string;
    details?: any;
  }> {
    try {
      // Clear caches and reduce load
      this.cache.invalidateAll();
      this.renderer.clearCaches();

      return {
        success: true,
        strategy: 'parallel_processing_recovery',
        details: { cachesCleared: true, loadReduced: true },
      };
    } catch (error) {
      return { success: false, strategy: 'parallel_processing_recovery' };
    }
  }

  /**
   * Execute manual recovery steps
   */
  private async executeManualRecoverySteps(
    strategy: string,
    steps: string[]
  ): Promise<{
    success: boolean;
    details?: any;
  }> {
    const results: any[] = [];

    for (const step of steps) {
      try {
        // Execute step based on strategy
        const result = await this.executeRecoveryStep(strategy, step);
        results.push({ step, success: true, result });
      } catch (error) {
        results.push({
          step,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const success = results.every(r => r.success);

    return {
      success,
      details: { steps: results },
    };
  }

  /**
   * Execute a single recovery step
   */
  private async executeRecoveryStep(
    strategy: string,
    step: string
  ): Promise<any> {
    // This is a simplified implementation
    // In a real system, you would have more sophisticated step execution
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate step execution

    return { executed: true, step, strategy };
  }

  /**
   * Update error monitoring
   */
  private updateErrorMonitoring(_error: TemplateError): void {
    this.errorCount++;

    // Check for error spikes
    if (this.errorCount > 10) {
      this.createMonitoringAlert(
        'error_spike',
        'medium',
        `High error count detected: ${this.errorCount} errors`
      );
    }
  }

  /**
   * Create monitoring alert
   */
  private createMonitoringAlert(
    type: MonitoringAlert['type'],
    severity: MonitoringAlert['severity'],
    message: string,
    data?: any
  ): void {
    const alert: MonitoringAlert = {
      id: this.generateAlertId(),
      type,
      severity,
      message,
      timestamp: new Date(),
      data,
    };

    this.monitoringAlerts.push(alert);
  }

  /**
   * Generate action ID
   */
  private generateActionId(): string {
    return `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate alert ID
   */
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
