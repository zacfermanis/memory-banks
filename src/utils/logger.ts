/* eslint-disable no-console */
import chalk from 'chalk';

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4,
}

export interface LogOptions {
  level?: LogLevel;
  verbose?: boolean;
  debug?: boolean;
  quiet?: boolean;
  timestamp?: boolean;
  performance?: boolean;
}

export class Logger {
  private static currentLevel: LogLevel = LogLevel.INFO;
  private static performanceTimers: Map<string, number> = new Map();
  private static enableTimestamp: boolean = false;
  private static enablePerformance: boolean = false;

  /**
   * Initialize logger with options
   */
  static initialize(options: LogOptions = {}): void {
    if (options.quiet) {
      this.currentLevel = LogLevel.ERROR;
    } else if (options.debug) {
      this.currentLevel = LogLevel.TRACE;
    } else if (options.verbose) {
      this.currentLevel = LogLevel.DEBUG;
    } else if (options.level !== undefined) {
      this.currentLevel = options.level;
    } else {
      this.currentLevel = LogLevel.INFO;
    }

    this.enableTimestamp = options.timestamp ?? false;
    this.enablePerformance = options.performance ?? false;
  }

  /**
   * Log error message
   */
  static error(message: string, ...args: any[]): void {
    if (this.currentLevel >= LogLevel.ERROR) {
      this.log(chalk.red('❌ ERROR:'), message, ...args);
    }
  }

  /**
   * Log warning message
   */
  static warn(message: string, ...args: any[]): void {
    if (this.currentLevel >= LogLevel.WARN) {
      this.log(chalk.yellow('⚠️  WARN:'), message, ...args);
    }
  }

  /**
   * Log info message
   */
  static info(message: string, ...args: any[]): void {
    if (this.currentLevel >= LogLevel.INFO) {
      this.log(chalk.blue('ℹ️  INFO:'), message, ...args);
    }
  }

  /**
   * Log debug message
   */
  static debug(message: string, ...args: any[]): void {
    if (this.currentLevel >= LogLevel.DEBUG) {
      if (args.length > 0) {
        // eslint-disable-next-line no-console
        console.log(`${chalk.gray('🐛 DEBUG:')} ${message}`, ...args);
      } else {
        // eslint-disable-next-line no-console
        console.log(`${chalk.gray('🐛 DEBUG:')} ${message}`);
      }
    }
  }

  /**
   * Log trace message
   */
  static trace(message: string, ...args: any[]): void {
    if (this.currentLevel >= LogLevel.TRACE) {
      if (args.length > 0) {
        // eslint-disable-next-line no-console
        console.log(`${chalk.gray('🔍 TRACE:')} ${message}`, ...args);
      } else {
        // eslint-disable-next-line no-console
        console.log(`${chalk.gray('🔍 TRACE:')} ${message}`);
      }
    }
  }

  /**
   * Log success message
   */
  static success(message: string, ...args: any[]): void {
    if (this.currentLevel >= LogLevel.INFO) {
      this.log(chalk.green('✅ SUCCESS:'), message, ...args);
    }
  }

  /**
   * Start performance timer
   */
  static startTimer(name: string): void {
    if (this.enablePerformance) {
      this.performanceTimers.set(name, Date.now());
      console.log(`${chalk.gray('🔍 TRACE:')} Started timer: ${name}`);
    }
  }

  /**
   * End performance timer and log duration
   */
  static endTimer(name: string): number | null {
    if (this.enablePerformance) {
      const startTime = this.performanceTimers.get(name);
      if (startTime) {
        const duration = Date.now() - startTime;
        this.performanceTimers.delete(name);
        console.log(`${chalk.gray('🐛 DEBUG:')} Timer ${name}: ${duration}ms`);
        return duration;
      }
    }
    return null;
  }

  /**
   * Log performance information
   */
  static performance(
    operation: string,
    duration: number,
    details?: Record<string, any>
  ): void {
    if (this.enablePerformance) {
      const color =
        duration < 100
          ? chalk.green
          : duration < 500
            ? chalk.yellow
            : chalk.red;
      console.log(
        chalk.blue('⏱️  PERF:'),
        `${operation} took ${color(`${duration}ms`)}`
      );

      if (details) {
        Object.entries(details).forEach(([key, value]) => {
          console.log(`${chalk.gray('    Details:')} ${key}: ${value}`);
        });
      }
    }
  }

  /**
   * Log memory usage information
   */
  static memoryUsage(): void {
    if (this.enablePerformance) {
      const usage = process.memoryUsage();
      console.log(chalk.gray('🐛 DEBUG:'), 'Memory Usage:', {
        rss: `${Math.round(usage.rss / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
        external: `${Math.round(usage.external / 1024 / 1024)}MB`,
      });
    }
  }

  /**
   * Log system information
   */
  static systemInfo(): void {
    if (this.currentLevel >= LogLevel.DEBUG) {
      console.log(chalk.gray('🐛 DEBUG:'), 'System Information:', {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        cwd: process.cwd(),
        pid: process.pid,
      });
    }
  }

  /**
   * Log configuration information
   */
  static configInfo(config: Record<string, any>): void {
    if (this.currentLevel >= LogLevel.DEBUG) {
      this.debug('Configuration:', config);
    }
  }

  /**
   * Log file operation information
   */
  static fileOperation(
    operation: 'read' | 'write' | 'delete' | 'exists',
    path: string,
    success: boolean,
    details?: any
  ): void {
    if (this.currentLevel >= LogLevel.DEBUG) {
      const status = success ? chalk.green('✓') : chalk.red('✗');
      const icon = {
        read: '📖',
        write: '📝',
        delete: '🗑️',
        exists: '🔍',
      }[operation];

      console.log(
        chalk.gray('🐛 DEBUG:'),
        `${icon} ${operation.toUpperCase()}: ${status} ${path}`
      );

      if (details) {
        console.log(chalk.gray('🐛 DEBUG:'), '  Details:', details);
      }
    }
  }

  /**
   * Log template operation information
   */
  static templateOperation(
    operation: string,
    templateId: string,
    details?: any
  ): void {
    if (this.currentLevel >= LogLevel.DEBUG) {
      console.log(
        chalk.gray('🐛 DEBUG:'),
        `📋 Template ${operation}: ${templateId}`
      );

      if (details) {
        console.log(chalk.gray('🐛 DEBUG:'), '  Details:', details);
      }
    }
  }

  /**
   * Log validation information
   */
  static validation(
    component: string,
    result: { isValid: boolean; errors?: string[]; warnings?: string[] }
  ): void {
    if (this.currentLevel >= LogLevel.DEBUG) {
      const status = result.isValid ? chalk.green('✓') : chalk.red('✗');
      console.log(
        chalk.gray('🐛 DEBUG:'),
        `🔍 Validation ${component}: ${status}`
      );

      if (result.errors && result.errors.length > 0) {
        console.log(chalk.gray('🐛 DEBUG:'), '  Errors:', result.errors);
      }

      if (result.warnings && result.warnings.length > 0) {
        console.log(chalk.gray('🐛 DEBUG:'), '  Warnings:', result.warnings);
      }
    }
  }

  /**
   * Create a progress indicator
   */
  static createProgress(
    total: number,
    description: string = 'Processing'
  ): ProgressIndicator {
    return new ProgressIndicator(total, description);
  }

  /**
   * Internal log method
   */
  private static log(prefix: string, message: string, ...args: any[]): void {
    const timestamp = this.enableTimestamp
      ? `[${new Date().toISOString()}] `
      : '';
    const formattedMessage = `${timestamp}${prefix} ${message}`;

    if (args.length > 0) {
      console.log(formattedMessage, ...args);
    } else {
      console.log(formattedMessage);
    }
  }

  /**
   * Get current log level
   */
  static getLevel(): LogLevel {
    return this.currentLevel;
  }

  /**
   * Check if debug mode is enabled
   */
  static isDebugEnabled(): boolean {
    return this.currentLevel >= LogLevel.DEBUG;
  }

  /**
   * Check if trace mode is enabled
   */
  static isTraceEnabled(): boolean {
    return this.currentLevel >= LogLevel.TRACE;
  }
}

/**
 * Progress indicator for long-running operations
 */
export class ProgressIndicator {
  private current: number = 0;
  private total: number;
  private description: string;
  private startTime: number;
  private lastUpdate: number = 0;

  constructor(total: number, description: string) {
    this.total = total;
    this.description = description;
    this.startTime = Date.now();
  }

  /**
   * Update progress
   */
  update(increment: number = 1): void {
    this.current += increment;
    this.current = Math.min(this.current, this.total);

    const now = Date.now();
    if (now - this.lastUpdate > 100) {
      // Update every 100ms
      this.display();
      this.lastUpdate = now;
    }
  }

  /**
   * Complete the progress
   */
  complete(): void {
    this.current = this.total;
    this.display();
    console.log(''); // New line after progress
  }

  /**
   * Display current progress
   */
  private display(): void {
    const percentage = Math.round((this.current / this.total) * 100);
    const elapsed = Date.now() - this.startTime;
    const estimated =
      this.current > 0 ? (elapsed / this.current) * this.total : 0;
    const remaining = Math.max(0, estimated - elapsed);

    const progressBar = this.createProgressBar(percentage);
    const timeInfo = this.formatTime(remaining);

    process.stdout.write(
      `\r${chalk.blue(this.description)}: ${progressBar} ${percentage}% (${timeInfo} remaining)`
    );
  }

  /**
   * Create visual progress bar
   */
  private createProgressBar(percentage: number): string {
    const width = 20;
    const filled = Math.round((percentage / 100) * width);
    const empty = width - filled;

    return chalk.green('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
  }

  /**
   * Format time in human-readable format
   */
  private formatTime(ms: number): string {
    if (ms < 1000) {
      return `${Math.round(ms)}ms`;
    }
    if (ms < 60000) {
      return `${Math.round(ms / 1000)}s`;
    }
    return `${Math.round(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
  }
}
