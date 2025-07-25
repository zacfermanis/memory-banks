#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { version } from '../../package.json';
import { initCommand } from './commands/init';
import { listCommand } from './commands/list';
import { infoCommand } from './commands/info';
import { validateCommand } from './commands/validate';
import { updateCommand } from './commands/update';

const program = new Command();

// Global error handler
process.on('uncaughtException', (error) => {
  console.error(chalk.red('❌ Uncaught Exception:'), error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('❌ Unhandled Rejection at:'), promise, chalk.red('reason:'), reason);
  process.exit(1);
});

program
  .name('memory-banks')
  .description('A CLI tool for creating and managing memory bank systems for AI agent collaboration')
  .version(version, '-v, --version')
  .option('--verbose', 'Enable verbose output')
  .option('--quiet', 'Suppress non-error output')
  .option('--debug', 'Enable debug logging')
  .hook('preAction', (thisCommand) => {
    const options = thisCommand.opts();
    
    // Set global verbosity levels
    if (options['debug']) {
      process.env['DEBUG'] = 'true';
    }
    
    if (options['quiet']) {
      // Suppress console.log but keep console.error
      console.log = () => {};
    }
  });

// Register all commands
initCommand(program);
listCommand(program);
infoCommand(program);
validateCommand(program);
updateCommand(program);

// Global help handler
program.addHelpText('after', `
Examples:
  $ memory-banks init                    # Interactive initialization
  $ memory-banks init --template typescript --yes  # Non-interactive
  $ memory-banks list                    # List available templates
  $ memory-banks info typescript         # Show template details
  $ memory-banks validate                # Validate current setup

For more information, visit: https://github.com/yourusername/memory-banks
`);

// Parse command line arguments
program.parse(); 