import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import path from 'path';
import { TemplateRegistry } from '../../services/templateRegistry';
import { TemplateRenderer } from '../../services/templateRenderer';
import { FileSystemUtils } from '../../utils/fileSystem';
import { ValidationUtils } from '../../utils/validation';
import {
  ErrorHandler,
  MemoryBanksError,
  ErrorCode,
} from '../../utils/errorHandling';
import { ConfigManager } from '../../utils/configManager';
import { InitOptions, ProjectConfig } from '../../types';

export const initCommand = (program: Command): void => {
  program
    .command('init')
    .description(
      'Initialize a new memory bank system for AI agent collaboration'
    )
    .option(
      '-t, --template <template>',
      'Template to use for project structure (default: typescript)',
      'typescript'
    )
    .option(
      '-y, --yes',
      'Skip interactive prompts and use intelligent defaults'
    )
    .option(
      '--dry-run',
      'Preview files that would be created without creating them'
    )
    .option('-f, --force', 'Overwrite existing files without confirmation')
    .option(
      '-o, --output-dir <path>',
      'Output directory for memory bank files (default: .memory-bank)'
    )
    .option('--config <path>', 'Path to custom configuration file')
    .addHelpText(
      'after',
      `
Examples:
  $ memory-banks init                    # Interactive initialization
  $ memory-banks init --template typescript  # Use specific template
  $ memory-banks init --yes              # Non-interactive with defaults
  $ memory-banks init --dry-run          # Preview without creating files
  $ memory-banks init --output-dir ./docs  # Custom output directory

Templates:
  typescript    Full-stack TypeScript projects with React/Vue support
  lua          Lua game development projects
  web          Basic web application projects
  api          Backend API development projects

Configuration:
  Use .memory-banks.json for local configuration
  Use ~/.memory-banks.json for global configuration
  Set MEMORY_BANKS_* environment variables for defaults

For more information, run: memory-banks help init
    `
    )
    .action(async (options: InitOptions) => {
      try {
        console.log(chalk.blue('🚀 Initializing memory bank system...'));
        console.log('');

        const registry = new TemplateRegistry();
        const renderer = new TemplateRenderer();

        // Validate template ID
        const templateValidation = ValidationUtils.validateTemplateId(
          options.template
        );
        if (!templateValidation.isValid) {
          const error = MemoryBanksError.createValidationError(
            `Invalid template ID: ${options.template}`,
            'The specified template ID is invalid',
            templateValidation.errors,
            { templateId: options.template }
          );
          ErrorHandler.handleError(error);
        }

        // Validate template exists
        if (!(await registry.templateExists(options.template))) {
          const error = MemoryBanksError.createTemplateError(
            ErrorCode.TEMPLATE_NOT_FOUND,
            `Template '${options.template}' not found`,
            `Template '${options.template}' was not found`,
            [
              'Run "memory-banks list" to see available templates',
              'Check if the template is properly installed',
              'Verify the template ID spelling',
            ],
            { templateId: options.template }
          );
          ErrorHandler.handleError(error);
        }

        // Load template
        const template = await registry.getTemplate(options.template);
        console.log(chalk.blue(`📋 Using template: ${template.name}`));

        // Get project configuration
        let projectConfig: ProjectConfig;

        if (options.yes) {
          // Use intelligent defaults for non-interactive mode
          const defaults = await ConfigManager.getDefaultConfig(
            options.template
          );
          projectConfig = {
            name: defaults.projectName || 'My Project',
            type: defaults.projectType || 'Web Application',
            description:
              defaults.projectDescription ||
              'A new project with memory bank system',
            version: defaults.version || '1.0.0',
            author: defaults.author || 'Developer',
            license: defaults.license || 'MIT',
            // Template variables with defaults
            projectName: defaults.projectName || 'My Project',
            projectType: defaults.projectType || 'Web Application',
            projectDescription:
              defaults.projectDescription ||
              'A new project with memory bank system',
            framework: defaults.framework || 'React',
            buildTool: defaults.buildTool || 'Vite',
            requirement1:
              defaults['requirement1'] || 'Implement core functionality',
            requirement2:
              defaults['requirement2'] ||
              'Ensure code quality and maintainability',
            requirement3:
              defaults['requirement3'] || 'Provide excellent user experience',
            success1: defaults['success1'] || 'All features work as expected',
            success2: defaults['success2'] || 'Code passes all tests',
            success3: defaults['success3'] || 'User feedback is positive',
            problemStatement:
              defaults['problemStatement'] ||
              'Addresses a specific need in the target domain',
            solutionOverview:
              defaults['solutionOverview'] ||
              'Provides a comprehensive solution using modern technologies',
            uxGoal1: defaults['uxGoal1'] || 'Intuitive and easy to use',
            uxGoal2: defaults['uxGoal2'] || 'Fast and responsive',
            uxGoal3: defaults['uxGoal3'] || 'Accessible to all users',
            architectureOverview:
              defaults['architectureOverview'] ||
              'Modern, scalable architecture following best practices',
            pattern1: defaults['pattern1'] || 'Component-based architecture',
            pattern2: defaults['pattern2'] || 'Separation of concerns',
            pattern3: defaults['pattern3'] || 'Clean code principles',
            componentRelationships:
              defaults['componentRelationships'] ||
              'Well-defined interfaces and clear data flow',
            devSetup:
              defaults['devSetup'] ||
              'Standard Node.js development environment with TypeScript',
            dependencies:
              defaults['dependencies'] ||
              'Core framework and essential development tools',
            currentFocus:
              defaults['currentFocus'] ||
              'Initial project setup and core feature development',
            recentChanges:
              defaults['recentChanges'] ||
              'Project initialization and basic structure',
            nextSteps:
              defaults['nextSteps'] ||
              'Implement core features and establish development workflow',
            activeDecisions:
              defaults['activeDecisions'] ||
              'Technology stack and architecture choices',
            whatWorks:
              defaults['whatWorks'] || 'Project structure and basic setup',
            whatsLeft:
              defaults['whatsLeft'] || 'Core functionality and features',
            currentStatus:
              defaults['currentStatus'] ||
              'In development - initial setup phase',
            knownIssues: defaults['knownIssues'] || 'None at this stage',
          };
        } else {
          // Interactive prompts
          projectConfig = await promptForProjectConfig(template);
        }

        // Validate required variables
        const allTemplates = template.files.map(f => f.content).join('\n');
        const missingVars = renderer.validateVariables(
          allTemplates,
          projectConfig
        );

        if (missingVars.length > 0) {
          const error = MemoryBanksError.createTemplateError(
            ErrorCode.TEMPLATE_VARIABLE_MISSING,
            `Missing required template variables: ${missingVars.join(', ')}`,
            'Some required template variables are missing',
            [
              'Provide the missing variables in interactive mode',
              'Use --yes flag to use default values',
              'Check template documentation for required variables',
            ],
            { missingVariables: missingVars }
          );
          ErrorHandler.handleError(error);
        }

        // Dry run mode
        if (options.dryRun) {
          console.log(chalk.yellow('🔍 DRY RUN - No files will be created'));
          console.log('');

          // Show configuration preview
          console.log(chalk.blue('📋 Configuration Preview:'));
          console.log(`  Project Name: ${projectConfig.name}`);
          console.log(`  Project Type: ${projectConfig.type}`);
          console.log(`  Description: ${projectConfig.description}`);
          console.log(`  Version: ${projectConfig.version}`);
          console.log(`  Author: ${projectConfig.author}`);
          console.log(`  License: ${projectConfig.license}`);
          console.log(`  Framework: ${projectConfig.framework}`);
          console.log(`  Build Tool: ${projectConfig.buildTool}`);
          console.log('');

          // Show files that would be created
          console.log(chalk.blue('📁 Files that would be created:'));
          let totalSize = 0;

          for (const file of template.files) {
            const filePath = path.join(
              options.outputDir || '.memory-bank',
              file.path
            );
            const exists = await FileSystemUtils.fileExists(filePath);
            const status = exists
              ? chalk.yellow('(exists)')
              : chalk.green('(new)');
            const size = Buffer.byteLength(file.content, 'utf8');
            totalSize += size;

            console.log(`  ${filePath} ${status} (${size} bytes)`);
          }

          console.log('');
          console.log(chalk.blue('📊 Summary:'));
          console.log(`  Total files: ${template.files.length}`);
          console.log(`  Total size: ${totalSize} bytes`);
          console.log(
            `  Output directory: ${options.outputDir || '.memory-bank'}`
          );
          console.log('');

          // Show validation results
          console.log(chalk.blue('✅ Validation:'));
          console.log('  All required variables are provided');
          console.log('  Template is valid and ready to use');
          console.log('');

          console.log(chalk.gray('Run without --dry-run to create files'));
          return;
        }

        // Create files
        let createdCount = 0;
        let skippedCount = 0;

        for (const file of template.files) {
          const filePath = path.join(
            options.outputDir || '.memory-bank',
            file.path
          );
          const exists = await FileSystemUtils.fileExists(filePath);

          if (exists && !options.force && !file.overwrite) {
            console.log(
              chalk.yellow(
                `⚠️  Skipping ${file.path} (use --force to overwrite)`
              )
            );
            skippedCount++;
            continue;
          }

          try {
            const renderedContent = await renderer.renderTemplate(
              file.content,
              projectConfig
            );
            await FileSystemUtils.safeWriteFile(
              filePath,
              renderedContent,
              options.force || file.overwrite || false
            );
            console.log(chalk.green(`✅ Created ${file.path}`));
            createdCount++;
          } catch (error) {
            console.log(
              chalk.red(`❌ Failed to create ${file.path}: ${error}`)
            );
          }
        }

        console.log('');
        console.log(chalk.blue('📊 Initialization Summary:'));
        console.log(`  Files created: ${createdCount}`);
        console.log(`  Files skipped: ${skippedCount}`);
        console.log('');
        console.log(
          chalk.green('🎉 Memory bank system initialized successfully!')
        );
        console.log('');
        console.log(chalk.yellow('📝 Next steps:'));
        console.log(
          chalk.yellow('   1. Review the generated memory bank files')
        );
        console.log(
          chalk.yellow('   2. Customize the templates for your project')
        );
        console.log(
          chalk.yellow(
            '   3. Start using memory banks in your development workflow'
          )
        );
        console.log('');
        console.log(
          chalk.gray('Run "memory-banks validate" to verify your setup')
        );
      } catch (error) {
        ErrorHandler.handleError(error as Error, {
          verbose: options.verbose ?? false,
          debug: options.debug ?? false,
          quiet: options.quiet ?? false,
        });
      }
    });
};

/**
 * Interactive prompts for project configuration
 */
async function promptForProjectConfig(template: any): Promise<ProjectConfig> {
  const questions = [
    {
      type: 'input',
      name: 'name',
      message: 'What is your project name?',
      default: 'My Project',
      validate: (input: string) => {
        const validation = ValidationUtils.validateProjectName(input);
        if (!validation.isValid) {
          return validation.errors[0] || 'Project name is invalid';
        }
        return true;
      },
    },
    {
      type: 'input',
      name: 'description',
      message: 'Describe your project:',
      default: 'A new project with memory bank system',
    },
    {
      type: 'list',
      name: 'type',
      message: 'What type of project is this?',
      choices: [
        'Web Application',
        'CLI Tool',
        'Library',
        'API',
        'Mobile App',
        'Desktop App',
        'Other',
      ],
      default: 'Web Application',
    },
    {
      type: 'input',
      name: 'version',
      message: 'Project version:',
      default: '1.0.0',
    },
    {
      type: 'input',
      name: 'author',
      message: 'Author name:',
      default: 'Developer',
    },
    {
      type: 'list',
      name: 'license',
      message: 'License:',
      choices: ['MIT', 'Apache-2.0', 'GPL-3.0', 'BSD-3-Clause', 'Unlicense'],
      default: 'MIT',
    },
  ];

  // Add template-specific questions
  if (template.options) {
    for (const option of template.options) {
      // Skip basic project info that we already have
      if (
        ['projectName', 'projectDescription', 'projectType'].includes(
          option.name
        )
      ) {
        continue;
      }

      const question: any = {
        type: option.type === 'select' ? 'list' : option.type,
        name: option.name,
        message: option.description,
        required: option.required,
      };

      if (option.default !== undefined) {
        question.default = option.default;
      }

      if (option.choices) {
        question.choices = option.choices;
      }

      questions.push(question);
    }
  }

  const answers = await inquirer.prompt(questions);

  // Map the answers to the expected format
  const config: any = {
    ...answers,
    projectName: answers.name,
    projectDescription: answers.description,
    projectType: answers.type,
  };

  return config;
}
