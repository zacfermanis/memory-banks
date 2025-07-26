# Installation Guide

## Prerequisites

### System Requirements
- **Node.js**: Version 16.0.0 or higher
- **npm**: Version 7.0.0 or higher (comes with Node.js)
- **Operating System**: Windows, macOS, or Linux

### Node.js Installation
If you don't have Node.js installed, download it from [nodejs.org](https://nodejs.org/):

```bash
# Check if Node.js is installed
node --version

# Check if npm is installed
npm --version
```

## Installation Methods

### Method 1: npx (Recommended)
Use npx to run memory-banks without installing it globally:

```bash
# Run directly with npx
npx memory-banks --help

# Initialize a memory bank
npx memory-banks init
```

**Advantages:**
- No global installation required
- Always uses the latest version
- Doesn't pollute your global npm packages
- Works immediately without setup

### Method 2: Global Installation
Install memory-banks globally for system-wide access:

```bash
# Install globally
npm install -g memory-banks

# Verify installation
memory-banks --version

# Run commands
memory-banks init
```

**Advantages:**
- Available system-wide
- Faster execution (no download time)
- Works offline after installation

### Method 3: Local Installation
Install memory-banks as a project dependency:

```bash
# Install as dev dependency
npm install --save-dev memory-banks

# Run via npm scripts
npm run memory-banks init

# Or use npx with local installation
npx memory-banks init
```

**Advantages:**
- Version locked to your project
- Included in package.json
- Team members get the same version

## Platform-Specific Instructions

### Windows
```bash
# Using PowerShell or Command Prompt
npx memory-banks init

# If you encounter execution policy issues
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### macOS
```bash
# Using Terminal
npx memory-banks init

# If you encounter permission issues
sudo npm install -g memory-banks
```

### Linux
```bash
# Using bash/zsh
npx memory-banks init

# If you encounter permission issues
sudo npm install -g memory-banks
```

## Verification

### Check Installation
```bash
# Verify CLI is working
memory-banks --version

# Check available commands
memory-banks --help

# Test template listing
memory-banks list
```

### Test Basic Functionality
```bash
# Create a test directory
mkdir test-memory-bank
cd test-memory-bank

# Initialize with dry-run
memory-banks init --dry-run

# Initialize for real
memory-banks init --yes
```

## Troubleshooting

### Common Issues

#### Permission Denied
```bash
# Error: EACCES: permission denied
# Solution: Use npx or fix permissions
npx memory-banks init

# Or fix npm permissions
sudo chown -R $USER:$GROUP ~/.npm
sudo chown -R $USER:$GROUP ~/.config
```

#### Node.js Version Too Old
```bash
# Error: Requires Node.js >= 16.0.0
# Solution: Update Node.js
node --version

# Update using nvm (recommended)
nvm install 18
nvm use 18
```

#### Network Issues
```bash
# Error: Network timeout
# Solution: Check network and try again
npm config set registry https://registry.npmjs.org/
npx memory-banks init
```

#### Template Loading Issues
```bash
# Error: Template not found
# Solution: Clear cache and retry
npm cache clean --force
npx memory-banks init
```

### Debug Mode
Enable debug mode for detailed error information:

```bash
# Run with debug logging
memory-banks init --debug

# Or set debug environment variable
DEBUG=* memory-banks init
```

### Verbose Output
Get detailed information about what's happening:

```bash
# Run with verbose output
memory-banks init --verbose

# Check template information
memory-banks list --verbose
```

## Uninstallation

### Remove Global Installation
```bash
# Uninstall globally
npm uninstall -g memory-banks

# Verify removal
memory-banks --version
# Should show: command not found
```

### Remove Local Installation
```bash
# Remove from project dependencies
npm uninstall memory-banks

# Or remove dev dependency
npm uninstall --save-dev memory-banks
```

### Clean Up Generated Files
```bash
# Remove memory bank files
rm -rf .memory-bank

# Remove any backup files
rm -rf .memory-bank.backup.*
```

## Advanced Installation

### Using Yarn
```bash
# Install with yarn
yarn global add memory-banks

# Or use with npx
npx memory-banks init
```

### Using pnpm
```bash
# Install with pnpm
pnpm add -g memory-banks

# Or use with npx
npx memory-banks init
```

### Docker Installation
```bash
# Run in Docker container
docker run --rm -v $(pwd):/app -w /app node:18 npx memory-banks init
```

### CI/CD Installation
```yaml
# GitHub Actions example
- name: Install memory-banks
  run: npm install -g memory-banks

- name: Initialize memory bank
  run: memory-banks init --yes
```

## Next Steps

After successful installation:

1. **Read the Quick Start Guide**: Learn how to use memory-banks effectively
2. **Explore Templates**: See what memory bank patterns are available
3. **Check Documentation**: Review the full documentation for advanced features
4. **Join the Community**: Get help and share experiences

## Support

If you encounter issues during installation:

1. **Check the troubleshooting section** above
2. **Enable debug mode** for detailed error information
3. **Search existing issues** on GitHub
4. **Create a new issue** with detailed information

For more help, see the [Support Guide](support-guide.md). 