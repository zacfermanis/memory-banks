import * as fs from 'fs';
import * as path from 'path';
import {
  GuideInfo,
  CustomGuideConfig,
  ValidationResult,
} from '../config/types';
import { validateGuideStructure } from '../utils/validation';

/**
 * Service for discovering and managing development guides
 */
export class GuideDiscoveryService {
  /**
   * Discover all built-in development guides
   */
  discoverBuiltInGuides(): GuideInfo[] {
    return [
      {
        id: 'lua',
        displayName: 'Lua - For Lua/Love2D game development',
        type: 'built-in',
        folderPath: path.join(
          __dirname,
          '..',
          '..',
          'src',
          'developmentGuides',
          'Lua'
        ),
        hasCursorRules: true,
      },
      {
        id: 'web',
        displayName: 'Web - For TypeScript/React/Next.js development',
        type: 'built-in',
        folderPath: path.join(
          __dirname,
          '..',
          '..',
          'src',
          'developmentGuides',
          'Web'
        ),
        hasCursorRules: true,
      },
      {
        id: 'java',
        displayName: 'Java - For Java/Spring Boot development',
        type: 'built-in',
        folderPath: path.join(
          __dirname,
          '..',
          '..',
          'src',
          'developmentGuides',
          'Java'
        ),
        hasCursorRules: true,
      },
    ];
  }

  /**
   * Discover custom development guides from the configured folder with error handling
   */
  discoverCustomGuides(config: CustomGuideConfig): GuideInfo[] {
    const guides: GuideInfo[] = [];
    const errors: string[] = [];

    try {
      // Check if custom guides folder exists
      if (!fs.existsSync(config.customGuidesFolder)) {
        return [];
      }

      // Check if it's a directory
      const stats = fs.statSync(config.customGuidesFolder);
      if (!stats.isDirectory()) {
        return [];
      }

      // Read directory contents
      const items = fs.readdirSync(config.customGuidesFolder);

      for (const item of items) {
        try {
          const itemPath = path.join(config.customGuidesFolder, item);

          // Check if item is a directory
          const itemStats = fs.statSync(itemPath);
          if (!itemStats.isDirectory()) {
            continue;
          }

          // Validate the guide structure
          const validation = this.validateGuide(itemPath);
          if (!validation.isValid) {
            errors.push(`Guide '${item}': ${validation.error}`);
            continue;
          }

          // Check for required developmentGuide.md file
          const developmentGuidePath = path.join(
            itemPath,
            'developmentGuide.md'
          );
          if (!fs.existsSync(developmentGuidePath)) {
            errors.push(
              `Guide '${item}' missing required file: developmentGuide.md`
            );
            continue;
          }

          // Check if there's a custom menu item configuration for this guide
          const customMenuItem = config.menuItems.find(
            (menuItem) => menuItem.id === item
          );

          // Determine if guide has cursor rules
          const hasCursorRules = fs.existsSync(
            path.join(itemPath, '.cursorrules')
          );

          const guide: GuideInfo = {
            id: item,
            displayName: customMenuItem?.displayName || item,
            type: 'custom',
            folderPath: itemPath,
            hasCursorRules,
            category: customMenuItem?.category,
            description: customMenuItem?.description,
          };

          guides.push(guide);
        } catch (itemError) {
          errors.push(
            `Error processing guide '${item}': ${itemError instanceof Error ? itemError.message : 'Unknown error'}`
          );
        }
      }

      // Log any errors for debugging
      if (errors.length > 0) {
        console.warn('⚠️  Custom guide discovery warnings:');
        errors.forEach((error) => {
          console.warn(`   - ${error}`);
        });
      }

      return guides;
    } catch (error) {
      // Return empty array on any error, but log the error
      console.warn(
        `⚠️  Custom guides discovery failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      return [];
    }
  }

  /**
   * Validate a development guide folder structure
   */
  validateGuide(guidePath: string): ValidationResult {
    return validateGuideStructure(guidePath);
  }

  /**
   * Get all available guides (built-in and custom) with error handling
   */
  getAllGuides(config: CustomGuideConfig): GuideInfo[] {
    const builtInGuides = this.discoverBuiltInGuides();
    const customGuides = this.discoverCustomGuides(config);

    // Combine guides with built-in guides first, then custom guides
    return [...builtInGuides, ...customGuides];
  }

  /**
   * Check if a guide is valid and accessible
   */
  isGuideAccessible(guide: GuideInfo): boolean {
    try {
      // Check if guide folder exists
      if (!fs.existsSync(guide.folderPath)) {
        return false;
      }

      // Check if it's a directory
      const stats = fs.statSync(guide.folderPath);
      if (!stats.isDirectory()) {
        return false;
      }

      // Check for required developmentGuide.md file
      const developmentGuidePath = path.join(
        guide.folderPath,
        'developmentGuide.md'
      );
      if (!fs.existsSync(developmentGuidePath)) {
        return false;
      }

      // Check if developmentGuide.md is readable
      try {
        fs.accessSync(developmentGuidePath, fs.constants.R_OK);
      } catch {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get guide information with validation
   */
  getGuideInfo(guidePath: string): GuideInfo | null {
    try {
      if (!fs.existsSync(guidePath)) {
        return null;
      }

      const stats = fs.statSync(guidePath);
      if (!stats.isDirectory()) {
        return null;
      }

      const guideName = path.basename(guidePath);
      const developmentGuidePath = path.join(guidePath, 'developmentGuide.md');
      const hasCursorRules = fs.existsSync(
        path.join(guidePath, '.cursorrules')
      );

      if (!fs.existsSync(developmentGuidePath)) {
        return null;
      }

      return {
        id: guideName,
        displayName: guideName,
        type: 'custom',
        folderPath: guidePath,
        hasCursorRules,
      };
    } catch {
      return null;
    }
  }
}
