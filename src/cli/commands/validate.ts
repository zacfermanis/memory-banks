import { Command } from 'commander';
import { promises as fs } from 'fs';
import path from 'path';
import { Logger } from '../../utils/logger';

export const validateCommand = (program: Command): void => {
  program
    .command('validate')
    .description('Validate current memory bank setup')
    .option('-v, --verbose', 'Show detailed validation information')
    .addHelpText(
      'after',
      `
Examples:
  $ memory-banks validate                # Basic validation
  $ memory-banks validate --verbose      # Detailed validation

Troubleshooting:
  If files are missing, run 'memory-banks init' to set up a complete memory bank system.
  For more, run: memory-banks help validate
    `
    )
    .action(async (options: { verbose?: boolean }) => {
      try {
        Logger.initialize({ verbose: !!options.verbose });
        Logger.info('Validating memory bank setup...');
        console.log('');

        const memoryBankPath = path.join(process.cwd(), '.memory-bank');
        const requiredFiles = [
          'projectBrief.md',
          'productContext.md',
          'systemPatterns.md',
          'techContext.md',
          'activeContext.md',
          'progress.md',
        ];

        let isValid = true;
        let fileCount = 0;

        // Check if .memory-bank directory exists
        try {
          await fs.access(memoryBankPath);
          Logger.success('✅ .memory-bank directory found');
          fileCount++;
        } catch {
          Logger.warn('❌ .memory-bank directory not found');
          isValid = false;
        }

        // Check each required file
        for (const file of requiredFiles) {
          const filePath = path.join(memoryBankPath, file);
          try {
            await fs.access(filePath);
            const stats = await fs.stat(filePath);
            const size = stats.size;

            if (size > 0) {
              Logger.success(`✅ ${file} (${size} bytes)`);
              fileCount++;
            } else {
              Logger.warn(`⚠️  ${file} (empty file)`);
              isValid = false;
            }
          } catch {
            Logger.error(`❌ ${file} (missing)`);
            isValid = false;
          }
        }

        console.log('');
        Logger.info('📊 Validation Summary:');
        Logger.info(`  Files found: ${fileCount}/${requiredFiles.length + 1}`);
        Logger.info(`  Status: ${isValid ? 'VALID' : 'INVALID'}`);

        if (isValid) {
          console.log('');
          Logger.success('🎉 Memory bank setup is valid!');
          Logger.info('Your project is ready for AI agent collaboration.');
        } else {
          console.log('');
          Logger.warn('⚠️  Memory bank setup needs attention:');
          Logger.info(
            'Run "memory-banks init" to set up a complete memory bank system.'
          );
        }

        if (options.verbose) {
          console.log('');
          Logger.info('📝 Additional Information:');

          // Check for additional files
          try {
            const files = await fs.readdir(memoryBankPath);
            const additionalFiles = files.filter(
              f => !requiredFiles.includes(f) && f.endsWith('.md')
            );

            if (additionalFiles.length > 0) {
              Logger.info('Additional memory bank files:');
              additionalFiles.forEach(file => {
                Logger.info(`  - ${file}`);
              });
            }
          } catch {
            // Directory doesn't exist, skip
          }
        }
      } catch (error) {
        Logger.error('Validation failed:', error);
        process.exit(1);
      }
    });
};
