import { Command } from 'commander';
import { TemplateRegistry } from '../../services/templateRegistry';
import { TemplateRenderer } from '../../services/templateRenderer';
import { FileSystemUtils } from '../../utils/fileSystem';
import path from 'path';
import { Logger } from '../../utils/logger';

export const updateCommand = (program: Command): void => {
  program
    .command('update')
    .description('Update existing memory bank files')
    .option('-t, --template <template>', 'Template to use for updates')
    .option('-f, --force', 'Overwrite existing files without confirmation')
    .option('--dry-run', 'Show what would be updated without making changes')
    .addHelpText(
      'after',
      `
Examples:
  $ memory-banks update                  # Update using detected template
  $ memory-banks update --template lua   # Update with specific template
  $ memory-banks update --dry-run        # Preview updates

Troubleshooting:
  If no memory bank is found, run 'memory-banks init' first.
  For more, run: memory-banks help update
    `
    )
    .action(
      async (options: {
        template?: string;
        force?: boolean;
        dryRun?: boolean;
      }) => {
        try {
          Logger.initialize();
          Logger.info('Updating memory bank files...');
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
                Logger.info(`Using detected template: ${templateName}`);
              }
            } else if (templates.length > 1) {
              Logger.warn(
                'Multiple templates available. Please specify with --template:'
              );
              templates.forEach(t => Logger.info(`  - ${t.name}`));
              return;
            } else {
              Logger.error(
                'No templates available. Run "memory-banks init" first.'
              );
              return;
            }
          }

          // Load template
          if (!templateName) {
            Logger.error('No template specified and none detected.');
            return;
          }
          const template = await registry.getTemplate(templateName);
          Logger.info(`Using template: ${template.name}`);

          // Check if memory bank exists
          const memoryBankPath = '.memory-bank';
          const exists = await FileSystemUtils.fileExists(memoryBankPath);

          if (!exists) {
            Logger.error('No existing memory bank found.');
            Logger.info('Run "memory-banks init" to create a new memory bank.');
            return;
          }

          // Get current configuration (simplified - in real implementation, you'd parse existing files)
          const currentConfig = {
            projectName: 'Current Project',
            projectType: 'Unknown',
            projectDescription: 'Project description',
            framework: 'None',
            buildTool: 'None',
          };

          if (options.dryRun) {
            Logger.warn('DRY RUN - No files will be modified');
            console.log('');
            Logger.info('Files that would be updated:');

            for (const file of template.files) {
              const filePath = path.join(memoryBankPath, file.path);
              const exists = await FileSystemUtils.fileExists(filePath);
              const status = exists ? '(exists)' : '(new)';
              Logger.info(`  ${filePath} ${status}`);
            }

            console.log('');
            Logger.info('Run without --dry-run to apply changes');
            return;
          }

          // Update files
          let updatedCount = 0;
          let createdCount = 0;

          for (const file of template.files) {
            const filePath = path.join(memoryBankPath, file.path);
            const exists = await FileSystemUtils.fileExists(filePath);

            if (exists && !options.force && !file.overwrite) {
              Logger.warn(`Skipping ${file.path} (use --force to overwrite)`);
              continue;
            }

            try {
              const renderedContent = await renderer.renderTemplate(
                file.content,
                currentConfig
              );
              await FileSystemUtils.safeWriteFile(
                filePath,
                renderedContent,
                options.force || file.overwrite || false
              );

              if (exists) {
                Logger.info(`Updated ${file.path}`);
                updatedCount++;
              } else {
                Logger.info(`Created ${file.path}`);
                createdCount++;
              }
            } catch (error) {
              Logger.error(`Failed to update ${file.path}: ${error}`);
            }
          }

          console.log('');
          Logger.info('Update Summary:');
          Logger.info(`  Files updated: ${updatedCount}`);
          Logger.info(`  Files created: ${createdCount}`);
          console.log('');
          Logger.info('Memory bank update completed!');
        } catch (error) {
          Logger.error('Failed to update memory bank:', error);
          process.exit(1);
        }
      }
    );
};
