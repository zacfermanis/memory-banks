# Memory Banks CLI

A powerful CLI tool for creating and managing memory bank systems for AI agent collaboration. Memory banks provide structured documentation that helps AI agents understand project context, requirements, and progress across development sessions.

## Features

### 🚀 Core CLI Commands
- **`init`** - Initialize a new memory bank system in your project
- **`list`** - List available templates with filtering options
- **`info`** - Show detailed information about specific templates
- **`validate`** - Validate your current memory bank setup
- **`update`** - Update existing memory bank files with new templates

### 🎯 Interactive & Non-Interactive Modes
- **Interactive prompts** for guided setup with Inquirer.js
- **Non-interactive mode** with `--yes` flag for automation
- **Dry-run mode** to preview changes without making them
- **Template-based** initialization with customizable options

### 📋 Template System
- **Extensible template registry** for different project types
- **Variable substitution** with `{{variable}}` syntax
- **Language filtering** for template discovery
- **Comprehensive configuration options** for each template

### 🛡️ Robust Error Handling
- **Clear error messages** with actionable guidance
- **Validation** of required variables and configurations
- **Safe file operations** with backup creation
- **Graceful failure handling** with proper exit codes

## Installation

```bash
npm install -g memory-banks
```

Or use it directly with npx:

```bash
npx memory-banks --help
```

## Quick Start

### 1. Initialize a Memory Bank

```bash
# Interactive mode (recommended for first-time users)
memory-banks init

# Non-interactive mode with defaults
memory-banks init --template typescript --yes

# Preview what would be created
memory-banks init --template typescript --dry-run
```

### 2. Explore Available Templates

```bash
# List all templates
memory-banks list

# Filter by language
memory-banks list --language typescript

# Show detailed information
memory-banks list --verbose
```

### 3. Get Template Details

```bash
# Show detailed template information
memory-banks info typescript
```

### 4. Validate Your Setup

```bash
# Check if your memory bank is properly configured
memory-banks validate

# Get detailed validation information
memory-banks validate --verbose
```

### 5. Update Existing Files

```bash
# Update with latest template
memory-banks update

# Force overwrite existing files
memory-banks update --force

# Preview changes
memory-banks update --dry-run
```

## Command Reference

### Global Options

```bash
memory-banks [global-options] <command> [command-options]

Global Options:
  -v, --version         Show version number
  --verbose             Enable verbose output
  --quiet               Suppress non-error output
  --debug               Enable debug logging
  -h, --help            Show help information
```

### Init Command

```bash
memory-banks init [options]

Options:
  -t, --template <template>    Template to use (default: typescript)
  -y, --yes                    Skip interactive prompts
  --dry-run                    Show what would be created
  -f, --force                  Overwrite existing files
  -o, --output-dir <path>      Output directory (default: .memory-bank)
```

### List Command

```bash
memory-banks list [options]

Options:
  -l, --language <language>    Filter by programming language
  -v, --verbose                Show detailed template information
```

### Info Command

```bash
memory-banks info <template-name>

Arguments:
  template-name                 Name of the template to inspect
```

### Validate Command

```bash
memory-banks validate [options]

Options:
  -v, --verbose                Show detailed validation information
```

### Update Command

```bash
memory-banks update [options]

Options:
  -t, --template <template>    Template to use for updates
  -f, --force                  Overwrite existing files
  --dry-run                    Show what would be updated
```

## Template System

### Template Structure

Templates are stored in the `templates/` directory and follow this structure:

```
templates/
├── typescript/
│   └── template.json
├── lua/
│   └── template.json
└── python/
    └── template.json
```

### Template Configuration

Each `template.json` file defines:

```json
{
  "name": "template-name",
  "description": "Template description",
  "version": "1.0.0",
  "files": [
    {
      "path": "file.md",
      "content": "Template content with {{variables}}",
      "overwrite": false
    }
  ],
  "options": [
    {
      "name": "variableName",
      "type": "string|boolean|number|select",
      "description": "Variable description",
      "default": "default value",
      "choices": ["option1", "option2"],
      "required": true
    }
  ]
}
```

### Variable Substitution

Templates use `{{variable}}` syntax for variable substitution:

```markdown
# Project: {{projectName}}

This is a {{projectType}} project that {{projectDescription}}.

## Requirements
- {{requirement1}}
- {{requirement2}}
- {{requirement3}}
```

## Memory Bank Structure

A complete memory bank includes these core files:

```
.memory-bank/
├── projectBrief.md      # Project overview and requirements
├── productContext.md    # Problem statement and solution
├── systemPatterns.md    # Architecture and design patterns
├── techContext.md       # Technology stack and setup
├── activeContext.md     # Current work focus and decisions
└── progress.md          # What works and what's left to build
```

## Development

### Prerequisites

- Node.js 16+
- npm, yarn, or pnpm

### Setup

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

# Run the CLI locally
node dist/index.js --help
```

### Project Structure

```
src/
├── cli/
│   ├── index.ts              # Main CLI entry point
│   └── commands/
│       ├── init.ts           # Initialize command
│       ├── list.ts           # List templates command
│       ├── info.ts           # Template info command
│       ├── validate.ts       # Validation command
│       └── update.ts         # Update command
├── services/
│   ├── templateRegistry.ts   # Template discovery and loading
│   └── templateRenderer.ts   # Template variable substitution
├── types/
│   └── index.ts              # TypeScript type definitions
├── utils/
│   └── fileSystem.ts         # File system utilities
└── index.ts                  # CLI entry point
```

### Adding New Templates

1. Create a new directory in `templates/`
2. Add a `template.json` file with configuration
3. Define template files and variables
4. Test with `memory-banks list` and `memory-banks info`

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- **Issues**: [GitHub Issues](https://github.com/zacfermanis/memory-banks/issues)
- **Documentation**: [GitHub Wiki](https://github.com/zacfermanis/memory-banks/wiki)
- **Discussions**: [GitHub Discussions](https://github.com/zacfermanis/memory-banks/discussions)

---

**Memory Banks CLI** - Empowering AI agent collaboration through structured project memory. 🧠✨
