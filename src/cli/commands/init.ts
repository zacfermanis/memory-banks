import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import path from 'path';
import { TemplateRegistry } from '../../services/templateRegistry';
import { TemplateRenderer } from '../../services/templateRenderer';
import { FileSystemUtils } from '../../utils/fileSystem';
import { InitOptions, ProjectConfig } from '../../types';

export const initCommand = (program: Command): void => {
  program
    .command('init')
    .description('Initialize a new memory bank system in the current project')
    .option(
      '-t, --template <template>',
      'Specify the template to use',
      'typescript'
    )
    .option('-y, --yes', 'Skip interactive prompts and use defaults')
    .option('--dry-run', 'Show what would be created without creating files')
    .option('-f, --force', 'Overwrite existing files without confirmation')
    .option('-o, --output-dir <path>', 'Specify output directory', '.memory-bank')
    .action(async (options: InitOptions) => {
      try {
        console.log(chalk.blue('🚀 Initializing memory bank system...'));
        console.log('');

        const registry = new TemplateRegistry();
        const renderer = new TemplateRenderer();

        // Validate template exists
        if (!(await registry.templateExists(options.template))) {
          console.log(chalk.red(`❌ Template '${options.template}' not found.`));
          console.log(chalk.gray('Run "memory-banks list" to see available templates.'));
          process.exit(1);
        }

        // Load template
        const template = await registry.getTemplate(options.template);
        console.log(chalk.blue(`📋 Using template: ${template.name}`));

        // Get project configuration
        let projectConfig: ProjectConfig;
        
        if (options.yes) {
          // Use defaults for non-interactive mode
          projectConfig = {
            name: 'My Project',
            type: 'Web Application',
            description: 'A new project with memory bank system',
            version: '1.0.0',
            author: 'Developer',
            license: 'MIT',
            // Template variables with defaults
            projectName: 'My Project',
            projectType: 'Web Application',
            projectDescription: 'A new project with memory bank system',
            framework: 'React',
            buildTool: 'Vite',
            requirement1: 'Implement core functionality',
            requirement2: 'Ensure code quality and maintainability',
            requirement3: 'Provide excellent user experience',
            success1: 'All features work as expected',
            success2: 'Code passes all tests',
            success3: 'User feedback is positive',
            problemStatement: 'Addresses a specific need in the target domain',
            solutionOverview: 'Provides a comprehensive solution using modern technologies',
            uxGoal1: 'Intuitive and easy to use',
            uxGoal2: 'Fast and responsive',
            uxGoal3: 'Accessible to all users',
            architectureOverview: 'Modern, scalable architecture following best practices',
            pattern1: 'Component-based architecture',
            pattern2: 'Separation of concerns',
            pattern3: 'Clean code principles',
            componentRelationships: 'Well-defined interfaces and clear data flow',
            devSetup: 'Standard Node.js development environment with TypeScript',
            dependencies: 'Core framework and essential development tools',
            currentFocus: 'Initial project setup and core feature development',
            recentChanges: 'Project initialization and basic structure',
            nextSteps: 'Implement core features and establish development workflow',
            activeDecisions: 'Technology stack and architecture choices',
            whatWorks: 'Project structure and basic setup',
            whatsLeft: 'Core functionality and features',
            currentStatus: 'In development - initial setup phase',
            knownIssues: 'None at this stage'
          };
        } else {
          // Interactive prompts
          projectConfig = await promptForProjectConfig(template);
        }

        // Validate required variables
        const allTemplates = template.files.map(f => f.content).join('\n');
        const missingVars = renderer.validateVariables(allTemplates, projectConfig);
        
        if (missingVars.length > 0) {
          console.log(chalk.yellow('⚠️  Missing required variables:'));
          missingVars.forEach(v => console.log(chalk.yellow(`  - ${v}`)));
          console.log(chalk.gray('Please provide these values or use --yes for defaults.'));
          process.exit(1);
        }

        // Dry run mode
        if (options.dryRun) {
          console.log(chalk.yellow('🔍 DRY RUN - No files will be created'));
          console.log('');
          console.log(chalk.blue('Files that would be created:'));
          
          for (const file of template.files) {
            const filePath = path.join(options.outputDir || '.memory-bank', file.path);
            console.log(`  ${filePath}`);
          }
          
          console.log('');
          console.log(chalk.gray('Run without --dry-run to create files'));
          return;
        }

        // Create files
        let createdCount = 0;
        let skippedCount = 0;

        for (const file of template.files) {
          const filePath = path.join(options.outputDir || '.memory-bank', file.path);
          const exists = await FileSystemUtils.fileExists(filePath);
          
          if (exists && !options.force && !file.overwrite) {
            console.log(chalk.yellow(`⚠️  Skipping ${file.path} (use --force to overwrite)`));
            skippedCount++;
            continue;
          }

          try {
            const renderedContent = await renderer.renderTemplate(file.content, projectConfig);
            await FileSystemUtils.safeWriteFile(filePath, renderedContent, options.force || file.overwrite || false);
            console.log(chalk.green(`✅ Created ${file.path}`));
            createdCount++;
          } catch (error) {
            console.log(chalk.red(`❌ Failed to create ${file.path}: ${error}`));
          }
        }

        console.log('');
        console.log(chalk.blue('📊 Initialization Summary:'));
        console.log(`  Files created: ${createdCount}`);
        console.log(`  Files skipped: ${skippedCount}`);
        console.log('');
        console.log(chalk.green('🎉 Memory bank system initialized successfully!'));
        console.log('');
        console.log(chalk.yellow('📝 Next steps:'));
        console.log(chalk.yellow('   1. Review the generated memory bank files'));
        console.log(chalk.yellow('   2. Customize the templates for your project'));
        console.log(chalk.yellow('   3. Start using memory banks in your development workflow'));
        console.log('');
        console.log(chalk.gray('Run "memory-banks validate" to verify your setup'));

      } catch (error) {
        console.error(
          chalk.red('❌ Failed to initialize memory bank system:'),
          error
        );
        process.exit(1);
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
      validate: (input: string) => input.trim().length > 0 || 'Project name is required'
    },
    {
      type: 'input',
      name: 'description',
      message: 'Describe your project:',
      default: 'A new project with memory bank system'
    },
    {
      type: 'list',
      name: 'type',
      message: 'What type of project is this?',
      choices: ['Web Application', 'CLI Tool', 'Library', 'API', 'Mobile App', 'Desktop App', 'Other'],
      default: 'Web Application'
    },
    {
      type: 'input',
      name: 'version',
      message: 'Project version:',
      default: '1.0.0'
    },
    {
      type: 'input',
      name: 'author',
      message: 'Author name:',
      default: 'Developer'
    },
    {
      type: 'list',
      name: 'license',
      message: 'License:',
      choices: ['MIT', 'Apache-2.0', 'GPL-3.0', 'BSD-3-Clause', 'Unlicense'],
      default: 'MIT'
    }
  ];

  // Add template-specific questions
  if (template.options) {
    for (const option of template.options) {
      // Skip basic project info that we already have
      if (['projectName', 'projectDescription', 'projectType'].includes(option.name)) {
        continue;
      }
      
      const question: any = {
        type: option.type === 'select' ? 'list' : option.type,
        name: option.name,
        message: option.description,
        required: option.required
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
    projectType: answers.type
  };
  
  return config;
}
