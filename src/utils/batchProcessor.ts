/* eslint-disable no-console */
import { promises as fs } from 'fs';
import path from 'path';
import chalk from 'chalk';
import { ConfigManager, ConfigDefaults } from './configManager';
import { TemplateRegistry } from '../services/templateRegistry';
import { TemplateRenderer } from '../services/templateRenderer';
import { FileSystemUtils } from './fileSystem';
import { ValidationUtils } from './validation';
// Error handling imports removed as they're not used in this implementation
import { ProjectConfig } from '../types';

export interface BatchProject {
  name: string;
  template: string;
  outputDir?: string;
  config?: ConfigDefaults;
  force?: boolean;
  dryRun?: boolean;
}

export interface BatchConfig {
  projects: BatchProject[];
  globalConfig?: ConfigDefaults;
  parallel?: boolean;
  maxConcurrency?: number;
}

export interface BatchResult {
  project: BatchProject;
  success: boolean;
  createdFiles: number;
  skippedFiles: number;
  errors: string[];
  warnings: string[];
  duration: number;
}

export interface BatchSummary {
  totalProjects: number;
  successfulProjects: number;
  failedProjects: number;
  totalFilesCreated: number;
  totalFilesSkipped: number;
  totalErrors: number;
  totalWarnings: number;
  totalDuration: number;
  results: BatchResult[];
}

export class BatchProcessor {
  private registry: TemplateRegistry;
  private renderer: TemplateRenderer;

  constructor() {
    this.registry = new TemplateRegistry();
    this.renderer = new TemplateRenderer();
  }

  /**
   * Process a batch of projects
   */
  async processBatch(batchConfig: BatchConfig): Promise<BatchSummary> {
    const startTime = Date.now();
    const results: BatchResult[] = [];

    console.log(
      chalk.blue(
        `🚀 Starting batch processing for ${batchConfig.projects.length} projects`
      )
    );
    console.log('');

    if (
      batchConfig.parallel &&
      batchConfig.maxConcurrency &&
      batchConfig.maxConcurrency > 1
    ) {
      results.push(...(await this.processBatchParallel(batchConfig)));
    } else {
      results.push(...(await this.processBatchSequential(batchConfig)));
    }

    const summary = this.createSummary(results, Date.now() - startTime);
    this.displaySummary(summary);

    return summary;
  }

  /**
   * Process projects sequentially
   */
  private async processBatchSequential(
    batchConfig: BatchConfig
  ): Promise<BatchResult[]> {
    const results: BatchResult[] = [];

    for (let i = 0; i < batchConfig.projects.length; i++) {
      const project = batchConfig.projects[i];
      if (!project) {
        continue;
      }

      console.log(
        chalk.blue(
          `📦 Processing project ${i + 1}/${batchConfig.projects.length}: ${project.name}`
        )
      );

      const result = await this.processProject(
        project,
        batchConfig.globalConfig
      );
      results.push(result);

      if (result.success) {
        console.log(chalk.green(`✅ ${project.name} completed successfully`));
      } else {
        console.log(chalk.red(`❌ ${project.name} failed`));
      }
      console.log('');
    }

    return results;
  }

  /**
   * Process projects in parallel
   */
  private async processBatchParallel(
    batchConfig: BatchConfig
  ): Promise<BatchResult[]> {
    const maxConcurrency = batchConfig.maxConcurrency || 3;
    const results: BatchResult[] = [];
    let completedCount = 0;

    console.log(
      chalk.blue(
        `🔄 Processing projects in parallel (max ${maxConcurrency} concurrent)`
      )
    );
    console.log('');

    // Process projects in chunks
    for (let i = 0; i < batchConfig.projects.length; i += maxConcurrency) {
      const chunk = batchConfig.projects.slice(i, i + maxConcurrency);
      const chunkPromises = chunk.map(project =>
        this.processProject(project, batchConfig.globalConfig)
      );

      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults);

      completedCount += chunkResults.length;
      console.log(
        chalk.gray(
          `Progress: ${completedCount}/${batchConfig.projects.length} completed`
        )
      );
    }

    return results;
  }

  /**
   * Process a single project
   */
  private async processProject(
    project: BatchProject,
    globalConfig?: ConfigDefaults
  ): Promise<BatchResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Validate project configuration
      const validation = ValidationUtils.validateProjectName(project.name);
      if (!validation.isValid) {
        errors.push(`Invalid project name: ${validation.errors.join(', ')}`);
      }

      const templateValidation = ValidationUtils.validateTemplateId(
        project.template
      );
      if (!templateValidation.isValid) {
        errors.push(
          `Invalid template ID: ${templateValidation.errors.join(', ')}`
        );
      }

      if (errors.length > 0) {
        return {
          project,
          success: false,
          createdFiles: 0,
          skippedFiles: 0,
          errors,
          warnings,
          duration: Date.now() - startTime,
        };
      }

      // Check if template exists
      if (!(await this.registry.templateExists(project.template))) {
        errors.push(`Template '${project.template}' not found`);
        return {
          project,
          success: false,
          createdFiles: 0,
          skippedFiles: 0,
          errors,
          warnings,
          duration: Date.now() - startTime,
        };
      }

      // Load template
      const template = await this.registry.getTemplate(project.template);

      // Get project configuration
      const defaults = await ConfigManager.getDefaultConfig(project.template);
      const mergedConfig = ConfigManager.mergeConfigs(
        globalConfig,
        defaults,
        project.config
      );

      const projectConfig: ProjectConfig = {
        name: mergedConfig?.projectName || project.name,
        type: mergedConfig?.projectType || 'Web Application',
        description:
          mergedConfig?.projectDescription ||
          'A new project with memory bank system',
        version: mergedConfig?.version || '1.0.0',
        author: mergedConfig?.author || 'Developer',
        license: mergedConfig?.license || 'MIT',
        projectName: mergedConfig?.projectName || project.name,
        projectType: mergedConfig?.projectType || 'Web Application',
        projectDescription:
          mergedConfig?.projectDescription ||
          'A new project with memory bank system',
        framework: mergedConfig?.framework || 'React',
        buildTool: mergedConfig?.buildTool || 'Vite',
        requirement1:
          mergedConfig?.['requirement1'] || 'Implement core functionality',
        requirement2:
          mergedConfig?.['requirement2'] ||
          'Ensure code quality and maintainability',
        requirement3:
          mergedConfig?.['requirement3'] || 'Provide excellent user experience',
        success1: mergedConfig?.['success1'] || 'All features work as expected',
        success2: mergedConfig?.['success2'] || 'Code passes all tests',
        success3: mergedConfig?.['success3'] || 'User feedback is positive',
        problemStatement:
          mergedConfig?.['problemStatement'] ||
          'Addresses a specific need in the target domain',
        solutionOverview:
          mergedConfig?.['solutionOverview'] ||
          'Provides a comprehensive solution using modern technologies',
        uxGoal1: mergedConfig?.['uxGoal1'] || 'Intuitive and easy to use',
        uxGoal2: mergedConfig?.['uxGoal2'] || 'Fast and responsive',
        uxGoal3: mergedConfig?.['uxGoal3'] || 'Accessible to all users',
        architectureOverview:
          mergedConfig?.['architectureOverview'] ||
          'Modern, scalable architecture following best practices',
        pattern1: mergedConfig?.['pattern1'] || 'Component-based architecture',
        pattern2: mergedConfig?.['pattern2'] || 'Separation of concerns',
        pattern3: mergedConfig?.['pattern3'] || 'Clean code principles',
        componentRelationships:
          mergedConfig?.['componentRelationships'] ||
          'Well-defined interfaces and clear data flow',
        devSetup:
          mergedConfig?.['devSetup'] ||
          'Standard Node.js development environment with TypeScript',
        dependencies:
          mergedConfig?.['dependencies'] ||
          'Core framework and essential development tools',
        currentFocus:
          mergedConfig?.['currentFocus'] ||
          'Initial project setup and core feature development',
        recentChanges:
          mergedConfig?.['recentChanges'] ||
          'Project initialization and basic structure',
        nextSteps:
          mergedConfig?.['nextSteps'] ||
          'Implement core features and establish development workflow',
        activeDecisions:
          mergedConfig?.['activeDecisions'] ||
          'Technology stack and architecture choices',
        whatWorks:
          mergedConfig?.['whatWorks'] || 'Project structure and basic setup',
        whatsLeft:
          mergedConfig?.['whatsLeft'] || 'Core functionality and features',
        currentStatus:
          mergedConfig?.['currentStatus'] ||
          'In development - initial setup phase',
        knownIssues: mergedConfig?.['knownIssues'] || 'None at this stage',
      };

      // Validate required variables
      const allTemplates = template.files.map(f => f.content).join('\n');
      const missingVars = this.renderer.validateVariables(
        allTemplates,
        projectConfig
      );

      if (missingVars.length > 0) {
        errors.push(
          `Missing required template variables: ${missingVars.join(', ')}`
        );
        return {
          project,
          success: false,
          createdFiles: 0,
          skippedFiles: 0,
          errors,
          warnings,
          duration: Date.now() - startTime,
        };
      }

      // Dry run mode
      if (project.dryRun) {
        return {
          project,
          success: true,
          createdFiles: 0,
          skippedFiles: template.files.length,
          errors,
          warnings: [...warnings, 'Dry run mode - no files created'],
          duration: Date.now() - startTime,
        };
      }

      // Create files
      let createdCount = 0;
      let skippedCount = 0;
      const outputDir = project.outputDir || '.memory-bank';

      for (const file of template.files) {
        const filePath = path.join(outputDir, file.path);
        const exists = await FileSystemUtils.fileExists(filePath);

        if (exists && !project.force && !file.overwrite) {
          warnings.push(`Skipped ${file.path} (file exists)`);
          skippedCount++;
          continue;
        }

        try {
          const renderedContent = await this.renderer.renderTemplate(
            file.content,
            projectConfig
          );
          await FileSystemUtils.safeWriteFile(
            filePath,
            renderedContent,
            project.force || file.overwrite || false
          );
          createdCount++;
        } catch (error) {
          errors.push(`Failed to create ${file.path}: ${error}`);
        }
      }

      return {
        project,
        success: errors.length === 0,
        createdFiles: createdCount,
        skippedFiles: skippedCount,
        errors,
        warnings,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      errors.push(`Unexpected error: ${error}`);
      return {
        project,
        success: false,
        createdFiles: 0,
        skippedFiles: 0,
        errors,
        warnings,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Create batch summary
   */
  private createSummary(
    results: BatchResult[],
    totalDuration: number
  ): BatchSummary {
    const successfulProjects = results.filter(r => r.success).length;
    const totalFilesCreated = results.reduce(
      (sum, r) => sum + r.createdFiles,
      0
    );
    const totalFilesSkipped = results.reduce(
      (sum, r) => sum + r.skippedFiles,
      0
    );
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
    const totalWarnings = results.reduce(
      (sum, r) => sum + r.warnings.length,
      0
    );

    return {
      totalProjects: results.length,
      successfulProjects,
      failedProjects: results.length - successfulProjects,
      totalFilesCreated,
      totalFilesSkipped,
      totalErrors,
      totalWarnings,
      totalDuration,
      results,
    };
  }

  /**
   * Display batch summary
   */
  private displaySummary(summary: BatchSummary): void {
    console.log(chalk.blue('📊 Batch Processing Summary'));
    console.log('='.repeat(50));
    console.log(`Total Projects: ${summary.totalProjects}`);
    console.log(`Successful: ${chalk.green(summary.successfulProjects)}`);
    console.log(`Failed: ${chalk.red(summary.failedProjects)}`);
    console.log(`Files Created: ${chalk.green(summary.totalFilesCreated)}`);
    console.log(`Files Skipped: ${chalk.yellow(summary.totalFilesSkipped)}`);
    console.log(`Total Errors: ${chalk.red(summary.totalErrors)}`);
    console.log(`Total Warnings: ${chalk.yellow(summary.totalWarnings)}`);
    console.log(`Total Duration: ${summary.totalDuration}ms`);
    console.log('');

    if (summary.totalErrors > 0) {
      console.log(chalk.red('❌ Errors:'));
      summary.results.forEach(result => {
        if (result.errors.length > 0) {
          console.log(chalk.red(`  ${result.project.name}:`));
          result.errors.forEach(error => {
            console.log(chalk.red(`    - ${error}`));
          });
        }
      });
      console.log('');
    }

    if (summary.totalWarnings > 0) {
      console.log(chalk.yellow('⚠️  Warnings:'));
      summary.results.forEach(result => {
        if (result.warnings.length > 0) {
          console.log(chalk.yellow(`  ${result.project.name}:`));
          result.warnings.forEach(warning => {
            console.log(chalk.yellow(`    - ${warning}`));
          });
        }
      });
      console.log('');
    }
  }

  /**
   * Load batch configuration from file
   */
  static async loadBatchConfig(configPath: string): Promise<BatchConfig> {
    try {
      const content = await fs.readFile(configPath, 'utf8');
      const config = JSON.parse(content) as BatchConfig;

      // Validate configuration
      if (!config.projects || !Array.isArray(config.projects)) {
        throw new Error('Batch configuration must have a "projects" array');
      }

      for (const project of config.projects) {
        if (!project.name || !project.template) {
          throw new Error(
            'Each project must have "name" and "template" fields'
          );
        }
      }

      return config;
    } catch (error) {
      throw new Error(`Failed to load batch configuration: ${error}`);
    }
  }
}
