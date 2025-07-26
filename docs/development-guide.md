# Development Guide

Complete guide for developers contributing to memory-banks, including setup, build process, and contribution guidelines.

## Table of Contents

- [Development Setup](#development-setup)
- [Build Process](#build-process)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Code Quality](#code-quality)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)

## Development Setup

### Prerequisites

- **Node.js**: Version 16.0.0 or higher
- **npm**: Version 7.0.0 or higher
- **Git**: For version control
- **Editor**: VS Code (recommended) with TypeScript support

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/zacfermanis/memory-banks.git
cd memory-banks

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Verify setup
npm run validate:full
```

### Development Dependencies

```json
{
  "devDependencies": {
    "@types/inquirer": "^9.0.8",
    "@types/jest": "^29.5.8",
    "@types/node": "^20.8.10",
    "@typescript-eslint/eslint-plugin": "^6.21.0",
    "@typescript-eslint/parser": "^6.21.0",
    "eslint": "^8.53.0",
    "eslint-config-prettier": "^9.0.0",
    "eslint-plugin-prettier": "^5.0.1",
    "husky": "^8.0.3",
    "jest": "^29.7.0",
    "lint-staged": "^15.0.2",
    "prettier": "^3.0.3",
    "rimraf": "^5.0.5",
    "standard-version": "^9.5.0",
    "ts-jest": "^29.1.1",
    "typescript": "^5.2.2"
  }
}
```

### IDE Configuration

#### VS Code Settings
```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.suggest.autoImports": true,
  "files.exclude": {
    "**/dist": true,
    "**/node_modules": true
  }
}
```

#### Recommended Extensions
- TypeScript and JavaScript Language Features
- ESLint
- Prettier
- Jest Runner
- GitLens

## Build Process

### Build Commands

```bash
# Basic build
npm run build

# Optimized build
npm run build:optimized

# Production build
npm run build:production

# Watch mode for development
npm run dev

# Clean build directory
npm run clean
```

### Build Configuration

#### TypeScript Configuration (tsconfig.json)
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "removeComments": false,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noImplicitThis": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

#### Build Scripts
```json
{
  "scripts": {
    "build": "tsc",
    "build:optimized": "tsc --incremental",
    "build:production": "tsc --removeComments",
    "dev": "tsc --watch",
    "clean": "rimraf dist",
    "prebuild": "npm run clean",
    "prepare": "npm run build"
  }
}
```

### Build Output

The build process generates:

```
dist/
├── cli/
│   ├── index.js
│   └── commands/
│       ├── init.js
│       ├── list.js
│       ├── info.js
│       ├── validate.js
│       └── update.js
├── services/
│   ├── templateRegistry.js
│   └── templateRenderer.js
├── types/
│   └── index.js
├── utils/
│   ├── fileSystem.js
│   ├── validation.js
│   ├── errorHandling.js
│   └── logger.js
└── index.js
```

## Project Structure

### Source Code Organization

```
src/
├── cli/                    # CLI interface
│   ├── index.ts           # Main CLI entry point
│   └── commands/          # Individual commands
│       ├── init.ts        # Initialize command
│       ├── list.ts        # List templates command
│       ├── info.ts        # Template info command
│       ├── validate.ts    # Validation command
│       └── update.ts      # Update command
├── services/              # Core business logic
│   ├── templateRegistry.ts # Template discovery and loading
│   └── templateRenderer.ts # Template variable substitution
├── types/                 # TypeScript type definitions
│   └── index.ts
├── utils/                 # Utility functions
│   ├── fileSystem.ts      # File system operations
│   ├── validation.ts      # Validation utilities
│   ├── errorHandling.ts   # Error handling
│   ├── logger.ts          # Logging system
│   ├── configManager.ts   # Configuration management
│   └── batchProcessor.ts  # Batch processing utilities
└── index.ts              # Main entry point
```

### Template Structure

```
templates/
├── typescript/            # TypeScript template
│   └── template.json      # Template configuration
├── lua/                   # Lua template
│   └── template.json      # Template configuration
└── [language]/            # Additional language templates
    └── template.json      # Template configuration
```

### Test Structure

```
tests/
├── cli/                   # CLI command tests
│   ├── commands.test.ts   # Command functionality tests
│   ├── integration.test.ts # Integration tests
│   └── accessibility.test.ts # Accessibility tests
├── utils/                 # Utility function tests
│   ├── fileSystem.test.ts
│   ├── validation.test.ts
│   ├── errorHandling.test.ts
│   └── logger.test.ts
└── setup.ts              # Test setup and configuration
```

## Development Workflow

### Development Cycle

1. **Feature Development**
   ```bash
   # Create feature branch
   git checkout -b feature/new-feature
   
   # Make changes
   # Write tests
   npm test
   
   # Build and validate
   npm run build
   npm run validate:full
   ```

2. **Testing**
   ```bash
   # Run all tests
   npm test
   
   # Run tests in watch mode
   npm run test:watch
   
   # Run tests with coverage
   npm run test:coverage
   ```

3. **Code Quality**
   ```bash
   # Lint code
   npm run lint
   
   # Format code
   npm run format
   
   # Fix linting issues
   npm run lint:fix
   ```

4. **Validation**
   ```bash
   # Full validation
   npm run validate:full
   
   # Quality checks
   npm run quality:all
   ```

### Git Workflow

#### Branch Naming
- `feature/feature-name` - New features
- `fix/bug-description` - Bug fixes
- `docs/documentation-update` - Documentation updates
- `refactor/component-name` - Code refactoring

#### Commit Messages
Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new Lua template support
fix: resolve Windows path handling issue
docs: update installation guide
refactor: improve template validation
test: add integration tests for CLI commands
```

#### Pull Request Process
1. Create feature branch
2. Make changes and test
3. Update documentation
4. Create pull request
5. Address review feedback
6. Merge when approved

## Testing

### Test Framework

Uses Jest for testing with TypeScript support:

```json
{
  "jest": {
    "preset": "ts-jest",
    "testEnvironment": "node",
    "roots": ["<rootDir>/src", "<rootDir>/tests"],
    "testMatch": ["**/__tests__/**/*.ts", "**/?(*.)+(spec|test).ts"],
    "transform": {
      "^.+\\.ts$": "ts-jest"
    },
    "collectCoverageFrom": [
      "src/**/*.ts",
      "!src/**/*.d.ts"
    ],
    "coverageThreshold": {
      "global": {
        "branches": 85,
        "functions": 90,
        "lines": 90,
        "statements": 90
      }
    }
  }
}
```

### Test Categories

#### Unit Tests
```typescript
// tests/utils/fileSystem.test.ts
import { FileSystem } from '../../src/utils/fileSystem';

describe('FileSystem', () => {
  describe('writeFile', () => {
    it('should write file successfully', async () => {
      const result = await FileSystem.writeFile('test.txt', 'content');
      expect(result.success).toBe(true);
    });
  });
});
```

#### Integration Tests
```typescript
// tests/cli/integration.test.ts
import { execSync } from 'child_process';

describe('CLI Integration', () => {
  it('should initialize memory bank', () => {
    const output = execSync('node dist/cli/index.js init --dry-run --yes', {
      encoding: 'utf8'
    });
    expect(output).toContain('Memory bank initialized');
  });
});
```

#### Cross-Platform Tests
```typescript
// tests/cli/cross-platform.test.ts
describe('Cross-Platform Compatibility', () => {
  it('should work on Windows', () => {
    // Windows-specific tests
  });
  
  it('should work on macOS', () => {
    // macOS-specific tests
  });
  
  it('should work on Linux', () => {
    // Linux-specific tests
  });
});
```

### Test Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- tests/utils/fileSystem.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="FileSystem"

# Run tests in verbose mode
npm test -- --verbose
```

### Test Coverage

Coverage targets:
- **Statements**: 90%
- **Branches**: 85%
- **Functions**: 90%
- **Lines**: 90%

Generate coverage report:
```bash
npm run test:coverage
```

## Code Quality

### Linting

Uses ESLint with TypeScript support:

```json
{
  "extends": [
    "@typescript-eslint/recommended",
    "prettier"
  ],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint", "prettier"],
  "rules": {
    "prettier/prettier": "error",
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-explicit-any": "warn"
  }
}
```

### Code Formatting

Uses Prettier for consistent formatting:

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

### Quality Commands

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check

# Run all quality checks
npm run quality:all
```

### Pre-commit Hooks

Uses Husky and lint-staged for pre-commit validation:

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.ts": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

## Contributing

### Contribution Guidelines

1. **Fork the repository**
2. **Create a feature branch**
3. **Make your changes**
4. **Add tests for new functionality**
5. **Update documentation**
6. **Run the test suite**
7. **Submit a pull request**

### Development Standards

#### Code Style
- Use TypeScript strict mode
- Follow ESLint rules
- Use Prettier formatting
- Write self-documenting code
- Add JSDoc comments for public APIs

#### Testing Requirements
- Write tests for all new functionality
- Maintain 90% code coverage
- Include integration tests for CLI commands
- Test cross-platform compatibility

#### Documentation
- Update README.md for user-facing changes
- Add JSDoc comments for new functions
- Update API documentation
- Include usage examples

### Pull Request Checklist

- [ ] Code follows style guidelines
- [ ] Tests pass and coverage is maintained
- [ ] Documentation is updated
- [ ] No breaking changes (or documented)
- [ ] Cross-platform compatibility verified
- [ ] Security considerations addressed

### Review Process

1. **Automated Checks**
   - Tests pass
   - Code coverage maintained
   - Linting passes
   - Build succeeds

2. **Manual Review**
   - Code quality
   - Functionality
   - Documentation
   - Security considerations

3. **Approval**
   - At least one maintainer approval
   - All checks pass
   - Ready for merge

## Troubleshooting

### Common Development Issues

#### Build Issues

**TypeScript Compilation Errors**
```bash
# Check TypeScript errors
npx tsc --noEmit

# Fix specific errors
npx tsc --noEmit --pretty

# Clean and rebuild
npm run clean
npm run build
```

**Missing Dependencies**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check for missing types
npm install --save-dev @types/missing-package
```

#### Test Issues

**Test Failures**
```bash
# Run tests with verbose output
npm test -- --verbose

# Run specific test
npm test -- --testNamePattern="specific test"

# Debug test
npm test -- --detectOpenHandles
```

**Coverage Issues**
```bash
# Generate coverage report
npm run test:coverage

# Check coverage thresholds
npm test -- --coverage --coverageThreshold='{"global":{"lines":90}}'
```

#### Linting Issues

**ESLint Errors**
```bash
# Fix auto-fixable issues
npm run lint:fix

# Check specific file
npx eslint src/utils/fileSystem.ts

# Ignore specific rules
// eslint-disable-next-line @typescript-eslint/no-explicit-any
```

**Prettier Issues**
```bash
# Format all files
npm run format

# Check formatting
npm run format:check

# Format specific file
npx prettier --write src/utils/fileSystem.ts
```

### Development Environment Issues

#### Node.js Version
```bash
# Check Node.js version
node --version

# Use correct version (16+)
nvm use 18

# Install correct version
nvm install 18
```

#### Package Manager Issues
```bash
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Use alternative package manager
yarn install
pnpm install
```

#### IDE Issues

**VS Code TypeScript Errors**
```bash
# Reload TypeScript server
Ctrl+Shift+P -> "TypeScript: Restart TS Server"

# Check TypeScript version
npx tsc --version

# Update TypeScript
npm update typescript
```

**ESLint Integration**
```bash
# Install ESLint extension
# Reload VS Code
# Check ESLint configuration
npx eslint --print-config src/utils/fileSystem.ts
```

### Performance Issues

#### Slow Build Times
```bash
# Use incremental builds
npm run build:optimized

# Enable TypeScript caching
# Add to tsconfig.json: "incremental": true

# Use parallel processing
npm run build:parallel
```

#### Memory Issues
```bash
# Increase Node.js memory limit
node --max-old-space-size=4096 npm run build

# Use alternative build tools
npm install --save-dev esbuild
```

### Debugging

#### Debug Mode
```bash
# Enable debug logging
DEBUG=* npm test

# Debug specific module
DEBUG=memory-banks:* npm test

# Debug CLI commands
DEBUG=* node dist/cli/index.js init --debug
```

#### Logging
```bash
# Enable verbose logging
npm test -- --verbose

# Log to file
npm test > test.log 2>&1

# Use custom logger
npm test -- --logger=file
```

### Getting Help

#### Documentation
- [Quick Start Guide](quick-start-guide.md)
- [API Reference](api-reference.md)
- [Command Reference](command-reference.md)

#### Community
- [GitHub Issues](https://github.com/zacfermanis/memory-banks/issues)
- [GitHub Discussions](https://github.com/zacfermanis/memory-banks/discussions)
- [GitHub Wiki](https://github.com/zacfermanis/memory-banks/wiki)

#### Development Resources
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [ESLint Rules](https://eslint.org/docs/rules/)

---

For more information, see the [Support Guide](support-guide.md) or [create an issue](https://github.com/zacfermanis/memory-banks/issues) on GitHub. 