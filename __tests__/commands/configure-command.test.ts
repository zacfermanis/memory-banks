import { ConfigureCommand } from '../../src/commands/configure-command';
import { ConfigurationManager } from '../../src/config/configuration-manager';
import { CustomGuideConfig } from '../../src/config/types';

// Mock dependencies
jest.mock('../../src/config/configuration-manager');
jest.mock('inquirer', () => ({
  prompt: jest.fn()
}));

const mockInquirer = require('inquirer');
const MockedConfigurationManager = ConfigurationManager as jest.MockedClass<typeof ConfigurationManager>;

describe('ConfigureCommand', () => {
  let configureCommand: ConfigureCommand;
  let mockConfigManager: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockConfigManager = {
      loadConfig: jest.fn().mockResolvedValue({
        version: '1.0.0',
        customGuidesFolder: '/default/path',
        menuItems: []
      }),
      saveConfig: jest.fn().mockResolvedValue(undefined),
      getDefaultConfig: jest.fn().mockReturnValue({
        version: '1.0.0',
        customGuidesFolder: '/default/path',
        menuItems: []
      }),
      validateConfig: jest.fn().mockReturnValue({ isValid: true }),
    } as any;

    MockedConfigurationManager.mockImplementation(() => mockConfigManager);
    
    configureCommand = new ConfigureCommand();
  });

  describe('constructor', () => {
    it('should create a new ConfigurationManager instance', () => {
      expect(MockedConfigurationManager).toHaveBeenCalledWith();
      expect(configureCommand['configManager']).toBe(mockConfigManager);
    });
  });

  describe('run', () => {
    it('should load existing config and start configuration flow', async () => {
      const mockConfig: CustomGuideConfig = {
        version: '1.0.0',
        customGuidesFolder: '/path/to/guides',
        menuItems: [
          { id: 'custom-guide', displayName: 'Custom Guide', folderPath: 'custom-guide' }
        ]
      };

      mockConfigManager.loadConfig.mockResolvedValue(mockConfig);
      mockInquirer.prompt.mockResolvedValue({ action: 'main-menu' });

      await configureCommand.run();

      expect(mockConfigManager.loadConfig).toHaveBeenCalled();
      expect(mockInquirer.prompt).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'list',
            name: 'action',
            message: 'What would you like to configure?'
          })
        ])
      );
    });

    it('should handle config loading errors gracefully', async () => {
      mockConfigManager.loadConfig.mockRejectedValue(new Error('Config error'));
      mockInquirer.prompt.mockResolvedValue({ action: 'main-menu' });

      await configureCommand.run();

      expect(mockConfigManager.loadConfig).toHaveBeenCalled();
      expect(mockInquirer.prompt).toHaveBeenCalled();
    });
  });

  describe('showMainMenu', () => {
    it('should display main configuration options', async () => {
      mockInquirer.prompt.mockResolvedValue({ action: 'exit' });

      const mockConfig = {
        version: '1.0.0',
        customGuidesFolder: '/path/to/guides',
        menuItems: []
      };
      await configureCommand['showMainMenu'](mockConfig);

      expect(mockInquirer.prompt).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'list',
            name: 'action',
            message: 'What would you like to configure?',
            choices: expect.arrayContaining([
              'Set custom guides folder',
              'Manage menu items',
              'View current configuration',
              'Exit'
            ])
          })
        ])
      );
    });

    it('should call configureCustomGuidesFolder when selected', async () => {
      const spy = jest.spyOn(configureCommand as any, 'configureCustomGuidesFolder');
      mockInquirer.prompt.mockResolvedValue({ action: 'custom-folder' });

      const mockConfig = {
        version: '1.0.0',
        customGuidesFolder: '/path/to/guides',
        menuItems: []
      };
      await configureCommand['showMainMenu'](mockConfig);

      expect(spy).toHaveBeenCalled();
    });

    it('should call manageMenuItems when selected', async () => {
      const spy = jest.spyOn(configureCommand as any, 'manageMenuItems');
      mockInquirer.prompt.mockResolvedValue({ action: 'menu-items' });

      const mockConfig = {
        version: '1.0.0',
        customGuidesFolder: '/path/to/guides',
        menuItems: []
      };
      await configureCommand['showMainMenu'](mockConfig);

      expect(spy).toHaveBeenCalled();
    });

    it('should call showCurrentConfig when selected', async () => {
      const spy = jest.spyOn(configureCommand as any, 'showCurrentConfig');
      mockInquirer.prompt.mockResolvedValue({ action: 'view-config' });

      const mockConfig = {
        version: '1.0.0',
        customGuidesFolder: '/path/to/guides',
        menuItems: []
      };
      await configureCommand['showMainMenu'](mockConfig);

      expect(spy).toHaveBeenCalled();
    });

    it('should exit when exit is selected', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      mockInquirer.prompt.mockResolvedValue({ action: 'exit' });

      const mockConfig = {
        version: '1.0.0',
        customGuidesFolder: '/path/to/guides',
        menuItems: []
      };
      await configureCommand['showMainMenu'](mockConfig);

      expect(consoleSpy).toHaveBeenCalledWith('Configuration complete!');
    });
  });

  describe('configureCustomGuidesFolder', () => {
    it('should prompt for folder path and save configuration', async () => {
      const mockConfig: CustomGuideConfig = {
        version: '1.0.0',
        customGuidesFolder: '/old/path',
        menuItems: []
      };

      mockInquirer.prompt.mockResolvedValue({ 
        folderPath: '/new/path/to/guides' 
      });
      mockConfigManager.saveConfig.mockResolvedValue(undefined);
      mockConfigManager.validateConfig.mockReturnValue({ isValid: true });

      await configureCommand['configureCustomGuidesFolder'](mockConfig);

      expect(mockInquirer.prompt).toHaveBeenCalledWith([
        expect.objectContaining({
          type: 'input',
          name: 'folderPath',
          message: 'Enter the path to your custom guides folder:',
          default: '/old/path'
        })
      ]);

      expect(mockConfigManager.saveConfig).toHaveBeenCalledWith({
        ...mockConfig,
        customGuidesFolder: '/new/path/to/guides'
      });
    });

    it('should handle validation errors', async () => {
      const mockConfig: CustomGuideConfig = {
        version: '1.0.0',
        customGuidesFolder: '/old/path',
        menuItems: []
      };

      mockInquirer.prompt.mockResolvedValue({ 
        folderPath: '/invalid/path' 
      });
      mockConfigManager.validateConfig.mockReturnValue({ 
        isValid: false, 
        error: 'Invalid path' 
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await configureCommand['configureCustomGuidesFolder'](mockConfig);

      expect(consoleSpy).toHaveBeenCalledWith('Error: Invalid path');
      expect(mockConfigManager.saveConfig).not.toHaveBeenCalled();
    });

    it('should handle save errors', async () => {
      const mockConfig: CustomGuideConfig = {
        version: '1.0.0',
        customGuidesFolder: '/old/path',
        menuItems: []
      };

      mockInquirer.prompt.mockResolvedValue({ 
        folderPath: '/new/path' 
      });
      mockConfigManager.saveConfig.mockRejectedValue(new Error('Save failed'));
      mockConfigManager.validateConfig.mockReturnValue({ isValid: true });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await configureCommand['configureCustomGuidesFolder'](mockConfig);

      expect(consoleSpy).toHaveBeenCalledWith('Error: Save failed');
    });
  });

  describe('manageMenuItems', () => {
    it('should display menu item management options', async () => {
      const mockConfig: CustomGuideConfig = {
        version: '1.0.0',
        customGuidesFolder: '/path/to/guides',
        menuItems: [
          { id: 'guide1', displayName: 'Guide 1', folderPath: 'guide1' },
          { id: 'guide2', displayName: 'Guide 2', folderPath: 'guide2' }
        ]
      };

      mockInquirer.prompt.mockResolvedValue({ action: 'back' });

      await configureCommand['manageMenuItems'](mockConfig);

      expect(mockInquirer.prompt).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'list',
            name: 'action',
            message: 'Manage menu items:',
            choices: expect.arrayContaining([
              'Add new menu item',
              'Edit existing menu item',
              'Remove menu item',
              'Back to main menu'
            ])
          })
        ])
      );
    });

    it('should call addMenuItem when selected', async () => {
      const mockConfig: CustomGuideConfig = {
        version: '1.0.0',
        customGuidesFolder: '/path/to/guides',
        menuItems: []
      };

      const spy = jest.spyOn(configureCommand as any, 'addMenuItem');
      mockInquirer.prompt.mockResolvedValue({ action: 'add' });

      await configureCommand['manageMenuItems'](mockConfig);

      expect(spy).toHaveBeenCalledWith(mockConfig);
    });

    it('should call editMenuItem when selected', async () => {
      const mockConfig: CustomGuideConfig = {
        version: '1.0.0',
        customGuidesFolder: '/path/to/guides',
        menuItems: [{ id: 'guide1', displayName: 'Guide 1', folderPath: 'guide1' }]
      };

      const spy = jest.spyOn(configureCommand as any, 'editMenuItem');
      mockInquirer.prompt.mockResolvedValue({ action: 'edit' });

      await configureCommand['manageMenuItems'](mockConfig);

      expect(spy).toHaveBeenCalledWith(mockConfig);
    });

    it('should call removeMenuItem when selected', async () => {
      const mockConfig: CustomGuideConfig = {
        version: '1.0.0',
        customGuidesFolder: '/path/to/guides',
        menuItems: [{ id: 'guide1', displayName: 'Guide 1', folderPath: 'guide1' }]
      };

      const spy = jest.spyOn(configureCommand as any, 'removeMenuItem');
      mockInquirer.prompt.mockResolvedValue({ action: 'remove' });

      await configureCommand['manageMenuItems'](mockConfig);

      expect(spy).toHaveBeenCalledWith(mockConfig);
    });
  });

  describe('addMenuItem', () => {
    it('should prompt for menu item details and save', async () => {
      const mockConfig: CustomGuideConfig = {
        version: '1.0.0',
        customGuidesFolder: '/path/to/guides',
        menuItems: []
      };

      mockInquirer.prompt.mockResolvedValue({
        displayName: 'New Guide',
        folderPath: 'new-guide'
      });
      mockConfigManager.saveConfig.mockResolvedValue(undefined);
      mockConfigManager.validateConfig.mockReturnValue({ isValid: true });

      await configureCommand['addMenuItem'](mockConfig);

      expect(mockInquirer.prompt).toHaveBeenCalledWith([
        expect.objectContaining({
          type: 'input',
          name: 'displayName',
          message: 'Enter the display name for this menu item:'
        }),
        expect.objectContaining({
          type: 'input',
          name: 'folderPath',
          message: 'Enter the folder name (should match a subfolder in your guides directory):'
        })
      ]);

      expect(mockConfigManager.saveConfig).toHaveBeenCalledWith({
        ...mockConfig,
        menuItems: [{ 
          id: expect.any(String), 
          displayName: 'New Guide', 
          folderPath: 'new-guide' 
        }]
      });
    });

    it('should handle validation errors', async () => {
      const mockConfig: CustomGuideConfig = {
        version: '1.0.0',
        customGuidesFolder: '/path/to/guides',
        menuItems: []
      };

      mockInquirer.prompt.mockResolvedValue({
        displayName: 'New Guide',
        folderPath: 'new-guide'
      });
      mockConfigManager.validateConfig.mockReturnValue({
        isValid: false,
        error: 'Invalid menu item'
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await configureCommand['addMenuItem'](mockConfig);

      expect(consoleSpy).toHaveBeenCalledWith('Error: Invalid menu item');
      expect(mockConfigManager.saveConfig).not.toHaveBeenCalled();
    });
  });

  describe('editMenuItem', () => {
    it('should prompt to select menu item and edit it', async () => {
      const mockConfig: CustomGuideConfig = {
        version: '1.0.0',
        customGuidesFolder: '/path/to/guides',
        menuItems: [
          { id: 'guide1', displayName: 'Guide 1', folderPath: 'guide1' },
          { id: 'guide2', displayName: 'Guide 2', folderPath: 'guide2' }
        ]
      };

      mockInquirer.prompt
        .mockResolvedValueOnce({ selectedItem: 'Guide 1' })
        .mockResolvedValueOnce({
          displayName: 'Updated Guide 1',
          folderPath: 'updated-guide1'
        });
      mockConfigManager.saveConfig.mockResolvedValue(undefined);
      mockConfigManager.validateConfig.mockReturnValue({ isValid: true });

      await configureCommand['editMenuItem'](mockConfig);

      expect(mockInquirer.prompt).toHaveBeenCalledTimes(2);
      expect(mockConfigManager.saveConfig).toHaveBeenCalledWith({
        ...mockConfig,
        menuItems: [
          { id: 'guide1', displayName: 'Updated Guide 1', folderPath: 'updated-guide1' },
          { id: 'guide2', displayName: 'Guide 2', folderPath: 'guide2' }
        ]
      });
    });

    it('should handle empty menu items list', async () => {
      const mockConfig: CustomGuideConfig = {
        version: '1.0.0',
        customGuidesFolder: '/path/to/guides',
        menuItems: []
      };

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await configureCommand['editMenuItem'](mockConfig);

      expect(consoleSpy).toHaveBeenCalledWith('No menu items to edit.');
    });
  });

  describe('removeMenuItem', () => {
    it('should prompt to select menu item and remove it', async () => {
      const mockConfig: CustomGuideConfig = {
        version: '1.0.0',
        customGuidesFolder: '/path/to/guides',
        menuItems: [
          { id: 'guide1', displayName: 'Guide 1', folderPath: 'guide1' },
          { id: 'guide2', displayName: 'Guide 2', folderPath: 'guide2' }
        ]
      };

      mockInquirer.prompt
        .mockResolvedValueOnce({ selectedItem: 'Guide 1' })
        .mockResolvedValueOnce({ confirm: true });
      mockConfigManager.saveConfig.mockResolvedValue(undefined);

      await configureCommand['removeMenuItem'](mockConfig);

      expect(mockConfigManager.saveConfig).toHaveBeenCalledWith({
        ...mockConfig,
        menuItems: [{ id: 'guide2', displayName: 'Guide 2', folderPath: 'guide2' }]
      });
    });

    it('should handle empty menu items list', async () => {
      const mockConfig: CustomGuideConfig = {
        version: '1.0.0',
        customGuidesFolder: '/path/to/guides',
        menuItems: []
      };

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await configureCommand['removeMenuItem'](mockConfig);

      expect(consoleSpy).toHaveBeenCalledWith('No menu items to remove.');
    });

    it('should not remove item if user cancels', async () => {
      const mockConfig: CustomGuideConfig = {
        version: '1.0.0',
        customGuidesFolder: '/path/to/guides',
        menuItems: [{ id: 'guide1', displayName: 'Guide 1', folderPath: 'guide1' }]
      };

      mockInquirer.prompt
        .mockResolvedValueOnce({ selectedItem: 'Guide 1' })
        .mockResolvedValueOnce({ confirm: false });

      await configureCommand['removeMenuItem'](mockConfig);

      expect(mockConfigManager.saveConfig).not.toHaveBeenCalled();
    });
  });

  describe('showCurrentConfig', () => {
    it('should display current configuration', async () => {
      const mockConfig: CustomGuideConfig = {
        version: '1.0.0',
        customGuidesFolder: '/path/to/guides',
        menuItems: [
          { id: 'guide1', displayName: 'Guide 1', folderPath: 'guide1' },
          { id: 'guide2', displayName: 'Guide 2', folderPath: 'guide2' }
        ]
      };

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      mockInquirer.prompt.mockResolvedValue({ action: 'back' });

      await configureCommand['showCurrentConfig'](mockConfig);

      expect(consoleSpy).toHaveBeenCalledWith('Current Configuration:');
      expect(consoleSpy).toHaveBeenCalledWith('Custom Guides Folder: /path/to/guides');
      expect(consoleSpy).toHaveBeenCalledWith('Menu Items:');
      expect(consoleSpy).toHaveBeenCalledWith('  - Guide 1 (folder: guide1)');
      expect(consoleSpy).toHaveBeenCalledWith('  - Guide 2 (folder: guide2)');
    });

    it('should handle empty menu items', async () => {
      const mockConfig: CustomGuideConfig = {
        version: '1.0.0',
        customGuidesFolder: '/path/to/guides',
        menuItems: []
      };

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      mockInquirer.prompt.mockResolvedValue({ action: 'back' });

      await configureCommand['showCurrentConfig'](mockConfig);

      expect(consoleSpy).toHaveBeenCalledWith('  No menu items configured');
    });
  });
}); 