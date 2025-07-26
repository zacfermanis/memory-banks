import { Command } from 'commander';
import { TemplateRegistry } from '../../services/templateRegistry';
import { TemplateConfig } from '../../types';
import { Logger } from '../../utils/logger';

export const listCommand = (program: Command): void => {
  program
    .command('list')
    .description('List available templates')
    .option('-l, --language <language>', 'Filter by programming language')
    .option('-v, --verbose', 'Show detailed template information')
    .addHelpText(
      'after',
      `
Examples:
  $ memory-banks list                    # List all templates
  $ memory-banks list --language lua     # Filter by language
  $ memory-banks list --verbose          # Show detailed info

Troubleshooting:
  If no templates are found, check your template directory or run 'memory-banks init'.
  For more, run: memory-banks help list
    `
    )
    .action(async (options: { language?: string; verbose?: boolean }) => {
      try {
        Logger.initialize({ verbose: !!options.verbose });
        const registry = new TemplateRegistry();
        const templates = await registry.listTemplates(options.language);

        if (templates.length === 0) {
          Logger.warn('No templates found');
          if (options.language) {
            Logger.warn(
              `No templates available for language: ${options.language}`
            );
          }
          return;
        }

        Logger.info('Available Templates:');
        templates.forEach((template: TemplateConfig) => {
          Logger.info(`${template.name} (v${template.version})`);
          Logger.info(`  ${template.description}`);
          if (options.verbose) {
            if (template.options && template.options.length > 0) {
              Logger.debug(
                `    Options: ${template.options.length} configuration options`
              );
            }
            if (template.files && template.files.length > 0) {
              Logger.debug(
                `    Files: ${template.files.length} files will be created`
              );
            }
          }
        });
        Logger.info(`Total: ${templates.length} template(s)`);
        Logger.info('Use "memory-banks info <template-name>" for details');
        Logger.info(
          'Use "memory-banks init --template <template-name>" to initialize'
        );
      } catch (error) {
        Logger.error('Failed to list templates:', error);
        process.exit(1);
      }
    });
};
