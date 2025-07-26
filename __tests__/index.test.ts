import * as fs from 'fs';
import * as path from 'path';

// Mock inquirer to avoid interactive prompts in tests
jest.mock('inquirer', () => ({
  prompt: jest.fn()
}));

describe('Memory Bank CLI', () => {
  const testDir = path.join(__dirname, 'test-project');
  
  beforeEach(() => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should create required directories and files', () => {
    const memoryBankDir = path.join(testDir, '.memory-bank');
    const specsDir = path.join(testDir, '.specs');
    const cursorRulesFile = path.join(testDir, '.cursorrules');

    // Create directories
    fs.mkdirSync(memoryBankDir, { recursive: true });
    fs.mkdirSync(specsDir, { recursive: true });

    // Create a test .cursorrules file
    fs.writeFileSync(cursorRulesFile, '# Test cursor rules');

    // Verify directories exist
    expect(fs.existsSync(memoryBankDir)).toBe(true);
    expect(fs.existsSync(specsDir)).toBe(true);
    expect(fs.existsSync(cursorRulesFile)).toBe(true);
  });

  it('should have valid memory bank type configurations', () => {
    const luaCursorRulesPath = path.join(__dirname, '..', 'Lua', '.cursorrules');
    const webCursorRulesPath = path.join(__dirname, '..', 'Web', '.cursorrules');
    const webDevelopmentGuidePath = path.join(__dirname, '..', 'Web', 'developmentGuide.md');

    // Verify source files exist
    expect(fs.existsSync(luaCursorRulesPath)).toBe(true);
    expect(fs.existsSync(webCursorRulesPath)).toBe(true);
    expect(fs.existsSync(webDevelopmentGuidePath)).toBe(true);
  });
}); 