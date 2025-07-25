import { Command } from 'commander';
import chalk from 'chalk';
import { TemplateRegistry } from '../../services/templateRegistry';
import { TemplateConfig } from '../../types';

export const listCommand = (program: Command): void => {
  program
    .command('list')
    .description('List available templates')
    .option('-l, --language <language>', 'Filter by programming language')
    .option('-v, --verbose', 'Show detailed template information')
    .action(async (options: { language?: string; verbose?: boolean }) => {
      try {
        const registry = new TemplateRegistry();
        const templates = await registry.listTemplates(options.language);

        if (templates.length === 0) {
          console.log(chalk.yellow('📝 No templates found'));
          if (options.language) {
            console.log(chalk.yellow(`   No templates available for language: ${options.language}`));
          }
          return;
        }

        console.log(chalk.blue('📋 Available Templates:'));
        console.log('');

        templates.forEach((template: TemplateConfig) => {
          const name = chalk.green(template.name);
          const description = template.description;
          const version = chalk.gray(`(v${template.version})`);
          
          console.log(`  ${name} ${version}`);
          console.log(`    ${description}`);
          
          if (options.verbose) {
            if (template.options && template.options.length > 0) {
              console.log(chalk.gray(`    Options: ${template.options.length} configuration options`));
            }
            if (template.files && template.files.length > 0) {
              console.log(chalk.gray(`    Files: ${template.files.length} files will be created`));
            }
          }
          console.log('');
        });

        console.log(chalk.blue(`Total: ${templates.length} template(s)`));
        console.log('');
        console.log(chalk.gray('Use "memory-banks info <template-name>" for detailed information'));
        console.log(chalk.gray('Use "memory-banks init --template <template-name>" to initialize'));

      } catch (error) {
        console.error(chalk.red('❌ Failed to list templates:'), error);
        process.exit(1);
      }
    });
}; 