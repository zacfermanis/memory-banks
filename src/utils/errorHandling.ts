import chalk from 'chalk';

export enum ErrorCode {
  // Validation errors (1000-1999)
  VALIDATION_ERROR = 1000,
  INVALID_PROJECT_NAME = 1001,
  INVALID_FILE_PATH = 1002,
  INVALID_TEMPLATE_ID = 1003,
  INVALID_CONFIGURATION = 1004,
  MISSING_REQUIRED_FIELD = 1005,

  // File system errors (2000-2999)
  FILE_SYSTEM_ERROR = 2000,
  FILE_NOT_FOUND = 2001,
  FILE_ACCESS_DENIED = 2002,
  FILE_ALREADY_EXISTS = 2003,
  DIRECTORY_NOT_FOUND = 2004,
  INSUFFICIENT_PERMISSIONS = 2005,
  DISK_SPACE_ERROR = 2006,

  // Template errors (3000-3999)
  TEMPLATE_ERROR = 3000,
  TEMPLATE_NOT_FOUND = 3001,
  TEMPLATE_INVALID = 3002,
  TEMPLATE_RENDER_ERROR = 3003,
  TEMPLATE_VARIABLE_MISSING = 3004,

  // CLI errors (4000-4999)
  CLI_ERROR = 4000,
  INVALID_COMMAND = 4001,
  INVALID_OPTION = 4002,
  MISSING_ARGUMENT = 4003,
  TOO_MANY_ARGUMENTS = 4004,

  // Network errors (5000-5999)
  NETWORK_ERROR = 5000,
  CONNECTION_TIMEOUT = 5001,
  DNS_RESOLUTION_ERROR = 5002,
  HTTP_ERROR = 5003,

  // System errors (6000-6999)
  SYSTEM_ERROR = 6000,
  OUT_OF_MEMORY = 6001,
  PROCESS_TIMEOUT = 6002,
  UNSUPPORTED_PLATFORM = 6003,

  // Unknown errors (9000-9999)
  UNKNOWN_ERROR = 9000,
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum ErrorCategory {
  VALIDATION = 'validation',
  FILE_SYSTEM = 'file_system',
  TEMPLATE = 'template',
  CLI = 'cli',
  NETWORK = 'network',
  SYSTEM = 'system',
  UNKNOWN = 'unknown',
}

export interface ErrorDetails {
  code: ErrorCode;
  severity: ErrorSeverity;
  category: ErrorCategory;
  message: string;
  userMessage: string;
  recoverySteps: string[];
  technicalDetails?: string | undefined;
  context?: Record<string, any> | undefined;
}

export class MemoryBanksError extends Error {
  public readonly code: ErrorCode;
  public readonly severity: ErrorSeverity;
  public readonly category: ErrorCategory;
  public readonly userMessage: string;
  public readonly recoverySteps: string[];
  public readonly technicalDetails?: string | undefined;
  public readonly context?: Record<string, any> | undefined;

  constructor(details: ErrorDetails) {
    super(details.message);
    this.name = 'MemoryBanksError';
    this.code = details.code;
    this.severity = details.severity;
    this.category = details.category;
    this.userMessage = details.userMessage;
    this.recoverySteps = details.recoverySteps;
    this.technicalDetails = details.technicalDetails ?? undefined;
    this.context = details.context ?? undefined;
  }

  static createValidationError(
    message: string,
    userMessage: string,
    recoverySteps: string[],
    context?: Record<string, any>
  ): MemoryBanksError {
    return new MemoryBanksError({
      code: ErrorCode.VALIDATION_ERROR,
      severity: ErrorSeverity.MEDIUM,
      category: ErrorCategory.VALIDATION,
      message,
      userMessage,
      recoverySteps,
      context,
    });
  }

  static createFileSystemError(
    code: ErrorCode,
    message: string,
    userMessage: string,
    recoverySteps: string[],
    context?: Record<string, any>
  ): MemoryBanksError {
    return new MemoryBanksError({
      code,
      severity: ErrorSeverity.HIGH,
      category: ErrorCategory.FILE_SYSTEM,
      message,
      userMessage,
      recoverySteps,
      context,
    });
  }

  static createTemplateError(
    code: ErrorCode,
    message: string,
    userMessage: string,
    recoverySteps: string[],
    context?: Record<string, any>
  ): MemoryBanksError {
    return new MemoryBanksError({
      code,
      severity: ErrorSeverity.MEDIUM,
      category: ErrorCategory.TEMPLATE,
      message,
      userMessage,
      recoverySteps,
      context,
    });
  }

  static createCLIError(
    code: ErrorCode,
    message: string,
    userMessage: string,
    recoverySteps: string[],
    context?: Record<string, any>
  ): MemoryBanksError {
    return new MemoryBanksError({
      code,
      severity: ErrorSeverity.LOW,
      category: ErrorCategory.CLI,
      message,
      userMessage,
      recoverySteps,
      context,
    });
  }

  static createSystemError(
    code: ErrorCode,
    message: string,
    userMessage: string,
    recoverySteps: string[],
    context?: Record<string, any>
  ): MemoryBanksError {
    return new MemoryBanksError({
      code,
      severity: ErrorSeverity.CRITICAL,
      category: ErrorCategory.SYSTEM,
      message,
      userMessage,
      recoverySteps,
      context,
    });
  }
}

export class ErrorHandler {
  // Error messages are now handled directly in the error creation methods

  // Recovery suggestions are now handled directly in the error creation methods

  /**
   * Handle and display an error
   */
  static handleError(
    error: Error | MemoryBanksError,
    options: {
      verbose?: boolean;
      debug?: boolean;
      quiet?: boolean;
    } = {}
  ): void {
    if (options.quiet) {
      process.exit(1);
    }

    if (error instanceof MemoryBanksError) {
      this.displayMemoryBanksError(error, options);
    } else {
      this.displayGenericError(error, options);
    }

    // Exit with appropriate code
    const exitCode =
      error instanceof MemoryBanksError ? this.getExitCode(error.severity) : 1;
    process.exit(exitCode);
  }

  /**
   * Display a MemoryBanksError with user-friendly formatting
   */
  private static displayMemoryBanksError(
    error: MemoryBanksError,
    options: { verbose?: boolean; debug?: boolean }
  ): void {
    console.log('');
    console.log(chalk.red('❌ Error:'), chalk.bold(error.userMessage));
    console.log('');

    // Display recovery steps
    if (error.recoverySteps.length > 0) {
      console.log(chalk.yellow('💡 To resolve this issue:'));
      error.recoverySteps.forEach((step, index) => {
        console.log(chalk.gray(`   ${index + 1}. ${step}`));
      });
      console.log('');
    }

    // Display technical details in verbose mode
    if (options.verbose || options.debug) {
      console.log(chalk.gray('Technical Details:'));
      console.log(chalk.gray(`  Code: ${error.code}`));
      console.log(chalk.gray(`  Category: ${error.category}`));
      console.log(chalk.gray(`  Severity: ${error.severity}`));
      console.log(chalk.gray(`  Message: ${error.message}`));

      if (error.technicalDetails) {
        console.log(chalk.gray(`  Details: ${error.technicalDetails}`));
      }

      if (error.context && Object.keys(error.context).length > 0) {
        console.log(chalk.gray('  Context:'));
        Object.entries(error.context).forEach(([key, value]) => {
          console.log(chalk.gray(`    ${key}: ${value}`));
        });
      }
      console.log('');
    }

    // Display stack trace in debug mode
    if (options.debug && error.stack) {
      console.log(chalk.gray('Stack Trace:'));
      console.log(chalk.gray(error.stack));
      console.log('');
    }
  }

  /**
   * Display a generic error
   */
  private static displayGenericError(
    error: Error,
    options: { verbose?: boolean; debug?: boolean }
  ): void {
    console.log('');
    console.log(chalk.red('❌ An unexpected error occurred:'));
    console.log(chalk.red(error.message));
    console.log('');

    if (options.verbose || options.debug) {
      console.log(chalk.gray('Technical Details:'));
      console.log(chalk.gray(`  Name: ${error.name}`));
      console.log(chalk.gray(`  Message: ${error.message}`));
      console.log('');
    }

    if (options.debug && error.stack) {
      console.log(chalk.gray('Stack Trace:'));
      console.log(chalk.gray(error.stack));
      console.log('');
    }

    console.log(
      chalk.yellow('💡 Try running with --help for usage information')
    );
    console.log(
      chalk.gray('If the problem persists, please report this issue.')
    );
  }

  /**
   * Get exit code based on error severity
   */
  private static getExitCode(severity: ErrorSeverity): number {
    switch (severity) {
      case ErrorSeverity.LOW:
        return 1;
      case ErrorSeverity.MEDIUM:
        return 2;
      case ErrorSeverity.HIGH:
        return 3;
      case ErrorSeverity.CRITICAL:
        return 4;
      default:
        return 1;
    }
  }

  /**
   * Create a user-friendly error message
   */
  static createUserMessage(error: Error | MemoryBanksError): string {
    if (error instanceof MemoryBanksError) {
      return error.userMessage;
    }

    // For generic errors, try to extract useful information
    const message = error.message.toLowerCase();

    if (message.includes('permission')) {
      return 'Access denied. Check your permissions and try again.';
    }

    if (message.includes('not found')) {
      return 'The requested resource was not found.';
    }

    if (message.includes('network') || message.includes('connection')) {
      return 'Network connection failed. Check your internet connection.';
    }

    if (message.includes('timeout') || message.includes('timed out')) {
      return 'Operation timed out. Please try again.';
    }

    return 'An unexpected error occurred. Please try again.';
  }

  /**
   * Get recovery suggestions for an error
   */
  static getRecoverySuggestions(error: Error | MemoryBanksError): string[] {
    if (error instanceof MemoryBanksError) {
      return error.recoverySteps;
    }

    // For generic errors, provide general suggestions
    const message = error.message.toLowerCase();

    if (message.includes('permission')) {
      return [
        'Check file and directory permissions',
        'Run with elevated privileges if needed',
        'Contact your system administrator',
      ];
    }

    if (message.includes('not found')) {
      return [
        'Verify the path or resource exists',
        'Check spelling and case sensitivity',
        'Ensure you have access to the resource',
      ];
    }

    if (message.includes('network') || message.includes('connection')) {
      return [
        'Check your internet connection',
        'Verify network settings',
        'Try again later',
      ];
    }

    return [
      'Try again',
      'Check system resources',
      'Contact support if the problem persists',
    ];
  }
}
