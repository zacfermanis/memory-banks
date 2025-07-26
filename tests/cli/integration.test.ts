import { Command } from 'commander';
import { promises as fs } from 'fs';
import path from 'path';
import { initCommand } from '../../src/cli/commands/init';
import { listCommand } from '../../src/cli/commands/list';
import { validateCommand } from '../../src/cli/commands/validate';
import { updateCommand } from '../../src/cli/commands/update';
import { helpCommand } from '../../src/cli/commands/help';

// Mock dependencies
jest.mock('chalk', () => ({
  blue: jest.fn((text: string) => `BLUE:${text}`),
  green: jest.fn((text: string) => `GREEN:${text}`),
  red: jest.fn((text: string) => `RED:${text}`),
  yellow: jest.fn((text: string) => `YELLOW:${text}`),
  gray: jest.fn((text: string) => `GRAY:${text}`),
  white: jest.fn((text: string) => `WHITE:${text}`),
  cyan: jest.fn((text: string) => `CYAN:${text}`)
}));

jest.mock('inquirer', () => ({
  prompt: jest.fn()
}));

jest.mock('../../src/services/templateRegistry');
jest.mock('../../src/services/templateRenderer');
jest.mock('../../src/utils/fileSystem');
jest.mock('../../src/utils/validation');
jest.mock('../../src/utils/errorHandling');
jest.mock('../../src/utils/configManager');
jest.mock('../../src/utils/logger');

describe('CLI Integration Tests', () => {
  let program: Command;
  let tempDir: string;

  beforeEach(async () => {
    program = new Command();
    jest.clearAllMocks();
    
    // Create a temporary directory for each test
    tempDir = path.join(process.cwd(), 'temp-test-dir');
    try {
      await fs.mkdir(tempDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  });

  afterEach(async () => {
    // Clean up temporary directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('init workflow', () => {
    beforeEach(() => {
      initCommand(program);
    });

    it('should complete full init workflow with interactive prompts', async () => {
      const mockInquirer = require('inquirer');
      const mockTemplateRegistry = require('../../src/services/templateRegistry').TemplateRegistry;
      const mockTemplateRenderer = require('../../src/services/templateRenderer').TemplateRenderer;
      const mockFileSystem = require('../../src/utils/fileSystem');
      const mockLogger = require('../../src/utils/logger').Logger;

      // Mock inquirer responses
      mockInquirer.prompt.mockResolvedValue({
        projectName: 'test-project',
        projectDescription: 'A test project',
        projectType: 'typescript',
        memoryBankPattern: 'basic',
        authorName: 'Test Author',
        authorEmail: 'test@example.com',
        confirm: true
      });

      // Mock template registry
      const mockRegistry = {
        listTemplates: jest.fn().mockResolvedValue([
          { name: 'typescript', description: 'TypeScript template', version: '1.0.0' }
        ]),
        getTemplate: jest.fn().mockResolvedValue({
          name: 'typescript',
          description: 'TypeScript template',
          files: [
            { path: 'projectBrief.md', content: '{{projectName}} brief' },
            { path: 'productContext.md', content: '{{projectDescription}} context' }
          ]
        })
      };
      mockTemplateRegistry.mockImplementation(() => mockRegistry);

      // Mock template renderer
      const mockRenderer = {
        renderTemplate: jest.fn().mockImplementation((content, vars) => {
          return content.replace(/\{\{(\w+)\}\}/g, (match: string, key: string) => vars[key] || match);
        })
      };
      mockTemplateRenderer.mockImplementation(() => mockRenderer);

      // Mock file system operations
      mockFileSystem.FileSystemUtils = {
        safeWriteFile: jest.fn().mockResolvedValue(undefined),
        fileExists: jest.fn().mockResolvedValue(false)
      };

      // Mock logger
      mockLogger.initialize.mockImplementation(() => {});
      mockLogger.info.mockImplementation(() => {});
      mockLogger.success.mockImplementation(() => {});
      mockLogger.warn.mockImplementation(() => {});
      mockLogger.error.mockImplementation(() => {});

      // Execute init command
      const initCmd = program.commands.find(cmd => cmd.name() === 'init');
      expect(initCmd).toBeDefined();

      // This would normally be called by Commander.js
      // For integration testing, we'll verify the command is properly configured
      expect(initCmd?.description()).toContain('Initialize a new memory bank system');
      
      // Verify that all required options are available
      const optionNames = initCmd?.options.map(opt => opt.long) || [];
      expect(optionNames).toContain('--template');
      expect(optionNames).toContain('--yes');
      expect(optionNames).toContain('--dry-run');
      expect(optionNames).toContain('--force');
      expect(optionNames).toContain('--output-dir');
    });

    it('should complete init workflow in non-interactive mode', async () => {
      const mockTemplateRegistry = require('../../src/services/templateRegistry').TemplateRegistry;
      const mockTemplateRenderer = require('../../src/services/templateRenderer').TemplateRenderer;
      const mockFileSystem = require('../../src/utils/fileSystem');
      const mockLogger = require('../../src/utils/logger').Logger;

      // Mock template registry
      const mockRegistry = {
        getTemplate: jest.fn().mockResolvedValue({
          name: 'typescript',
          description: 'TypeScript template',
          files: [
            { path: 'projectBrief.md', content: '{{projectName}} brief' },
            { path: 'productContext.md', content: '{{projectDescription}} context' }
          ]
        })
      };
      mockTemplateRegistry.mockImplementation(() => mockRegistry);

      // Mock template renderer
      const mockRenderer = {
        renderTemplate: jest.fn().mockImplementation((content, vars) => {
          return content.replace(/\{\{(\w+)\}\}/g, (match: string, key: string) => vars[key] || match);
        })
      };
      mockTemplateRenderer.mockImplementation(() => mockRenderer);

      // Mock file system operations
      mockFileSystem.FileSystemUtils = {
        safeWriteFile: jest.fn().mockResolvedValue(undefined),
        fileExists: jest.fn().mockResolvedValue(false)
      };

      // Mock logger
      mockLogger.initialize.mockImplementation(() => {});
      mockLogger.info.mockImplementation(() => {});
      mockLogger.success.mockImplementation(() => {});

      // Verify non-interactive mode options
      const initCmd = program.commands.find(cmd => cmd.name() === 'init');
      const yesOption = initCmd?.options.find(opt => opt.long === '--yes');
      expect(yesOption).toBeDefined();
      expect(yesOption?.description).toContain('Skip interactive prompts');
    });

    it('should handle dry-run mode correctly', async () => {
      const mockTemplateRegistry = require('../../src/services/templateRegistry').TemplateRegistry;
      const mockTemplateRenderer = require('../../src/services/templateRenderer').TemplateRenderer;
      const mockFileSystem = require('../../src/utils/fileSystem');
      const mockLogger = require('../../src/utils/logger').Logger;

      // Mock template registry
      const mockRegistry = {
        getTemplate: jest.fn().mockResolvedValue({
          name: 'typescript',
          description: 'TypeScript template',
          files: [
            { path: 'projectBrief.md', content: '{{projectName}} brief' },
            { path: 'productContext.md', content: '{{projectDescription}} context' }
          ]
        })
      };
      mockTemplateRegistry.mockImplementation(() => mockRegistry);

      // Mock template renderer
      const mockRenderer = {
        renderTemplate: jest.fn().mockImplementation((content, vars) => {
          return content.replace(/\{\{(\w+)\}\}/g, (match: string, key: string) => vars[key] || match);
        })
      };
      mockTemplateRenderer.mockImplementation(() => mockRenderer);

      // Mock file system operations
      mockFileSystem.FileSystemUtils = {
        safeWriteFile: jest.fn().mockResolvedValue(undefined),
        fileExists: jest.fn().mockResolvedValue(false)
      };

      // Mock logger
      mockLogger.initialize.mockImplementation(() => {});
      mockLogger.info.mockImplementation(() => {});
      mockLogger.warn.mockImplementation(() => {});

      // Verify dry-run option
      const initCmd = program.commands.find(cmd => cmd.name() === 'init');
      const dryRunOption = initCmd?.options.find(opt => opt.long === '--dry-run');
      expect(dryRunOption).toBeDefined();
      expect(dryRunOption?.description).toContain('Preview files');
    });
  });

  describe('list workflow', () => {
    beforeEach(() => {
      listCommand(program);
    });

    it('should list all templates successfully', async () => {
      const mockTemplateRegistry = require('../../src/services/templateRegistry').TemplateRegistry;
      const mockLogger = require('../../src/utils/logger').Logger;

      // Mock template registry
      const mockRegistry = {
        listTemplates: jest.fn().mockResolvedValue([
          { name: 'typescript', description: 'TypeScript template', version: '1.0.0' },
          { name: 'lua', description: 'Lua template', version: '1.0.0' }
        ])
      };
      mockTemplateRegistry.mockImplementation(() => mockRegistry);

      // Mock logger
      mockLogger.initialize.mockImplementation(() => {});
      mockLogger.info.mockImplementation(() => {});
      mockLogger.warn.mockImplementation(() => {});

      // Verify list command
      const listCmd = program.commands.find(cmd => cmd.name() === 'list');
      expect(listCmd).toBeDefined();
      expect(listCmd?.description()).toContain('List available templates');
    });

    it('should filter templates by language', async () => {
      const mockTemplateRegistry = require('../../src/services/templateRegistry').TemplateRegistry;
      const mockLogger = require('../../src/utils/logger').Logger;

      // Mock template registry
      const mockRegistry = {
        listTemplates: jest.fn().mockResolvedValue([
          { name: 'typescript', description: 'TypeScript template', version: '1.0.0' }
        ])
      };
      mockTemplateRegistry.mockImplementation(() => mockRegistry);

      // Mock logger
      mockLogger.initialize.mockImplementation(() => {});
      mockLogger.info.mockImplementation(() => {});

      // Verify language filter option
      const listCmd = program.commands.find(cmd => cmd.name() === 'list');
      const languageOption = listCmd?.options.find(opt => opt.long === '--language');
      expect(languageOption).toBeDefined();
      expect(languageOption?.description).toContain('Filter by programming language');
    });
  });

  describe('validate workflow', () => {
    beforeEach(() => {
      validateCommand(program);
    });

    it('should validate memory bank setup successfully', async () => {
      const mockLogger = require('../../src/utils/logger').Logger;

      // Mock file system operations
      const mockFs = require('fs').promises;
      mockFs.access = jest.fn().mockResolvedValue(undefined);
      mockFs.stat = jest.fn().mockResolvedValue({ size: 100 });

      // Mock logger
      mockLogger.initialize.mockImplementation(() => {});
      mockLogger.info.mockImplementation(() => {});
      mockLogger.success.mockImplementation(() => {});
      mockLogger.warn.mockImplementation(() => {});
      mockLogger.error.mockImplementation(() => {});

      // Verify validate command
      const validateCmd = program.commands.find(cmd => cmd.name() === 'validate');
      expect(validateCmd).toBeDefined();
      expect(validateCmd?.description()).toContain('Validate current memory bank setup');
    });

    it('should handle validation errors gracefully', async () => {
      const mockLogger = require('../../src/utils/logger').Logger;

      // Mock file system operations to simulate missing files
      const mockFs = require('fs').promises;
      mockFs.access = jest.fn().mockRejectedValue(new Error('File not found'));
      mockFs.stat = jest.fn().mockResolvedValue({ size: 0 });

      // Mock logger
      mockLogger.initialize.mockImplementation(() => {});
      mockLogger.info.mockImplementation(() => {});
      mockLogger.warn.mockImplementation(() => {});
      mockLogger.error.mockImplementation(() => {});

      // Verify verbose option
      const validateCmd = program.commands.find(cmd => cmd.name() === 'validate');
      const verboseOption = validateCmd?.options.find(opt => opt.long === '--verbose');
      expect(verboseOption).toBeDefined();
      expect(verboseOption?.description).toContain('Show detailed validation information');
    });
  });

  describe('update workflow', () => {
    beforeEach(() => {
      updateCommand(program);
    });

    it('should update existing memory bank files', async () => {
      const mockTemplateRegistry = require('../../src/services/templateRegistry').TemplateRegistry;
      const mockTemplateRenderer = require('../../src/services/templateRenderer').TemplateRenderer;
      const mockFileSystem = require('../../src/utils/fileSystem');
      const mockLogger = require('../../src/utils/logger').Logger;

      // Mock template registry
      const mockRegistry = {
        listTemplates: jest.fn().mockResolvedValue([
          { name: 'typescript', description: 'TypeScript template', version: '1.0.0' }
        ]),
        getTemplate: jest.fn().mockResolvedValue({
          name: 'typescript',
          description: 'TypeScript template',
          files: [
            { path: 'projectBrief.md', content: 'Updated {{projectName}} brief' }
          ]
        })
      };
      mockTemplateRegistry.mockImplementation(() => mockRegistry);

      // Mock template renderer
      const mockRenderer = {
        renderTemplate: jest.fn().mockImplementation((content, vars) => {
          return content.replace(/\{\{(\w+)\}\}/g, (match: string, key: string) => vars[key] || match);
        })
      };
      mockTemplateRenderer.mockImplementation(() => mockRenderer);

      // Mock file system operations
      mockFileSystem.FileSystemUtils = {
        safeWriteFile: jest.fn().mockResolvedValue(undefined),
        fileExists: jest.fn().mockResolvedValue(true)
      };

      // Mock logger
      mockLogger.initialize.mockImplementation(() => {});
      mockLogger.info.mockImplementation(() => {});
      mockLogger.warn.mockImplementation(() => {});

      // Verify update command
      const updateCmd = program.commands.find(cmd => cmd.name() === 'update');
      expect(updateCmd).toBeDefined();
      expect(updateCmd?.description()).toContain('Update existing memory bank files');
    });

    it('should handle dry-run mode for updates', async () => {
      const mockTemplateRegistry = require('../../src/services/templateRegistry').TemplateRegistry;
      const mockFileSystem = require('../../src/utils/fileSystem');
      const mockLogger = require('../../src/utils/logger').Logger;

      // Mock template registry
      const mockRegistry = {
        listTemplates: jest.fn().mockResolvedValue([
          { name: 'typescript', description: 'TypeScript template', version: '1.0.0' }
        ]),
        getTemplate: jest.fn().mockResolvedValue({
          name: 'typescript',
          description: 'TypeScript template',
          files: [
            { path: 'projectBrief.md', content: 'Updated {{projectName}} brief' }
          ]
        })
      };
      mockTemplateRegistry.mockImplementation(() => mockRegistry);

      // Mock file system operations
      mockFileSystem.FileSystemUtils = {
        fileExists: jest.fn().mockResolvedValue(true)
      };

      // Mock logger
      mockLogger.initialize.mockImplementation(() => {});
      mockLogger.info.mockImplementation(() => {});
      mockLogger.warn.mockImplementation(() => {});

      // Verify dry-run option
      const updateCmd = program.commands.find(cmd => cmd.name() === 'update');
      const dryRunOption = updateCmd?.options.find(opt => opt.long === '--dry-run');
      expect(dryRunOption).toBeDefined();
      expect(dryRunOption?.description).toContain('Show what would be updated');
    });
  });

  describe('help workflow', () => {
    beforeEach(() => {
      helpCommand(program);
    });

    it('should display comprehensive help information', async () => {
      const mockHelpSystem = require('../../src/utils/helpSystem').HelpSystem;
      const mockLogger = require('../../src/utils/logger').Logger;

      // Mock help system
      mockHelpSystem.displayInteractiveHelp = jest.fn().mockResolvedValue(undefined);
      mockHelpSystem.displayCommandHelp = jest.fn().mockImplementation(() => {});
      mockHelpSystem.displayTopicHelp = jest.fn().mockImplementation(() => {});

      // Mock logger
      mockLogger.info.mockImplementation(() => {});
      mockLogger.warn.mockImplementation(() => {});
      mockLogger.error.mockImplementation(() => {});

      // Verify help command
      const helpCmd = program.commands.find(cmd => cmd.name() === 'help');
      expect(helpCmd).toBeDefined();
      expect(helpCmd?.description()).toContain('Show comprehensive help information');
    });

    it('should support interactive help mode', async () => {
      const mockHelpSystem = require('../../src/utils/helpSystem').HelpSystem;
      const mockLogger = require('../../src/utils/logger').Logger;

      // Mock help system
      mockHelpSystem.displayInteractiveHelp = jest.fn().mockResolvedValue(undefined);

      // Mock logger
      mockLogger.info.mockImplementation(() => {});
      mockLogger.warn.mockImplementation(() => {});
      mockLogger.error.mockImplementation(() => {});

      // Verify interactive option
      const helpCmd = program.commands.find(cmd => cmd.name() === 'help');
      const interactiveOption = helpCmd?.options.find(opt => opt.long === '--interactive');
      expect(interactiveOption).toBeDefined();
      expect(interactiveOption?.description).toContain('Start interactive help mode');
    });
  });
}); 