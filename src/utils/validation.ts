import * as fs from 'fs';
import * as path from 'path';
import { ValidationResult } from '../config/types';
import { CustomGuideConfig } from '../config/types';

/**
 * Validate a file path for security and correctness
 */
export function validateFilePath(filePath: string): ValidationResult {
  // Check for empty or null values
  if (!filePath || filePath.trim() === '') {
    return {
      isValid: false,
      error: 'File path cannot be empty',
    };
  }

  // Check for invalid characters
  const invalidChars = /[<>:"|?*\0]/;
  if (invalidChars.test(filePath)) {
    return {
      isValid: false,
      error: 'File path contains invalid characters',
    };
  }

  // Check for directory traversal attempts
  const traversalPattern = /\.\./;
  if (traversalPattern.test(filePath)) {
    return {
      isValid: false,
      error: 'File path contains directory traversal',
    };
  }

  return {
    isValid: true,
  };
}

/**
 * Validate the structure of a development guide folder
 */
export function validateGuideStructure(guidePath: string): ValidationResult {
  try {
    const warnings: string[] = [];

    // Check for required developmentGuide.md file
    const developmentGuidePath = path.join(guidePath, 'developmentGuide.md');
    if (!fs.existsSync(developmentGuidePath)) {
      return {
        isValid: false,
        error: 'Guide is missing required file: developmentGuide.md',
      };
    }

    // Check for optional .cursorrules file
    const cursorRulesPath = path.join(guidePath, '.cursorrules');
    if (!fs.existsSync(cursorRulesPath)) {
      warnings.push('Guide is missing optional file: .cursorrules');
    }

    return {
      isValid: true,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown error during validation',
    };
  }
}

/**
 * Validate a custom guide configuration
 */
export function validateConfiguration(config: CustomGuideConfig): ValidationResult {
  try {
    // Validate version
    if (config.version !== '1.0.0') {
      return {
        isValid: false,
        error: `Invalid version: ${config.version}. Expected: 1.0.0`,
      };
    }

    // Validate custom guides folder path
    if (!config.customGuidesFolder || config.customGuidesFolder.trim() === '') {
      return {
        isValid: false,
        error: 'Custom guides folder path cannot be empty',
      };
    }

    // Check if custom guides folder exists
    if (!fs.existsSync(config.customGuidesFolder)) {
      return {
        isValid: false,
        error: `Custom guides folder does not exist: ${config.customGuidesFolder}`,
      };
    }

    // Check if custom guides folder is a directory
    const stats = fs.statSync(config.customGuidesFolder);
    if (!stats.isDirectory()) {
      return {
        isValid: false,
        error: `Custom guides folder is not a directory: ${config.customGuidesFolder}`,
      };
    }

    // Validate menu items
    for (const menuItem of config.menuItems) {
      if (!menuItem.folderPath || menuItem.folderPath.trim() === '') {
        return {
          isValid: false,
          error: `Menu item '${menuItem.id}' has empty folder path`,
        };
      }

      if (!fs.existsSync(menuItem.folderPath)) {
        return {
          isValid: false,
          error: `Menu item folder does not exist: ${menuItem.folderPath}`,
        };
      }
    }

    return {
      isValid: true,
    };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown error during validation',
    };
  }
} 