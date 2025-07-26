# Command Reference

Complete reference for all memory-banks CLI commands, options, and usage examples.

## Global Options

All commands support these global options:

```bash
memory-banks [global-options] <command> [command-options]
```

| Option | Description | Example |
|--------|-------------|---------|
| `-v, --version` | Show version number | `memory-banks --version` |
| `--verbose` | Enable verbose output | `memory-banks init --verbose` |
| `--quiet` | Suppress non-error output | `memory-banks init --quiet` |
| `--debug` | Enable debug logging | `memory-banks init --debug` |
| `-h, --help` | Show help information | `memory-banks --help` |

## Commands Overview

| Command | Description | Usage |
|---------|-------------|-------|
| `init` | Initialize a new memory bank system | `memory-banks init` |
| `list` | List available templates | `memory-banks list` |
| `info` | Show detailed template information | `memory-banks info <template>` |
| `validate` | Validate current memory bank setup | `memory-banks validate` |
| `update` | Update existing memory bank files | `memory-banks update` |

## Init Command

Initialize a new memory bank system in your project.

### Syntax
```bash
memory-banks init [options]
```

### Options

| Option | Description | Default | Example |
|--------|-------------|---------|---------|
| `-t, --template <template>` | Template to use | `typescript` | `--template lua` |
| `-y, --yes` | Skip interactive prompts | `false` | `--yes` |
| `--dry-run` | Show what would be created | `false` | `--dry-run` |
| `-f, --force` | Overwrite existing files | `false` | `--force` |
| `-o, --output-dir <path>` | Output directory | `.memory-bank` | `--output-dir ./custom` |

### Examples

#### Basic Initialization
```bash
# Interactive mode (recommended)
memory-banks init

# Non-interactive with defaults
memory-banks init --yes

# Specify template
memory-banks init --template typescript --yes
```

#### Preview Mode
```bash
# See what would be created
memory-banks init --dry-run

# Preview with specific template
memory-banks init --template lua --dry-run
```

#### Custom Output
```bash
# Use custom output directory
memory-banks init --output-dir ./my-memory-bank

# Force overwrite existing files
memory-banks init --force
```

#### Advanced Usage
```bash
# Verbose output with debug
memory-banks init --verbose --debug

# Quiet mode for automation
memory-banks init --yes --quiet
```

### Interactive Prompts

When running in interactive mode, you'll be prompted for:

1. **Template Selection**
   ```
   ? Select a template: (Use arrow keys)
   ❯ typescript - TypeScript/JavaScript project template
     lua - Lua/Love2D project template
   ```

2. **Project Configuration** (varies by template)
   ```
   ? Project name: (my-project)
   ? Project description: (A new project)
   ? Author name: (Your Name)
   ```

3. **File Generation Confirmation**
   ```
   ? The following files will be created:
     .memory-bank/projectBrief.md
     .memory-bank/productContext.md
     .memory-bank/systemPatterns.md
     .memory-bank/techContext.md
     .memory-bank/activeContext.md
     .memory-bank/progress.md
   ? Proceed? (Y/n)
   ```

## List Command

List available templates with filtering options.

### Syntax
```bash
memory-banks list [options]
```

### Options

| Option | Description | Example |
|--------|-------------|---------|
| `-l, --language <language>` | Filter by programming language | `--language typescript` |
| `-v, --verbose` | Show detailed template information | `--verbose` |

### Examples

#### Basic Listing
```bash
# List all templates
memory-banks list

# Verbose output
memory-banks list --verbose
```

#### Filtered Listing
```bash
# Filter by language
memory-banks list --language typescript

# Filter with verbose output
memory-banks list --language lua --verbose
```

### Output Format

#### Standard Output
```
Available Templates:
  typescript - TypeScript/JavaScript project template
  lua - Lua/Love2D project template
```

#### Verbose Output
```
Available Templates:

typescript
  Description: TypeScript/JavaScript project template
  Version: 1.0.0
  Language: typescript
  Files: 6
  Options: 30+

lua
  Description: Lua/Love2D project template
  Version: 1.0.0
  Language: lua
  Files: 6
  Options: 25+
```

## Info Command

Show detailed information about a specific template.

### Syntax
```bash
memory-banks info <template-name>
```

### Arguments

| Argument | Description | Example |
|----------|-------------|---------|
| `template-name` | Name of the template to inspect | `typescript` |

### Examples

#### Basic Information
```bash
# Show template details
memory-banks info typescript

# Show Lua template details
memory-banks info lua
```

#### With Global Options
```bash
# Verbose output
memory-banks info typescript --verbose

# Debug mode
memory-banks info typescript --debug
```

### Output Format

```
Template: typescript
Description: TypeScript/JavaScript project template
Version: 1.0.0
Language: typescript

Files to be created:
  .memory-bank/projectBrief.md
  .memory-bank/productContext.md
  .memory-bank/systemPatterns.md
  .memory-bank/techContext.md
  .memory-bank/activeContext.md
  .memory-bank/progress.md

Configuration Options:
  projectName (string, required)
    Description: Name of your project
    Default: my-project

  projectDescription (string, required)
    Description: Brief description of your project
    Default: A new project

  authorName (string, required)
    Description: Your name or organization
    Default: Your Name

  [additional options...]
```

## Validate Command

Validate your current memory bank setup.

### Syntax
```bash
memory-banks validate [options]
```

### Options

| Option | Description | Example |
|--------|-------------|---------|
| `-v, --verbose` | Show detailed validation information | `--verbose` |

### Examples

#### Basic Validation
```bash
# Validate current setup
memory-banks validate

# Verbose validation
memory-banks validate --verbose
```

#### With Global Options
```bash
# Debug mode
memory-banks validate --debug

# Quiet mode
memory-banks validate --quiet
```

### Output Format

#### Standard Output
```
✅ Memory bank validation passed
  Found 6 files in .memory-bank/
  All required files present
  File structure is valid
```

#### Verbose Output
```
Memory Bank Validation Report:

File Structure:
  ✅ .memory-bank/projectBrief.md - Present and valid
  ✅ .memory-bank/productContext.md - Present and valid
  ✅ .memory-bank/systemPatterns.md - Present and valid
  ✅ .memory-bank/techContext.md - Present and valid
  ✅ .memory-bank/activeContext.md - Present and valid
  ✅ .memory-bank/progress.md - Present and valid

Configuration:
  ✅ Template: typescript
  ✅ Version: 1.0.0
  ✅ Language: typescript

Validation Status: PASSED
```

## Update Command

Update existing memory bank files with new templates.

### Syntax
```bash
memory-banks update [options]
```

### Options

| Option | Description | Default | Example |
|--------|-------------|---------|---------|
| `-t, --template <template>` | Template to use for updates | `auto-detect` | `--template typescript` |
| `-f, --force` | Overwrite existing files | `false` | `--force` |
| `--dry-run` | Show what would be updated | `false` | `--dry-run` |

### Examples

#### Basic Update
```bash
# Update with current template
memory-banks update

# Update with specific template
memory-banks update --template typescript
```

#### Preview Mode
```bash
# See what would be updated
memory-banks update --dry-run

# Preview with specific template
memory-banks update --template lua --dry-run
```

#### Force Update
```bash
# Force overwrite existing files
memory-banks update --force

# Force with specific template
memory-banks update --template typescript --force
```

#### Advanced Usage
```bash
# Verbose update with debug
memory-banks update --verbose --debug

# Quiet mode for automation
memory-banks update --force --quiet
```

## Exit Codes

All commands return appropriate exit codes:

| Code | Description |
|------|-------------|
| `0` | Success |
| `1` | General error |
| `2` | Invalid command or option |
| `3` | Template not found |
| `4` | File operation failed |
| `5` | Validation failed |

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DEBUG` | Enable debug logging | `DEBUG=* memory-banks init` |
| `MEMORY_BANKS_TEMPLATE` | Default template | `MEMORY_BANKS_TEMPLATE=typescript` |
| `MEMORY_BANKS_OUTPUT_DIR` | Default output directory | `MEMORY_BANKS_OUTPUT_DIR=./custom` |

## Configuration Files

### Global Configuration
```bash
# ~/.memory-banks/config.json
{
  "defaultTemplate": "typescript",
  "defaultOutputDir": ".memory-bank",
  "autoBackup": true,
  "verbose": false
}
```

### Project Configuration
```bash
# .memory-banks.json
{
  "template": "typescript",
  "outputDir": ".memory-bank",
  "options": {
    "projectName": "my-project",
    "authorName": "Your Name"
  }
}
```

## Examples by Use Case

### New Project Setup
```bash
# Create new project
mkdir my-project
cd my-project

# Initialize memory bank
memory-banks init --template typescript --yes

# Verify setup
memory-banks validate
```

### Existing Project Enhancement
```bash
# Navigate to project
cd existing-project

# Initialize memory bank
memory-banks init

# Update later
memory-banks update
```

### Team Project
```bash
# Clone project
git clone https://github.com/team/project.git
cd project

# Setup memory bank for team
memory-banks init --template typescript --yes

# Share with team
git add .memory-bank/
git commit -m "Add memory bank system"
```

### Automation
```bash
# CI/CD pipeline
memory-banks init --template typescript --yes --quiet

# Script automation
memory-banks update --force --quiet

# Validation in pipeline
memory-banks validate --quiet
```

## Troubleshooting Commands

### Debug Issues
```bash
# Enable debug mode
memory-banks init --debug

# Verbose output
memory-banks list --verbose

# Check version
memory-banks --version
```

### Reset and Recovery
```bash
# Backup existing files
cp -r .memory-bank .memory-bank.backup

# Force reinitialize
memory-banks init --force

# Restore from backup
cp -r .memory-bank.backup .memory-bank
```

### Validation
```bash
# Validate current state
memory-banks validate --verbose

# Check template availability
memory-banks list

# Verify template details
memory-banks info typescript
```

## Best Practices

### Command Usage
1. **Use interactive mode** for first-time setup
2. **Use `--dry-run`** before making changes
3. **Use `--verbose`** for troubleshooting
4. **Use `--quiet`** for automation

### File Management
1. **Backup before updates** with `--force`
2. **Validate after changes**
3. **Use version control** for memory bank files
4. **Keep templates updated**

### Automation
1. **Use environment variables** for defaults
2. **Use configuration files** for consistency
3. **Use exit codes** for error handling
4. **Use `--quiet`** for non-interactive use

---

For more information, see the [Quick Start Guide](quick-start-guide.md) or [Support Guide](support-guide.md). 