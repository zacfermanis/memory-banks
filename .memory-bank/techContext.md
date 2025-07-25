# Technical Context: Memory Banks

## Technology Stack

### Core Technologies
- **Language**: TypeScript (strict mode)
- **Runtime**: Node.js (v16+)
- **Package Manager**: npm/yarn/pnpm
- **Distribution**: npx (via npm package)

### CLI Framework
- **Commander.js**: Command-line argument parsing and help generation
- **Inquirer.js**: Interactive prompts and user input collection
- **Chalk**: Terminal color and formatting utilities

### Development Tools
- **Testing**: Jest + ts-jest
- **Linting**: ESLint with TypeScript rules
- **Formatting**: Prettier
- **Type Checking**: TypeScript compiler
- **Build Tool**: tsc (TypeScript compiler) or esbuild

### Template System
- **Template Engine**: Custom string-based interpolation
- **File System**: Node.js fs/promises API
- **Path Handling**: path-browserify for cross-platform compatibility

## Development Setup

### Prerequisites
```bash
# Required
Node.js >= 16.0.0
npm >= 8.0.0

# Optional but recommended
yarn >= 1.22.0
pnpm >= 7.0.0
```

### Project Structure
```
memory-banks/
├── src/
│   ├── cli/
│   │   ├── commands/
│   │   ├── prompts/
│   │   └── index.ts
│   ├── templates/
│   │   ├── typescript/
│   │   ├── lua/
│   │   └── registry.ts
│   ├── utils/
│   │   ├── file-system.ts
│   │   ├── validation.ts
│   │   └── template-engine.ts
│   └── types/
│       └── index.ts
├── templates/
│   ├── typescript/
│   │   ├── basic/
│   │   └── advanced/
│   └── lua/
│       └── love2d/
├── tests/
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

### Package Configuration
```json
{
  "name": "memory-banks",
  "version": "1.0.0",
  "description": "CLI tool for setting up memory bank systems in repositories",
  "main": "dist/index.js",
  "bin": {
    "memory-banks": "dist/cli/index.js"
  },
  "files": [
    "dist/",
    "templates/"
  ],
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "test": "jest",
    "lint": "eslint src/",
    "format": "prettier --write src/",
    "prepare": "npm run build"
  },
  "dependencies": {
    "commander": "^11.0.0",
    "inquirer": "^9.2.0",
    "chalk": "^5.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/inquirer": "^9.0.0",
    "@types/jest": "^29.0.0",
    "typescript": "^5.0.0",
    "jest": "^29.0.0",
    "ts-jest": "^29.0.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0"
  },
  "engines": {
    "node": ">=16.0.0"
  }
}
```

## Technical Constraints

### Performance Requirements
- **Installation Time**: < 5 seconds for typical setup
- **Memory Usage**: < 100MB during operation
- **Bundle Size**: < 10MB total package size
- **Startup Time**: < 1 second for command execution

### Compatibility Requirements
- **Operating Systems**: Windows 10+, macOS 10.15+, Linux (Ubuntu 18.04+)
- **Node.js Versions**: 16.x, 18.x, 20.x (LTS versions)
- **Package Managers**: npm, yarn, pnpm
- **Terminals**: PowerShell, bash, zsh

### Security Considerations
- **File System Access**: Only read/write in target directory
- **Network Access**: Minimal (only for package updates)
- **Dependencies**: Audit all third-party packages
- **Template Validation**: Sanitize user inputs in templates

## Dependencies

### Production Dependencies
```typescript
// Core CLI functionality
import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';

// File system operations
import { promises as fs } from 'fs';
import path from 'path';

// Template processing
import { renderTemplate } from './utils/template-engine';
import { validateConfig } from './utils/validation';
```

### Development Dependencies
```typescript
// Testing
import { describe, it, expect } from '@jest/globals';

// Type checking
import type { Config, Template, ValidationResult } from './types';

// Build tools
import { build } from 'esbuild';
```

## Tool Usage Patterns

### CLI Command Structure
```typescript
// Main command
program
  .name('memory-banks')
  .description('Set up memory bank systems in your repository')
  .version('1.0.0');

// Init command
program
  .command('init')
  .description('Initialize memory bank in current directory')
  .option('-t, --template <template>', 'Template to use')
  .option('-y, --yes', 'Skip prompts and use defaults')
  .action(async (options) => {
    // Implementation
  });

// List command
program
  .command('list')
  .description('List available templates')
  .action(async () => {
    // Implementation
  });
```

### Template System Usage
```typescript
// Template registration
const registry = new TemplateRegistry();
registry.register({
  id: 'typescript-basic',
  name: 'TypeScript Basic',
  description: 'Basic memory bank for TypeScript projects',
  language: 'typescript',
  files: [
    {
      path: '.memory-bank/projectBrief.md',
      content: templateContent,
      overwrite: false
    }
  ],
  questions: [
    {
      type: 'input',
      name: 'projectName',
      message: 'What is your project name?'
    }
  ]
});

// Template rendering
const config = await collectUserInput();
const template = registry.get(config.templateId);
const files = await generateFiles(template, config);
```

### File System Operations
```typescript
// Safe file writing
const safeWriteFile = async (filePath: string, content: string): Promise<void> => {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  
  if (await fs.access(filePath).then(() => true).catch(() => false)) {
    const backupPath = `${filePath}.backup.${Date.now()}`;
    await fs.copyFile(filePath, backupPath);
    console.log(chalk.yellow(`Backed up existing file to: ${backupPath}`));
  }
  
  await fs.writeFile(filePath, content);
  console.log(chalk.green(`Created: ${filePath}`));
};

// Directory scanning
const scanProject = async (rootPath: string): Promise<ProjectInfo> => {
  const files = await fs.readdir(rootPath);
  const hasPackageJson = files.includes('package.json');
  const hasTsConfig = files.includes('tsconfig.json');
  
  return {
    type: hasPackageJson ? 'node' : 'unknown',
    hasTypeScript: hasTsConfig,
    files
  };
};
```

## Development Workflow

### Local Development
```bash
# Clone and setup
git clone <repository>
cd memory-banks
npm install

# Development mode
npm run dev

# Testing
npm test
npm run test:watch

# Linting and formatting
npm run lint
npm run format

# Build for production
npm run build
```

### Testing Strategy
```typescript
// Unit tests for core functionality
describe('TemplateEngine', () => {
  it('should render template with variables', () => {
    const template = 'Hello {{name}}!';
    const config = { name: 'World' };
    const result = renderTemplate(template, config);
    expect(result).toBe('Hello World!');
  });
});

// Integration tests for CLI
describe('CLI Integration', () => {
  it('should create files when running init command', async () => {
    // Test end-to-end file creation
  });
});
```

### Package Publishing
```bash
# Build and publish
npm run build
npm publish

# Test npx installation
npx memory-banks@latest init
```

## Environment Configuration

### Development Environment
```bash
# .env.development
NODE_ENV=development
DEBUG=memory-banks:*
TEMPLATE_PATH=./templates
```

### Production Environment
```bash
# .env.production
NODE_ENV=production
TEMPLATE_PATH=./templates
```

## Performance Optimization

### Bundle Optimization
- Tree shaking for unused dependencies
- Minimal runtime dependencies
- Efficient template loading
- Lazy loading for large templates

### Runtime Optimization
- Caching of template registry
- Efficient file system operations
- Minimal memory allocations
- Fast template rendering

## Monitoring and Debugging

### Logging Strategy
```typescript
import debug from 'debug';

const log = debug('memory-banks:cli');
const templateLog = debug('memory-banks:template');

// Usage
log('Starting initialization...');
templateLog('Rendering template: %s', templateId);
```

### Error Handling
```typescript
const handleError = (error: Error): void => {
  console.error(chalk.red('Error:'), error.message);
  
  if (process.env.NODE_ENV === 'development') {
    console.error(chalk.gray(error.stack));
  }
  
  process.exit(1);
};

process.on('unhandledRejection', handleError);
process.on('uncaughtException', handleError);
``` 