#!/usr/bin/env node
/* eslint-disable no-console */

import { Command } from 'commander';
import chalk from 'chalk';
import { version } from '../../package.json';
import { initCommand } from './commands/init';
import { helpCommand } from './commands/help';
import { compatibilityCommand } from './commands/compatibility';
import { Logger } from '../utils/logger';

const program = new Command();

// Global error handler
process.on('uncaughtException', error => {
  console.error(chalk.red('❌ Uncaught Exception:'), error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(
    chalk.red('❌ Unhandled Rejection at:'),
    promise,
    chalk.red('reason:'),
    reason
  );
  process.exit(1);
});

program
  .name('memory-banks')
  .description(
    'A CLI tool for creating and managing memory bank systems for AI agent collaboration'
  )
  .version(version, '-v, --version')
  .option('--verbose', 'Enable verbose output')
  .option('--quiet', 'Suppress non-error output')
  .option('--debug', 'Enable debug logging')
  .hook('preAction', thisCommand => {
    const options = thisCommand.opts();

    // Initialize logger with command options
    Logger.initialize({
      verbose: options['verbose'],
      debug: options['debug'],
      quiet: options['quiet'],
      timestamp: options['debug'],
      performance: options['debug'],
    });

    // Log system information in debug mode
    if (options['debug']) {
      Logger.systemInfo();
      Logger.memoryUsage();
    }
  });

// Register all commands
initCommand(program);
helpCommand(program);
compatibilityCommand(program);

// TODO: Register other commands when they are implemented
// listCommand(program);
// infoCommand(program);
// validateCommand(program);
// updateCommand(program);

// Global help handler
program.addHelpText(
  'after',
  `
Examples:
  $ memory-banks init                    # Interactive initialization
  $ memory-banks init --template typescript --yes  # Non-interactive
  $ memory-banks list                    # List available templates
  $ memory-banks info typescript         # Show template details
  $ memory-banks validate                # Validate current setup

For more information, visit: https://github.com/zacfermanis/memory-banks
`
);

// Parse command line arguments
program.parse();
