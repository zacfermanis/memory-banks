#!/usr/bin/env node

import inquirer from 'inquirer';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigurationManager } from './config/configuration-manager';
import { GuideDiscoveryService } from './services/guide-discovery-service';
import { FileCopyService } from './services/file-copy-service';
import { GuideInfo } from './config/types';

/**
 * Main entry point for the Memory Bank Initializer
 *
 * This function orchestrates the complete workflow:
 * 1. Loads and validates configuration
 * 2. Discovers built-in and custom development guides
 * 3. Presents an interactive menu for guide selection
 * 4. Copies selected guide files to the current project
 *
 * The function includes comprehensive error handling to ensure
 * graceful degradation when configuration or custom guides are unavailable.
 *
 * @returns Promise<void> - Resolves when the operation completes
 * @throws Error - If no guides are available or critical operations fail
 */
export async function main() {
  console.log('🚀 Memory Bank Initializer');
  console.log('==========================\n');

  try {
    // Load configuration and discover guides with comprehensive error handling
    const configManager = new ConfigurationManager();
    const guideDiscoveryService = new GuideDiscoveryService();
    const fileCopyService = new FileCopyService();

    console.log('📋 Loading configuration...');
    let config;
    let configErrors: string[] = [];

    try {
      config = await configManager.loadConfig();

      // Validate configuration and collect any warnings
      const validation = configManager.validateConfig(config);
      if (!validation.isValid) {
        configErrors.push(
          validation.error || 'Configuration validation failed'
        );
      }
      if (validation.warnings && validation.warnings.length > 0) {
        configErrors.push(...validation.warnings);
      }
      console.log('✅ Configuration loaded successfully');
    } catch (error) {
      console.log(
        '⚠️  Configuration loading failed, using built-in guides only.'
      );
      console.log(
        `   Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      config = configManager.getDefaultConfig();
      configErrors.push('Configuration loading failed');
    }

    // Discover all available guides with error handling
    console.log('🔍 Discovering development guides...');
    const builtInGuides = guideDiscoveryService.discoverBuiltInGuides();
    console.log(`✅ Found ${builtInGuides.length} built-in guides`);

    let customGuides: GuideInfo[] = [];
    let customGuideErrors: string[] = [];

    try {
      customGuides = guideDiscoveryService.discoverCustomGuides(config);
      if (customGuides.length > 0) {
        console.log(`✅ Found ${customGuides.length} custom guides`);
      } else {
        console.log('ℹ️  No custom guides found');
      }
    } catch (error) {
      customGuideErrors.push(
        `Custom guides discovery failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    // Show warnings for configuration issues
    if (configErrors.length > 0) {
      console.log('\n⚠️  Configuration warnings:');
      configErrors.forEach((error) => {
        console.log(`   - ${error}`);
      });
      console.log(
        '   Using built-in guides only. Run "npx memory-bank-configure" to fix configuration issues.\n'
      );
    }

    if (customGuideErrors.length > 0) {
      console.log('\n⚠️  Custom guides warnings:');
      customGuideErrors.forEach(error => {
        console.log(`   - ${error}`);
      });
      console.log('   Custom guides will not be available. Check your custom guides folder configuration.\n');
    }

    const allGuides = [...builtInGuides, ...customGuides];

    if (allGuides.length === 0) {
      throw new Error('No guides found. Please check your configuration or reinstall the package.');
    }

    // Create menu choices with clear labeling
    const choices = allGuides.map(guide => ({
      name: `${guide.displayName}${guide.type === 'custom' ? ' (Custom)' : ''}`,
      value: guide.id,
      guide: guide
    }));

    console.log('\n📝 Available development guides:');
    choices.forEach((choice, index) => {
      const prefix = choice.guide.type === 'custom' ? '🔧' : '📦';
      console.log(`   ${index + 1}. ${prefix} ${choice.name}`);
    });

    const { selectedGuideId } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedGuideId',
        message: 'What type of memory bank would you like to install?',
        choices: choices,
      },
    ]);

    const selectedGuide = allGuides.find(guide => guide.id === selectedGuideId);
    if (!selectedGuide) {
      throw new Error(`Selected guide not found: ${selectedGuideId}. Please try again.`);
    }

    console.log(`\n📦 Installing ${selectedGuide.displayName} Memory Bank...\n`);

    // Create directories with error handling
    console.log('📁 Creating project directories...');
    const memoryBankDir = path.join(process.cwd(), '.memory-bank');
    const specsDir = path.join(process.cwd(), '.specs');

    try {
      if (!fs.existsSync(memoryBankDir)) {
        fs.mkdirSync(memoryBankDir, { recursive: true });
        console.log('✅ Created .memory-bank directory');
      } else {
        console.log('ℹ️  .memory-bank directory already exists');
      }
    } catch (error) {
      throw new Error(`Failed to create .memory-bank directory: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    try {
      if (!fs.existsSync(specsDir)) {
        fs.mkdirSync(specsDir, { recursive: true });
        console.log('✅ Created .specs directory');
      } else {
        console.log('ℹ️  .specs directory already exists');
      }
    } catch (error) {
      throw new Error(`Failed to create .specs directory: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Copy guide files using the file copy service with comprehensive error handling
    console.log('📄 Copying guide files...');
    const targetDir = process.cwd();
    const copyResults = fileCopyService.copyGuideFilesWithBackup(selectedGuide, targetDir);

    // Check for any copy failures and provide detailed error information
    const failedCopies = copyResults.filter(result => !result.success);
    if (failedCopies.length > 0) {
      console.error('\n❌ Some files failed to copy:');
      failedCopies.forEach(result => {
        console.error(`   - ${result.error}`);
        if (result.rollbackError) {
          console.error(`     Rollback failed: ${result.rollbackError}`);
        }
      });
      
      // Provide recovery instructions
      console.error('\n💡 Recovery options:');
      console.error('   1. Check file permissions in your project directory');
      console.error('   2. Ensure you have write access to the current directory');
      console.error('   3. Try running the command again');
      console.error('   4. If the issue persists, try running as administrator');
      
      throw new Error('Failed to copy some guide files. See error details above.');
    }

    // Report successful copies with detailed information
    console.log('✅ File copy operations completed successfully:');
    copyResults.forEach(result => {
      if (result.success) {
        const fileName = path.basename(result.copiedFilePath || '');
        if (fileName === 'developmentGuide.md') {
          console.log('   📖 Copied development guide to .memory-bank directory');
        } else if (fileName === '.cursorrules') {
          console.log('   ⚙️  Copied .cursorrules to project root');
        }
        
        if (result.overwritten) {
          console.log(`      ⚠️  Overwrote existing ${fileName}`);
          if (result.backupPath) {
            console.log(`      💾 Backup created at: ${result.backupPath}`);
          }
        }
      }
    });

    console.log('\n🎉 Memory Bank setup complete!');
    console.log('\n📁 Project structure:');
    console.log('   📂 .memory-bank/ (contains developmentGuide.md)');
    console.log('   📂 .specs/ (for feature specifications)');
    console.log('   📄 .cursorrules (project-specific rules)');
    console.log('\n🚀 You can now start using your Memory Bank!');
    
    if (selectedGuide.type === 'custom') {
      console.log('\n💡 Tip: Run "npx memory-bank-configure" to manage custom guides');
    }

    // Show configuration help if there were issues
    if (configErrors.length > 0 || customGuideErrors.length > 0) {
      console.log('\n🔧 Configuration help:');
      console.log('   - Run "npx memory-bank-configure" to set up custom guides');
      console.log('   - Check that your custom guides folder exists and contains valid guides');
      console.log('   - Ensure your custom guides have a developmentGuide.md file');
    }

    // Show next steps
    console.log('\n📋 Next steps:');
    console.log('   1. Review the developmentGuide.md file in .memory-bank/');
    console.log('   2. Customize the .cursorrules file for your project');
    console.log('   3. Start using the memory bank in your development workflow');
    console.log('   4. Create feature specifications in the .specs/ directory');

  } catch (error) {
    console.error(
      '\n❌ Error:',
      error instanceof Error ? error.message : error
    );
    
    // Provide helpful error recovery information
    console.error('\n💡 Troubleshooting tips:');
    console.error('   - Ensure you have write permissions in the current directory');
    console.error('   - Check that the memory-bank package is properly installed');
          console.error('   - Try running "npx memory-bank-configure" to fix configuration issues');
    console.error('   - If the problem persists, try reinstalling the package');
    console.error('   - Check the console output above for specific error details');
    
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
