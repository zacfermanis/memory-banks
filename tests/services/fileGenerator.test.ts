import { FileGenerator, FileGenerationOptions, TemplateFileDefinition } from '../../src/services/fileGenerator';
import { FileSystemUtils } from '../../src/utils/fileSystem';
import path from 'path';

// Mock FileSystemUtils
jest.mock('../../src/utils/fileSystem');
const mockFileSystem = FileSystemUtils as jest.Mocked<typeof FileSystemUtils>;

describe('FileGenerator', () => {
  let fileGenerator: FileGenerator;
  let mockOptions: FileGenerationOptions;

  beforeEach(() => {
    fileGenerator = new FileGenerator();
    mockOptions = {
      outputDir: '/test/output',
      overwrite: false,
      backup: false,
      dryRun: false,
      force: false,
      validatePaths: true,
      createBackups: false,
      conflictStrategy: 'ask',
    };

    // Reset all mocks
    jest.clearAllMocks();

    // Setup default mock implementations
    mockFileSystem.ensureDirectory.mockResolvedValue();
    mockFileSystem.fileExists.mockResolvedValue(false);
    mockFileSystem.directoryExists.mockResolvedValue(false);
    mockFileSystem.createFileCrossPlatform.mockResolvedValue({
      success: true,
      path: '/test/output/file.md',
      platform: 'win32',
      optimizations: [],
      warnings: [],
    });
    mockFileSystem.getFileMetadata.mockResolvedValue({
      size: 100,
      created: new Date(),
      modified: new Date(),
      permissions: '644',
      owner: 'user',
      checksum: 'abc123',
    });
    mockFileSystem.detectFileConflict.mockResolvedValue(null);
    mockFileSystem.resolveConflictIntelligently.mockResolvedValue({
      strategy: 'overwrite',
      userConfirmed: true,
    });
    mockFileSystem.createSkipStrategy.mockReturnValue({
      strategy: 'skip',
      userConfirmed: false,
    });
    mockFileSystem.createBackupRenameStrategy.mockReturnValue({
      strategy: 'backup',
      userConfirmed: false,
      backupPath: '/test/output/file.md.backup',
    });
    mockFileSystem.createBackup.mockResolvedValue({
      id: 'backup-123',
      timestamp: new Date(),
      type: 'file',
      target: '/test/output/file.md',
      backupPath: '/test/output/file.md.backup',
      metadata: {
        originalSize: 100,
        backupSize: 100,
        checksum: 'abc123',
        dependencies: [],
        rollbackSteps: [],
      },
      status: 'completed',
    });
  });

  describe('File Path Resolution', () => {
    it('should resolve file paths with variable substitution', async () => {
      const templateFile: TemplateFileDefinition = {
        path: '{{projectName}}/{{fileName}}.md',
        content: 'Test content',
      };

      const variables = {
        projectName: 'my-project',
        fileName: 'readme',
      };

      const result = await fileGenerator.generateFiles([templateFile], variables, mockOptions);

      expect(result.success).toBe(true);
      expect(result.files).toHaveLength(1);
      expect(result.files[0]?.path).toBe(path.join('/test/output', 'my-project/readme.md'));
    });

    it('should normalize and validate paths', async () => {
      const templateFile: TemplateFileDefinition = {
        path: 'test/../{{fileName}}.md',
        content: 'Test content',
      };

      const variables = { fileName: 'readme' };

      const result = await fileGenerator.generateFiles([templateFile], variables, mockOptions);

      expect(result.success).toBe(true);
      expect(result.files).toHaveLength(1);
      expect(result.files[0]?.path).toBe(path.join('/test/output', 'readme.md'));
    });

    it('should reject paths with traversal attempts', async () => {
      const templateFile: TemplateFileDefinition = {
        path: '../../../etc/passwd',
        content: 'Test content',
      };

      const result = await fileGenerator.generateFiles([templateFile], {}, mockOptions);

      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('Invalid path');
    });
  });

  describe('File Generation', () => {
    it('should generate files successfully', async () => {
      const templateFiles: TemplateFileDefinition[] = [
        {
          path: 'file1.md',
          content: 'Content 1',
        },
        {
          path: 'file2.md',
          content: 'Content 2',
        },
      ];

      const result = await fileGenerator.generateFiles(templateFiles, {}, mockOptions);

      expect(result.success).toBe(true);
      expect(result.files).toHaveLength(2);
      expect(result.summary.createdFiles).toBe(2);
      expect(result.summary.totalFiles).toBe(2);
    });

    it('should handle conditional file generation', async () => {
      const templateFiles: TemplateFileDefinition[] = [
        {
          path: 'always.md',
          content: 'Always created',
        },
        {
          path: 'conditional.md',
          content: 'Conditional content',
          condition: 'shouldCreate',
        },
      ];

      const variables = { shouldCreate: true };

      const result = await fileGenerator.generateFiles(templateFiles, variables, mockOptions);

      expect(result.success).toBe(true);
      expect(result.files).toHaveLength(2);
      expect(result.summary.createdFiles).toBe(2);
    });

    it('should skip files when condition is false', async () => {
      const templateFiles: TemplateFileDefinition[] = [
        {
          path: 'always.md',
          content: 'Always created',
        },
        {
          path: 'conditional.md',
          content: 'Conditional content',
          condition: 'shouldCreate',
        },
      ];

      const variables = { shouldCreate: false };

      const result = await fileGenerator.generateFiles(templateFiles, variables, mockOptions);

      expect(result.success).toBe(true);
      expect(result.files).toHaveLength(1);
      expect(result.summary.createdFiles).toBe(1);
      expect(result.summary.skippedFiles).toBe(1);
      expect(result.warnings[0]).toContain('condition not met');
    });

    it('should handle file overwrites', async () => {
      mockFileSystem.fileExists.mockResolvedValue(true);

      const templateFiles: TemplateFileDefinition[] = [
        {
          path: 'existing.md',
          content: 'New content',
          overwrite: true,
        },
      ];

      const options = { ...mockOptions, overwrite: true };

      const result = await fileGenerator.generateFiles(templateFiles, {}, options);

      expect(result.success).toBe(true);
      expect(result.files).toHaveLength(1);
      expect(result.files[0]?.overwritten).toBe(true);
      expect(result.summary.updatedFiles).toBe(1);
    });
  });

  describe('Conflict Resolution', () => {
    it('should detect file conflicts', async () => {
      mockFileSystem.fileExists.mockResolvedValue(true);
      mockFileSystem.detectFileConflict.mockResolvedValue({
        type: 'overwrite',
        source: '/source/file.md',
        destination: '/test/output/file.md',
        sourceMetadata: {
          size: 100,
          created: new Date(),
          modified: new Date(),
          permissions: '644',
          owner: 'user',
        },
        destinationMetadata: {
          size: 200,
          created: new Date(),
          modified: new Date(),
          permissions: '644',
          owner: 'user',
        },
      });

      const templateFiles: TemplateFileDefinition[] = [
        {
          path: 'file.md',
          content: 'New content',
        },
      ];

      const result = await fileGenerator.generateFiles(templateFiles, {}, mockOptions);

      expect(result.conflicts).toHaveLength(1);
    });

    it('should handle skip conflict strategy', async () => {
      mockFileSystem.fileExists.mockResolvedValue(true);
      mockFileSystem.detectFileConflict.mockResolvedValue({
        type: 'overwrite',
        source: '/source/file.md',
        destination: '/test/output/file.md',
        sourceMetadata: {
          size: 100,
          created: new Date(),
          modified: new Date(),
          permissions: '644',
          owner: 'user',
        },
        destinationMetadata: {
          size: 200,
          created: new Date(),
          modified: new Date(),
          permissions: '644',
          owner: 'user',
        },
      });

      const options = { ...mockOptions, conflictStrategy: 'skip' as const };

      const templateFiles: TemplateFileDefinition[] = [
        {
          path: 'file.md',
          content: 'New content',
        },
      ];

      const result = await fileGenerator.generateFiles(templateFiles, {}, options);

      expect(result.summary.skippedFiles).toBe(1);
      expect(result.warnings[0]).toContain('conflict resolution: skip');
    });

    it('should handle backup conflict strategy', async () => {
      mockFileSystem.fileExists.mockResolvedValue(true);
      mockFileSystem.detectFileConflict.mockResolvedValue({
        type: 'overwrite',
        source: '/source/file.md',
        destination: '/test/output/file.md',
        sourceMetadata: {
          size: 100,
          created: new Date(),
          modified: new Date(),
          permissions: '644',
          owner: 'user',
        },
        destinationMetadata: {
          size: 200,
          created: new Date(),
          modified: new Date(),
          permissions: '644',
          owner: 'user',
        },
      });

      const options = { ...mockOptions, conflictStrategy: 'backup' as const, createBackups: true };

      const templateFiles: TemplateFileDefinition[] = [
        {
          path: 'file.md',
          content: 'New content',
        },
      ];

      const result = await fileGenerator.generateFiles(templateFiles, {}, options);

      expect(result.success).toBe(true);
      expect(result.files).toHaveLength(1);
    });
  });

  describe('Directory Management', () => {
    it('should create directories successfully', async () => {
      const directories = ['src', 'src/components', 'docs'];

      const result = await fileGenerator.generateDirectories(directories, mockOptions);

      expect(result).toHaveLength(3);
      expect(result[0]?.created).toBe(true);
      expect(result[0]?.path).toBe(path.join('/test/output', 'src'));
    });

    it('should handle existing directories', async () => {
      mockFileSystem.directoryExists.mockResolvedValue(true);

      const directories = ['existing-dir'];

      const result = await fileGenerator.generateDirectories(directories, mockOptions);

      expect(result).toHaveLength(1);
      expect(result[0]?.created).toBe(false);
      expect(result[0]?.existing).toBe(true);
    });

    it('should ensure output directory exists', async () => {
      const templateFiles: TemplateFileDefinition[] = [
        {
          path: 'test.md',
          content: 'Test content',
        },
      ];

      await fileGenerator.generateFiles(templateFiles, {}, mockOptions);

      expect(mockFileSystem.ensureDirectory).toHaveBeenCalledWith('/test/output');
    });
  });

  describe('Preview Generation', () => {
    it('should preview file generation without creating files', async () => {
      const templateFiles: TemplateFileDefinition[] = [
        {
          path: 'file1.md',
          content: 'Content 1',
        },
        {
          path: 'file2.md',
          content: 'Content 2',
          condition: 'shouldCreate',
        },
      ];

      const variables = { shouldCreate: true };

      const preview = await fileGenerator.previewGeneration(templateFiles, variables, mockOptions);

      expect(preview.files).toHaveLength(2);
      expect(preview.files[0]?.wouldCreate).toBe(true);
      expect(preview.warnings).toHaveLength(0);
    });

    it('should detect conflicts in preview', async () => {
      mockFileSystem.fileExists.mockResolvedValue(true);
      mockFileSystem.detectFileConflict.mockResolvedValue({
        type: 'overwrite',
        source: '/source/file.md',
        destination: '/test/output/file.md',
        sourceMetadata: {
          size: 100,
          created: new Date(),
          modified: new Date(),
          permissions: '644',
          owner: 'user',
        },
        destinationMetadata: {
          size: 200,
          created: new Date(),
          modified: new Date(),
          permissions: '644',
          owner: 'user',
        },
      });

      const templateFiles: TemplateFileDefinition[] = [
        {
          path: 'file.md',
          content: 'New content',
        },
      ];

      const options = { ...mockOptions, overwrite: true };
      const preview = await fileGenerator.previewGeneration(templateFiles, {}, options);

      expect(preview.conflicts).toHaveLength(1);
      expect(preview.files[0]?.wouldOverwrite).toBe(true);
    });

    it('should show conditional files in preview', async () => {
      const templateFiles: TemplateFileDefinition[] = [
        {
          path: 'conditional.md',
          content: 'Conditional content',
          condition: 'shouldCreate',
        },
      ];

      const variables = { shouldCreate: false };

      const preview = await fileGenerator.previewGeneration(templateFiles, variables, mockOptions);

      expect(preview.files).toHaveLength(0);
      expect(preview.warnings[0]).toContain('Would skip');
    });
  });

  describe('Rollback Functionality', () => {
    it('should rollback file generation', async () => {
      const generatedFiles = [
        {
          path: '/test/output/file1.md',
          content: 'Content 1',
          originalPath: '/test/output/file1.md',
          backupPath: '/test/output/file1.md.backup',
          permissions: '644',
          overwritten: true,
          size: 100,
        },
        {
          path: '/test/output/file2.md',
          content: 'Content 2',
          permissions: '644',
          overwritten: false,
          size: 100,
        },
      ];

      mockFileSystem.readFile.mockResolvedValue('Original content');
      mockFileSystem.safeWriteFile.mockResolvedValue();

      const result = await fileGenerator.rollbackGeneration(generatedFiles, mockOptions);

      expect(result.success).toBe(true);
      expect(result.rolledBack).toBe(2);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle rollback errors', async () => {
      const generatedFiles = [
        {
          path: '/test/output/file1.md',
          content: 'Content 1',
          permissions: '644',
          overwritten: false,
          size: 100,
        },
      ];

      mockFileSystem.safeWriteFile.mockRejectedValue(new Error('Permission denied'));

      const result = await fileGenerator.rollbackGeneration(generatedFiles, mockOptions);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Failed to rollback');
    });
  });

  describe('Error Handling', () => {
    it('should handle file creation errors', async () => {
      mockFileSystem.createFileCrossPlatform.mockRejectedValue(new Error('Disk full'));

      const templateFiles: TemplateFileDefinition[] = [
        {
          path: 'file.md',
          content: 'Test content',
        },
      ];

      const result = await fileGenerator.generateFiles(templateFiles, {}, mockOptions);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Failed to process');
    });

    it('should handle path resolution errors', async () => {
      const templateFiles: TemplateFileDefinition[] = [
        {
          path: '{{invalidPath}}/file.md',
          content: 'Test content',
        },
      ];

      const result = await fileGenerator.generateFiles(templateFiles, {}, mockOptions);

      expect(result.success).toBe(true);
      expect(result.files).toHaveLength(1);
      expect(result.files[0]?.path).toContain('{{invalidPath}}');
    });

    it('should continue processing other files when one fails', async () => {
      mockFileSystem.createFileCrossPlatform
        .mockResolvedValueOnce({
          success: true,
          path: '/test/output/file1.md',
          platform: 'win32',
          optimizations: [],
          warnings: [],
        })
        .mockRejectedValueOnce(new Error('Disk full'))
        .mockResolvedValueOnce({
          success: true,
          path: '/test/output/file3.md',
          platform: 'win32',
          optimizations: [],
          warnings: [],
        });

      const templateFiles: TemplateFileDefinition[] = [
        {
          path: 'file1.md',
          content: 'Content 1',
        },
        {
          path: 'file2.md',
          content: 'Content 2',
        },
        {
          path: 'file3.md',
          content: 'Content 3',
        },
      ];

      const result = await fileGenerator.generateFiles(templateFiles, {}, mockOptions);

      expect(result.success).toBe(false);
      expect(result.files).toHaveLength(2);
      expect(result.errors).toHaveLength(1);
      expect(result.summary.createdFiles).toBe(2);
      expect(result.summary.skippedFiles).toBe(1);
    });
  });

  describe('Integration with Template Renderer', () => {
    it('should render template content with variables', async () => {
      const templateFiles: TemplateFileDefinition[] = [
        {
          path: '{{projectName}}.md',
          content: 'Project: {{projectName}}\nDescription: {{description}}',
        },
      ];

      const variables = {
        projectName: 'My Project',
        description: 'A test project',
      };

      const result = await fileGenerator.generateFiles(templateFiles, variables, mockOptions);

      expect(result.success).toBe(true);
      expect(result.files).toHaveLength(1);
      expect(result.files[0]?.content).toBe('Project: My Project\nDescription: A test project');
      expect(result.files[0]?.path).toBe(path.join('/test/output', 'My Project.md'));
    });

    it('should handle conditional content in templates', async () => {
      const templateFiles: TemplateFileDefinition[] = [
        {
          path: 'readme.md',
          content: '{% if hasTests %}Tests: Yes{% endif %}{% if hasDocs %}Docs: Yes{% endif %}',
        },
      ];

      const variables = {
        hasTests: true,
        hasDocs: false,
      };

      const result = await fileGenerator.generateFiles(templateFiles, variables, mockOptions);

      expect(result.success).toBe(true);
      expect(result.files).toHaveLength(1);
      expect(result.files[0]?.content).toBe('Tests: Yes');
    });
  });
}); 