import { Command } from 'commander';
import { HelpSystem } from '../../utils/helpSystem';
import { Logger } from '../../utils/logger';

export const helpCommand = (program: Command): void => {
  program
    .command('help')
    .description('Show comprehensive help information')
    .argument(
      '[topic]',
      'Help topic to display (getting-started, templates, configuration, validation, troubleshooting)'
    )
    .option('-i, --interactive', 'Start interactive help mode')
    .option('-c, --command <command>', 'Show help for specific command')
    .action(async (topic, options) => {
      try {
        if (options.interactive) {
          await HelpSystem.displayInteractiveHelp();
          return;
        }

        if (options.command) {
          const command = program.commands.find(
            cmd => cmd.name() === options.command
          );
          if (command) {
            HelpSystem.displayCommandHelp(command);
          } else {
            Logger.error(`Command '${options.command}' not found.`);
            Logger.warn('Available commands:');
            program.commands.forEach(cmd => {
              Logger.info(`  - ${cmd.name()}`);
            });
          }
          return;
        }

        if (topic) {
          HelpSystem.displayTopicHelp(topic);
        } else {
          // Show general help overview
          Logger.info('🎯 Memory Banks CLI Help');
          console.log('='.repeat(60));
          console.log('');
          Logger.info(
            'Memory Banks is a CLI tool for creating and managing memory bank systems for AI agent collaboration.'
          );
          console.log('');

          Logger.info('📋 Quick Commands:');
          Logger.info(
            '  memory-banks init                    # Start a new project'
          );
          Logger.info(
            '  memory-banks list                    # List available templates'
          );
          Logger.info(
            '  memory-banks validate                # Validate your setup'
          );
          Logger.info(
            '  memory-banks help <topic>            # Get help on specific topics'
          );
          console.log('');

          Logger.info('📚 Help Topics:');
          Logger.info(
            '  memory-banks help getting-started    # Quick start guide'
          );
          Logger.info(
            '  memory-banks help templates          # Working with templates'
          );
          Logger.info(
            '  memory-banks help configuration      # Configuration management'
          );
          Logger.info(
            '  memory-banks help validation         # Validation and quality assurance'
          );
          Logger.info(
            '  memory-banks help troubleshooting    # Common issues and solutions'
          );
          console.log('');

          Logger.info('🔧 Command Help:');
          Logger.info(
            '  memory-banks help --command init     # Help for init command'
          );
          Logger.info(
            '  memory-banks help --command list     # Help for list command'
          );
          Logger.info(
            '  memory-banks help --command validate # Help for validate command'
          );
          console.log('');

          Logger.info('🎯 Interactive Help:');
          Logger.info(
            '  memory-banks help --interactive      # Start interactive help mode'
          );
          console.log('');

          Logger.warn(
            'For more detailed information, visit: https://github.com/zacfermanis/memory-banks'
          );
        }
      } catch (error) {
        Logger.error('Error displaying help:', error);
        process.exit(1);
      }
    });
};
