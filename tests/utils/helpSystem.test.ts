import { HelpSystem } from '../../src/utils/helpSystem';
import { Command } from 'commander';

// Mock chalk
jest.mock('chalk', () => ({
  blue: jest.fn((text: string) => `BLUE:${text}`),
  green: jest.fn((text: string) => `GREEN:${text}`),
  red: jest.fn((text: string) => `RED:${text}`),
  yellow: jest.fn((text: string) => `YELLOW:${text}`),
  gray: jest.fn((text: string) => `GRAY:${text}`),
  white: jest.fn((text: string) => `WHITE:${text}`),
  cyan: jest.fn((text: string) => `CYAN:${text}`)
}));

describe('HelpSystem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('displayTopicHelp', () => {
    it('should display help for valid topic', () => {
      const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();

      HelpSystem.displayTopicHelp('getting-started');

      expect(mockConsoleLog).toHaveBeenCalledWith('BLUE:📚 Getting Started');
      expect(mockConsoleLog).toHaveBeenCalledWith('============================================================');
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Memory Banks is a CLI tool'));
    });

    it('should display error for invalid topic', () => {
      const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();

      HelpSystem.displayTopicHelp('invalid-topic');

      expect(mockConsoleLog).toHaveBeenCalledWith('RED:❌ Help topic \'invalid-topic\' not found.');
      expect(mockConsoleLog).toHaveBeenCalledWith('YELLOW:Available topics:');
    });

    it('should display examples for topic with examples', () => {
      const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();

      HelpSystem.displayTopicHelp('templates');

      expect(mockConsoleLog).toHaveBeenCalledWith('BLUE:\n📝 Examples:');
      expect(mockConsoleLog).toHaveBeenCalledWith('GRAY:  memory-banks list');
    });
  });

  describe('displayTopicsOverview', () => {
    it('should display all help topics', () => {
      const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();

      HelpSystem.displayTopicsOverview();

      expect(mockConsoleLog).toHaveBeenCalledWith('BLUE:📚 Memory Banks Help Topics');
      expect(mockConsoleLog).toHaveBeenCalledWith('============================================================');
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Getting Started'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Templates'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Configuration'));
    });
  });

  describe('displayCommandHelp', () => {
    it('should display help for init command', () => {
      const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
      const command = new Command('init');
      command.description('Initialize a new memory bank system');

      HelpSystem.displayCommandHelp(command);

      expect(mockConsoleLog).toHaveBeenCalledWith('BLUE:📖 init Command Help');
      expect(mockConsoleLog).toHaveBeenCalledWith('============================================================');
      expect(mockConsoleLog).toHaveBeenCalledWith('WHITE:Initialize a new memory bank system');
      expect(mockConsoleLog).toHaveBeenCalledWith('BLUE:📝 Examples:');
    });

    it('should display troubleshooting tips', () => {
      const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
      const command = new Command('validate');
      command.description('Validate memory bank setup');

      HelpSystem.displayCommandHelp(command);

      expect(mockConsoleLog).toHaveBeenCalledWith('BLUE:🔧 Troubleshooting:');
      expect(mockConsoleLog).toHaveBeenCalledWith('YELLOW:  • Use --strict for comprehensive validation');
    });
  });

  describe('getCategoryColor', () => {
    it('should return correct colors for categories', () => {
      const basicColor = (HelpSystem as any).getCategoryColor('basic');
      const advancedColor = (HelpSystem as any).getCategoryColor('advanced');
      const troubleshootingColor = (HelpSystem as any).getCategoryColor('troubleshooting');
      const defaultColor = (HelpSystem as any).getCategoryColor('unknown');

      expect(basicColor).toBeDefined();
      expect(advancedColor).toBeDefined();
      expect(troubleshootingColor).toBeDefined();
      expect(defaultColor).toBeDefined();
    });
  });

  describe('displayInteractiveHelp', () => {
    it('should display interactive help menu', async () => {
      const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();

      await HelpSystem.displayInteractiveHelp();

      expect(mockConsoleLog).toHaveBeenCalledWith('BLUE:🎯 Memory Banks Interactive Help');
      expect(mockConsoleLog).toHaveBeenCalledWith('============================================================');
      expect(mockConsoleLog).toHaveBeenCalledWith('WHITE:Choose a topic to learn more:');
    });
  });

  describe('getCommandExamples', () => {
    it('should return examples for init command', () => {
      const examples = (HelpSystem as any).getCommandExamples('init');

      expect(examples).toHaveLength(4);
      expect(examples[0].command).toBe('memory-banks init');
      expect(examples[0].category).toBe('basic');
    });

    it('should return examples for list command', () => {
      const examples = (HelpSystem as any).getCommandExamples('list');

      expect(examples).toHaveLength(3);
      expect(examples[0].command).toBe('memory-banks list');
      expect(examples[0].category).toBe('basic');
    });

    it('should return empty array for unknown command', () => {
      const examples = (HelpSystem as any).getCommandExamples('unknown');

      expect(examples).toHaveLength(0);
    });
  });

  describe('getCommandTroubleshooting', () => {
    it('should return troubleshooting tips for init command', () => {
      const tips = (HelpSystem as any).getCommandTroubleshooting('init');

      expect(tips).toHaveLength(4);
      expect(tips[0]).toContain('--yes flag');
    });

    it('should return troubleshooting tips for validate command', () => {
      const tips = (HelpSystem as any).getCommandTroubleshooting('validate');

      expect(tips).toHaveLength(3);
      expect(tips[0]).toContain('--strict');
    });

    it('should return empty array for unknown command', () => {
      const tips = (HelpSystem as any).getCommandTroubleshooting('unknown');

      expect(tips).toHaveLength(0);
    });
  });
}); 