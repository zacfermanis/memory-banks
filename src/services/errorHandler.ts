import { promises as fs } from 'fs';
import path from 'path';

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum ErrorCategory {
  TEMPLATE_SYNTAX = 'template_syntax',
  VARIABLE_RESOLUTION = 'variable_resolution',
  FILE_OPERATION = 'file_operation',
  VALIDATION = 'validation',
  RENDERING = 'rendering',
  CACHE = 'cache',
  PARALLEL_PROCESSING = 'parallel_processing',
  SYSTEM = 'system',
  NETWORK = 'network',
  PERMISSION = 'permission',
}

export interface ErrorContext {
  templateName?: string;
  fileName?: string;
  variableName?: string;
  operation?: string;
  timestamp: Date;
  stackTrace?: string;
  additionalData?: Record<string, any>;
}

export interface TemplateError {
  id: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  message: string;
  code: string;
  context: ErrorContext;
  recoverable: boolean;
  suggestions: string[];
  timestamp: Date;
}

export interface ErrorRecoveryStrategy {
  id: string;
  name: string;
  description: string;
  applicableErrors: ErrorCategory[];
  recoverySteps: string[];
  successRate: number;
  estimatedTime: number; // in milliseconds
}

export interface ErrorReport {
  summary: {
    totalErrors: number;
    criticalErrors: number;
    recoverableErrors: number;
    errorRate: number;
  };
  errors: TemplateError[];
  recoveryStrategies: ErrorRecoveryStrategy[];
  recommendations: string[];
}

export class ErrorHandler {
  private errors: TemplateError[] = [];
  private recoveryStrategies: Map<string, ErrorRecoveryStrategy> = new Map();
  private errorCounts: Map<ErrorCategory, number> = new Map();
  private recoveryAttempts: Map<string, number> = new Map();

  constructor() {
    this.initializeRecoveryStrategies();
  }

  /**
   * TASK-031: Implement error categorization
   */
  categorizeError(
    error: Error,
    context: Partial<ErrorContext> = {}
  ): TemplateError {
    const errorId = this.generateErrorId();
    const category = this.determineErrorCategory(error);
    const severity = this.determineErrorSeverity(error, category);
    const recoverable = this.isErrorRecoverable(error, category);
    const suggestions = this.generateErrorSuggestions(error, category);

    const templateError: TemplateError = {
      id: errorId,
      category,
      severity,
      message: error.message,
      code: this.extractErrorCode(error),
      context: {
        timestamp: new Date(),
        ...context,
      },
      recoverable,
      suggestions,
      timestamp: new Date(),
    };

    this.errors.push(templateError);
    this.updateErrorCounts(category);

    return templateError;
  }

  /**
   * TASK-031: Add error recovery mechanisms
   */
  async attemptErrorRecovery(error: TemplateError): Promise<{
    success: boolean;
    recoveredData?: any;
    newErrors?: TemplateError[];
  }> {
    const strategy = this.findRecoveryStrategy(error.category);
    if (!strategy) {
      return { success: false };
    }

    const attemptCount = this.recoveryAttempts.get(error.id) || 0;
    if (attemptCount >= 3) {
      return { success: false };
    }

    this.recoveryAttempts.set(error.id, attemptCount + 1);

    try {
      const result = await this.executeRecoveryStrategy(strategy, error);
      return { success: true, recoveredData: result };
    } catch (recoveryError) {
      const newError = this.categorizeError(recoveryError as Error, {
        templateName: error.context.templateName,
        fileName: error.context.fileName,
        operation: 'error_recovery',
      });
      return { success: false, newErrors: [newError] };
    }
  }

  /**
   * TASK-031: Create error reporting system
   */
  generateErrorReport(): ErrorReport {
    const totalErrors = this.errors.length;
    const criticalErrors = this.errors.filter(
      e => e.severity === ErrorSeverity.CRITICAL
    ).length;
    const recoverableErrors = this.errors.filter(e => e.recoverable).length;
    const errorRate = this.calculateErrorRate();

    const recommendations = this.generateRecommendations();

    return {
      summary: {
        totalErrors,
        criticalErrors,
        recoverableErrors,
        errorRate,
      },
      errors: [...this.errors],
      recoveryStrategies: Array.from(this.recoveryStrategies.values()),
      recommendations,
    };
  }

  /**
   * TASK-031: Add error logging
   */
  async logError(
    error: TemplateError,
    logLevel: 'info' | 'warn' | 'error' = 'error'
  ): Promise<void> {
    const logEntry = {
      timestamp: error.timestamp.toISOString(),
      level: logLevel,
      errorId: error.id,
      category: error.category,
      severity: error.severity,
      message: error.message,
      code: error.code,
      context: error.context,
      recoverable: error.recoverable,
    };

    const logDir = path.join(process.cwd(), 'logs');
    await fs.mkdir(logDir, { recursive: true });

    const logFile = path.join(
      logDir,
      `template-engine-${new Date().toISOString().split('T')[0]}.log`
    );
    const logLine = `${JSON.stringify(logEntry)}\n`;

    await fs.appendFile(logFile, logLine, 'utf8');
  }

  /**
   * Get errors by category
   */
  getErrorsByCategory(category: ErrorCategory): TemplateError[] {
    return this.errors.filter(error => error.category === category);
  }

  /**
   * Get errors by severity
   */
  getErrorsBySeverity(severity: ErrorSeverity): TemplateError[] {
    return this.errors.filter(error => error.severity === severity);
  }

  /**
   * Get recoverable errors
   */
  getRecoverableErrors(): TemplateError[] {
    return this.errors.filter(error => error.recoverable);
  }

  /**
   * Clear error history
   */
  clearErrors(): void {
    this.errors = [];
    this.errorCounts.clear();
    this.recoveryAttempts.clear();
  }

  /**
   * Get error statistics
   */
  getErrorStatistics(): {
    totalErrors: number;
    errorsByCategory: Record<ErrorCategory, number>;
    errorsBySeverity: Record<ErrorSeverity, number>;
    recoveryAttempts: number;
    successRate: number;
  } {
    const errorsByCategory: Record<ErrorCategory, number> = {} as any;
    const errorsBySeverity: Record<ErrorSeverity, number> = {} as any;

    // Initialize counts
    Object.values(ErrorCategory).forEach(category => {
      errorsByCategory[category] = 0;
    });
    Object.values(ErrorSeverity).forEach(severity => {
      errorsBySeverity[severity] = 0;
    });

    // Count errors
    this.errors.forEach(error => {
      errorsByCategory[error.category]++;
      errorsBySeverity[error.severity]++;
    });

    const totalRecoveryAttempts = Array.from(
      this.recoveryAttempts.values()
    ).reduce((sum, count) => sum + count, 0);
    const successRate =
      this.errors.length > 0
        ? (this.errors.filter(e => e.recoverable).length / this.errors.length) *
          100
        : 0;

    return {
      totalErrors: this.errors.length,
      errorsByCategory,
      errorsBySeverity,
      recoveryAttempts: totalRecoveryAttempts,
      successRate,
    };
  }

  /**
   * Initialize recovery strategies
   */
  private initializeRecoveryStrategies(): void {
    const strategies: ErrorRecoveryStrategy[] = [
      {
        id: 'template-syntax-fix',
        name: 'Template Syntax Auto-Fix',
        description: 'Attempts to fix common template syntax errors',
        applicableErrors: [ErrorCategory.TEMPLATE_SYNTAX],
        recoverySteps: [
          'Validate template structure',
          'Fix missing closing tags',
          'Correct variable syntax',
          'Validate conditional blocks',
        ],
        successRate: 0.7,
        estimatedTime: 1000,
      },
      {
        id: 'variable-resolution-retry',
        name: 'Variable Resolution Retry',
        description: 'Retries variable resolution with fallback values',
        applicableErrors: [ErrorCategory.VARIABLE_RESOLUTION],
        recoverySteps: [
          'Check variable existence',
          'Apply default values',
          'Resolve nested variables',
          'Validate variable types',
        ],
        successRate: 0.8,
        estimatedTime: 500,
      },
      {
        id: 'file-operation-retry',
        name: 'File Operation Retry',
        description: 'Retries file operations with different strategies',
        applicableErrors: [
          ErrorCategory.FILE_OPERATION,
          ErrorCategory.PERMISSION,
        ],
        recoverySteps: [
          'Check file permissions',
          'Create missing directories',
          'Handle file conflicts',
          'Retry with different encoding',
        ],
        successRate: 0.6,
        estimatedTime: 2000,
      },
      {
        id: 'cache-invalidation',
        name: 'Cache Invalidation',
        description: 'Invalidates and rebuilds cache entries',
        applicableErrors: [ErrorCategory.CACHE],
        recoverySteps: [
          'Clear corrupted cache entries',
          'Rebuild cache from source',
          'Validate cache integrity',
          'Update cache metadata',
        ],
        successRate: 0.9,
        estimatedTime: 300,
      },
      {
        id: 'parallel-processing-fallback',
        name: 'Parallel Processing Fallback',
        description: 'Falls back to sequential processing',
        applicableErrors: [ErrorCategory.PARALLEL_PROCESSING],
        recoverySteps: [
          'Reduce concurrency level',
          'Switch to sequential processing',
          'Retry failed tasks',
          'Optimize resource usage',
        ],
        successRate: 0.8,
        estimatedTime: 1500,
      },
    ];

    strategies.forEach(strategy => {
      this.recoveryStrategies.set(strategy.id, strategy);
    });
  }

  /**
   * Determine error category
   */
  private determineErrorCategory(error: Error): ErrorCategory {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';

    if (
      message.includes('template') ||
      message.includes('syntax') ||
      stack.includes('template')
    ) {
      return ErrorCategory.TEMPLATE_SYNTAX;
    }
    if (
      message.includes('variable') ||
      message.includes('undefined') ||
      message.includes('null')
    ) {
      return ErrorCategory.VARIABLE_RESOLUTION;
    }
    if (
      message.includes('file') ||
      message.includes('path') ||
      message.includes('directory')
    ) {
      return ErrorCategory.FILE_OPERATION;
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return ErrorCategory.VALIDATION;
    }
    if (message.includes('render') || message.includes('template')) {
      return ErrorCategory.RENDERING;
    }
    if (message.includes('cache') || message.includes('memory')) {
      return ErrorCategory.CACHE;
    }
    if (message.includes('parallel') || message.includes('concurrent')) {
      return ErrorCategory.PARALLEL_PROCESSING;
    }
    if (message.includes('permission') || message.includes('access')) {
      return ErrorCategory.PERMISSION;
    }
    if (message.includes('network') || message.includes('connection')) {
      return ErrorCategory.NETWORK;
    }

    return ErrorCategory.SYSTEM;
  }

  /**
   * Determine error severity
   */
  private determineErrorSeverity(
    error: Error,
    category: ErrorCategory
  ): ErrorSeverity {
    const message = error.message.toLowerCase();

    // Critical errors
    if (
      message.includes('fatal') ||
      message.includes('critical') ||
      category === ErrorCategory.SYSTEM
    ) {
      return ErrorSeverity.CRITICAL;
    }

    // High severity errors
    if (
      category === ErrorCategory.FILE_OPERATION ||
      category === ErrorCategory.PERMISSION
    ) {
      return ErrorSeverity.HIGH;
    }

    // Medium severity errors
    if (
      category === ErrorCategory.TEMPLATE_SYNTAX ||
      category === ErrorCategory.VALIDATION
    ) {
      return ErrorSeverity.MEDIUM;
    }

    // Low severity errors
    return ErrorSeverity.LOW;
  }

  /**
   * Check if error is recoverable
   */
  private isErrorRecoverable(error: Error, category: ErrorCategory): boolean {
    const message = error.message.toLowerCase();

    // Non-recoverable errors
    if (
      message.includes('fatal') ||
      message.includes('critical') ||
      category === ErrorCategory.SYSTEM
    ) {
      return false;
    }

    // Recoverable errors
    return [
      ErrorCategory.TEMPLATE_SYNTAX,
      ErrorCategory.VARIABLE_RESOLUTION,
      ErrorCategory.CACHE,
      ErrorCategory.PARALLEL_PROCESSING,
    ].includes(category);
  }

  /**
   * Generate error suggestions
   */
  private generateErrorSuggestions(
    _error: Error,
    category: ErrorCategory
  ): string[] {
    const suggestions: string[] = [];

    switch (category) {
      case ErrorCategory.TEMPLATE_SYNTAX:
        suggestions.push(
          'Check template syntax for missing closing tags',
          'Verify variable syntax ({{variable}})',
          'Ensure conditional blocks are properly closed',
          'Validate template structure'
        );
        break;
      case ErrorCategory.VARIABLE_RESOLUTION:
        suggestions.push(
          'Check if all required variables are provided',
          'Verify variable names match template expectations',
          'Ensure variables are not undefined or null',
          'Check for typos in variable names'
        );
        break;
      case ErrorCategory.FILE_OPERATION:
        suggestions.push(
          'Check file permissions and access rights',
          'Verify file paths are correct',
          'Ensure target directories exist',
          'Check for file system errors'
        );
        break;
      case ErrorCategory.CACHE:
        suggestions.push(
          'Clear cache and retry operation',
          'Check cache configuration',
          'Verify cache storage permissions',
          'Restart cache service if applicable'
        );
        break;
      case ErrorCategory.PARALLEL_PROCESSING:
        suggestions.push(
          'Reduce concurrency level',
          'Check system resources',
          'Retry with sequential processing',
          'Optimize task distribution'
        );
        break;
      default:
        suggestions.push(
          'Review error details and context',
          'Check system logs for additional information',
          'Verify configuration settings',
          'Contact support if issue persists'
        );
    }

    return suggestions;
  }

  /**
   * Extract error code
   */
  private extractErrorCode(error: Error): string {
    const message = error.message.toLowerCase();

    if (message.includes('template')) {
      return 'TEMPLATE_ERROR';
    }
    if (message.includes('variable')) {
      return 'VARIABLE_ERROR';
    }
    if (message.includes('file')) {
      return 'FILE_ERROR';
    }
    if (message.includes('validation')) {
      return 'VALIDATION_ERROR';
    }
    if (message.includes('cache')) {
      return 'CACHE_ERROR';
    }
    if (message.includes('permission')) {
      return 'PERMISSION_ERROR';
    }

    return 'UNKNOWN_ERROR';
  }

  /**
   * Generate error ID
   */
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Update error counts
   */
  private updateErrorCounts(category: ErrorCategory): void {
    const currentCount = this.errorCounts.get(category) || 0;
    this.errorCounts.set(category, currentCount + 1);
  }

  /**
   * Find recovery strategy
   */
  private findRecoveryStrategy(
    category: ErrorCategory
  ): ErrorRecoveryStrategy | undefined {
    for (const strategy of this.recoveryStrategies.values()) {
      if (strategy.applicableErrors.includes(category)) {
        return strategy;
      }
    }
    return undefined;
  }

  /**
   * Execute recovery strategy
   */
  private async executeRecoveryStrategy(
    strategy: ErrorRecoveryStrategy,
    error: TemplateError
  ): Promise<any> {
    // Simulate recovery execution based on strategy
    await new Promise(resolve => setTimeout(resolve, strategy.estimatedTime));

    // Return mock recovered data
    return {
      strategyId: strategy.id,
      errorId: error.id,
      recoveredAt: new Date(),
      success: Math.random() < strategy.successRate,
    };
  }

  /**
   * Calculate error rate
   */
  private calculateErrorRate(): number {
    // Mock error rate calculation
    return this.errors.length > 0
      ? (this.errors.filter(e => e.severity === ErrorSeverity.CRITICAL).length /
          this.errors.length) *
          100
      : 0;
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const stats = this.getErrorStatistics();

    if (stats.errorsByCategory[ErrorCategory.TEMPLATE_SYNTAX] > 0) {
      recommendations.push('Review template syntax and structure');
    }
    if (stats.errorsByCategory[ErrorCategory.VARIABLE_RESOLUTION] > 0) {
      recommendations.push('Verify all required variables are provided');
    }
    if (stats.errorsByCategory[ErrorCategory.FILE_OPERATION] > 0) {
      recommendations.push('Check file permissions and directory structure');
    }
    if (stats.recoveryAttempts > 0) {
      recommendations.push(
        'Consider implementing additional error recovery strategies'
      );
    }

    return recommendations;
  }
}
