# Quick Start Guide

Get up and running with memory-banks in minutes! This guide will walk you through creating your first memory bank system.

## What You'll Learn

By the end of this guide, you'll have:
- ✅ A working memory bank system in your project
- ✅ Understanding of how memory banks help AI agents
- ✅ Knowledge of basic memory-banks commands
- ✅ A foundation for advanced usage

## Prerequisites

- Node.js 16+ installed
- A project directory (existing or new)
- Basic familiarity with command line

## Step 1: Install memory-banks

Choose your preferred installation method:

```bash
# Option 1: Use npx (recommended for first-time users)
npx memory-banks --help

# Option 2: Install globally
npm install -g memory-banks
```

## Step 2: Navigate to Your Project

```bash
# Go to your project directory
cd your-project-name

# Or create a new project
mkdir my-new-project
cd my-new-project
```

## Step 3: Explore Available Templates

See what memory bank patterns are available:

```bash
# List all templates
memory-banks list

# Filter by language
memory-banks list --language typescript

# Get detailed information
memory-banks info typescript
```

## Step 4: Initialize Your Memory Bank

### Interactive Mode (Recommended)
```bash
# Start the interactive setup
memory-banks init
```

You'll be guided through:
1. **Template Selection**: Choose your project type
2. **Configuration**: Set project-specific options
3. **File Generation**: Create your memory bank files

### Non-Interactive Mode
```bash
# Use defaults for quick setup
memory-banks init --yes

# Specify a template
memory-banks init --template typescript --yes
```

## Step 5: Review Generated Files

Your memory bank system is now created! Explore the generated files:

```bash
# List the memory bank directory
ls -la .memory-bank/

# View the project brief
cat .memory-bank/projectBrief.md
```

### Generated File Structure
```
.memory-bank/
├── projectBrief.md      # Project overview and requirements
├── productContext.md    # Problem statement and solution
├── systemPatterns.md    # Architecture and design patterns
├── techContext.md       # Technology stack and setup
├── activeContext.md     # Current work focus and decisions
└── progress.md          # What works and what's left to build
```

## Step 6: Validate Your Setup

Ensure everything is working correctly:

```bash
# Validate your memory bank
memory-banks validate

# Get detailed validation info
memory-banks validate --verbose
```

## Step 7: Start Using Your Memory Bank

### With AI Agents
1. **Share the `.memory-bank/` directory** with your AI agent
2. **Reference specific files** when asking questions
3. **Update files** as your project evolves

### Example AI Agent Usage
```
"Please read the .memory-bank/projectBrief.md and .memory-bank/activeContext.md 
files to understand the current project state and help me continue development."
```

## Step 8: Update Your Memory Bank

Keep your memory bank current as your project evolves:

```bash
# Update with latest template
memory-banks update

# Preview changes first
memory-banks update --dry-run

# Force overwrite if needed
memory-banks update --force
```

## Common Use Cases

### New Project Setup
```bash
# Create a new project
mkdir my-awesome-project
cd my-awesome-project

# Initialize with TypeScript template
memory-banks init --template typescript --yes

# Start development with AI assistance
```

### Existing Project Enhancement
```bash
# Navigate to existing project
cd existing-project

# Initialize memory bank
memory-banks init --template typescript

# Customize configuration during setup
```

### Team Project Onboarding
```bash
# Clone team project
git clone https://github.com/team/project.git
cd project

# Initialize memory bank for team context
memory-banks init --template typescript --yes

# Share memory bank with team members
```

## Next Steps

### Learn More
- **Command Reference**: Explore all available commands
- **Template System**: Understand how templates work
- **Advanced Usage**: Discover advanced features
- **Best Practices**: Learn memory bank maintenance

### Advanced Features
- **Custom Templates**: Create your own memory bank patterns
- **Integration**: Use with CI/CD pipelines
- **Automation**: Automate memory bank updates
- **Collaboration**: Share memory banks across teams

## Troubleshooting

### Common Issues

**Template not found**
```bash
# Check available templates
memory-banks list

# Use a different template
memory-banks init --template typescript
```

**Permission errors**
```bash
# Use npx instead
npx memory-banks init

# Or fix permissions
sudo npm install -g memory-banks
```

**Files already exist**
```bash
# Use force flag
memory-banks init --force

# Or choose different output directory
memory-banks init --output-dir ./custom-memory-bank
```

### Get Help
```bash
# Show help
memory-banks --help

# Command-specific help
memory-banks init --help

# Enable debug mode
memory-banks init --debug
```

## Success Checklist

- [ ] memory-banks installed and working
- [ ] Memory bank system created in your project
- [ ] Generated files reviewed and understood
- [ ] Validation passed successfully
- [ ] AI agent can access memory bank files
- [ ] Ready to start development with AI assistance

## Congratulations! 🎉

You've successfully set up your first memory bank system! You're now ready to:

1. **Collaborate effectively** with AI agents
2. **Maintain project context** across sessions
3. **Scale your development** with structured memory
4. **Share knowledge** with team members

The memory bank system will grow with your project and help ensure AI agents always have the context they need to assist you effectively.

---

**Need help?** Check out the [Support Guide](support-guide.md) or [create an issue](https://github.com/zacfermanis/memory-banks/issues) on GitHub. 