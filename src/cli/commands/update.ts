import { Command } from 'commander';
import chalk from 'chalk';
import { TemplateRegistry } from '../../services/templateRegistry';
import { TemplateRenderer } from '../../services/templateRenderer';
import { FileSystemUtils } from '../../utils/fileSystem';
import path from 'path';

export const updateCommand = (program: Command): void => {
  program
    .command('update')
    .description('Update existing memory bank files')
    .option('-t, --template <template>', 'Template to use for updates')
    .option('-f, --force', 'Overwrite existing files without confirmation')
    .option('--dry-run', 'Show what would be updated without making changes')
    .action(async (options: { template?: string; force?: boolean; dryRun?: boolean }) => {
      try {
        console.log(chalk.blue('🔄 Updating memory bank files...'));
        console.log('');

        const registry = new TemplateRegistry();
        const renderer = new TemplateRenderer();

        // Determine template to use
        let templateName = options.template;
        if (!templateName) {
          // Try to detect from existing setup
          const templates = await registry.listTemplates();
          if (templates.length === 1) {
            const firstTemplate = templates[0];
            if (firstTemplate) {
              templateName = firstTemplate.name;
              console.log(chalk.gray(`Using detected template: ${templateName}`));
            }
          } else if (templates.length > 1) {
            console.log(chalk.yellow('Multiple templates available. Please specify with --template:'));
            templates.forEach(t => console.log(chalk.gray(`  - ${t.name}`)));
            return;
          } else {
            console.log(chalk.red('No templates available. Run "memory-banks init" first.'));
            return;
          }
        }

        // Load template
        if (!templateName) {
          console.log(chalk.red('❌ No template specified and none detected.'));
          return;
        }
        const template = await registry.getTemplate(templateName);
        console.log(chalk.blue(`📋 Using template: ${template.name}`));

        // Check if memory bank exists
        const memoryBankPath = '.memory-bank';
        const exists = await FileSystemUtils.fileExists(memoryBankPath);
        
        if (!exists) {
          console.log(chalk.red('❌ No existing memory bank found.'));
          console.log(chalk.gray('Run "memory-banks init" to create a new memory bank.'));
          return;
        }

        // Get current configuration (simplified - in real implementation, you'd parse existing files)
        const currentConfig = {
          projectName: 'Current Project',
          projectType: 'Unknown',
          projectDescription: 'Project description',
          framework: 'None',
          buildTool: 'None'
        };

        if (options.dryRun) {
          console.log(chalk.yellow('🔍 DRY RUN - No files will be modified'));
          console.log('');
          console.log(chalk.blue('Files that would be updated:'));
          
          for (const file of template.files) {
            const filePath = path.join(memoryBankPath, file.path);
            const exists = await FileSystemUtils.fileExists(filePath);
            const status = exists ? chalk.yellow('(exists)') : chalk.green('(new)');
            console.log(`  ${filePath} ${status}`);
          }
          
          console.log('');
          console.log(chalk.gray('Run without --dry-run to apply changes'));
          return;
        }

        // Update files
        let updatedCount = 0;
        let createdCount = 0;

        for (const file of template.files) {
          const filePath = path.join(memoryBankPath, file.path);
          const exists = await FileSystemUtils.fileExists(filePath);
          
          if (exists && !options.force && !file.overwrite) {
            console.log(chalk.yellow(`⚠️  Skipping ${file.path} (use --force to overwrite)`));
            continue;
          }

          try {
            const renderedContent = await renderer.renderTemplate(file.content, currentConfig);
            await FileSystemUtils.safeWriteFile(filePath, renderedContent, options.force || file.overwrite || false);
            
            if (exists) {
              console.log(chalk.green(`✅ Updated ${file.path}`));
              updatedCount++;
            } else {
              console.log(chalk.green(`✅ Created ${file.path}`));
              createdCount++;
            }
          } catch (error) {
            console.log(chalk.red(`❌ Failed to update ${file.path}: ${error}`));
          }
        }

        console.log('');
        console.log(chalk.blue('📊 Update Summary:'));
        console.log(`  Files updated: ${updatedCount}`);
        console.log(`  Files created: ${createdCount}`);
        console.log('');
        console.log(chalk.green('🎉 Memory bank update completed!'));

      } catch (error) {
        console.error(chalk.red('❌ Failed to update memory bank:'), error);
        process.exit(1);
      }
    });
}; 