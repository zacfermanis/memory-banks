import { Command } from 'commander';
import chalk from 'chalk';
import { promises as fs } from 'fs';
import path from 'path';

export const validateCommand = (program: Command): void => {
  program
    .command('validate')
    .description('Validate current memory bank setup')
    .option('-v, --verbose', 'Show detailed validation information')
    .action(async (options: { verbose?: boolean }) => {
      try {
        console.log(chalk.blue('🔍 Validating memory bank setup...'));
        console.log('');

        const memoryBankPath = path.join(process.cwd(), '.memory-bank');
        const requiredFiles = [
          'projectBrief.md',
          'productContext.md',
          'systemPatterns.md',
          'techContext.md',
          'activeContext.md',
          'progress.md'
        ];

        let isValid = true;
        let fileCount = 0;

        // Check if .memory-bank directory exists
        try {
          await fs.access(memoryBankPath);
          console.log(chalk.green('✅ .memory-bank directory found'));
          fileCount++;
        } catch {
          console.log(chalk.red('❌ .memory-bank directory not found'));
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
              console.log(chalk.green(`✅ ${file} (${size} bytes)`));
              fileCount++;
            } else {
              console.log(chalk.yellow(`⚠️  ${file} (empty file)`));
              isValid = false;
            }
          } catch {
            console.log(chalk.red(`❌ ${file} (missing)`));
            isValid = false;
          }
        }

        console.log('');
        console.log(chalk.blue('📊 Validation Summary:'));
        console.log(`  Files found: ${fileCount}/${requiredFiles.length + 1}`);
        console.log(`  Status: ${isValid ? chalk.green('VALID') : chalk.red('INVALID')}`);

        if (isValid) {
          console.log('');
          console.log(chalk.green('🎉 Memory bank setup is valid!'));
          console.log(chalk.gray('Your project is ready for AI agent collaboration.'));
        } else {
          console.log('');
          console.log(chalk.yellow('⚠️  Memory bank setup needs attention:'));
          console.log(chalk.gray('Run "memory-banks init" to set up a complete memory bank system.'));
        }

        if (options.verbose) {
          console.log('');
          console.log(chalk.blue('📝 Additional Information:'));
          
          // Check for additional files
          try {
            const files = await fs.readdir(memoryBankPath);
            const additionalFiles = files.filter(f => !requiredFiles.includes(f) && f.endsWith('.md'));
            
            if (additionalFiles.length > 0) {
              console.log(chalk.gray('Additional memory bank files:'));
              additionalFiles.forEach(file => {
                console.log(chalk.gray(`  - ${file}`));
              });
            }
          } catch {
            // Directory doesn't exist, skip
          }
        }

      } catch (error) {
        console.error(chalk.red('❌ Validation failed:'), error);
        process.exit(1);
      }
    });
}; 