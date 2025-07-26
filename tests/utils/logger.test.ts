import { Logger, LogLevel, ProgressIndicator } from '../../src/utils/logger';

// Mock chalk
jest.mock('chalk', () => ({
  red: jest.fn((text: string) => `RED:${text}`),
  yellow: jest.fn((text: string) => `YELLOW:${text}`),
  blue: jest.fn((text: string) => `BLUE:${text}`),
  gray: jest.fn((text: string) => `GRAY:${text}`),
  green: jest.fn((text: string) => `GREEN:${text}`)
}));

describe('Logger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Logger.initialize();
  });

  describe('initialize', () => {
    it('should set log level to ERROR when quiet is true', () => {
      Logger.initialize({ quiet: true });
      expect(Logger.getLevel()).toBe(LogLevel.ERROR);
    });

    it('should set log level to TRACE when debug is true', () => {
      Logger.initialize({ debug: true });
      expect(Logger.getLevel()).toBe(LogLevel.TRACE);
    });

    it('should set log level to DEBUG when verbose is true', () => {
      Logger.initialize({ verbose: true });
      expect(Logger.getLevel()).toBe(LogLevel.DEBUG);
    });

    it('should set log level to INFO by default', () => {
      Logger.initialize();
      expect(Logger.getLevel()).toBe(LogLevel.INFO);
    });
  });

  describe('log levels', () => {
    it('should log error messages', () => {
      const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
      Logger.initialize({ quiet: true }); // Only errors should show

      Logger.error('Test error message');

      expect(mockConsoleLog).toHaveBeenCalledWith('RED:❌ ERROR: Test error message');
    });

    it('should log warning messages when level allows', () => {
      const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
      Logger.initialize({ level: LogLevel.WARN });

      Logger.warn('Test warning message');

      expect(mockConsoleLog).toHaveBeenCalledWith('YELLOW:⚠️  WARN: Test warning message');
    });

    it('should not log warning messages when level is too low', () => {
      const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
      Logger.initialize({ level: LogLevel.ERROR });

      Logger.warn('Test warning message');

      expect(mockConsoleLog).not.toHaveBeenCalled();
    });

    it('should log info messages when level allows', () => {
      const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
      Logger.initialize({ level: LogLevel.INFO });

      Logger.info('Test info message');

      expect(mockConsoleLog).toHaveBeenCalledWith('BLUE:ℹ️  INFO: Test info message');
    });

    it('should log debug messages when level allows', () => {
      const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
      Logger.initialize({ level: LogLevel.DEBUG });

      Logger.debug('Test debug message');

      expect(mockConsoleLog).toHaveBeenCalledWith('GRAY:🐛 DEBUG: Test debug message');
    });

    it('should log trace messages when level allows', () => {
      const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
      Logger.initialize({ level: LogLevel.TRACE });

      Logger.trace('Test trace message');

      expect(mockConsoleLog).toHaveBeenCalledWith('GRAY:🔍 TRACE: Test trace message');
    });

    it('should log success messages', () => {
      const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
      Logger.initialize({ level: LogLevel.INFO });

      Logger.success('Test success message');

      expect(mockConsoleLog).toHaveBeenCalledWith('GREEN:✅ SUCCESS: Test success message');
    });
  });

  describe('performance timing', () => {
    it('should start and end timer correctly', async () => {
      const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
      Logger.initialize({ performance: true });

      Logger.startTimer('test-timer');
      // Add a small delay to ensure non-zero duration
      await new Promise(resolve => setTimeout(resolve, 10));
      const duration = Logger.endTimer('test-timer');

      expect(duration).toBeGreaterThan(0);
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Started timer: test-timer'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Timer test-timer:'));
    });

    it('should return null when timer does not exist', () => {
      Logger.initialize({ performance: true });

      const duration = Logger.endTimer('non-existent-timer');

      expect(duration).toBeNull();
    });

    it('should log performance information', () => {
      const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
      Logger.initialize({ performance: true });

      Logger.performance('test-operation', 150, { files: 5, size: '1MB' });

      expect(mockConsoleLog).toHaveBeenCalledWith('BLUE:⏱️  PERF:', expect.stringContaining('test-operation took'));
      expect(mockConsoleLog).toHaveBeenCalledWith('GRAY:    Details: files: 5');
      expect(mockConsoleLog).toHaveBeenCalledWith('GRAY:    Details: size: 1MB');
    });
  });

  describe('system information', () => {
    it('should log system info in debug mode', () => {
      const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
      Logger.initialize({ level: LogLevel.DEBUG });

      Logger.systemInfo();

      expect(mockConsoleLog).toHaveBeenCalledWith('GRAY:🐛 DEBUG:', 'System Information:', expect.any(Object));
    });

    it('should not log system info when debug is disabled', () => {
      const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
      Logger.initialize({ level: LogLevel.INFO });

      Logger.systemInfo();

      expect(mockConsoleLog).not.toHaveBeenCalled();
    });
  });

  describe('memory usage', () => {
    it('should log memory usage in performance mode', () => {
      const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
      Logger.initialize({ performance: true });

      Logger.memoryUsage();

      expect(mockConsoleLog).toHaveBeenCalledWith('GRAY:🐛 DEBUG:', 'Memory Usage:', expect.any(Object));
    });

    it('should not log memory usage when performance is disabled', () => {
      const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
      Logger.initialize({ performance: false });

      Logger.memoryUsage();

      expect(mockConsoleLog).not.toHaveBeenCalled();
    });
  });

  describe('file operations', () => {
    it('should log file operations in debug mode', () => {
      const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
      Logger.initialize({ level: LogLevel.DEBUG });

      Logger.fileOperation('read', '/path/to/file', true, { size: 1024 });

      expect(mockConsoleLog).toHaveBeenCalledWith('GRAY:🐛 DEBUG:', '📖 READ: GREEN:✓ /path/to/file');
      expect(mockConsoleLog).toHaveBeenCalledWith('GRAY:🐛 DEBUG:', '  Details:', { size: 1024 });
    });

    it('should log failed file operations', () => {
      const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
      Logger.initialize({ level: LogLevel.DEBUG });

      Logger.fileOperation('write', '/path/to/file', false, { error: 'Permission denied' });

      expect(mockConsoleLog).toHaveBeenCalledWith('GRAY:🐛 DEBUG:', '📝 WRITE: RED:✗ /path/to/file');
    });
  });

  describe('template operations', () => {
    it('should log template operations in debug mode', () => {
      const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
      Logger.initialize({ level: LogLevel.DEBUG });

      Logger.templateOperation('load', 'typescript', { version: '1.0.0' });

      expect(mockConsoleLog).toHaveBeenCalledWith('GRAY:🐛 DEBUG:', '📋 Template load: typescript');
      expect(mockConsoleLog).toHaveBeenCalledWith('GRAY:🐛 DEBUG:', '  Details:', { version: '1.0.0' });
    });
  });

  describe('validation', () => {
    it('should log successful validation', () => {
      const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
      Logger.initialize({ level: LogLevel.DEBUG });

      Logger.validation('project-name', { isValid: true, warnings: ['Minor issue'] });

      expect(mockConsoleLog).toHaveBeenCalledWith('GRAY:🐛 DEBUG:', '🔍 Validation project-name: GREEN:✓');
      expect(mockConsoleLog).toHaveBeenCalledWith('GRAY:🐛 DEBUG:', '  Warnings:', ['Minor issue']);
    });

    it('should log failed validation', () => {
      const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
      Logger.initialize({ level: LogLevel.DEBUG });

      Logger.validation('template-id', { isValid: false, errors: ['Invalid format'] });

      expect(mockConsoleLog).toHaveBeenCalledWith('GRAY:🐛 DEBUG:', '🔍 Validation template-id: RED:✗');
      expect(mockConsoleLog).toHaveBeenCalledWith('GRAY:🐛 DEBUG:', '  Errors:', ['Invalid format']);
    });
  });

  describe('createProgress', () => {
    it('should create progress indicator', () => {
      const progress = Logger.createProgress(10, 'Test Progress');

      expect(progress).toBeInstanceOf(ProgressIndicator);
    });
  });

  describe('utility methods', () => {
    it('should check if debug is enabled', () => {
      Logger.initialize({ level: LogLevel.DEBUG });
      expect(Logger.isDebugEnabled()).toBe(true);

      Logger.initialize({ level: LogLevel.INFO });
      expect(Logger.isDebugEnabled()).toBe(false);
    });

    it('should check if trace is enabled', () => {
      Logger.initialize({ level: LogLevel.TRACE });
      expect(Logger.isTraceEnabled()).toBe(true);

      Logger.initialize({ level: LogLevel.DEBUG });
      expect(Logger.isTraceEnabled()).toBe(false);
    });
  });
});

describe('ProgressIndicator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create progress indicator with correct properties', () => {
    const progress = new ProgressIndicator(100, 'Test Progress');

    expect(progress).toBeInstanceOf(ProgressIndicator);
  });

  it('should update progress correctly', () => {
    const mockStdoutWrite = jest.spyOn(process.stdout, 'write').mockImplementation();
    const progress = new ProgressIndicator(10, 'Test Progress');

    progress.update(5);

    expect(mockStdoutWrite).toHaveBeenCalledWith(expect.stringContaining('50%'));
  });

  it('should complete progress', () => {
    const mockStdoutWrite = jest.spyOn(process.stdout, 'write').mockImplementation();
    const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
    const progress = new ProgressIndicator(10, 'Test Progress');

    progress.complete();

    expect(mockStdoutWrite).toHaveBeenCalledWith(expect.stringContaining('100%'));
    expect(mockConsoleLog).toHaveBeenCalledWith(''); // New line
  });

  it('should not exceed total progress', () => {
    const mockStdoutWrite = jest.spyOn(process.stdout, 'write').mockImplementation();
    const progress = new ProgressIndicator(10, 'Test Progress');

    progress.update(15); // Try to exceed total

    expect(mockStdoutWrite).toHaveBeenCalledWith(expect.stringContaining('100%'));
  });
}); 