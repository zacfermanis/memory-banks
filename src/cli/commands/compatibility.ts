#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { CrossPlatformCompatibility } from '../../utils/crossPlatformCompatibility';
import { Logger } from '../../utils/logger';

export function compatibilityCommand(program: Command): void {
  program
    .command('compatibility')
    .description('Test cross-platform compatibility')
    .option(
      '-p, --platform <platform>',
      'Test specific platform (windows, macos, linux, all)'
    )
    .option('-v, --verbose', 'Enable verbose output')
    .option('-r, --report', 'Generate detailed compatibility report')
    .action(async options => {
      try {
        Logger.info('Starting cross-platform compatibility testing...');

        const platform = options.platform?.toLowerCase() || 'all';
        const verbose = options.verbose || false;
        const generateReport = options.report || false;

        if (verbose) {
          Logger.debug('Compatibility test options:', {
            platform,
            verbose,
            generateReport,
          });
        }

        let result;

        switch (platform) {
          case 'windows':
            Logger.info('Testing Windows compatibility...');
            result =
              await CrossPlatformCompatibility.testWindowsCompatibility();
            break;

          case 'macos':
            Logger.info('Testing macOS compatibility...');
            result = await CrossPlatformCompatibility.testMacOSCompatibility();
            break;

          case 'linux':
            Logger.info('Testing Linux compatibility...');
            result = await CrossPlatformCompatibility.testLinuxCompatibility();
            break;

          case 'all':
          default: {
            Logger.info('Testing all platform compatibility...');
            const report = await CrossPlatformCompatibility.testAllPlatforms();

            if (generateReport) {
              // eslint-disable-next-line no-console
              console.log(
                chalk.blue('\n📊 Cross-Platform Compatibility Report')
              );
              // eslint-disable-next-line no-console
              console.log(chalk.gray('='.repeat(50)));
              // eslint-disable-next-line no-console
              console.log(
                chalk.cyan(`Timestamp: ${report.timestamp.toISOString()}`)
              );
              // eslint-disable-next-line no-console
              console.log(
                chalk.cyan(
                  `Overall Compatibility: ${report.overall.compatible ? chalk.green('PASS') : chalk.red('FAIL')}`
                )
              );
              // eslint-disable-next-line no-console
              console.log(
                chalk.cyan(`Total Tests: ${report.overall.totalTests}`)
              );
              // eslint-disable-next-line no-console
              console.log(
                chalk.cyan(`Passed: ${chalk.green(report.overall.totalPassed)}`)
              );
              // eslint-disable-next-line no-console
              console.log(
                chalk.cyan(`Failed: ${chalk.red(report.overall.totalFailed)}`)
              );
              // eslint-disable-next-line no-console
              console.log(
                chalk.cyan(
                  `Critical Failures: ${chalk.red(report.overall.criticalFailures)}`
                )
              );

              // eslint-disable-next-line no-console
              console.log(chalk.blue('\n📋 Platform Results:'));
              Object.entries(report.platforms).forEach(
                ([platformName, platformResult]) => {
                  const status =
                    platformResult.summary.criticalFailed === 0
                      ? chalk.green('✅')
                      : chalk.red('❌');
                  // eslint-disable-next-line no-console
                  console.log(
                    `${status} ${chalk.cyan(platformName.toUpperCase())}: ${platformResult.summary.passed}/${platformResult.summary.total} tests passed`
                  );

                  if (verbose) {
                    Object.entries(platformResult.tests).forEach(
                      ([testName, test]) => {
                        const testStatus = test.passed
                          ? chalk.green('✓')
                          : chalk.red('✗');
                        // eslint-disable-next-line no-console
                        console.log(
                          `  ${testStatus} ${testName}: ${test.details} (${test.duration}ms)`
                        );
                        if (test.error) {
                          // eslint-disable-next-line no-console
                          console.log(
                            `    ${chalk.red('Error:')} ${test.error}`
                          );
                        }
                      }
                    );
                  }
                }
              );

              if (report.recommendations.length > 0) {
                // eslint-disable-next-line no-console
                console.log(chalk.blue('\n💡 Recommendations:'));
                report.recommendations.forEach((rec, index) => {
                  // eslint-disable-next-line no-console
                  console.log(`${index + 1}. ${rec}`);
                });
              }
            } else {
              // Simple summary
              const status = report.overall.compatible
                ? chalk.green('PASS')
                : chalk.red('FAIL');
              // eslint-disable-next-line no-console
              console.log(
                chalk.blue(`\nCross-Platform Compatibility: ${status}`)
              );
              // eslint-disable-next-line no-console
              console.log(
                chalk.gray(
                  `Tests: ${report.overall.totalPassed}/${report.overall.totalTests} passed`
                )
              );
              if (report.overall.criticalFailures > 0) {
                // eslint-disable-next-line no-console
                console.log(
                  chalk.red(
                    `Critical failures: ${report.overall.criticalFailures}`
                  )
                );
              }
            }

            return;
          }
        }

        if (result) {
          // Single platform result
          const status =
            result.summary.criticalFailed === 0
              ? chalk.green('PASS')
              : chalk.red('FAIL');
          // eslint-disable-next-line no-console
          console.log(
            chalk.blue(`\n${platform.toUpperCase()} Compatibility: ${status}`)
          );
          // eslint-disable-next-line no-console
          console.log(
            chalk.gray(
              `Tests: ${result.summary.passed}/${result.summary.total} passed`
            )
          );

          if (verbose) {
            Object.entries(result.tests).forEach(([testName, test]) => {
              const testStatus = test.passed
                ? chalk.green('✓')
                : chalk.red('✗');
              // eslint-disable-next-line no-console
              console.log(
                `  ${testStatus} ${testName}: ${test.details} (${test.duration}ms)`
              );
              if (test.error) {
                // eslint-disable-next-line no-console
                console.log(`    ${chalk.red('Error:')} ${test.error}`);
              }
            });
          }

          if (result.recommendations.length > 0) {
            // eslint-disable-next-line no-console
            console.log(chalk.blue('\n💡 Recommendations:'));
            result.recommendations.forEach((rec, index) => {
              // eslint-disable-next-line no-console
              console.log(`${index + 1}. ${rec}`);
            });
          }
        }

        Logger.info('Cross-platform compatibility testing completed');
      } catch (error) {
        Logger.error('Error during compatibility testing:', error);
        // eslint-disable-next-line no-console
        console.error(chalk.red('❌ Compatibility testing failed:'), error);
        process.exit(1);
      }
    });
}
