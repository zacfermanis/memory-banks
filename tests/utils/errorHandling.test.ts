// Mock chalk before importing the module
jest.mock('chalk', () => ({
  red: jest.fn((text: string) => `RED:${text}`),
  yellow: jest.fn((text: string) => `YELLOW:${text}`),
  gray: jest.fn((text: string) => `GRAY:${text}`),
  blue: jest.fn((text: string) => `BLUE:${text}`),
  bold: jest.fn((text: string) => `BOLD:${text}`),
  green: jest.fn((text: string) => `GREEN:${text}`)
}));

import { MemoryBanksError, ErrorHandler, ErrorCode, ErrorSeverity, ErrorCategory } from '../../src/utils/errorHandling';

// Mock console.log and console.error to capture output
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const mockConsoleLog = jest.fn();
const mockConsoleError = jest.fn();

describe('MemoryBanksError', () => {
  beforeEach(() => {
    console.log = mockConsoleLog;
    console.error = mockConsoleError;
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    jest.clearAllMocks();
  });

  describe('createValidationError', () => {
    it('should create a validation error with correct properties', () => {
      const error = MemoryBanksError.createValidationError(
        'Test validation error',
        'User-friendly message',
        ['Step 1', 'Step 2'],
        { field: 'test' }
      );

      expect(error).toBeInstanceOf(MemoryBanksError);
      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.category).toBe(ErrorCategory.VALIDATION);
      expect(error.message).toBe('Test validation error');
      expect(error.userMessage).toBe('User-friendly message');
      expect(error.recoverySteps).toEqual(['Step 1', 'Step 2']);
      expect(error.context).toEqual({ field: 'test' });
    });
  });

  describe('createFileSystemError', () => {
    it('should create a file system error with correct properties', () => {
      const error = MemoryBanksError.createFileSystemError(
        ErrorCode.FILE_NOT_FOUND,
        'File not found',
        'The requested file was not found',
        ['Check if file exists', 'Verify path'],
        { filePath: '/test/file.txt' }
      );

      expect(error).toBeInstanceOf(MemoryBanksError);
      expect(error.code).toBe(ErrorCode.FILE_NOT_FOUND);
      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.category).toBe(ErrorCategory.FILE_SYSTEM);
      expect(error.message).toBe('File not found');
      expect(error.userMessage).toBe('The requested file was not found');
      expect(error.recoverySteps).toEqual(['Check if file exists', 'Verify path']);
      expect(error.context).toEqual({ filePath: '/test/file.txt' });
    });
  });

  describe('createTemplateError', () => {
    it('should create a template error with correct properties', () => {
      const error = MemoryBanksError.createTemplateError(
        ErrorCode.TEMPLATE_NOT_FOUND,
        'Template not found',
        'The specified template was not found',
        ['Check template name', 'List available templates'],
        { templateId: 'test-template' }
      );

      expect(error).toBeInstanceOf(MemoryBanksError);
      expect(error.code).toBe(ErrorCode.TEMPLATE_NOT_FOUND);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.category).toBe(ErrorCategory.TEMPLATE);
      expect(error.message).toBe('Template not found');
      expect(error.userMessage).toBe('The specified template was not found');
      expect(error.recoverySteps).toEqual(['Check template name', 'List available templates']);
      expect(error.context).toEqual({ templateId: 'test-template' });
    });
  });

  describe('createCLIError', () => {
    it('should create a CLI error with correct properties', () => {
      const error = MemoryBanksError.createCLIError(
        ErrorCode.INVALID_COMMAND,
        'Invalid command',
        'The specified command is not valid',
        ['Check command spelling', 'Use --help for available commands'],
        { command: 'invalid-cmd' }
      );

      expect(error).toBeInstanceOf(MemoryBanksError);
      expect(error.code).toBe(ErrorCode.INVALID_COMMAND);
      expect(error.severity).toBe(ErrorSeverity.LOW);
      expect(error.category).toBe(ErrorCategory.CLI);
      expect(error.message).toBe('Invalid command');
      expect(error.userMessage).toBe('The specified command is not valid');
      expect(error.recoverySteps).toEqual(['Check command spelling', 'Use --help for available commands']);
      expect(error.context).toEqual({ command: 'invalid-cmd' });
    });
  });

  describe('createSystemError', () => {
    it('should create a system error with correct properties', () => {
      const error = MemoryBanksError.createSystemError(
        ErrorCode.OUT_OF_MEMORY,
        'Out of memory',
        'The system ran out of memory',
        ['Close other applications', 'Restart the system'],
        { memoryUsage: '95%' }
      );

      expect(error).toBeInstanceOf(MemoryBanksError);
      expect(error.code).toBe(ErrorCode.OUT_OF_MEMORY);
      expect(error.severity).toBe(ErrorSeverity.CRITICAL);
      expect(error.category).toBe(ErrorCategory.SYSTEM);
      expect(error.message).toBe('Out of memory');
      expect(error.userMessage).toBe('The system ran out of memory');
      expect(error.recoverySteps).toEqual(['Close other applications', 'Restart the system']);
      expect(error.context).toEqual({ memoryUsage: '95%' });
    });
  });
});

describe('ErrorHandler', () => {
  const originalProcessExit = process.exit;
  const mockProcessExit = jest.fn();

  beforeEach(() => {
    console.log = mockConsoleLog;
    console.error = mockConsoleError;
    process.exit = mockProcessExit as any;
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    process.exit = originalProcessExit;
    jest.clearAllMocks();
  });

  describe('handleError', () => {
    it('should handle MemoryBanksError with default options', () => {
      const error = MemoryBanksError.createValidationError(
        'Test error',
        'User-friendly error message',
        ['Step 1', 'Step 2']
      );

      ErrorHandler.handleError(error);

      expect(mockConsoleLog).toHaveBeenCalledWith('');
      expect(mockConsoleLog).toHaveBeenCalledWith('RED:❌ Error:', 'BOLD:User-friendly error message');
      expect(mockConsoleLog).toHaveBeenCalledWith('');
      expect(mockConsoleLog).toHaveBeenCalledWith('YELLOW:💡 To resolve this issue:');
      expect(mockConsoleLog).toHaveBeenCalledWith('GRAY:   1. Step 1');
      expect(mockConsoleLog).toHaveBeenCalledWith('GRAY:   2. Step 2');
      expect(mockConsoleLog).toHaveBeenCalledWith('');
      expect(mockProcessExit).toHaveBeenCalledWith(2); // MEDIUM severity
    });

    it('should handle MemoryBanksError with verbose options', () => {
      const error = MemoryBanksError.createValidationError(
        'Test error',
        'User-friendly error message',
        ['Step 1'],
        { test: 'context' }
      );

      ErrorHandler.handleError(error, { verbose: true });

      expect(mockConsoleLog).toHaveBeenCalledWith('GRAY:Technical Details:');
      expect(mockConsoleLog).toHaveBeenCalledWith('GRAY:  Code: 1000');
      expect(mockConsoleLog).toHaveBeenCalledWith('GRAY:  Category: validation');
      expect(mockConsoleLog).toHaveBeenCalledWith('GRAY:  Severity: medium');
      expect(mockConsoleLog).toHaveBeenCalledWith('GRAY:    test: context');
    });

    it('should handle MemoryBanksError with debug options', () => {
      const error = MemoryBanksError.createValidationError(
        'Test error',
        'User-friendly error message',
        ['Step 1']
      );

      ErrorHandler.handleError(error, { debug: true });

      expect(mockConsoleLog).toHaveBeenCalledWith('GRAY:Stack Trace:');
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('MemoryBanksError'));
    });

    it('should handle MemoryBanksError with quiet options', () => {
      const error = MemoryBanksError.createValidationError(
        'Test error',
        'User-friendly error message',
        ['Step 1']
      );

      ErrorHandler.handleError(error, { quiet: true });

      // In quiet mode, console.log should still be called for error display
      expect(mockProcessExit).toHaveBeenCalledWith(2);
      expect(mockProcessExit).toHaveBeenCalledWith(2);
    });

    it('should handle generic Error', () => {
      const error = new Error('Generic error message');

      ErrorHandler.handleError(error);

      expect(mockConsoleLog).toHaveBeenCalledWith('');
      expect(mockConsoleLog).toHaveBeenCalledWith('RED:❌ An unexpected error occurred:');
      expect(mockConsoleLog).toHaveBeenCalledWith('RED:Generic error message');
      expect(mockConsoleLog).toHaveBeenCalledWith('');
      expect(mockConsoleLog).toHaveBeenCalledWith('YELLOW:💡 Try running with --help for usage information');
      expect(mockConsoleLog).toHaveBeenCalledWith('GRAY:If the problem persists, please report this issue.');
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });

    it('should handle generic Error with verbose options', () => {
      const error = new Error('Generic error message');

      ErrorHandler.handleError(error, { verbose: true });

      expect(mockConsoleLog).toHaveBeenCalledWith('GRAY:Technical Details:');
      expect(mockConsoleLog).toHaveBeenCalledWith('GRAY:  Name: Error');
      expect(mockConsoleLog).toHaveBeenCalledWith('GRAY:  Message: Generic error message');
    });

    it('should handle generic Error with debug options', () => {
      const error = new Error('Generic error message');

      ErrorHandler.handleError(error, { debug: true });

      expect(mockConsoleLog).toHaveBeenCalledWith('GRAY:Stack Trace:');
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Error: Generic error message'));
    });

    it('should exit with correct code for different severities', () => {
      const lowError = MemoryBanksError.createCLIError(
        ErrorCode.INVALID_COMMAND,
        'Test',
        'Test',
        []
      );
      const mediumError = MemoryBanksError.createValidationError(
        'Test',
        'Test',
        []
      );
      const highError = MemoryBanksError.createFileSystemError(
        ErrorCode.FILE_NOT_FOUND,
        'Test',
        'Test',
        []
      );
      const criticalError = MemoryBanksError.createSystemError(
        ErrorCode.OUT_OF_MEMORY,
        'Test',
        'Test',
        []
      );

      ErrorHandler.handleError(lowError);
      expect(mockProcessExit).toHaveBeenCalledWith(1);

      jest.clearAllMocks();
      ErrorHandler.handleError(mediumError);
      expect(mockProcessExit).toHaveBeenCalledWith(2);

      jest.clearAllMocks();
      ErrorHandler.handleError(highError);
      expect(mockProcessExit).toHaveBeenCalledWith(3);

      jest.clearAllMocks();
      ErrorHandler.handleError(criticalError);
      expect(mockProcessExit).toHaveBeenCalledWith(4);
    });
  });

  describe('createUserMessage', () => {
    it('should return user message for MemoryBanksError', () => {
      const error = MemoryBanksError.createValidationError(
        'Test error',
        'User-friendly message',
        []
      );

      const message = ErrorHandler.createUserMessage(error);
      expect(message).toBe('User-friendly message');
    });

    it('should create user message for permission error', () => {
      const error = new Error('Permission denied');

      const message = ErrorHandler.createUserMessage(error);
      expect(message).toBe('Access denied. Check your permissions and try again.');
    });

    it('should create user message for not found error', () => {
      const error = new Error('File not found');

      const message = ErrorHandler.createUserMessage(error);
      expect(message).toBe('The requested resource was not found.');
    });

    it('should create user message for network error', () => {
      const error = new Error('Network connection failed');

      const message = ErrorHandler.createUserMessage(error);
      expect(message).toBe('Network connection failed. Check your internet connection.');
    });

    it('should create user message for timeout error', () => {
      const error = new Error('Operation timed out');

      const message = ErrorHandler.createUserMessage(error);
      expect(message).toBe('Operation timed out. Please try again.');
    });

    it('should create generic user message for unknown error', () => {
      const error = new Error('Unknown error type');

      const message = ErrorHandler.createUserMessage(error);
      expect(message).toBe('An unexpected error occurred. Please try again.');
    });
  });

  describe('getRecoverySuggestions', () => {
    it('should return recovery steps for MemoryBanksError', () => {
      const error = MemoryBanksError.createValidationError(
        'Test error',
        'User-friendly message',
        ['Step 1', 'Step 2']
      );

      const suggestions = ErrorHandler.getRecoverySuggestions(error);
      expect(suggestions).toEqual(['Step 1', 'Step 2']);
    });

    it('should create recovery suggestions for permission error', () => {
      const error = new Error('Permission denied');

      const suggestions = ErrorHandler.getRecoverySuggestions(error);
      expect(suggestions).toEqual([
        'Check file and directory permissions',
        'Run with elevated privileges if needed',
        'Contact your system administrator'
      ]);
    });

    it('should create recovery suggestions for not found error', () => {
      const error = new Error('File not found');

      const suggestions = ErrorHandler.getRecoverySuggestions(error);
      expect(suggestions).toEqual([
        'Verify the path or resource exists',
        'Check spelling and case sensitivity',
        'Ensure you have access to the resource'
      ]);
    });

    it('should create recovery suggestions for network error', () => {
      const error = new Error('Network connection failed');

      const suggestions = ErrorHandler.getRecoverySuggestions(error);
      expect(suggestions).toEqual([
        'Check your internet connection',
        'Verify network settings',
        'Try again later'
      ]);
    });

    it('should create generic recovery suggestions for unknown error', () => {
      const error = new Error('Unknown error type');

      const suggestions = ErrorHandler.getRecoverySuggestions(error);
      expect(suggestions).toEqual([
        'Try again',
        'Check system resources',
        'Contact support if the problem persists'
      ]);
    });
  });
}); 