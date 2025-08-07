import { ConfigurationManager } from '../config/configuration-manager';
import { CustomGuideConfig, CustomMenuItem } from '../config/types';

/**
 * Command for configuring custom development guides
 */
export class ConfigureCommand {
  private configManager: ConfigurationManager;

  constructor() {
    this.configManager = new ConfigurationManager();
  }

  /**
   * Run the configuration command
   */
  async run(): Promise<void> {
    try {
      const config = await this.configManager.loadConfig();
      await this.showMainMenu(config);
    } catch (error) {
      console.error('Error loading configuration:', error);
      const defaultConfig = this.configManager.getDefaultConfig();
      await this.showMainMenu(defaultConfig);
    }
  }

  /**
   * Show the main configuration menu
   */
  private async showMainMenu(config: CustomGuideConfig): Promise<void> {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { default: inquirer } = await import('inquirer');
      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'What would you like to configure?',
          choices: [
            'Set custom guides folder',
            'Manage menu items',
            'View current configuration',
            'Exit',
          ],
        },
      ]);

      switch (action) {
        case 'Set custom guides folder':
          await this.configureCustomGuidesFolder(config);
          break;
        case 'Manage menu items':
          await this.manageMenuItems(config);
          break;
        case 'View current configuration':
          await this.showCurrentConfig(config);
          break;
        case 'Exit':
          console.log('Configuration complete!');
          return;
      }
    }
  }

  /**
   * Configure the custom guides folder path
   */
  private async configureCustomGuidesFolder(
    config: CustomGuideConfig
  ): Promise<void> {
    const { default: inquirer } = await import('inquirer');
    const { folderPath } = await inquirer.prompt([
      {
        type: 'input',
        name: 'folderPath',
        message: 'Enter the path to your custom guides folder:',
        default: config.customGuidesFolder,
      },
    ]);

    const updatedConfig = {
      ...config,
      customGuidesFolder: folderPath,
    };

    const validation = this.configManager.validateConfig(updatedConfig);
    if (!validation.isValid) {
      console.error('Error:', validation.error);
      return;
    }

    try {
      await this.configManager.saveConfig(updatedConfig);
      console.log('Custom guides folder updated successfully!');
    } catch (error) {
      console.error('Error:', error);
    }
  }

  /**
   * Manage menu items (add, edit, remove)
   */
  private async manageMenuItems(config: CustomGuideConfig): Promise<void> {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { default: inquirer } = await import('inquirer');
      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'Manage menu items:',
          choices: [
            'Add new menu item',
            'Edit existing menu item',
            'Remove menu item',
            'Back to main menu',
          ],
        },
      ]);

      switch (action) {
        case 'Add new menu item':
          await this.addMenuItem(config);
          break;
        case 'Edit existing menu item':
          await this.editMenuItem(config);
          break;
        case 'Remove menu item':
          await this.removeMenuItem(config);
          break;
        case 'Back to main menu':
          return;
      }
    }
  }

  /**
   * Add a new menu item
   */
  private async addMenuItem(config: CustomGuideConfig): Promise<void> {
    const { default: inquirer } = await import('inquirer');
    const { displayName, folderPath } = await inquirer.prompt([
      {
        type: 'input',
        name: 'displayName',
        message: 'Enter the display name for this menu item:',
      },
      {
        type: 'input',
        name: 'folderPath',
        message:
          'Enter the folder name (should match a subfolder in your guides directory):',
      },
    ]);

    const newMenuItem: CustomMenuItem = {
      id: this.generateId(),
      displayName,
      folderPath,
    };

    const updatedConfig = {
      ...config,
      menuItems: [...config.menuItems, newMenuItem],
    };

    const validation = this.configManager.validateConfig(updatedConfig);
    if (!validation.isValid) {
      console.error('Error:', validation.error);
      return;
    }

    try {
      await this.configManager.saveConfig(updatedConfig);
      console.log('Menu item added successfully!');
    } catch (error) {
      console.error('Error:', error);
    }
  }

  /**
   * Edit an existing menu item
   */
  private async editMenuItem(config: CustomGuideConfig): Promise<void> {
    if (config.menuItems.length === 0) {
      console.log('No menu items to edit.');
      return;
    }

    const { default: inquirer } = await import('inquirer');
    const { selectedItem } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedItem',
        message: 'Select a menu item to edit:',
        choices: config.menuItems.map((item) => item.displayName),
      },
    ]);

    const itemToEdit = config.menuItems.find(
      (item) => item.displayName === selectedItem
    );
    if (!itemToEdit) {
      console.error('Menu item not found.');
      return;
    }

    const { displayName, folderPath } = await inquirer.prompt([
      {
        type: 'input',
        name: 'displayName',
        message: 'Enter the new display name:',
        default: itemToEdit.displayName,
      },
      {
        type: 'input',
        name: 'folderPath',
        message: 'Enter the new folder path:',
        default: itemToEdit.folderPath,
      },
    ]);

    const updatedConfig = {
      ...config,
      menuItems: config.menuItems.map((item) =>
        item.id === itemToEdit.id ? { ...item, displayName, folderPath } : item
      ),
    };

    const validation = this.configManager.validateConfig(updatedConfig);
    if (!validation.isValid) {
      console.error('Error:', validation.error);
      return;
    }

    try {
      await this.configManager.saveConfig(updatedConfig);
      console.log('Menu item updated successfully!');
    } catch (error) {
      console.error('Error:', error);
    }
  }

  /**
   * Remove a menu item
   */
  private async removeMenuItem(config: CustomGuideConfig): Promise<void> {
    if (config.menuItems.length === 0) {
      console.log('No menu items to remove.');
      return;
    }

    const { default: inquirer } = await import('inquirer');
    const { selectedItem } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedItem',
        message: 'Select a menu item to remove:',
        choices: config.menuItems.map((item) => item.displayName),
      },
    ]);

    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `Are you sure you want to remove "${selectedItem}"?`,
        default: false,
      },
    ]);

    if (!confirm) {
      return;
    }

    const updatedConfig = {
      ...config,
      menuItems: config.menuItems.filter(
        (item) => item.displayName !== selectedItem
      ),
    };

    try {
      await this.configManager.saveConfig(updatedConfig);
      console.log('Menu item removed successfully!');
    } catch (error) {
      console.error('Error:', error);
    }
  }

  /**
   * Show current configuration
   */
  private async showCurrentConfig(config: CustomGuideConfig): Promise<void> {
    console.log('Current Configuration:');
    console.log(`Custom Guides Folder: ${config.customGuidesFolder}`);
    console.log('Menu Items:');

    if (config.menuItems.length === 0) {
      console.log('  No menu items configured');
    } else {
      config.menuItems.forEach((item) => {
        console.log(`  - ${item.displayName} (folder: ${item.folderPath})`);
      });
    }

    const { default: inquirer } = await import('inquirer');
    await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'Press Enter to continue:',
        choices: ['Back to main menu'],
      },
    ]);
  }

  /**
   * Generate a unique ID for menu items
   */
  private generateId(): string {
    return `menu-item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
