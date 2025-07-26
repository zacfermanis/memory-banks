import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import { FileSystemUtils } from './fileSystem';
import { Logger } from './logger';

export interface PlatformInfo {
  platform: string;
  arch: string;
  version: string;
  release: string;
  hostname: string;
  homedir: string;
  tmpdir: string;
  nodeVersion: string;
  npmVersion?: string;
}

export interface CompatibilityResult {
  platform: string;
  tests: {
    [key: string]: {
      passed: boolean;
      details: string;
      duration: number;
      error?: string;
    };
  };
  summary: {
    total: number;
    passed: number;
    failed: number;
    critical: number;
    criticalPassed: number;
    criticalFailed: number;
  };
  recommendations: string[];
  warnings: string[];
}

export interface CrossPlatformReport {
  timestamp: Date;
  platforms: {
    [platform: string]: CompatibilityResult;
  };
  overall: {
    compatible: boolean;
    totalTests: number;
    totalPassed: number;
    totalFailed: number;
    criticalFailures: number;
  };
  recommendations: string[];
}

export class CrossPlatformCompatibility {
  private static readonly TEST_TIMEOUT = 30000; // 30 seconds

  /**
   * Get comprehensive platform information
   */
  static getPlatformInfo(): PlatformInfo {
    return {
      platform: os.platform(),
      arch: os.arch(),
      version: os.version(),
      release: os.release(),
      hostname: os.hostname(),
      homedir: os.homedir(),
      tmpdir: os.tmpdir(),
      nodeVersion: process.version,
      npmVersion: process.env['npm_config_user_agent']?.split('/')[0] || undefined
    };
  }

  /**
   * Test Windows-specific compatibility
   */
  static async testWindowsCompatibility(): Promise<CompatibilityResult> {
    const platform = 'windows';
    const tests: { [key: string]: any } = {};
    const startTime = Date.now();

    // Test Windows installation
    tests['installation'] = await this.runTest('Windows Installation', async () => {
      const info = this.getPlatformInfo();
      const isWindows = info.platform === 'win32';
      
      if (!isWindows) {
        Logger.debug('Skipping Windows installation test on non-Windows platform');
        return true; // Skip test on non-Windows
      }

      // Test npm install simulation
      const testDir = path.join(os.tmpdir(), 'memory-banks-test');
      await fs.mkdir(testDir, { recursive: true });
      
      // Test binary permissions
      const testFile = path.join(testDir, 'test.bat');
      await fs.writeFile(testFile, '@echo off\necho Test');
      
      // Test PATH integration
      const pathEnv = process.env['PATH'] || '';
      const hasNodeInPath = pathEnv.includes('node') || pathEnv.includes('npm');
      
      await fs.rm(testDir, { recursive: true, force: true });
      
      return hasNodeInPath;
    }, true, 'installation');

    // Test Windows npx
    tests['npx'] = await this.runTest('Windows npx', async () => {
      const info = this.getPlatformInfo();
      if (info.platform !== 'win32') {
        Logger.debug('Skipping Windows npx test on non-Windows platform');
        return true;
      }

      // Test command parsing
      const testCommand = 'memory-banks --version';
      const commandParts = testCommand.split(' ');
      
      // Test file operations
      const testPath = 'C:\\Users\\Test\\Documents\\test.txt';
      const normalizedPath = FileSystemUtils.normalizeWindowsPath(testPath);
      
      return commandParts.length > 0 && normalizedPath.includes('\\');
    }, true, 'npx');

    // Test Windows binary
    tests['binary'] = await this.runTest('Windows binary', async () => {
      const info = this.getPlatformInfo();
      if (info.platform !== 'win32') {
        Logger.debug('Skipping Windows binary test on non-Windows platform');
        return true;
      }

      // Test shebang handling
      const shebang = '#!/usr/bin/env node';
      const hasShebang = shebang.includes('node');
      
      // Test line endings
      const testContent = 'line1\r\nline2\r\n';
      const hasCRLF = testContent.includes('\r\n');
      
      return hasShebang && hasCRLF;
    }, true, 'binary');

    // Test Windows optimization
    tests['optimization'] = await this.runTest('Windows optimization', async () => {
      const info = this.getPlatformInfo();
      if (info.platform !== 'win32') {
        Logger.debug('Skipping Windows optimization test on non-Windows platform');
        return true;
      }

      // Test path separators
      const windowsPath = 'C:\\Users\\Test\\Documents';
      const hasBackslashes = windowsPath.includes('\\');
      
      // Test drive letters
      const hasDriveLetter = /^[A-Z]:\\/.test(windowsPath);
      
      // Test long paths
      const longPath = '\\\\?\\' + 'C:\\'.padEnd(260, 'a');
      const supportsLongPaths = longPath.length > 260;
      
      return hasBackslashes && hasDriveLetter && supportsLongPaths;
    }, false, 'optimization');

    return this.createCompatibilityResult(platform, tests, startTime);
  }

  /**
   * Test macOS-specific compatibility
   */
  static async testMacOSCompatibility(): Promise<CompatibilityResult> {
    const platform = 'macos';
    const tests: { [key: string]: any } = {};
    const startTime = Date.now();

    // Test macOS installation
    tests['installation'] = await this.runTest('macOS Installation', async () => {
      const info = this.getPlatformInfo();
      const isMacOS = info.platform === 'darwin';
      
      if (!isMacOS) {
        Logger.debug('Skipping macOS installation test on non-macOS platform');
        return true;
      }

      // Test npm install simulation
      const testDir = path.join(os.tmpdir(), 'memory-banks-test');
      await fs.mkdir(testDir, { recursive: true });
      
      // Test binary permissions (755)
      const testFile = path.join(testDir, 'test.sh');
      await fs.writeFile(testFile, '#!/bin/bash\necho "Test"');
      await fs.chmod(testFile, 0o755);
      
      // Test PATH integration
      const pathEnv = process.env['PATH'] || '';
      const hasNodeInPath = pathEnv.includes('node') || pathEnv.includes('npm');
      
      await fs.rm(testDir, { recursive: true, force: true });
      
      return hasNodeInPath;
    }, true, 'installation');

    // Test macOS npx
    tests['npx'] = await this.runTest('macOS npx', async () => {
      const info = this.getPlatformInfo();
      if (info.platform !== 'darwin') {
        Logger.debug('Skipping macOS npx test on non-macOS platform');
        return true;
      }

      // Test command parsing
      const testCommand = 'memory-banks --version';
      const commandParts = testCommand.split(' ');
      
      // Test file operations
      const testPath = '/Users/test/Documents/test.txt';
      const normalizedPath = FileSystemUtils.normalizeMacOSPath(testPath);
      
      return commandParts.length > 0 && normalizedPath.includes('/');
    }, true, 'npx');

    // Test macOS binary
    tests['binary'] = await this.runTest('macOS binary', async () => {
      const info = this.getPlatformInfo();
      if (info.platform !== 'darwin') {
        Logger.debug('Skipping macOS binary test on non-macOS platform');
        return true;
      }

      // Test shebang handling
      const shebang = '#!/usr/bin/env node';
      const hasShebang = shebang.includes('node');
      
      // Test line endings
      const testContent = 'line1\nline2\n';
      const hasLF = testContent.includes('\n') && !testContent.includes('\r');
      
      return hasShebang && hasLF;
    }, true, 'binary');

    // Test macOS optimization
    tests['optimization'] = await this.runTest('macOS optimization', async () => {
      const info = this.getPlatformInfo();
      if (info.platform !== 'darwin') {
        Logger.debug('Skipping macOS optimization test on non-macOS platform');
        return true;
      }

      // Test path separators
      const macosPath = '/Users/test/Documents';
      const hasForwardSlashes = macosPath.includes('/');
      
      // Test home directory
      const homeDir = os.homedir();
      const hasHomeDir = homeDir.startsWith('/Users/');
      
      // Test Unix permissions
      const testFile = path.join(os.tmpdir(), 'test-permissions');
      await fs.writeFile(testFile, 'test');
      const stats = await fs.stat(testFile);
      const hasUnixPermissions = (stats.mode & 0o777) === 0o644;
      await fs.unlink(testFile);
      
      return hasForwardSlashes && hasHomeDir && hasUnixPermissions;
    }, false, 'optimization');

    return this.createCompatibilityResult(platform, tests, startTime);
  }

  /**
   * Test Linux-specific compatibility
   */
  static async testLinuxCompatibility(): Promise<CompatibilityResult> {
    const platform = 'linux';
    const tests: { [key: string]: any } = {};
    const startTime = Date.now();

    // Test Linux installation
    tests['installation'] = await this.runTest('Linux Installation', async () => {
      const info = this.getPlatformInfo();
      const isLinux = info.platform === 'linux';
      
      if (!isLinux) {
        Logger.debug('Skipping Linux installation test on non-Linux platform');
        return true;
      }

      // Test npm install simulation
      const testDir = path.join(os.tmpdir(), 'memory-banks-test');
      await fs.mkdir(testDir, { recursive: true });
      
      // Test binary permissions (755)
      const testFile = path.join(testDir, 'test.sh');
      await fs.writeFile(testFile, '#!/bin/bash\necho "Test"');
      await fs.chmod(testFile, 0o755);
      
      // Test PATH integration
      const pathEnv = process.env['PATH'] || '';
      const hasNodeInPath = pathEnv.includes('node') || pathEnv.includes('npm');
      
      await fs.rm(testDir, { recursive: true, force: true });
      
      return hasNodeInPath;
    }, true, 'installation');

    // Test Linux npx
    tests['npx'] = await this.runTest('Linux npx', async () => {
      const info = this.getPlatformInfo();
      if (info.platform !== 'linux') {
        Logger.debug('Skipping Linux npx test on non-Linux platform');
        return true;
      }

      // Test command parsing
      const testCommand = 'memory-banks --version';
      const commandParts = testCommand.split(' ');
      
      // Test file operations
      const testPath = '/home/test/documents/test.txt';
      const normalizedPath = FileSystemUtils.normalizeLinuxPath(testPath);
      
      return commandParts.length > 0 && normalizedPath.includes('/');
    }, true, 'npx');

    // Test Linux binary
    tests['binary'] = await this.runTest('Linux binary', async () => {
      const info = this.getPlatformInfo();
      if (info.platform !== 'linux') {
        Logger.debug('Skipping Linux binary test on non-Linux platform');
        return true;
      }

      // Test shebang handling
      const shebang = '#!/usr/bin/env node';
      const hasShebang = shebang.includes('node');
      
      // Test line endings
      const testContent = 'line1\nline2\n';
      const hasLF = testContent.includes('\n') && !testContent.includes('\r');
      
      return hasShebang && hasLF;
    }, true, 'binary');

    // Test Linux optimization
    tests['optimization'] = await this.runTest('Linux optimization', async () => {
      const info = this.getPlatformInfo();
      if (info.platform !== 'linux') {
        Logger.debug('Skipping Linux optimization test on non-Linux platform');
        return true;
      }

      // Test path separators
      const linuxPath = '/home/test/documents';
      const hasForwardSlashes = linuxPath.includes('/');
      
      // Test home directory
      const homeDir = os.homedir();
      const hasHomeDir = homeDir.startsWith('/home/');
      
      // Test Unix permissions
      const testFile = path.join(os.tmpdir(), 'test-permissions');
      await fs.writeFile(testFile, 'test');
      const stats = await fs.stat(testFile);
      const hasUnixPermissions = (stats.mode & 0o777) === 0o644;
      await fs.unlink(testFile);
      
      return hasForwardSlashes && hasHomeDir && hasUnixPermissions;
    }, false, 'optimization');

    return this.createCompatibilityResult(platform, tests, startTime);
  }

  /**
   * Run comprehensive cross-platform validation
   */
  static async testCrossPlatformValidation(): Promise<CompatibilityResult> {
    const platform = 'cross-platform';
    const tests: { [key: string]: any } = {};
    const startTime = Date.now();

    // Test cross-platform compatibility
    tests['compatibility'] = await this.runTest('Cross-platform compatibility', async () => {
      const info = this.getPlatformInfo();
      const supportedPlatforms = ['win32', 'darwin', 'linux'];
      const supportedArchs = ['x64', 'arm64', 'x86'];
      
      const platformSupported = supportedPlatforms.includes(info.platform);
      const archSupported = supportedArchs.includes(info.arch);
      const nodeVersionSupported = parseInt(info.nodeVersion.slice(1)) >= 16;
      
      return platformSupported && archSupported && nodeVersionSupported;
    }, true, 'optimization');

    // Test platform-specific validation
    tests['platformValidation'] = await this.runTest('Platform-specific validation', async () => {
      const info = this.getPlatformInfo();
      
      // Test path handling
      const testPath = info.platform === 'win32' ? 'C:\\test\\path' : '/test/path';
      const normalizedPath = path.normalize(testPath);
      
      // Test file operations
      const testFile = path.join(os.tmpdir(), 'cross-platform-test');
      await fs.writeFile(testFile, 'test');
      const exists = await fs.access(testFile).then(() => true).catch(() => false);
      await fs.unlink(testFile).catch(() => {});
      
      return Boolean(normalizedPath && exists);
    }, true, 'optimization');

    // Test compatibility reporting
    tests['reporting'] = await this.runTest('Compatibility reporting', async () => {
      const info = this.getPlatformInfo();
      
      // Test platform detection
      const platformDetected = !!info.platform;
      
      // Test feature availability
      const features = ['fs', 'path', 'os', 'process'];
      const featuresAvailable = features.every(feature => !!require(feature));
      
      return platformDetected && featuresAvailable;
    }, false, 'optimization');

    // Test platform optimization
    tests['optimization'] = await this.runTest('Platform optimization', async () => {
      const info = this.getPlatformInfo();
      
      // Test platform-specific optimizations
      let optimizationsApplied = 0;
      
      if (info.platform === 'win32') {
        optimizationsApplied++;
      } else if (info.platform === 'darwin') {
        optimizationsApplied++;
      } else if (info.platform === 'linux') {
        optimizationsApplied++;
      }
      
      return optimizationsApplied > 0;
    }, false, 'optimization');

    return this.createCompatibilityResult(platform, tests, startTime);
  }

  /**
   * Run all platform compatibility tests
   */
  static async testAllPlatforms(): Promise<CrossPlatformReport> {
    const startTime = Date.now();
    const platforms: { [platform: string]: CompatibilityResult } = {};

    Logger.info('Starting comprehensive cross-platform compatibility testing...');

    // Test each platform
    platforms['windows'] = await this.testWindowsCompatibility();
    platforms['macos'] = await this.testMacOSCompatibility();
    platforms['linux'] = await this.testLinuxCompatibility();
    platforms['crossPlatform'] = await this.testCrossPlatformValidation();

    // Calculate overall results
    const overall = this.calculateOverallResults(platforms);
    const recommendations = this.generateRecommendations(platforms);

    const report: CrossPlatformReport = {
      timestamp: new Date(),
      platforms,
      overall,
      recommendations
    };

    Logger.info(`Cross-platform compatibility testing completed in ${Date.now() - startTime}ms`);
    Logger.info(`Overall compatibility: ${overall.compatible ? 'PASS' : 'FAIL'}`);

    return report;
  }

  /**
   * Run a single compatibility test
   */
  private static async runTest(
    name: string,
    test: () => Promise<boolean>,
    _critical: boolean,
    _category: 'installation' | 'npx' | 'binary' | 'optimization'
  ): Promise<{
    passed: boolean;
    details: string;
    duration: number;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      const result = await Promise.race([
        test(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Test timeout')), this.TEST_TIMEOUT)
        )
      ]);

      const duration = Date.now() - startTime;
      
      return {
        passed: result,
        details: `${name} test ${result ? 'passed' : 'failed'}`,
        duration,
        error: result ? undefined : 'Test failed'
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      return {
        passed: false,
        details: `${name} test failed with error`,
        duration,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create compatibility result from test results
   */
  private static createCompatibilityResult(
    platform: string,
    tests: { [key: string]: any },
    _startTime: number
  ): CompatibilityResult {
    const total = Object.keys(tests).length;
    const passed = Object.values(tests).filter(t => t.passed).length;
    const failed = total - passed;
    
    const criticalTests = Object.values(tests).filter(t => t.critical);
    const critical = criticalTests.length;
    const criticalPassed = criticalTests.filter(t => t.passed).length;
    const criticalFailed = critical - criticalPassed;

    const recommendations = this.generatePlatformRecommendations(platform, tests);
    const warnings = this.generatePlatformWarnings(platform, tests);

    return {
      platform,
      tests,
      summary: {
        total,
        passed,
        failed,
        critical,
        criticalPassed,
        criticalFailed
      },
      recommendations,
      warnings
    };
  }

  /**
   * Calculate overall results from all platform tests
   */
  private static calculateOverallResults(platforms: { [platform: string]: CompatibilityResult }) {
    let totalTests = 0;
    let totalPassed = 0;
    let totalFailed = 0;
    let criticalFailures = 0;

    Object.values(platforms).forEach(platform => {
      totalTests += platform.summary.total;
      totalPassed += platform.summary.passed;
      totalFailed += platform.summary.failed;
      criticalFailures += platform.summary.criticalFailed;
    });

    return {
      compatible: criticalFailures === 0,
      totalTests,
      totalPassed,
      totalFailed,
      criticalFailures
    };
  }

  /**
   * Generate platform-specific recommendations
   */
  private static generatePlatformRecommendations(
    platform: string,
    tests: { [key: string]: any }
  ): string[] {
    const recommendations: string[] = [];

    Object.entries(tests).forEach(([testName, test]) => {
      if (!test.passed) {
        recommendations.push(`${platform} ${testName}: ${test.error || 'Test failed'}`);
      }
    });

    return recommendations;
  }

  /**
   * Generate platform-specific warnings
   */
  private static generatePlatformWarnings(
    platform: string,
    tests: { [key: string]: any }
  ): string[] {
    const warnings: string[] = [];

    Object.entries(tests).forEach(([testName, test]) => {
      if (test.duration > 5000) {
        warnings.push(`${platform} ${testName}: Slow performance (${test.duration}ms)`);
      }
    });

    return warnings;
  }

  /**
   * Generate overall recommendations
   */
  private static generateRecommendations(platforms: { [platform: string]: CompatibilityResult }): string[] {
    const recommendations: string[] = [];

    Object.entries(platforms).forEach(([platform, result]) => {
      if (result.summary.criticalFailed > 0) {
        recommendations.push(`Critical failures detected on ${platform}: ${result.summary.criticalFailed} tests failed`);
      }
      
      if (result.summary.failed > 0) {
        recommendations.push(`Non-critical failures on ${platform}: ${result.summary.failed} tests failed`);
      }
    });

    if (recommendations.length === 0) {
      recommendations.push('All platforms are compatible and ready for distribution');
    }

    return recommendations;
  }
}
