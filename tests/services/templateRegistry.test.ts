import { TemplateRegistry } from '../../src/services/templateRegistry';
import { TemplateConfig } from '../../src/types';

// Mock fs module with simple implementation
jest.mock('fs', () => ({
  promises: {
    readdir: jest.fn(),
    stat: jest.fn(),
    readFile: jest.fn(),
    mkdir: jest.fn(),
    copyFile: jest.fn(),
    rm: jest.fn(),
    rename: jest.fn(),
  },
}));

// Mock path module
jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/')),
}));

describe('TemplateRegistry', () => {
  let registry: TemplateRegistry;
  let mockFs: any;

  beforeEach(() => {
    registry = new TemplateRegistry();
    mockFs = require('fs').promises;
    jest.clearAllMocks();
  });

  describe('scanTemplates', () => {
    it('should scan templates and return metadata', async () => {
      const mockTemplateConfig: TemplateConfig = {
        name: 'Test Template',
        description: 'A test template',
        version: '1.0.0',
        files: [
          { path: 'test.ts', content: 'console.log("test");' },
          { path: 'README.md', content: '# Test' },
        ],
      };

      const mockStat = {
        isDirectory: () => true,
        isFile: () => false,
        mtime: new Date('2023-01-01'),
        size: 1024,
      };

      // Simple mock setup
      mockFs.readdir.mockResolvedValue(['test-template']);
      mockFs.stat.mockResolvedValue(mockStat);
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockTemplateConfig));

      const result = await registry.scanTemplates();

      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe('test-template');
      expect(result[0]?.name).toBe('Test Template');
    });

    it('should handle invalid template directories gracefully', async () => {
      const mockStat = {
        isDirectory: () => true,
        mtime: new Date('2023-01-01'),
        size: 1024,
      };

      mockFs.readdir.mockResolvedValue(['invalid-template']);
      mockFs.stat.mockResolvedValue(mockStat);
      mockFs.readFile.mockRejectedValue(new Error('File not found'));

      const result = await registry.scanTemplates();

      expect(result).toHaveLength(0);
    });
  });

  describe('searchTemplates', () => {
    it('should search templates by query', async () => {
      const mockTemplateConfig: TemplateConfig = {
        name: 'Test Template',
        description: 'A test template',
        version: '1.0.0',
        files: [{ path: 'test.ts', content: 'console.log("test");' }],
      };

      const mockStat = {
        isDirectory: () => true,
        isFile: () => false,
        mtime: new Date('2023-01-01'),
        size: 1024,
      };

      mockFs.readdir.mockResolvedValue(['test-template']);
      mockFs.stat.mockResolvedValue(mockStat);
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockTemplateConfig));

      // First scan to populate cache
      await registry.scanTemplates();

      const result = await registry.searchTemplates({ query: 'Test' });

      expect(result.templates).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should search templates by language', async () => {
      const mockTemplateConfig: TemplateConfig = {
        name: 'Test Template',
        description: 'A test template',
        version: '1.0.0',
        files: [{ path: 'test.ts', content: 'console.log("test");' }],
      };

      const mockStat = {
        isDirectory: () => true,
        isFile: () => false,
        mtime: new Date('2023-01-01'),
        size: 1024,
      };

      mockFs.readdir.mockResolvedValue(['test-template']);
      mockFs.stat.mockResolvedValue(mockStat);
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockTemplateConfig));

      // First scan to populate cache
      await registry.scanTemplates();

      const result = await registry.searchTemplates({ language: 'typescript' });

      expect(result.templates).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('generateTemplateDocumentation', () => {
    it('should generate documentation for template', async () => {
      const mockTemplateConfig: TemplateConfig = {
        name: 'Test Template',
        description: 'A test template',
        version: '1.0.0',
        files: [
          { path: 'test.ts', content: 'console.log("test");' },
          { path: 'README.md', content: '# Test' },
        ],
      };

      const mockStat = {
        isDirectory: () => true,
        isFile: () => false,
        mtime: new Date('2023-01-01'),
        size: 1024,
      };

      mockFs.readdir.mockResolvedValue(['test-template']);
      mockFs.stat.mockResolvedValue(mockStat);
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockTemplateConfig));

      // First scan to populate cache
      await registry.scanTemplates();

      const documentation = await registry.generateTemplateDocumentation('test-template');

      expect(documentation).toContain('# Test Template');
      expect(documentation).toContain('Version: 1.0.0');
      expect(documentation).toContain('## Files');
    });
  });

  describe('getTemplate', () => {
    it('should get template by name', async () => {
      const mockTemplateConfig: TemplateConfig = {
        name: 'Test Template',
        description: 'A test template',
        version: '1.0.0',
        files: [{ path: 'test.ts', content: 'console.log("test");' }],
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(mockTemplateConfig));

      const template = await registry.getTemplate('test-template');

      expect(template.name).toBe('Test Template');
      expect(template.description).toBe('A test template');
      expect(template.version).toBe('1.0.0');
    });
  });

  describe('templateExists', () => {
    it('should return true for existing template', async () => {
      const mockTemplateConfig: TemplateConfig = {
        name: 'Test Template',
        description: 'A test template',
        version: '1.0.0',
        files: [{ path: 'test.ts', content: 'console.log("test");' }],
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(mockTemplateConfig));

      const exists = await registry.templateExists('test-template');

      expect(exists).toBe(true);
    });
  });

  describe('getTemplateFile', () => {
    it('should get template file content', async () => {
      const mockTemplateConfig: TemplateConfig = {
        name: 'Test Template',
        description: 'A test template',
        version: '1.0.0',
        files: [{ path: 'test.ts', content: 'console.log("test");' }],
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(mockTemplateConfig));

      const content = await registry.getTemplateFile('test-template', 'test.ts');

      expect(content).toBe('console.log("test");');
    });
  });
}); 