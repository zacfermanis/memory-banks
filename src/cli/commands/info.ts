import { Command } from 'commander';
import chalk from 'chalk';
import { TemplateRegistry } from '../../services/templateRegistry';

export const infoCommand = (program: Command): void => {
  program
    .command('info <template-name>')
    .description('Show detailed template information')
    .action(async (templateName: string) => {
      try {
        const registry = new TemplateRegistry();
        const template = await registry.getTemplate(templateName);

        console.log(chalk.blue(`📋 Template: ${chalk.green(template.name)}`));
        console.log(chalk.gray(`Version: ${template.version}`));
        console.log('');
        console.log(chalk.white(template.description));
        console.log('');

        // Show files that will be created
        if (template.files && template.files.length > 0) {
          console.log(chalk.blue('📁 Files to be created:'));
          template.files.forEach((file) => {
            const path = chalk.cyan(file.path);
            const overwrite = file.overwrite ? chalk.yellow(' (overwrite)') : '';
            console.log(`  ${path}${overwrite}`);
          });
          console.log('');
        }

        // Show configuration options
        if (template.options && template.options.length > 0) {
          console.log(chalk.blue('⚙️  Configuration Options:'));
          template.options.forEach((option) => {
            const name = chalk.green(option.name);
            const type = chalk.gray(`(${option.type})`);
            const required = option.required ? chalk.red(' *required') : '';
            const defaultVal = option.default !== undefined ? chalk.gray(` = ${option.default}`) : '';
            
            console.log(`  ${name} ${type}${required}${defaultVal}`);
            console.log(`    ${option.description}`);
            
            if (option.choices && option.choices.length > 0) {
              const choices = option.choices.map(c => chalk.cyan(c)).join(', ');
              console.log(`    Choices: ${choices}`);
            }
            console.log('');
          });
        }

        console.log(chalk.gray('Use "memory-banks init --template ' + template.name + '" to initialize this template'));

      } catch (error) {
        console.error(chalk.red('❌ Failed to get template information:'), error);
        process.exit(1);
      }
    });
}; 