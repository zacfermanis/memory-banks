import { TemplateRegistry } from '../../src/services/templateRegistry';
import { TemplateRenderer } from '../../src/services/templateRenderer';
import { TemplateValidator } from '../../src/services/templateValidator';
import { TemplateCache } from '../../src/services/templateCache';
import { OutputFormatter } from '../../src/services/outputFormatter';
import { ErrorHandler, ErrorCategory, ErrorSeverity } from '../../src/services/errorHandler';
import { RollbackManager } from '../../src/services/rollbackManager';
import { RecoveryManager } from '../../src/services/recoveryManager';
import { ParallelProcessor } from '../../src/services/parallelProcessor';
import { TemplateConfig } from '../../src/types';
import { promises as fs } from 'fs';

// Mock fs module
jest.mock('fs', () => ({
  promises: {
    readdir: jest.fn(),
    stat: jest.fn(),
    readFile: jest.fn(),
    writeFile: jest.fn(),
    mkdir: jest.fn(),
    copyFile: jest.fn(),
    rm: jest.fn(),
    rename: jest.fn(),
    unlink: jest.fn(),
    rmdir: jest.fn(),
  },
}));

describe('Template Engine Unit Tests', () => {
  let registry: TemplateRegistry;
  let renderer: TemplateRenderer;
  let validator: TemplateValidator;
  let cache: TemplateCache;
  let formatter: OutputFormatter;
  let errorHandler: ErrorHandler;
  let rollbackManager: RollbackManager;
  let recoveryManager: RecoveryManager;
  let parallelProcessor: ParallelProcessor;
  let mockFs: jest.Mocked<typeof fs>;

  beforeEach(() => {
    registry = new TemplateRegistry();
    renderer = new TemplateRenderer();
    validator = new TemplateValidator();
    cache = new TemplateCache();
    formatter = new OutputFormatter();
    errorHandler = new ErrorHandler();
    rollbackManager = new RollbackManager();
    recoveryManager = new RecoveryManager(
      errorHandler,
      rollbackManager,
      renderer,
      validator,
      cache
    );
    parallelProcessor = new ParallelProcessor();
    mockFs = fs as jest.Mocked<typeof fs>;
    jest.clearAllMocks();
  });

  describe('Template Registry Tests', () => {
    const mockTemplateConfig: TemplateConfig = {
      name: 'Test Template',
      description: 'A test template',
      version: '1.0.0',
      files: [
        { path: 'test.ts', content: 'console.log("{{message}}");' },
        { path: 'README.md', content: '# {{projectName}}\n\n{{description}}' },
      ],
    };

    it('should scan templates and return metadata', async () => {
      const mockStat = {
        isDirectory: () => true,
        mtime: new Date('2023-01-01'),
        size: 1024,
      };

      mockFs.readdir.mockResolvedValue(['test-template'] as any);
      mockFs.stat.mockResolvedValue(mockStat as any);
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockTemplateConfig));

      const result = await registry.scanTemplates();

      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe('test-template');
      expect(result[0]?.name).toBe('Test Template');
      expect(result[0]?.version).toBe('1.0.0');
    });

    it('should search templates with filters', async () => {
      const mockStat = {
        isDirectory: () => true,
        mtime: new Date('2023-01-01'),
        size: 1024,
      };

      mockFs.readdir.mockResolvedValue(['test-template'] as any);
      mockFs.stat.mockResolvedValue(mockStat as any);
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockTemplateConfig));

      const result = await registry.searchTemplates({
        query: 'Test',
        language: 'typescript',
      });

      expect(result.templates).toHaveLength(1);
      expect(result.searchTime).toBeGreaterThan(0);
    });

    it('should generate template documentation', async () => {
      const mockStat = {
        isDirectory: () => true,
        mtime: new Date('2023-01-01'),
        size: 1024,
      };

      mockFs.readdir.mockResolvedValue(['test-template'] as any);
      mockFs.stat.mockResolvedValue(mockStat as any);
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockTemplateConfig));

      const documentation = await registry.generateTemplateDocumentation('test-template');

      expect(documentation).toContain('# Test Template');
      expect(documentation).toContain('Version: 1.0.0');
      expect(documentation).toContain('## Files');
    });
  });

  describe('Template Renderer Tests', () => {
    it('should render template with variables', async () => {
      const template = 'Hello {{name}}, welcome to {{project}}!';
      const variables = { name: 'John', project: 'Memory Banks' };

      const result = await renderer.renderTemplate(template, variables);

      expect(result.content).toBe('Hello John, welcome to Memory Banks!');
      expect(result.renderTime).toBeGreaterThan(0);
      expect(result.cacheHit).toBe(false);
    });

    it('should handle conditional blocks', async () => {
      const template = '{% if showMessage %}Hello {{name}}{% endif %}';
      const variables = { showMessage: true, name: 'John' };

      const result = await renderer.renderTemplate(template, variables);

      expect(result.content).toBe('Hello John');
    });

    it('should handle nested conditionals', async () => {
      const template = '{% if user %}{% if user.name %}Hello {{user.name}}{% endif %}{% endif %}';
      const variables = { user: { name: 'John' } };

      const result = await renderer.renderTemplate(template, variables);

      expect(result.content).toBe('Hello John');
    });

    it('should extract template variables', () => {
      const template = 'Hello {{name}}, welcome to {{project}}! {% if showMessage %}{{message}}{% endif %}';
      const variables = renderer.getTemplateVariables(template);

      expect(variables).toContain('name');
      expect(variables).toContain('project');
      expect(variables).toContain('message');
    });

    it('should validate variables', () => {
      const template = 'Hello {{name}}, welcome to {{project}}!';
      const providedVariables = { name: 'John' };
      const missingVariables = renderer.validateVariables(template, providedVariables);

      expect(missingVariables).toContain('project');
    });

    it('should handle caching', async () => {
      const template = 'Hello {{name}}!';
      const variables = { name: 'John' };

      // First render
      const result1 = await renderer.renderTemplate(template, variables, { enableCache: true });
      expect(result1.cacheHit).toBe(false);

      // Second render (should hit cache)
      const result2 = await renderer.renderTemplate(template, variables, { enableCache: true });
      expect(result2.cacheHit).toBe(true);
    });
  });

  describe('Template Validator Tests', () => {
    const validTemplate: TemplateConfig = {
      name: 'Valid Template',
      description: 'A valid template',
      version: '1.0.0',
      files: [
        { path: 'test.ts', content: 'console.log("{{message}}");' },
      ],
    };

    it('should validate template syntax', async () => {
      const result = await validator.validateTemplateSyntax(validTemplate);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate template configuration', async () => {
      const result = await validator.validateTemplate(validTemplate, 'test-template');

      expect(result.configuration.isValid).toBe(true);
      expect(result.configuration.errors).toHaveLength(0);
    });

    it('should validate template metadata', async () => {
      const result = await validator.validateTemplate(validTemplate, 'test-template');

      expect(result.metadata.isValid).toBe(true);
      expect(result.metadata.errors).toHaveLength(0);
    });

    it('should validate complete template', async () => {
      const result = await validator.validateTemplate(validTemplate, 'test-template');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.templateId).toBe('test-template');
    });

    it('should detect invalid template syntax', async () => {
      const invalidTemplate: TemplateConfig = {
        name: 'Invalid Template',
        description: 'An invalid template',
        version: '1.0.0',
        files: [
          { path: 'test.ts', content: 'console.log("{{unclosed");' },
        ],
      };

      const result = await validator.validateTemplateSyntax(invalidTemplate);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Template Cache Tests', () => {
    it('should cache and retrieve template metadata', async () => {
      const metadata = {
        id: 'test-template',
        name: 'Test Template',
        description: 'A test template',
        version: '1.0.0',
        tags: ['test'],
        languages: ['typescript'],
        category: 'test',
        lastModified: new Date(),
        fileCount: 1,
        size: 1024,
      };

      cache.setTemplateMetadata('test-template', metadata);
      const retrieved = await cache.getTemplateMetadata('test-template');

      expect(retrieved).toEqual(metadata);
    });

    it('should cache and retrieve template content', async () => {
      const content = 'console.log("Hello World");';
      cache.setTemplateContent('test-content', content);
      const retrieved = await cache.getTemplateContent('test-content');

      expect(retrieved).toBe(content);
    });

    it('should handle cache expiration', async () => {
      const content = 'console.log("Hello World");';
      cache.setTemplateContent('test-content', content, 1); // 1ms TTL

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 10));
      const retrieved = await cache.getTemplateContent('test-content');

      expect(retrieved).toBeNull();
    });

    it('should provide cache statistics', () => {
      const content = 'console.log("Hello World");';
      cache.setTemplateContent('test-content', content);

      const stats = cache.getStats();
      expect(stats.size).toBeGreaterThan(0);
      expect(stats.hitRate).toBeGreaterThanOrEqual(0);
    });

    it('should invalidate cache entries', () => {
      const content = 'console.log("Hello World");';
      cache.setTemplateContent('test-content', content);
      cache.invalidateTemplate('test-content');

      const stats = cache.getStats();
      expect(stats.size).toBe(0);
    });
  });

  describe('Output Formatter Tests', () => {
    it('should format TypeScript code', () => {
      const code = 'function test(){console.log("hello");}';
      const result = formatter.formatCode(code, 'test.ts');

      expect(result.content).toContain('function test()');
      expect(result.formattedLength).toBeGreaterThan(result.originalLength);
    });

    it('should format Markdown code', () => {
      const code = '# Title\n\nContent';
      const result = formatter.formatCode(code, 'README.md');

      expect(result.content).toContain('# Title');
      expect(result.formattedLength).toBeGreaterThan(result.originalLength);
    });

    it('should add file headers', () => {
      const code = 'console.log("Hello");';
      const result = formatter.addFileHeader(code, 'test.ts', { includeDescription: 'Test file' });

      expect(result).toContain('// File: test.ts');
      expect(result).toContain('// Description: Test file');
    });

    it('should add file footers', () => {
      const code = 'console.log("Hello");';
      const result = formatter.addFileFooter(code, 'test.ts');

      expect(result).toContain('// End of file: test.ts');
    });

    it('should validate output quality', () => {
      const code = 'console.log("Hello");';
      const result = formatter.validateOutput(code, 'test.ts');

      expect(result.isValid).toBe(true);
      expect(result.issues).toBeDefined();
    });
  });

  describe('Error Handler Tests', () => {
    it('should categorize errors correctly', () => {
      const templateError = new Error('Template syntax error: missing closing tag');
      const categorized = errorHandler.categorizeError(templateError);

      expect(categorized.category).toBe(ErrorCategory.TEMPLATE_SYNTAX);
      expect(categorized.severity).toBe(ErrorSeverity.MEDIUM);
      expect(categorized.recoverable).toBe(true);
    });

    it('should categorize file operation errors', () => {
      const fileError = new Error('File not found: test.ts');
      const categorized = errorHandler.categorizeError(fileError);

      expect(categorized.category).toBe(ErrorCategory.FILE_OPERATION);
      expect(categorized.severity).toBe(ErrorSeverity.HIGH);
    });

    it('should categorize variable resolution errors', () => {
      const variableError = new Error('Variable undefined is not defined');
      const categorized = errorHandler.categorizeError(variableError);

      expect(categorized.category).toBe(ErrorCategory.VARIABLE_RESOLUTION);
      expect(categorized.recoverable).toBe(true);
    });

    it('should generate error reports', () => {
      const templateError = new Error('Template syntax error');
      errorHandler.categorizeError(templateError);

      const report = errorHandler.generateErrorReport();
      expect(report.summary.totalErrors).toBe(1);
      expect(report.errors.length).toBe(1);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });

    it('should provide error statistics', () => {
      const templateError = new Error('Template syntax error');
      const fileError = new Error('File not found');
      
      errorHandler.categorizeError(templateError);
      errorHandler.categorizeError(fileError);

      const stats = errorHandler.getErrorStatistics();
      expect(stats.totalErrors).toBe(2);
      expect(stats.errorsByCategory[ErrorCategory.TEMPLATE_SYNTAX]).toBe(1);
      expect(stats.errorsByCategory[ErrorCategory.FILE_OPERATION]).toBe(1);
    });
  });

  describe('Rollback Manager Tests', () => {
    it('should create file backup', async () => {
      const filePath = 'test.ts';
      const operation = await rollbackManager.createFileBackup(filePath, 'update');

      expect(operation.type).toBe('file');
      expect(operation.action).toBe('update');
      expect(operation.path).toBe(filePath);
      expect(operation.status).toBe('pending');
    });

    it('should create directory backup', async () => {
      const dirPath = 'src/components';
      const operation = await rollbackManager.createDirectoryBackup(dirPath, 'delete');

      expect(operation.type).toBe('directory');
      expect(operation.action).toBe('delete');
      expect(operation.path).toBe(dirPath);
    });

    it('should create configuration backup', async () => {
      const configPath = 'config.json';
      const config = { name: 'test', version: '1.0.0' };
      const operation = await rollbackManager.createConfigurationBackup(configPath, config);

      expect(operation.type).toBe('configuration');
      expect(operation.action).toBe('update');
      expect(operation.originalConfig).toEqual(config);
    });

    it('should create rollback points', async () => {
      const filePath = 'test.ts';
      await rollbackManager.createFileBackup(filePath, 'update');
      
      const point = await rollbackManager.createRollbackPoint('Test Point', 'Test description');
      
      expect(point.name).toBe('Test Point');
      expect(point.description).toBe('Test description');
      expect(point.status).toBe('active');
      expect(point.operations.length).toBe(1);
    });

    it('should provide rollback statistics', () => {
      const stats = rollbackManager.getRollbackStatistics();
      expect(stats.totalPoints).toBeGreaterThanOrEqual(0);
      expect(stats.totalOperations).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Recovery Manager Tests', () => {
    it('should handle errors automatically', async () => {
      const templateError = new Error('Template syntax error');
      const result = await recoveryManager.handleError(templateError, {
        templateName: 'test-template',
      });

      expect(result.recovered).toBeDefined();
      expect(result.action).toBeDefined();
    });

    it('should perform manual recovery', async () => {
      const result = await recoveryManager.performManualRecovery(
        'test-error-id',
        'template_syntax_fix',
        ['Clear caches', 'Revalidate template']
      );

      expect(result.success).toBeDefined();
      expect(result.action).toBeDefined();
      expect(result.action.type).toBe('manual');
    });

    it('should implement error prevention', async () => {
      const result = await recoveryManager.implementErrorPrevention();

      expect(result.preventionRules).toBeDefined();
      expect(result.appliedRules).toBeGreaterThanOrEqual(0);
      expect(result.preventedErrors).toBeGreaterThanOrEqual(0);
    });

    it('should monitor system health', async () => {
      const health = await recoveryManager.monitorSystemHealth();

      expect(health.health).toMatch(/^(good|warning|critical)$/);
      expect(health.metrics).toBeDefined();
      expect(health.alerts).toBeDefined();
    });

    it('should provide recovery statistics', () => {
      const stats = recoveryManager.getRecoveryStatistics();
      expect(stats.totalRecoveries).toBeGreaterThanOrEqual(0);
      expect(stats.recoveryRate).toBeGreaterThanOrEqual(0);
      expect(stats.recoveryRate).toBeLessThanOrEqual(1);
    });
  });

  describe('Parallel Processor Tests', () => {
    const mockTemplate: TemplateConfig = {
      name: 'Test Template',
      description: 'A test template',
      version: '1.0.0',
      files: [
        { path: 'test1.ts', content: 'console.log("{{message1}}");' },
        { path: 'test2.ts', content: 'console.log("{{message2}}");' },
      ],
    };

    it('should process file generation in parallel', async () => {
      const variables = { message1: 'Hello', message2: 'World' };
      const outputDir = 'output';

      const results = await parallelProcessor.processFileGeneration(
        mockTemplate,
        variables,
        outputDir
      );

      expect(results.length).toBe(2);
      expect(results[0]?.success).toBeDefined();
      expect(results[1]?.success).toBeDefined();
    });

    it('should process template validation in parallel', async () => {
      const templates = [mockTemplate];

      const results = await parallelProcessor.processTemplateValidation(templates);

      expect(results.length).toBe(1);
      expect(results[0]?.success).toBeDefined();
    });

    it('should process variable resolution in parallel', async () => {
      const templates = [mockTemplate];
      const variables = { message1: 'Hello', message2: 'World' };

      const results = await parallelProcessor.processVariableResolution(templates, variables);

      expect(results.length).toBe(2); // One for each file
      expect(results[0]?.success).toBeDefined();
      expect(results[1]?.success).toBeDefined();
    });

    it('should provide processing statistics', () => {
      const stats = parallelProcessor.getStats();
      expect(stats.totalTasks).toBeGreaterThanOrEqual(0);
      expect(stats.completedTasks).toBeGreaterThanOrEqual(0);
      expect(stats.averageProcessingTime).toBeGreaterThanOrEqual(0);
    });

    it('should optimize concurrency', () => {
      const optimalConcurrency = parallelProcessor.optimizeConcurrency();
      expect(optimalConcurrency).toBeGreaterThan(0);
      expect(optimalConcurrency).toBeLessThanOrEqual(8);
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete template rendering workflow', async () => {
      const template: TemplateConfig = {
        name: 'Integration Test Template',
        description: 'A template for integration testing',
        version: '1.0.0',
        files: [
          { path: 'main.ts', content: 'console.log("Hello {{name}}!");' },
          { path: 'README.md', content: '# {{projectName}}\n\n{{description}}' },
        ],
      };

      // Validate template
      const validation = await validator.validateTemplate(template, 'integration-test');
      expect(validation.isValid).toBe(true);

      // Render template
      const variables = { name: 'World', projectName: 'Test Project', description: 'A test project' };
      const renderResult = await renderer.renderTemplate(template.files[0]?.content || '', variables);
      expect(renderResult.content).toBe('console.log("Hello World!");');

      // Format output
      const formatted = formatter.formatCode(renderResult.content, 'main.ts');
      expect(formatted.content).toContain('console.log');

      // Cache result
      cache.setTemplateContent('integration-test', formatted.content);
      const cached = await cache.getTemplateContent('integration-test');
      expect(cached).toBe(formatted.content);
    });

    it('should handle errors gracefully', async () => {
      const invalidTemplate: TemplateConfig = {
        name: 'Invalid Template',
        description: 'An invalid template',
        version: '1.0.0',
        files: [
          { path: 'test.ts', content: 'console.log("{{unclosed");' },
        ],
      };

      // This should trigger an error
      const validation = await validator.validateTemplate(invalidTemplate, 'invalid-test');
      expect(validation.isValid).toBe(false);

      // Error should be categorized
      const error = new Error('Template validation failed');
      const categorized = errorHandler.categorizeError(error);
      expect(categorized.category).toBe(ErrorCategory.VALIDATION);

      // Recovery should be attempted
      const recovery = await recoveryManager.handleError(error);
      expect(recovery.recovered).toBeDefined();
    });
  });
}); 