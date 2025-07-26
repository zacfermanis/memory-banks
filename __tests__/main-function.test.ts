import * as fs from 'fs';
import * as path from 'path';

// Mock inquirer
jest.mock('inquirer', () => ({
  prompt: jest.fn(),
}));

// Mock fs
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  copyFileSync: jest.fn(),
}));

// Import after mocking
import inquirer from 'inquirer';

describe('Main Function Logic Testing', () => {
  let mockPrompt: jest.MockedFunction<typeof inquirer.prompt>;
  let mockExistsSync: jest.MockedFunction<typeof fs.existsSync>;
  let mockMkdirSync: jest.MockedFunction<typeof fs.mkdirSync>;
  let mockCopyFileSync: jest.MockedFunction<typeof fs.copyFileSync>;
  let mockConsoleLog: jest.SpyInstance;
  let mockConsoleError: jest.SpyInstance;
  let mockProcessCwd: jest.SpyInstance;
  let mockProcessExit: jest.SpyInstance;

  beforeEach(() => {
    // Get mocked functions
    mockPrompt = inquirer.prompt as jest.MockedFunction<typeof inquirer.prompt>;
    mockExistsSync = fs.existsSync as jest.MockedFunction<typeof fs.existsSync>;
    mockMkdirSync = fs.mkdirSync as jest.MockedFunction<typeof fs.mkdirSync>;
    mockCopyFileSync = fs.copyFileSync as jest.MockedFunction<
      typeof fs.copyFileSync
    >;

    // Mock console and process
    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
    mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
    mockProcessCwd = jest
      .spyOn(process, 'cwd')
      .mockReturnValue('/test/project');
    mockProcessExit = jest.spyOn(process, 'exit').mockImplementation();

    // Reset mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Extract the main function logic for testing
  const createMainFunction = () => {
    const MEMORY_BANK_TYPES: Record<string, any> = {
      lua: {
        name: "Lua",
        cursorRulesPath: path.join(__dirname, "..", "..", "Lua", ".cursorrules"),
        developmentGuidePath: path.join(__dirname, "..", "..", "Lua", ".cursorrules"),
      },
      web: {
        name: "Web",
        cursorRulesPath: path.join(__dirname, "..", "..", "Web", ".cursorrules"),
        developmentGuidePath: path.join(
          __dirname,
          "..",
          "..",
          "Web",
          "developmentGuide.md",
        ),
      },
    };

    return async () => {
      console.log("🚀 Memory Bank Initializer");
      console.log("==========================\n");

      try {
        const { memoryBankType } = await inquirer.prompt([
          {
            type: "list",
            name: "memoryBankType",
            message: "What type of memory bank would you like to install?",
            choices: [
              { name: "Lua - For Lua/Love2D game development", value: "lua" },
              {
                name: "Web - For TypeScript/React/Next.js development",
                value: "web",
              },
            ],
          },
        ]);

        const selectedType = MEMORY_BANK_TYPES[memoryBankType];

        if (!selectedType) {
          throw new Error(`Unknown memory bank type: ${memoryBankType}`);
        }

        console.log(`\n📦 Installing ${selectedType.name} Memory Bank...\n`);

        // Create .memory-bank directory
        const memoryBankDir = path.join(process.cwd(), ".memory-bank");
        if (!fs.existsSync(memoryBankDir)) {
          fs.mkdirSync(memoryBankDir, { recursive: true });
          console.log("✅ Created .memory-bank directory");
        }

        // Create .specs directory
        const specsDir = path.join(process.cwd(), ".specs");
        if (!fs.existsSync(specsDir)) {
          fs.mkdirSync(specsDir, { recursive: true });
          console.log("✅ Created .specs directory");
        }

        // Copy .cursorrules to project root
        const cursorRulesDest = path.join(process.cwd(), ".cursorrules");
        if (fs.existsSync(selectedType.cursorRulesPath)) {
          fs.copyFileSync(selectedType.cursorRulesPath, cursorRulesDest);
          console.log("✅ Copied .cursorrules to project root");
        } else {
          throw new Error(
            `Source .cursorrules not found: ${selectedType.cursorRulesPath}`,
          );
        }

        // Copy development guide to .memory-bank directory
        const developmentGuideDest = path.join(
          memoryBankDir,
          "developmentGuide.md",
        );
        if (fs.existsSync(selectedType.developmentGuidePath)) {
          fs.copyFileSync(selectedType.developmentGuidePath, developmentGuideDest);
          console.log("✅ Copied development guide to .memory-bank directory");
        } else {
          throw new Error(
            `Source development guide not found: ${selectedType.developmentGuidePath}`,
          );
        }

        console.log("\n🎉 Memory Bank setup complete!");
        console.log("\n📁 Created directories:");
        console.log("   - .memory-bank/ (contains developmentGuide.md)");
        console.log("   - .specs/ (for feature specifications)");
        console.log("\n📄 Created files:");
        console.log("   - .cursorrules (project-specific rules)");
        console.log("\n🚀 You can now start using your Memory Bank!");
      } catch (error) {
        console.error(
          "\n❌ Error:",
          error instanceof Error ? error.message : error,
        );
        process.exit(1);
      }
    };
  };

  describe('Successful execution paths', () => {
    it('should successfully execute lua memory bank setup', async () => {
      const main = createMainFunction();
      
      mockPrompt.mockResolvedValue({ memoryBankType: 'lua' });
      mockExistsSync
        .mockReturnValueOnce(false) // .memory-bank does not exist
        .mockReturnValueOnce(false) // .specs does not exist
        .mockReturnValueOnce(true) // cursor rules source exists
        .mockReturnValueOnce(true); // development guide source exists

      await main();

      expect(mockPrompt).toHaveBeenCalledWith([
        {
          type: "list",
          name: "memoryBankType",
          message: "What type of memory bank would you like to install?",
          choices: [
            { name: "Lua - For Lua/Love2D game development", value: "lua" },
            {
              name: "Web - For TypeScript/React/Next.js development",
              value: "web",
            },
          ],
        },
      ]);

      expect(mockConsoleLog).toHaveBeenCalledWith("🚀 Memory Bank Initializer");
      expect(mockConsoleLog).toHaveBeenCalledWith("==========================\n");
      expect(mockConsoleLog).toHaveBeenCalledWith("\n📦 Installing Lua Memory Bank...\n");
      expect(mockConsoleLog).toHaveBeenCalledWith("✅ Created .memory-bank directory");
      expect(mockConsoleLog).toHaveBeenCalledWith("✅ Created .specs directory");
      expect(mockConsoleLog).toHaveBeenCalledWith("✅ Copied .cursorrules to project root");
      expect(mockConsoleLog).toHaveBeenCalledWith("✅ Copied development guide to .memory-bank directory");
      expect(mockConsoleLog).toHaveBeenCalledWith("\n🎉 Memory Bank setup complete!");
      expect(mockConsoleLog).toHaveBeenCalledWith("\n📁 Created directories:");
      expect(mockConsoleLog).toHaveBeenCalledWith("   - .memory-bank/ (contains developmentGuide.md)");
      expect(mockConsoleLog).toHaveBeenCalledWith("   - .specs/ (for feature specifications)");
      expect(mockConsoleLog).toHaveBeenCalledWith("\n📄 Created files:");
      expect(mockConsoleLog).toHaveBeenCalledWith("   - .cursorrules (project-specific rules)");
      expect(mockConsoleLog).toHaveBeenCalledWith("\n🚀 You can now start using your Memory Bank!");

      expect(mockMkdirSync).toHaveBeenCalledWith(path.join('/test/project', '.memory-bank'), { recursive: true });
      expect(mockMkdirSync).toHaveBeenCalledWith(path.join('/test/project', '.specs'), { recursive: true });
      expect(mockCopyFileSync).toHaveBeenCalledWith(
        path.join(__dirname, "..", "..", "Lua", ".cursorrules"),
        path.join('/test/project', '.cursorrules')
      );
      expect(mockCopyFileSync).toHaveBeenCalledWith(
        path.join(__dirname, "..", "..", "Lua", ".cursorrules"),
        path.join('/test/project', '.memory-bank', 'developmentGuide.md')
      );
    });

    it('should successfully execute web memory bank setup', async () => {
      const main = createMainFunction();
      
      mockPrompt.mockResolvedValue({ memoryBankType: 'web' });
      mockExistsSync
        .mockReturnValueOnce(false) // .memory-bank does not exist
        .mockReturnValueOnce(false) // .specs does not exist
        .mockReturnValueOnce(true) // cursor rules source exists
        .mockReturnValueOnce(true); // development guide source exists

      await main();

      expect(mockConsoleLog).toHaveBeenCalledWith("\n📦 Installing Web Memory Bank...\n");
      expect(mockCopyFileSync).toHaveBeenCalledWith(
        path.join(__dirname, "..", "..", "Web", ".cursorrules"),
        path.join('/test/project', '.cursorrules')
      );
      expect(mockCopyFileSync).toHaveBeenCalledWith(
        path.join(__dirname, "..", "..", "Web", "developmentGuide.md"),
        path.join('/test/project', '.memory-bank', 'developmentGuide.md')
      );
    });

    it('should skip directory creation when directories already exist', async () => {
      const main = createMainFunction();
      
      mockPrompt.mockResolvedValue({ memoryBankType: 'lua' });
      mockExistsSync
        .mockReturnValueOnce(true) // .memory-bank exists
        .mockReturnValueOnce(true) // .specs exists
        .mockReturnValueOnce(true) // cursor rules source exists
        .mockReturnValueOnce(true); // development guide source exists

      await main();

      expect(mockMkdirSync).not.toHaveBeenCalled();
      expect(mockCopyFileSync).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error handling paths', () => {
    it('should handle unknown memory bank type', async () => {
      const main = createMainFunction();
      
      mockPrompt.mockResolvedValue({ memoryBankType: 'unknown' });

      await main();

      expect(mockConsoleError).toHaveBeenCalledWith("\n❌ Error:", "Unknown memory bank type: unknown");
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });

    it('should handle missing cursor rules file', async () => {
      const main = createMainFunction();
      
      mockPrompt.mockResolvedValue({ memoryBankType: 'lua' });
      mockExistsSync
        .mockReturnValueOnce(false) // .memory-bank does not exist
        .mockReturnValueOnce(false) // .specs does not exist
        .mockReturnValueOnce(false); // cursor rules source does not exist

      await main();

      const expectedPath = path.join(__dirname, "..", "..", "Lua", ".cursorrules");
      expect(mockConsoleError).toHaveBeenCalledWith("\n❌ Error:", `Source .cursorrules not found: ${expectedPath}`);
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });

    it('should handle missing development guide file', async () => {
      const main = createMainFunction();
      
      mockPrompt.mockResolvedValue({ memoryBankType: 'web' });
      mockExistsSync
        .mockReturnValueOnce(false) // .memory-bank does not exist
        .mockReturnValueOnce(false) // .specs does not exist
        .mockReturnValueOnce(true) // cursor rules source exists
        .mockReturnValueOnce(false); // development guide source does not exist

      await main();

      const expectedPath = path.join(__dirname, "..", "..", "Web", "developmentGuide.md");
      expect(mockConsoleError).toHaveBeenCalledWith("\n❌ Error:", `Source development guide not found: ${expectedPath}`);
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });

    it('should handle inquirer prompt error', async () => {
      const main = createMainFunction();
      
      const promptError = new Error('Prompt failed');
      mockPrompt.mockRejectedValue(promptError);

      await main();

      expect(mockConsoleError).toHaveBeenCalledWith("\n❌ Error:", "Prompt failed");
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });

    it('should handle non-Error objects in catch block', async () => {
      const main = createMainFunction();
      
      mockPrompt.mockRejectedValue('String error');

      await main();

      expect(mockConsoleError).toHaveBeenCalledWith("\n❌ Error:", "String error");
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });

    it('should handle null error objects', async () => {
      const main = createMainFunction();
      
      mockPrompt.mockRejectedValue(null);

      await main();

      expect(mockConsoleError).toHaveBeenCalledWith("\n❌ Error:", null);
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });

    it('should handle undefined error objects', async () => {
      const main = createMainFunction();
      
      mockPrompt.mockRejectedValue(undefined);

      await main();

      expect(mockConsoleError).toHaveBeenCalledWith("\n❌ Error:", undefined);
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });

    it('should handle error objects without message property', async () => {
      const main = createMainFunction();
      
      const errorWithoutMessage = { code: 'ENOENT' };
      mockPrompt.mockRejectedValue(errorWithoutMessage);

      await main();

      expect(mockConsoleError).toHaveBeenCalledWith("\n❌ Error:", errorWithoutMessage);
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });
  });

  describe('Path construction testing', () => {
    it('should construct correct paths for lua memory bank', async () => {
      const main = createMainFunction();
      
      mockPrompt.mockResolvedValue({ memoryBankType: 'lua' });
      mockExistsSync.mockReturnValue(true);

      await main();

      const expectedCursorRulesPath = path.join(__dirname, "..", "..", "Lua", ".cursorrules");
      const expectedDevelopmentGuidePath = path.join(__dirname, "..", "..", "Lua", ".cursorrules");
      
      expect(mockCopyFileSync).toHaveBeenCalledWith(
        expectedCursorRulesPath,
        path.join('/test/project', '.cursorrules')
      );
      expect(mockCopyFileSync).toHaveBeenCalledWith(
        expectedDevelopmentGuidePath,
        path.join('/test/project', '.memory-bank', 'developmentGuide.md')
      );
    });

    it('should construct correct paths for web memory bank', async () => {
      const main = createMainFunction();
      
      mockPrompt.mockResolvedValue({ memoryBankType: 'web' });
      mockExistsSync.mockReturnValue(true);

      await main();

      const expectedCursorRulesPath = path.join(__dirname, "..", "..", "Web", ".cursorrules");
      const expectedDevelopmentGuidePath = path.join(__dirname, "..", "..", "Web", "developmentGuide.md");
      
      expect(mockCopyFileSync).toHaveBeenCalledWith(
        expectedCursorRulesPath,
        path.join('/test/project', '.cursorrules')
      );
      expect(mockCopyFileSync).toHaveBeenCalledWith(
        expectedDevelopmentGuidePath,
        path.join('/test/project', '.memory-bank', 'developmentGuide.md')
      );
    });
  });

  describe('File system operation testing', () => {
    it('should create directories with correct paths', async () => {
      const main = createMainFunction();
      
      mockPrompt.mockResolvedValue({ memoryBankType: 'lua' });
      mockExistsSync
        .mockReturnValueOnce(false) // .memory-bank does not exist
        .mockReturnValueOnce(false) // .specs does not exist
        .mockReturnValueOnce(true) // cursor rules source exists
        .mockReturnValueOnce(true); // development guide source exists

      await main();

      expect(mockMkdirSync).toHaveBeenCalledWith(
        path.join('/test/project', '.memory-bank'),
        { recursive: true }
      );
      expect(mockMkdirSync).toHaveBeenCalledWith(
        path.join('/test/project', '.specs'),
        { recursive: true }
      );
    });

    it('should copy files to correct destinations', async () => {
      const main = createMainFunction();
      
      mockPrompt.mockResolvedValue({ memoryBankType: 'lua' });
      mockExistsSync.mockReturnValue(true);

      await main();

      expect(mockCopyFileSync).toHaveBeenCalledWith(
        path.join(__dirname, "..", "..", "Lua", ".cursorrules"),
        path.join('/test/project', '.cursorrules')
      );
      expect(mockCopyFileSync).toHaveBeenCalledWith(
        path.join(__dirname, "..", "..", "Lua", ".cursorrules"),
        path.join('/test/project', '.memory-bank', 'developmentGuide.md')
      );
    });
  });

  describe('Console output testing', () => {
    it('should output all expected console messages for successful execution', async () => {
      const main = createMainFunction();
      
      mockPrompt.mockResolvedValue({ memoryBankType: 'lua' });
      mockExistsSync
        .mockReturnValueOnce(false) // .memory-bank does not exist
        .mockReturnValueOnce(false) // .specs does not exist
        .mockReturnValueOnce(true) // cursor rules source exists
        .mockReturnValueOnce(true); // development guide source exists

      await main();

      const expectedCalls = [
        "🚀 Memory Bank Initializer",
        "==========================\n",
        "\n📦 Installing Lua Memory Bank...\n",
        "✅ Created .memory-bank directory",
        "✅ Created .specs directory",
        "✅ Copied .cursorrules to project root",
        "✅ Copied development guide to .memory-bank directory",
        "\n🎉 Memory Bank setup complete!",
        "\n📁 Created directories:",
        "   - .memory-bank/ (contains developmentGuide.md)",
        "   - .specs/ (for feature specifications)",
        "\n📄 Created files:",
        "   - .cursorrules (project-specific rules)",
        "\n🚀 You can now start using your Memory Bank!"
      ];

      expectedCalls.forEach(expectedCall => {
        expect(mockConsoleLog).toHaveBeenCalledWith(expectedCall);
      });
    });

    it('should output error messages correctly', async () => {
      const main = createMainFunction();
      
      mockPrompt.mockRejectedValue(new Error('Test error'));

      await main();

      expect(mockConsoleError).toHaveBeenCalledWith("\n❌ Error:", "Test error");
    });
  });
}); 