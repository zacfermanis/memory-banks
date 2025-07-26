import { promises as fs } from 'fs';
import path from 'path';
import { TemplateConfig } from '../types';
import { TemplateRenderer } from './templateRenderer';
import { TemplateValidator } from './templateValidator';
import { OutputFormatter } from './outputFormatter';

export interface ParallelProcessingOptions {
  maxConcurrency?: number;
  enableProfiling?: boolean;
  batchSize?: number;
  timeout?: number;
}

export interface ProcessingTask {
  id: string;
  type: 'file-generation' | 'template-validation' | 'variable-resolution';
  data: any;
  priority?: number;
}

export interface ProcessingResult {
  taskId: string;
  success: boolean;
  result?: any;
  error?: string;
  processingTime: number;
  memoryUsage?: number;
}

export interface ParallelProcessingStats {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  averageProcessingTime: number;
  totalProcessingTime: number;
  memoryUsage: number;
  throughput: number;
}

export class ParallelProcessor {
  // private _maxConcurrency: number; // Unused variable
  private enableProfiling: boolean;
  private batchSize: number;
  private timeout: number;
  private renderer: TemplateRenderer;
  private validator: TemplateValidator;
  private formatter: OutputFormatter;
  private stats = {
    totalTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    totalProcessingTime: 0,
    memoryUsage: 0,
  };

  constructor(
    options: ParallelProcessingOptions = {},
    renderer?: TemplateRenderer,
    validator?: TemplateValidator,
    formatter?: OutputFormatter
  ) {
    // this._maxConcurrency = options.maxConcurrency || 4; // Unused variable
    this.enableProfiling = options.enableProfiling || false;
    this.batchSize = options.batchSize || 10;
    this.timeout = options.timeout || 30000; // 30 seconds
    this.renderer = renderer || new TemplateRenderer();
    this.validator = validator || new TemplateValidator();
    this.formatter = formatter || new OutputFormatter();
  }

  /**
   * TASK-030: Create parallel file generation
   */
  async processFileGeneration(
    template: TemplateConfig,
    variables: Record<string, any>,
    outputDir: string,
    options: ParallelProcessingOptions = {}
  ): Promise<ProcessingResult[]> {
    if (!template.files || template.files.length === 0) {
      return [];
    }

    const tasks: ProcessingTask[] = template.files.map((file, index) => ({
      id: `file-${index}`,
      type: 'file-generation',
      data: { file, template, variables, outputDir },
      priority: file.overwrite ? 1 : 2, // Higher priority for overwrite files
    }));

    return this.processTasks(
      tasks,
      this.processFileGenerationTask.bind(this),
      options
    );
  }

  /**
   * TASK-030: Add parallel template validation
   */
  async processTemplateValidation(
    templates: TemplateConfig[],
    options: ParallelProcessingOptions = {}
  ): Promise<ProcessingResult[]> {
    const tasks: ProcessingTask[] = templates.map((template, index) => ({
      id: `validation-${index}`,
      type: 'template-validation',
      data: { template },
      priority: 1,
    }));

    return this.processTasks(
      tasks,
      this.processTemplateValidationTask.bind(this),
      options
    );
  }

  /**
   * TASK-030: Implement parallel variable resolution
   */
  async processVariableResolution(
    templates: TemplateConfig[],
    variables: Record<string, any>,
    options: ParallelProcessingOptions = {}
  ): Promise<ProcessingResult[]> {
    const tasks: ProcessingTask[] = [];

    for (let i = 0; i < templates.length; i++) {
      const template = templates[i];
      if (template && template.files) {
        for (let j = 0; j < template.files.length; j++) {
          const file = template.files[j];
          tasks.push({
            id: `variable-${i}-${j}`,
            type: 'variable-resolution',
            data: { template, file, variables },
            priority: 2,
          });
        }
      }
    }

    return this.processTasks(
      tasks,
      this.processVariableResolutionTask.bind(this),
      options
    );
  }

  /**
   * Generic task processor with concurrency control
   */
  private async processTasks(
    tasks: ProcessingTask[],
    processor: (task: ProcessingTask) => Promise<any>,
    _options: ParallelProcessingOptions = {}
  ): Promise<ProcessingResult[]> {
    const startMemory = this.enableProfiling
      ? process.memoryUsage().heapUsed
      : 0;

    this.stats.totalTasks = tasks.length;
    this.stats.completedTasks = 0;
    this.stats.failedTasks = 0;
    this.stats.totalProcessingTime = 0;

    const allResults: ProcessingResult[] = [];

    // Sort tasks by priority (lower number = higher priority)
    tasks.sort((a, b) => (a.priority || 3) - (b.priority || 3));

    // Process tasks in batches
    for (let i = 0; i < tasks.length; i += this.batchSize) {
      const batch = tasks.slice(i, i + this.batchSize);
      const batchPromises = batch.map(async task => {
        const taskStartTime = Date.now();
        const taskStartMemory = this.enableProfiling
          ? process.memoryUsage().heapUsed
          : 0;

        try {
          const result = await Promise.race([
            processor(task),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Task timeout')), this.timeout)
            ),
          ]);

          const processingTime = Date.now() - taskStartTime;
          const memoryUsage = this.enableProfiling
            ? process.memoryUsage().heapUsed - taskStartMemory
            : undefined;

          this.stats.completedTasks++;
          this.stats.totalProcessingTime += processingTime;

          return {
            taskId: task.id,
            success: true,
            result,
            processingTime,
            memoryUsage,
          };
        } catch (error) {
          const processingTime = Date.now() - taskStartTime;
          this.stats.failedTasks++;
          this.stats.totalProcessingTime += processingTime;

          return {
            taskId: task.id,
            success: false,
            error: error instanceof Error ? error.message : String(error),
            processingTime,
          };
        }
      });

      // Process batch with concurrency limit
      const batchResults = await Promise.allSettled(batchPromises);

      for (const batchResult of batchResults) {
        if (batchResult.status === 'fulfilled') {
          allResults.push(batchResult.value);
        } else {
          // Handle batch-level errors
          allResults.push({
            taskId: 'batch-error',
            success: false,
            error: batchResult.reason?.message || 'Batch processing error',
            processingTime: 0,
          });
        }
      }

      // Add small delay between batches to prevent overwhelming the system
      if (i + this.batchSize < tasks.length) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }

    // Update final memory usage
    if (this.enableProfiling) {
      this.stats.memoryUsage = process.memoryUsage().heapUsed - startMemory;
    }

    return allResults;
  }

  /**
   * Process individual file generation task
   */
  private async processFileGenerationTask(task: ProcessingTask): Promise<any> {
    const { file, template: _template, variables, outputDir } = task.data;

    // Render template content
    const renderedContent = await this.renderer.renderTemplate(
      file.content,
      variables
    );

    // Format the content
    const formattedContent = this.formatter.formatCode(
      renderedContent.content,
      file.path
    );

    // Resolve file path
    const renderedPath = await this.renderer.renderTemplate(
      file.path,
      variables
    );
    const resolvedPath = path.join(outputDir, renderedPath.content);

    // Create directory if needed
    const dir = path.dirname(resolvedPath);
    await fs.mkdir(dir, { recursive: true });

    // Write file
    await fs.writeFile(resolvedPath, formattedContent.content, 'utf8');

    return {
      path: resolvedPath,
      size: formattedContent.content.length,
      renderTime: renderedContent.renderTime,
      formatTime:
        formattedContent.formattedLength - formattedContent.originalLength,
    };
  }

  /**
   * Process individual template validation task
   */
  private async processTemplateValidationTask(
    task: ProcessingTask
  ): Promise<any> {
    const { template } = task.data;

    // Use the public validateTemplate method
    const validationResult = await this.validator.validateTemplate(
      template,
      template.name
    );

    return {
      templateName: template.name,
      syntaxValid: validationResult.syntax.isValid,
      configValid: validationResult.configuration.isValid,
      metadataValid: validationResult.metadata.isValid,
      filesValid: validationResult.files.isValid,
      errors: validationResult.errors,
      warnings: validationResult.warnings,
    };
  }

  /**
   * Process individual variable resolution task
   */
  private async processVariableResolutionTask(
    task: ProcessingTask
  ): Promise<any> {
    const { template, file, variables } = task.data;

    // Extract variables from template content
    const templateVariables = this.renderer.getTemplateVariables(file.content);
    const conditionalVariables = this.renderer.getConditionalVariables(
      file.content
    );

    // Validate variables
    const missingVariables = this.renderer.validateVariables(
      file.content,
      variables
    );

    // Resolve variables
    const resolvedVariables: Record<string, any> = {};
    for (const variable of templateVariables) {
      resolvedVariables[variable] = this.getNestedValue(variables, variable);
    }

    return {
      templateName: template.name,
      fileName: file.path,
      templateVariables,
      conditionalVariables,
      missingVariables,
      resolvedVariables,
      variableCount: templateVariables.length,
    };
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * TASK-030: Add performance benchmarking
   */
  getStats(): ParallelProcessingStats {
    const averageProcessingTime =
      this.stats.completedTasks > 0
        ? this.stats.totalProcessingTime / this.stats.completedTasks
        : 0;

    const throughput =
      this.stats.totalProcessingTime > 0
        ? (this.stats.completedTasks / this.stats.totalProcessingTime) * 1000
        : 0;

    return {
      totalTasks: this.stats.totalTasks,
      completedTasks: this.stats.completedTasks,
      failedTasks: this.stats.failedTasks,
      averageProcessingTime,
      totalProcessingTime: this.stats.totalProcessingTime,
      memoryUsage: this.stats.memoryUsage,
      throughput,
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      totalProcessingTime: 0,
      memoryUsage: 0,
    };
  }

  /**
   * Get current memory usage
   */
  getMemoryUsage(): NodeJS.MemoryUsage {
    return process.memoryUsage();
  }

  /**
   * Optimize concurrency based on system resources
   */
  optimizeConcurrency(): number {
    const memoryUsage = process.memoryUsage();
    const cpuCount = require('os').cpus().length;

    // Base concurrency on CPU cores
    let optimalConcurrency = Math.max(1, cpuCount - 1);

    // Adjust based on memory usage
    const memoryUsagePercent = memoryUsage.heapUsed / memoryUsage.heapTotal;
    if (memoryUsagePercent > 0.8) {
      optimalConcurrency = Math.max(1, optimalConcurrency - 1);
    }

    // Cap at reasonable maximum
    optimalConcurrency = Math.min(optimalConcurrency, 8);

    return optimalConcurrency;
  }

  /**
   * Process tasks with automatic concurrency optimization
   */
  async processWithOptimization(
    tasks: ProcessingTask[],
    processor: (task: ProcessingTask) => Promise<any>,
    options: ParallelProcessingOptions = {}
  ): Promise<ProcessingResult[]> {
    const optimizedConcurrency = this.optimizeConcurrency();
    const optimizedOptions = {
      ...options,
      maxConcurrency: optimizedConcurrency,
    };

    return this.processTasks(tasks, processor, optimizedOptions);
  }
}
