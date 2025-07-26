import { BatchProcessor, BatchConfig, BatchProject } from '../../src/utils/batchProcessor';
import { ConfigManager } from '../../src/utils/configManager';

// Mock chalk
jest.mock('chalk', () => ({
  blue: jest.fn((text: string) => `BLUE:${text}`),
  green: jest.fn((text: string) => `GREEN:${text}`),
  red: jest.fn((text: string) => `RED:${text}`),
  yellow: jest.fn((text: string) => `YELLOW:${text}`),
  gray: jest.fn((text: string) => `GRAY:${text}`)
}));

// Mock dependencies
jest.mock('../../src/utils/configManager');
jest.mock('../../src/services/templateRegistry');
jest.mock('../../src/services/templateRenderer');
jest.mock('../../src/utils/fileSystem');
jest.mock('../../src/utils/validation');
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn()
  }
}));

const mockConfigManager = ConfigManager as jest.Mocked<typeof ConfigManager>;

describe('BatchProcessor', () => {
  let processor: BatchProcessor;

  beforeEach(() => {
    processor = new BatchProcessor();
    jest.clearAllMocks();
  });

  describe('processBatch', () => {
    it('should process batch sequentially by default', async () => {
      const batchConfig: BatchConfig = {
        projects: [
          { name: 'Project 1', template: 'typescript' },
          { name: 'Project 2', template: 'typescript' }
        ]
      };

      // Mock the processProject method
      const mockProcessProject = jest.spyOn(processor as any, 'processProject')
        .mockResolvedValue({
          project: { name: 'Project 1', template: 'typescript' },
          success: true,
          createdFiles: 5,
          skippedFiles: 0,
          errors: [],
          warnings: [],
          duration: 100
        });

      const result = await processor.processBatch(batchConfig);

      expect(result.totalProjects).toBe(2);
      expect(result.successfulProjects).toBe(2);
      expect(mockProcessProject).toHaveBeenCalledTimes(2);
    });

    it('should process batch in parallel when specified', async () => {
      const batchConfig: BatchConfig = {
        projects: [
          { name: 'Project 1', template: 'typescript' },
          { name: 'Project 2', template: 'typescript' },
          { name: 'Project 3', template: 'typescript' }
        ],
        parallel: true,
        maxConcurrency: 2
      };

      // Mock the processProject method
      const mockProcessProject = jest.spyOn(processor as any, 'processProject')
        .mockResolvedValue({
          project: { name: 'Project 1', template: 'typescript' },
          success: true,
          createdFiles: 5,
          skippedFiles: 0,
          errors: [],
          warnings: [],
          duration: 100
        });

      const result = await processor.processBatch(batchConfig);

      expect(result.totalProjects).toBe(3);
      expect(result.successfulProjects).toBe(3);
      expect(mockProcessProject).toHaveBeenCalledTimes(3);
    });
  });

  describe('processProject', () => {
    it('should process a valid project successfully', async () => {
      const project: BatchProject = {
        name: 'Test Project',
        template: 'typescript'
      };

      // Mock validation to pass
      jest.spyOn(require('../../src/utils/validation').ValidationUtils, 'validateProjectName')
        .mockReturnValue({
          isValid: true,
          errors: [],
          warnings: []
        });

      jest.spyOn(require('../../src/utils/validation').ValidationUtils, 'validateTemplateId')
        .mockReturnValue({
          isValid: true,
          errors: [],
          warnings: []
        });

      // Mock template registry
      jest.spyOn(processor['registry'], 'templateExists')
        .mockResolvedValue(true);
      
      jest.spyOn(processor['registry'], 'getTemplate')
        .mockResolvedValue({
          name: 'TypeScript Template',
          description: 'A TypeScript template',
          version: '1.0.0',
          files: [
            { path: 'projectBrief.md', content: 'Project: {{projectName}}' },
            { path: 'activeContext.md', content: 'Context for {{projectName}}' }
          ]
        });

      // Mock template renderer
      jest.spyOn(processor['renderer'], 'validateVariables')
        .mockReturnValue([]);
      
      jest.spyOn(processor['renderer'], 'renderTemplate')
        .mockResolvedValue({ content: 'Rendered content', renderTime: 1, cacheHit: false, iterations: 0 });

      // Mock file system
      jest.spyOn(require('../../src/utils/fileSystem').FileSystemUtils, 'fileExists')
        .mockResolvedValue(false);
      
      jest.spyOn(require('../../src/utils/fileSystem').FileSystemUtils, 'safeWriteFile')
        .mockResolvedValue(undefined);

      // Mock config manager
      mockConfigManager.getDefaultConfig.mockResolvedValue({
        projectName: 'Test Project',
        projectType: 'Web Application',
        projectDescription: 'A test project',
        version: '1.0.0',
        author: 'Test Author',
        license: 'MIT',
        framework: 'React',
        buildTool: 'Vite',
        requirement1: 'Test requirement 1',
        requirement2: 'Test requirement 2',
        requirement3: 'Test requirement 3',
        success1: 'Test success 1',
        success2: 'Test success 2',
        success3: 'Test success 3',
        problemStatement: 'Test problem statement',
        solutionOverview: 'Test solution overview',
        uxGoal1: 'Test UX goal 1',
        uxGoal2: 'Test UX goal 2',
        uxGoal3: 'Test UX goal 3',
        architectureOverview: 'Test architecture overview',
        pattern1: 'Test pattern 1',
        pattern2: 'Test pattern 2',
        pattern3: 'Test pattern 3',
        componentRelationships: 'Test component relationships',
        devSetup: 'Test dev setup',
        dependencies: 'Test dependencies',
        currentFocus: 'Test current focus',
        recentChanges: 'Test recent changes',
        nextSteps: 'Test next steps',
        activeDecisions: 'Test active decisions',
        whatWorks: 'Test what works',
        whatsLeft: 'Test what\'s left',
        currentStatus: 'Test current status',
        knownIssues: 'Test known issues'
      });

      const result = await (processor as any).processProject(project);

      expect(result.success).toBe(true);
      expect(result.createdFiles).toBe(2);
      expect(result.skippedFiles).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle invalid project name', async () => {
      const project: BatchProject = {
        name: '', // Invalid name
        template: 'typescript'
      };

      // Mock validation to return invalid result
      jest.spyOn(require('../../src/utils/validation').ValidationUtils, 'validateProjectName')
        .mockReturnValue({
          isValid: false,
          errors: ['Project name is required'],
          warnings: []
        });

      // Mock template ID validation to pass
      jest.spyOn(require('../../src/utils/validation').ValidationUtils, 'validateTemplateId')
        .mockReturnValue({
          isValid: true,
          errors: [],
          warnings: []
        });

      const result = await (processor as any).processProject(project);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Invalid project name: Project name is required');
    });

    it('should handle invalid template ID', async () => {
      const project: BatchProject = {
        name: 'Test Project',
        template: '@invalid' // Invalid template ID
      };

      // Mock project name validation to pass
      jest.spyOn(require('../../src/utils/validation').ValidationUtils, 'validateProjectName')
        .mockReturnValue({
          isValid: true,
          errors: [],
          warnings: []
        });

      // Mock validation to return invalid result for template ID
      jest.spyOn(require('../../src/utils/validation').ValidationUtils, 'validateTemplateId')
        .mockReturnValue({
          isValid: false,
          errors: ['Template ID can only contain letters, numbers, hyphens, and underscores'],
          warnings: []
        });

      const result = await (processor as any).processProject(project);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Invalid template ID: Template ID can only contain letters, numbers, hyphens, and underscores');
    });

    it('should handle template not found', async () => {
      const project: BatchProject = {
        name: 'Test Project',
        template: 'nonexistent'
      };

      // Mock validation to pass
      jest.spyOn(require('../../src/utils/validation').ValidationUtils, 'validateProjectName')
        .mockReturnValue({
          isValid: true,
          errors: [],
          warnings: []
        });

      jest.spyOn(require('../../src/utils/validation').ValidationUtils, 'validateTemplateId')
        .mockReturnValue({
          isValid: true,
          errors: [],
          warnings: []
        });

      // Mock template registry to return false
      jest.spyOn(processor['registry'], 'templateExists')
        .mockResolvedValue(false);

      const result = await (processor as any).processProject(project);

      expect(result.success).toBe(false);
      expect(result.errors).toContain("Template 'nonexistent' not found");
    });

    it('should handle missing template variables', async () => {
      const project: BatchProject = {
        name: 'Test Project',
        template: 'typescript'
      };

      // Mock validation to pass
      jest.spyOn(require('../../src/utils/validation').ValidationUtils, 'validateProjectName')
        .mockReturnValue({
          isValid: true,
          errors: [],
          warnings: []
        });

      jest.spyOn(require('../../src/utils/validation').ValidationUtils, 'validateTemplateId')
        .mockReturnValue({
          isValid: true,
          errors: [],
          warnings: []
        });

      // Mock template registry
      jest.spyOn(processor['registry'], 'templateExists')
        .mockResolvedValue(true);
      
      jest.spyOn(processor['registry'], 'getTemplate')
        .mockResolvedValue({
          name: 'TypeScript Template',
          description: 'A TypeScript template',
          version: '1.0.0',
          files: [
            { path: 'projectBrief.md', content: 'Project: {{missingVariable}}' }
          ]
        });

      // Mock template renderer to return missing variables
      jest.spyOn(processor['renderer'], 'validateVariables')
        .mockReturnValue(['missingVariable']);

      // Mock config manager
      mockConfigManager.getDefaultConfig.mockResolvedValue({
        projectName: 'Test Project',
        projectType: 'Web Application',
        projectDescription: 'A test project',
        version: '1.0.0',
        author: 'Test Author',
        license: 'MIT',
        framework: 'React',
        buildTool: 'Vite',
        requirement1: 'Test requirement 1',
        requirement2: 'Test requirement 2',
        requirement3: 'Test requirement 3',
        success1: 'Test success 1',
        success2: 'Test success 2',
        success3: 'Test success 3',
        problemStatement: 'Test problem statement',
        solutionOverview: 'Test solution overview',
        uxGoal1: 'Test UX goal 1',
        uxGoal2: 'Test UX goal 2',
        uxGoal3: 'Test UX goal 3',
        architectureOverview: 'Test architecture overview',
        pattern1: 'Test pattern 1',
        pattern2: 'Test pattern 2',
        pattern3: 'Test pattern 3',
        componentRelationships: 'Test component relationships',
        devSetup: 'Test dev setup',
        dependencies: 'Test dependencies',
        currentFocus: 'Test current focus',
        recentChanges: 'Test recent changes',
        nextSteps: 'Test next steps',
        activeDecisions: 'Test active decisions',
        whatWorks: 'Test what works',
        whatsLeft: 'Test what\'s left',
        currentStatus: 'Test current status',
        knownIssues: 'Test known issues'
      });

      const result = await (processor as any).processProject(project);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Missing required template variables: missingVariable');
    });

    it('should handle dry run mode', async () => {
      const project: BatchProject = {
        name: 'Test Project',
        template: 'typescript',
        dryRun: true
      };

      // Mock validation to pass
      jest.spyOn(require('../../src/utils/validation').ValidationUtils, 'validateProjectName')
        .mockReturnValue({
          isValid: true,
          errors: [],
          warnings: []
        });

      jest.spyOn(require('../../src/utils/validation').ValidationUtils, 'validateTemplateId')
        .mockReturnValue({
          isValid: true,
          errors: [],
          warnings: []
        });

      // Mock template registry
      jest.spyOn(processor['registry'], 'templateExists')
        .mockResolvedValue(true);
      
      jest.spyOn(processor['registry'], 'getTemplate')
        .mockResolvedValue({
          name: 'TypeScript Template',
          description: 'A TypeScript template',
          version: '1.0.0',
          files: [
            { path: 'projectBrief.md', content: 'Project: {{projectName}}' }
          ]
        });

      // Mock template renderer
      jest.spyOn(processor['renderer'], 'validateVariables')
        .mockReturnValue([]);

      // Mock config manager
      mockConfigManager.getDefaultConfig.mockResolvedValue({
        projectName: 'Test Project',
        projectType: 'Web Application',
        projectDescription: 'A test project',
        version: '1.0.0',
        author: 'Test Author',
        license: 'MIT',
        framework: 'React',
        buildTool: 'Vite',
        requirement1: 'Test requirement 1',
        requirement2: 'Test requirement 2',
        requirement3: 'Test requirement 3',
        success1: 'Test success 1',
        success2: 'Test success 2',
        success3: 'Test success 3',
        problemStatement: 'Test problem statement',
        solutionOverview: 'Test solution overview',
        uxGoal1: 'Test UX goal 1',
        uxGoal2: 'Test UX goal 2',
        uxGoal3: 'Test UX goal 3',
        architectureOverview: 'Test architecture overview',
        pattern1: 'Test pattern 1',
        pattern2: 'Test pattern 2',
        pattern3: 'Test pattern 3',
        componentRelationships: 'Test component relationships',
        devSetup: 'Test dev setup',
        dependencies: 'Test dependencies',
        currentFocus: 'Test current focus',
        recentChanges: 'Test recent changes',
        nextSteps: 'Test next steps',
        activeDecisions: 'Test active decisions',
        whatWorks: 'Test what works',
        whatsLeft: 'Test what\'s left',
        currentStatus: 'Test current status',
        knownIssues: 'Test known issues'
      });

      const result = await (processor as any).processProject(project);

      expect(result.success).toBe(true);
      expect(result.createdFiles).toBe(0);
      expect(result.skippedFiles).toBe(1);
      expect(result.warnings).toContain('Dry run mode - no files created');
    });
  });

  describe('createSummary', () => {
    it('should create correct summary from results', () => {
      const results = [
        {
          project: { name: 'Project 1', template: 'typescript' },
          success: true,
          createdFiles: 5,
          skippedFiles: 0,
          errors: [],
          warnings: [],
          duration: 100
        },
        {
          project: { name: 'Project 2', template: 'typescript' },
          success: false,
          createdFiles: 0,
          skippedFiles: 0,
          errors: ['Template not found'],
          warnings: [],
          duration: 50
        }
      ];

      const summary = (processor as any).createSummary(results, 150);

      expect(summary.totalProjects).toBe(2);
      expect(summary.successfulProjects).toBe(1);
      expect(summary.failedProjects).toBe(1);
      expect(summary.totalFilesCreated).toBe(5);
      expect(summary.totalFilesSkipped).toBe(0);
      expect(summary.totalErrors).toBe(1);
      expect(summary.totalWarnings).toBe(0);
      expect(summary.totalDuration).toBe(150);
    });
  });

  describe('loadBatchConfig', () => {
    it('should load valid batch configuration', async () => {
      const mockConfig: BatchConfig = {
        projects: [
          { name: 'Project 1', template: 'typescript' },
          { name: 'Project 2', template: 'typescript' }
        ],
        parallel: true,
        maxConcurrency: 2
      };

      const mockFs = require('fs').promises;
      (mockFs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockConfig));

      const result = await BatchProcessor.loadBatchConfig('batch-config.json');

      expect(result).toEqual(mockConfig);
    });

    it('should reject configuration without projects array', async () => {
      const mockConfig = { parallel: true };

      const mockFs = require('fs').promises;
      (mockFs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockConfig));

      await expect(BatchProcessor.loadBatchConfig('batch-config.json'))
        .rejects.toThrow('Batch configuration must have a "projects" array');
    });

    it('should reject configuration with invalid projects', async () => {
      const mockConfig = {
        projects: [
          { name: 'Project 1' }, // Missing template
          { template: 'typescript' } // Missing name
        ]
      };

      const mockFs = require('fs').promises;
      (mockFs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockConfig));

      await expect(BatchProcessor.loadBatchConfig('batch-config.json'))
        .rejects.toThrow('Each project must have "name" and "template" fields');
    });

    it('should handle file read errors', async () => {
      const mockFs = require('fs').promises;
      (mockFs.readFile as jest.Mock).mockRejectedValue(new Error('File not found'));

      await expect(BatchProcessor.loadBatchConfig('nonexistent.json'))
        .rejects.toThrow('Failed to load batch configuration: Error: File not found');
    });
  });
}); 