import { Command } from 'commander';
import { TemplateRegistry } from '../../services/templateRegistry';
import { Logger } from '../../utils/logger';

export const infoCommand = (program: Command): void => {
  program
    .command('info <template-name>')
    .description('Show detailed template information')
    .addHelpText(
      'after',
      `
Examples:
  $ memory-banks info typescript         # Show info for typescript template

Troubleshooting:
  If the template is not found, run 'memory-banks list' to see available templates.
  For more, run: memory-banks help info
    `
    )
    .action(async (templateName: string) => {
      try {
        Logger.initialize();
        const registry = new TemplateRegistry();
        const template = await registry.getTemplate(templateName);
        Logger.info(`Template: ${template.name}`);
        Logger.debug(`Version: ${template.version}`);
        Logger.info(template.description);
        if (template.files && template.files.length > 0) {
          Logger.info('Files to be created:');
          template.files.forEach(file => {
            const overwrite = file.overwrite ? ' (overwrite)' : '';
            Logger.debug(`  ${file.path}${overwrite}`);
          });
        }
        if (template.options && template.options.length > 0) {
          Logger.info('Configuration Options:');
          template.options.forEach(option => {
            const required = option.required ? ' *required' : '';
            const defaultVal =
              option.default !== undefined ? ` = ${option.default}` : '';
            Logger.debug(
              `  ${option.name} (${option.type})${required}${defaultVal}`
            );
            Logger.debug(`    ${option.description}`);
            if (option.choices && option.choices.length > 0) {
              Logger.debug(`    Choices: ${option.choices.join(', ')}`);
            }
          });
        }
        Logger.info(
          `Use "memory-banks init --template ${template.name}" to initialize this template`
        );
      } catch (error) {
        Logger.error('Failed to get template information:', error);
        process.exit(1);
      }
    });
};
