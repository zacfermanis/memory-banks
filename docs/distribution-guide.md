# Distribution Guide

Complete guide for publishing and distributing memory-banks packages through various channels.

## Table of Contents

- [Publishing Process](#publishing-process)
- [Version Management](#version-management)
- [Release Process](#release-process)
- [Distribution Channels](#distribution-channels)
- [Quality Control](#quality-control)
- [Automation](#automation)
- [Troubleshooting](#troubleshooting)

## Publishing Process

### Prerequisites

Before publishing, ensure you have:

1. **npm Account**: Valid npm account with publishing permissions
2. **Authentication**: npm authentication configured
3. **Package Validation**: All tests passing
4. **Documentation**: Complete and up-to-date
5. **Version Management**: Proper version bump

### Pre-Publishing Checklist

```bash
# 1. Run all tests
npm test

# 2. Build the package
npm run build

# 3. Validate package structure
npm run validate:package

# 4. Check bundle size
npm run validate:bundle-size

# 5. Run security checks
npm run security:all

# 6. Update version
npm run version:patch  # or minor/major

# 7. Generate changelog
npm run changelog:generate

# 8. Dry run publish
npm run publish:dry-run
```

### Publishing Commands

#### Automated Publishing
```bash
# Full automated publishing workflow
npm run publish:full

# Patch release
npm run publish:patch

# Minor release
npm run publish:minor

# Major release
npm run publish:major
```

#### Manual Publishing
```bash
# Manual version bump
npm run version:patch

# Manual changelog generation
npm run changelog:generate

# Manual publish
npm publish

# Manual release creation
npm run distribute:github
```

### Publishing Configuration

#### package.json Configuration
```json
{
  "name": "memory-banks",
  "version": "0.1.0",
  "description": "A CLI tool for creating and managing memory bank systems",
  "main": "dist/index.js",
  "bin": {
    "memory-banks": "dist/cli/index.js"
  },
  "files": [
    "dist",
    "templates",
    "README.md",
    "LICENSE"
  ],
  "scripts": {
    "prepublishOnly": "npm run validate",
    "publish:check": "npm run validate:full && npm run test:cross-platform",
    "publish:validate": "npm run publish:check && npm run publish:dry-run"
  },
  "publishConfig": {
    "access": "public"
  }
}
```

#### npm Configuration
```bash
# Set npm registry
npm config set registry https://registry.npmjs.org/

# Set access level
npm config set access public

# Set package visibility
npm config set visibility public
```

## Version Management

### Semantic Versioning

Follow [Semantic Versioning](https://semver.org/) (SemVer) principles:

- **MAJOR.MINOR.PATCH** (e.g., 1.2.3)
- **MAJOR**: Breaking changes
- **MINOR**: New features, backward compatible
- **PATCH**: Bug fixes, backward compatible

### Version Bumping

```bash
# Patch version (bug fixes)
npm run version:patch

# Minor version (new features)
npm run version:minor

# Major version (breaking changes)
npm run version:major

# Pre-release version
npm run version:prerelease

# Dry run version bump
npm run version:dry-run
```

### Version Validation

```bash
# Validate version format
npm run version:validate

# Check version consistency
node -e "
const pkg = require('./package.json');
const version = pkg.version;
const semver = require('semver');

if (!semver.valid(version)) {
  console.error('Invalid version format:', version);
  process.exit(1);
}

console.log('Version validation passed:', version);
"
```

### Version History

Track version changes in `CHANGELOG.md`:

```markdown
# Changelog

## [1.2.0] - 2024-01-15

### Added
- New Lua template support
- Enhanced validation system
- Improved error handling

### Changed
- Updated TypeScript template
- Enhanced CLI help system

### Fixed
- Fixed Windows compatibility issues
- Resolved template loading bugs

## [1.1.0] - 2024-01-01

### Added
- Initial release
- TypeScript template
- Basic CLI functionality
```

## Release Process

### Release Workflow

1. **Development Phase**
   ```bash
   # Make changes and test
   npm test
   npm run build
   ```

2. **Pre-Release Phase**
   ```bash
   # Validate everything
   npm run validate:full
   npm run quality:all
   ```

3. **Version Bump**
   ```bash
   # Bump version
   npm run version:patch
   ```

4. **Changelog Generation**
   ```bash
   # Generate changelog
   npm run changelog:generate
   ```

5. **Publishing**
   ```bash
   # Publish to npm
   npm run publish:auto
   ```

6. **Release Creation**
   ```bash
   # Create GitHub release
   npm run distribute:github
   ```

### Release Automation

#### GitHub Actions Workflow
```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build package
        run: npm run build
      
      - name: Publish to npm
        run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
      
      - name: Create GitHub release
        run: npm run distribute:github
```

#### Release Scripts
```bash
#!/bin/bash
# scripts/release.sh

set -e

echo "Starting release process..."

# 1. Validate
npm run validate:full

# 2. Version bump
npm run version:patch

# 3. Generate changelog
npm run changelog:generate

# 4. Publish
npm run publish:auto

# 5. Create release
npm run distribute:github

echo "Release completed successfully!"
```

### Release Validation

```bash
# Pre-release validation
npm run release:prepare

# Post-release validation
npm run deploy:validate

# Release monitoring
npm run deploy:status
```

## Distribution Channels

### Primary Channels

#### npm Registry
```bash
# Publish to npm
npm publish

# Verify publication
npm view memory-banks

# Check downloads
npm view memory-banks downloads
```

#### GitHub Releases
```bash
# Create release assets
npm run distribute:github-assets

# Generate release notes
npm run distribute:github-notes

# Create release
npm run distribute:github
```

### Alternative Channels

#### GitHub Packages
```bash
# Configure for GitHub Packages
npm config set @zacfermanis:registry https://npm.pkg.github.com

# Publish to GitHub Packages
npm publish
```

#### Verdaccio (Local Registry)
```bash
# Start local registry
npx verdaccio

# Configure for local registry
npm config set registry http://localhost:4873

# Publish to local registry
npm publish
```

### CDN Distribution

#### jsDelivr
```javascript
// Available at: https://cdn.jsdelivr.net/npm/memory-banks/
import { TemplateRenderer } from 'https://cdn.jsdelivr.net/npm/memory-banks@latest/dist/index.js';
```

#### unpkg
```javascript
// Available at: https://unpkg.com/memory-banks/
import { TemplateRenderer } from 'https://unpkg.com/memory-banks@latest/dist/index.js';
```

## Quality Control

### Pre-Publishing Quality Gates

```bash
# 1. Code Quality
npm run lint
npm run format:check

# 2. Testing
npm test
npm run test:coverage

# 3. Build Validation
npm run build
npm run validate:build

# 4. Package Validation
npm run validate:package
npm run validate:metadata

# 5. Security
npm run security:all
npm audit

# 6. Performance
npm run validate:bundle-size
npm run validate:startup-time

# 7. Cross-Platform
npm run test:cross-platform
npm run test:npx-compatibility
```

### Quality Metrics

#### Code Coverage
```bash
# Generate coverage report
npm run test:coverage

# Coverage thresholds
# - Statements: 90%
# - Branches: 85%
# - Functions: 90%
# - Lines: 90%
```

#### Bundle Size
```bash
# Check bundle size
npm run validate:bundle-size

# Size limits
# - Total: < 500 KB
# - Gzipped: < 150 KB
```

#### Performance
```bash
# Startup time
npm run validate:startup-time

# Memory usage
npm run validate:memory-usage

# Performance targets
# - Startup: < 100ms
# - Memory: < 50MB
```

### Quality Reporting

```bash
# Generate quality report
npm run quality:all

# Quality report includes:
# - Code coverage
# - Bundle size
# - Security status
# - Performance metrics
# - Cross-platform compatibility
```

## Automation

### CI/CD Pipeline

#### GitHub Actions
```yaml
name: CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run build

  quality:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run quality:all

  publish:
    runs-on: ubuntu-latest
    needs: quality
    if: startsWith(github.ref, 'refs/tags/')
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm run publish:auto
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

#### Automated Scripts
```bash
#!/bin/bash
# scripts/ci.sh

set -e

echo "Running CI pipeline..."

# Install dependencies
npm ci

# Run tests
npm test

# Build package
npm run build

# Quality checks
npm run quality:all

# Cross-platform tests
npm run test:cross-platform

echo "CI pipeline completed successfully!"
```

### Release Automation

#### Automated Release Script
```bash
#!/bin/bash
# scripts/auto-release.sh

set -e

echo "Starting automated release..."

# 1. Validate current state
npm run validate:full

# 2. Determine version bump type
BUMP_TYPE=${1:-patch}

# 3. Bump version
npm run version:$BUMP_TYPE

# 4. Generate changelog
npm run changelog:generate

# 5. Publish
npm run publish:auto

# 6. Create release
npm run distribute:github

# 7. Notify
npm run deploy:notify

echo "Automated release completed!"
```

#### Release Triggers
```bash
# Manual trigger
npm run release:patch

# Git tag trigger
git tag v1.2.3
git push origin v1.2.3

# Scheduled release
# Configure in GitHub Actions with cron
```

## Troubleshooting

### Publishing Issues

#### Authentication Problems
```bash
# Check npm authentication
npm whoami

# Login to npm
npm login

# Check registry
npm config get registry

# Set correct registry
npm config set registry https://registry.npmjs.org/
```

#### Package Name Conflicts
```bash
# Check if package name is available
npm view memory-banks

# If name is taken, consider:
# - Using a scoped package (@username/memory-banks)
# - Choosing a different name
# - Contacting the current owner
```

#### Version Conflicts
```bash
# Check current version
npm view memory-banks version

# If version already exists:
# - Bump to next version
npm run version:patch

# - Or use pre-release
npm run version:prerelease
```

### Distribution Issues

#### GitHub Release Problems
```bash
# Check GitHub token
echo $GITHUB_TOKEN

# Verify repository access
gh auth status

# Create release manually
gh release create v1.2.3 --generate-notes
```

#### CDN Issues
```bash
# Check CDN availability
curl -I https://cdn.jsdelivr.net/npm/memory-banks@latest/

# Clear CDN cache (if possible)
# Contact CDN provider for cache invalidation
```

### Quality Control Issues

#### Test Failures
```bash
# Run tests locally
npm test

# Check test environment
node --version
npm --version

# Debug specific test
npm test -- --testNamePattern="specific test"
```

#### Build Failures
```bash
# Clean and rebuild
npm run clean
npm run build

# Check TypeScript errors
npx tsc --noEmit

# Check dependencies
npm ls
```

#### Security Issues
```bash
# Run security audit
npm audit

# Fix vulnerabilities
npm audit fix

# Check for known vulnerabilities
npm audit --audit-level=moderate
```

### Recovery Procedures

#### Rollback Release
```bash
# Unpublish from npm (within 72 hours)
npm unpublish memory-banks@1.2.3

# Delete GitHub release
gh release delete v1.2.3

# Revert version
npm version 1.2.2 --no-git-tag-version
```

#### Emergency Fix
```bash
# Create emergency patch
npm run version:patch

# Quick publish
npm run publish:auto

# Notify users
npm run deploy:notify
```

## Best Practices

### Publishing Best Practices

1. **Always test before publishing**
   ```bash
   npm run validate:full
   ```

2. **Use semantic versioning**
   ```bash
   npm run version:patch  # for bug fixes
   npm run version:minor  # for new features
   npm run version:major  # for breaking changes
   ```

3. **Generate changelog**
   ```bash
   npm run changelog:generate
   ```

4. **Test the published package**
   ```bash
   npm pack --dry-run
   npx memory-banks --version
   ```

### Distribution Best Practices

1. **Use multiple channels**
   - npm registry (primary)
   - GitHub releases (backup)
   - CDN (for web usage)

2. **Monitor distribution**
   ```bash
   npm run deploy:monitor
   npm run deploy:analytics
   ```

3. **Maintain quality gates**
   ```bash
   npm run quality:pre-publish
   ```

4. **Automate where possible**
   - Use CI/CD pipelines
   - Automate version bumping
   - Automate changelog generation

### Security Best Practices

1. **Regular security audits**
   ```bash
   npm run security:all
   ```

2. **Keep dependencies updated**
   ```bash
   npm update
   npm audit fix
   ```

3. **Use secure publishing**
   - Enable 2FA on npm
   - Use npm tokens
   - Monitor for unauthorized access

---

For more information, see the [Support Guide](support-guide.md) or [create an issue](https://github.com/zacfermanis/memory-banks/issues) on GitHub. 