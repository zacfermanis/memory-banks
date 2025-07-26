/* eslint-disable no-console */
import chalk from 'chalk';
import { Command } from 'commander';

export interface HelpExample {
  command: string;
  description: string;
  category: 'basic' | 'advanced' | 'troubleshooting';
}

export interface HelpTopic {
  name: string;
  title: string;
  content: string;
  examples?: HelpExample[];
}

export class HelpSystem {
  private static readonly HELP_TOPICS: Record<string, HelpTopic> = {
    'getting-started': {
      name: 'getting-started',
      title: 'Getting Started',
      content: `
Memory Banks is a CLI tool designed to help AI agents maintain context and collaborate effectively across sessions.

## Quick Start

1. **Initialize a new project:**
   \`\`\`bash
   memory-banks init
   \`\`\`

2. **List available templates:**
   \`\`\`bash
   memory-banks list
   \`\`\`

3. **Validate your setup:**
   \`\`\`bash
   memory-banks validate
   \`\`\`

## Key Concepts

- **Memory Bank**: A structured documentation system that persists context across AI sessions
- **Templates**: Pre-defined project structures for different use cases
- **Validation**: Automated checks to ensure your memory bank is properly configured
- **Updates**: Tools to keep your memory bank current with project changes
      `,
      examples: [
        {
          command: 'memory-banks init',
          description: 'Start interactive project setup',
          category: 'basic',
        },
        {
          command: 'memory-banks init --yes',
          description: 'Quick setup with defaults',
          category: 'basic',
        },
      ],
    },
    templates: {
      name: 'templates',
      title: 'Working with Templates',
      content: `
Templates provide pre-configured memory bank structures for different project types.

## Available Templates

- **typescript**: Full-stack TypeScript projects with React/Vue support
- **lua**: Lua game development projects
- **web**: Basic web application projects
- **api**: Backend API development projects

## Template Features

Each template includes:
- Project structure documentation
- Development workflow guidelines
- Code organization patterns
- Testing strategies
- Deployment procedures

## Customizing Templates

Templates can be customized through:
- Configuration files (.memory-banks.json)
- Environment variables (MEMORY_BANKS_*)
- Interactive prompts during initialization
      `,
      examples: [
        {
          command: 'memory-banks list',
          description: 'View all available templates',
          category: 'basic',
        },
        {
          command: 'memory-banks info typescript',
          description: 'Show detailed template information',
          category: 'basic',
        },
        {
          command: 'memory-banks init --template typescript',
          description: 'Initialize with specific template',
          category: 'basic',
        },
      ],
    },
    configuration: {
      name: 'configuration',
      title: 'Configuration Management',
      content: `
Memory Banks supports multiple configuration sources with priority ordering.

## Configuration Sources (in order of priority)

1. **Command Line Options**: Highest priority, overrides all others
2. **Environment Variables**: Set MEMORY_BANKS_* variables
3. **Local Config File**: .memory-banks.json in current directory
4. **Global Config File**: ~/.memory-banks.json
5. **Template Defaults**: Built-in sensible defaults

## Environment Variables

- \`MEMORY_BANKS_PROJECT_NAME\`: Default project name
- \`MEMORY_BANKS_PROJECT_TYPE\`: Default project type
- \`MEMORY_BANKS_PROJECT_DESCRIPTION\`: Default description
- \`MEMORY_BANKS_VERSION\`: Default version
- \`MEMORY_BANKS_AUTHOR\`: Default author
- \`MEMORY_BANKS_LICENSE\`: Default license
- \`MEMORY_BANKS_FRAMEWORK\`: Default framework
- \`MEMORY_BANKS_BUILD_TOOL\`: Default build tool

## Configuration File Format

\`\`\`json
{
  "defaults": {
    "projectName": "My Project",
    "projectType": "Web Application",
    "version": "1.0.0",
    "author": "Your Name",
    "license": "MIT"
  },
  "templates": {
    "typescript": {
      "framework": "React",
      "buildTool": "Vite"
    }
  }
}
\`\`\`
      `,
      examples: [
        {
          command: 'memory-banks init --config custom-config.json',
          description: 'Use custom configuration file',
          category: 'advanced',
        },
        {
          command:
            'export MEMORY_BANKS_FRAMEWORK=Vue && memory-banks init --yes',
          description: 'Set framework via environment variable',
          category: 'advanced',
        },
      ],
    },
    validation: {
      name: 'validation',
      title: 'Validation and Quality Assurance',
      content: `
Memory Banks includes comprehensive validation to ensure your setup is correct and complete.

## What Gets Validated

- **Project Structure**: Required files and directories
- **Template Variables**: All required variables are provided
- **File Formats**: Markdown syntax and structure
- **Cross-References**: Links between memory bank files
- **Completeness**: Required sections are present

## Validation Modes

- **Basic**: Quick checks for obvious issues
- **Strict**: Comprehensive validation with detailed reporting
- **Fix**: Automatic fixing of common issues

## Common Issues

- **Missing Variables**: Template variables not provided
- **Invalid Syntax**: Markdown formatting errors
- **Broken Links**: Cross-references to non-existent files
- **Incomplete Sections**: Required documentation missing
      `,
      examples: [
        {
          command: 'memory-banks validate',
          description: 'Basic validation',
          category: 'basic',
        },
        {
          command: 'memory-banks validate --strict',
          description: 'Comprehensive validation',
          category: 'advanced',
        },
        {
          command: 'memory-banks validate --fix',
          description: 'Auto-fix common issues',
          category: 'advanced',
        },
      ],
    },
    troubleshooting: {
      name: 'troubleshooting',
      title: 'Troubleshooting',
      content: `
Common issues and their solutions.

## Common Problems

### Template Not Found
**Error**: "Template 'xyz' not found"
**Solution**: Run \`memory-banks list\` to see available templates

### Missing Variables
**Error**: "Missing required template variables"
**Solution**: Use interactive mode or provide missing variables via config

### Permission Errors
**Error**: "EACCES: permission denied"
**Solution**: Check file permissions or use \`--force\` flag

### Invalid Project Name
**Error**: "Invalid project name"
**Solution**: Use alphanumeric characters, hyphens, and underscores only

### Configuration File Issues
**Error**: "Failed to load configuration"
**Solution**: Check JSON syntax in .memory-banks.json

## Debug Mode

Enable debug mode for detailed error information:
\`\`\`bash
memory-banks --debug <command>
\`\`\`

## Verbose Output

Enable verbose mode for detailed operation information:
\`\`\`bash
memory-banks --verbose <command>
\`\`\`
      `,
      examples: [
        {
          command: 'memory-banks --debug init',
          description: 'Debug initialization issues',
          category: 'troubleshooting',
        },
        {
          command: 'memory-banks --verbose validate',
          description: 'Detailed validation output',
          category: 'troubleshooting',
        },
        {
          command: 'memory-banks init --force',
          description: 'Force overwrite existing files',
          category: 'troubleshooting',
        },
      ],
    },
  };

  /**
   * Display comprehensive help for a specific topic
   */
  static displayTopicHelp(topicName: string): void {
    const topic = this.HELP_TOPICS[topicName];

    if (!topic) {
      console.log(chalk.red(`❌ Help topic '${topicName}' not found.`));
      console.log(chalk.yellow('Available topics:'));
      Object.keys(this.HELP_TOPICS).forEach(name => {
        console.log(chalk.yellow(`  - ${name}`));
      });
      return;
    }

    console.log(chalk.blue(`📚 ${topic.title}`));
    console.log('='.repeat(60));
    console.log(topic.content);

    if (topic.examples && topic.examples.length > 0) {
      console.log(chalk.blue('\n📝 Examples:'));
      topic.examples.forEach(example => {
        const categoryColor = this.getCategoryColor(example.category);
        console.log(chalk.gray(`  ${example.command}`));
        console.log(chalk.gray(`    ${categoryColor(example.description)}`));
        console.log('');
      });
    }
  }

  /**
   * Display help topics overview
   */
  static displayTopicsOverview(): void {
    console.log(chalk.blue('📚 Memory Banks Help Topics'));
    console.log('='.repeat(60));
    console.log('');

    Object.values(this.HELP_TOPICS).forEach(topic => {
      console.log(chalk.blue(`• ${topic.title}`));
      console.log(chalk.gray(`  memory-banks help ${topic.name}`));
      console.log('');
    });
  }

  /**
   * Display command-specific help with examples
   */
  static displayCommandHelp(command: Command): void {
    const commandName = command.name();
    const examples = this.getCommandExamples(commandName);

    console.log(chalk.blue(`📖 ${commandName} Command Help`));
    console.log('='.repeat(60));
    console.log('');

    // Display command description
    if (command.description()) {
      console.log(chalk.white(command.description()));
      console.log('');
    }

    // Display examples
    if (examples.length > 0) {
      console.log(chalk.blue('📝 Examples:'));
      examples.forEach(example => {
        const categoryColor = this.getCategoryColor(example.category);
        console.log(chalk.gray(`  ${example.command}`));
        console.log(chalk.gray(`    ${categoryColor(example.description)}`));
        console.log('');
      });
    }

    // Display troubleshooting tips
    const troubleshooting = this.getCommandTroubleshooting(commandName);
    if (troubleshooting.length > 0) {
      console.log(chalk.blue('🔧 Troubleshooting:'));
      troubleshooting.forEach(tip => {
        console.log(chalk.yellow(`  • ${tip}`));
      });
      console.log('');
    }
  }

  /**
   * Get examples for a specific command
   */
  private static getCommandExamples(commandName: string): HelpExample[] {
    const examples: Record<string, HelpExample[]> = {
      init: [
        {
          command: 'memory-banks init',
          description: 'Interactive project initialization',
          category: 'basic',
        },
        {
          command: 'memory-banks init --template typescript',
          description: 'Initialize with specific template',
          category: 'basic',
        },
        {
          command: 'memory-banks init --yes --dry-run',
          description: 'Non-interactive setup with preview',
          category: 'advanced',
        },
        {
          command: 'memory-banks init --output-dir ./my-project',
          description: 'Specify custom output directory',
          category: 'advanced',
        },
      ],
      list: [
        {
          command: 'memory-banks list',
          description: 'List all available templates',
          category: 'basic',
        },
        {
          command: 'memory-banks list --verbose',
          description: 'Detailed template information',
          category: 'advanced',
        },
        {
          command: 'memory-banks list --json',
          description: 'Output in JSON format',
          category: 'advanced',
        },
      ],
      info: [
        {
          command: 'memory-banks info typescript',
          description: 'Show template details',
          category: 'basic',
        },
        {
          command: 'memory-banks info typescript --verbose',
          description: 'Detailed template information',
          category: 'advanced',
        },
      ],
      validate: [
        {
          command: 'memory-banks validate',
          description: 'Basic validation',
          category: 'basic',
        },
        {
          command: 'memory-banks validate --strict',
          description: 'Comprehensive validation',
          category: 'advanced',
        },
        {
          command: 'memory-banks validate --fix',
          description: 'Auto-fix common issues',
          category: 'advanced',
        },
        {
          command: 'memory-banks validate --report report.json',
          description: 'Generate validation report',
          category: 'advanced',
        },
      ],
      update: [
        {
          command: 'memory-banks update',
          description: 'Update existing memory bank',
          category: 'basic',
        },
        {
          command: 'memory-banks update --template typescript',
          description: 'Update to specific template',
          category: 'advanced',
        },
        {
          command: 'memory-banks update --backup',
          description: 'Create backup before updating',
          category: 'advanced',
        },
      ],
    };

    return examples[commandName] || [];
  }

  /**
   * Get troubleshooting tips for a specific command
   */
  private static getCommandTroubleshooting(commandName: string): string[] {
    const troubleshooting: Record<string, string[]> = {
      init: [
        'Use --yes flag for non-interactive mode',
        'Use --dry-run to preview without creating files',
        'Use --force to overwrite existing files',
        'Check template availability with "memory-banks list"',
      ],
      list: [
        'Use --verbose for detailed template information',
        'Use --json for machine-readable output',
      ],
      info: [
        'Template must exist (check with "memory-banks list")',
        'Use --verbose for complete template details',
      ],
      validate: [
        'Use --strict for comprehensive validation',
        'Use --fix to automatically resolve common issues',
        'Check validation report for detailed error information',
      ],
      update: [
        'Use --backup to preserve existing configuration',
        'Use --force to overwrite without confirmation',
        'Check template compatibility before updating',
      ],
    };

    return troubleshooting[commandName] || [];
  }

  /**
   * Get color for category
   */
  private static getCategoryColor(category: string): (_text: string) => string {
    switch (category) {
      case 'basic':
        return chalk.green;
      case 'advanced':
        return chalk.blue;
      case 'troubleshooting':
        return chalk.yellow;
      default:
        return chalk.white;
    }
  }

  /**
   * Display interactive help menu
   */
  static async displayInteractiveHelp(): Promise<void> {
    console.log(chalk.blue('🎯 Memory Banks Interactive Help'));
    console.log('='.repeat(60));
    console.log('');
    console.log(chalk.white('Choose a topic to learn more:'));
    console.log('');

    const topics = Object.values(this.HELP_TOPICS);
    topics.forEach((topic, index) => {
      console.log(chalk.cyan(`${index + 1}. ${topic.title}`));
    });
    console.log(chalk.cyan(`${topics.length + 1}. Exit`));
    console.log('');

    // In a real implementation, this would use inquirer for interactive selection
    // For now, we'll just show the overview
    this.displayTopicsOverview();
  }
}
