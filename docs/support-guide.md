# Support Guide

Get help with memory-banks, troubleshoot issues, and find answers to common questions.

## Getting Help

### Quick Help
```bash
# Show general help
memory-banks --help

# Show command-specific help
memory-banks init --help

# Enable debug mode for detailed information
memory-banks init --debug
```

### Documentation
- **[Quick Start Guide](quick-start-guide.md)** - Get up and running quickly
- **[Command Reference](command-reference.md)** - Complete command documentation
- **[Installation Guide](installation-guide.md)** - Installation instructions
- **[API Documentation](file-operations-api.md)** - Technical API reference

### Community Support
- **[GitHub Issues](https://github.com/zacfermanis/memory-banks/issues)** - Report bugs and request features
- **[GitHub Discussions](https://github.com/zacfermanis/memory-banks/discussions)** - Ask questions and share experiences
- **[GitHub Wiki](https://github.com/zacfermanis/memory-banks/wiki)** - Community-maintained documentation

## Troubleshooting

### Common Issues

#### Installation Problems

**Permission Denied Error**
```bash
# Error: EACCES: permission denied
# Solution: Use npx instead of global installation
npx memory-banks init

# Or fix npm permissions
sudo chown -R $USER:$GROUP ~/.npm
sudo chown -R $USER:$GROUP ~/.config
```

**Node.js Version Too Old**
```bash
# Error: Requires Node.js >= 16.0.0
# Solution: Update Node.js
node --version

# Update using nvm (recommended)
nvm install 18
nvm use 18

# Or download from nodejs.org
```

**Network Timeout**
```bash
# Error: Network timeout
# Solution: Check network and try again
npm config set registry https://registry.npmjs.org/
npx memory-banks init

# Or use a different network
```

#### Template Issues

**Template Not Found**
```bash
# Error: Template 'custom-template' not found
# Solution: Check available templates
memory-banks list

# Use an available template
memory-banks init --template typescript
```

**Template Loading Error**
```bash
# Error: Failed to load template
# Solution: Clear cache and retry
npm cache clean --force
npx memory-banks init

# Or reinstall the package
npm uninstall -g memory-banks
npm install -g memory-banks
```

#### File Operation Issues

**Files Already Exist**
```bash
# Error: Files already exist in .memory-bank/
# Solution: Use force flag or different directory
memory-banks init --force

# Or use custom output directory
memory-banks init --output-dir ./my-memory-bank
```

**Permission Denied on Files**
```bash
# Error: EACCES: permission denied
# Solution: Check file permissions
ls -la .memory-bank/

# Fix permissions
chmod -R 755 .memory-bank/
```

**Disk Space Issues**
```bash
# Error: ENOSPC: no space left on device
# Solution: Check disk space
df -h

# Clean up space and retry
```

#### Validation Issues

**Validation Failed**
```bash
# Error: Memory bank validation failed
# Solution: Check what's missing
memory-banks validate --verbose

# Reinitialize if needed
memory-banks init --force
```

**Missing Required Files**
```bash
# Error: Required files missing
# Solution: Check file structure
ls -la .memory-bank/

# Recreate missing files
memory-banks init --force
```

### Debug Mode

Enable debug mode for detailed error information:

```bash
# Enable debug logging
memory-banks init --debug

# Or set debug environment variable
DEBUG=* memory-banks init

# Debug specific command
DEBUG=memory-banks:* memory-banks list
```

### Verbose Output

Get detailed information about what's happening:

```bash
# Verbose output for all commands
memory-banks init --verbose
memory-banks list --verbose
memory-banks validate --verbose

# Combine with debug
memory-banks init --verbose --debug
```

## Frequently Asked Questions

### General Questions

**Q: What is a memory bank?**
A: A memory bank is a structured documentation system that helps AI agents understand your project context, requirements, and progress across development sessions.

**Q: Why should I use memory-banks?**
A: Memory banks improve AI agent collaboration by providing consistent project context, reducing repeated explanations, and ensuring AI agents understand your project's history and decisions.

**Q: Is memory-banks free to use?**
A: Yes, memory-banks is open source and free to use under the MIT license.

**Q: What programming languages are supported?**
A: Currently supports TypeScript/JavaScript and Lua/Love2D. More languages are planned.

### Installation Questions

**Q: Do I need to install memory-banks globally?**
A: No, you can use `npx memory-banks` without any installation. Global installation is optional for convenience.

**Q: What Node.js version do I need?**
A: Node.js 16.0.0 or higher is required.

**Q: Can I use memory-banks with Yarn or pnpm?**
A: Yes, memory-banks works with any Node.js package manager.

**Q: Does memory-banks work on Windows?**
A: Yes, memory-banks is cross-platform and works on Windows, macOS, and Linux.

### Usage Questions

**Q: How do I choose the right template?**
A: Use `memory-banks list` to see available templates and `memory-banks info <template>` for details. Choose based on your project's primary language.

**Q: Can I customize the generated files?**
A: Yes, you can edit the generated files directly. Use `memory-banks update` to apply template updates while preserving your customizations.

**Q: How often should I update my memory bank?**
A: Update your memory bank whenever your project structure, requirements, or context changes significantly.

**Q: Can I use memory-banks in a team?**
A: Yes, memory banks are designed for team collaboration. Share the `.memory-bank/` directory with your team.

### Technical Questions

**Q: How does the template system work?**
A: Templates use variable substitution with `{{variable}}` syntax. Configuration options are defined in `template.json` files.

**Q: Can I create my own templates?**
A: Yes, you can create custom templates. See the template development documentation for details.

**Q: How do I backup my memory bank?**
A: The `.memory-bank/` directory can be backed up like any other project files. Use version control for automatic backups.

**Q: What happens if I delete the memory bank files?**
A: You can recreate them using `memory-banks init --force`. Consider backing up important customizations.

## Error Reference

### Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `EACCES: permission denied` | Permission issues | Use `npx` or fix permissions |
| `ENOENT: no such file or directory` | Missing files | Check file paths and permissions |
| `EISDIR: is a directory` | Path conflict | Use different output directory |
| `ENOSPC: no space left on device` | Disk full | Free up disk space |
| `Template not found` | Invalid template name | Use `memory-banks list` to see available templates |
| `Validation failed` | Missing required files | Use `memory-banks validate --verbose` to diagnose |

### Exit Codes

| Code | Meaning | Action |
|------|---------|--------|
| `0` | Success | No action needed |
| `1` | General error | Check error message |
| `2` | Invalid command/option | Check command syntax |
| `3` | Template not found | Use `memory-banks list` |
| `4` | File operation failed | Check permissions and disk space |
| `5` | Validation failed | Use `memory-banks validate --verbose` |

## Performance Issues

### Slow Execution
```bash
# Check if it's a network issue
npx memory-banks --version

# Use global installation for faster execution
npm install -g memory-banks
memory-banks init
```

### Large Package Size
```bash
# Check package size
npm pack --dry-run

# Use npx for no local storage
npx memory-banks init
```

### Memory Issues
```bash
# Check memory usage
memory-banks init --debug

# Increase Node.js memory limit if needed
node --max-old-space-size=4096 $(which memory-banks) init
```

## Platform-Specific Issues

### Windows
```bash
# Execution policy issues
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Path length issues
# Use shorter project paths or enable long paths
```

### macOS
```bash
# Permission issues
sudo npm install -g memory-banks

# Gatekeeper issues
# Allow execution in System Preferences > Security & Privacy
```

### Linux
```bash
# Permission issues
sudo npm install -g memory-banks

# SELinux issues
# Check SELinux context and permissions
```

## Reporting Issues

### Before Reporting
1. **Check existing issues** on GitHub
2. **Try the troubleshooting steps** above
3. **Enable debug mode** and collect logs
4. **Test with a minimal example**

### Issue Template
When reporting an issue, include:

```markdown
**Environment:**
- OS: [Windows/macOS/Linux]
- Node.js version: [version]
- memory-banks version: [version]

**Steps to reproduce:**
1. [step 1]
2. [step 2]
3. [step 3]

**Expected behavior:**
[description]

**Actual behavior:**
[description]

**Debug output:**
```
memory-banks init --debug
[output here]
```

**Additional context:**
[any other relevant information]
```

### Feature Requests
For feature requests:
1. **Check existing requests** on GitHub
2. **Describe the use case** clearly
3. **Explain the benefit** to users
4. **Consider implementation complexity**

## Contributing

### How to Contribute
1. **Fork the repository**
2. **Create a feature branch**
3. **Make your changes**
4. **Add tests** for new functionality
5. **Submit a pull request**

### Development Setup
```bash
# Clone the repository
git clone https://github.com/zacfermanis/memory-banks.git
cd memory-banks

# Install dependencies
npm install

# Run tests
npm test

# Build the project
npm run build
```

### Code Style
- Follow the existing code style
- Use TypeScript strict mode
- Add tests for new features
- Update documentation as needed

## Community Resources

### Documentation
- **[Official Documentation](https://github.com/zacfermanis/memory-banks#readme)**
- **[API Reference](file-operations-api.md)**
- **[Best Practices](file-operations-best-practices.md)**

### Examples
- **[Usage Examples](file-operations-examples.md)**
- **[Template Examples](templates/)**
- **[Community Templates](https://github.com/zacfermanis/memory-banks/wiki/Templates)**

### Tools
- **[Template Validator](https://github.com/zacfermanis/memory-banks/wiki/Template-Validator)**
- **[Memory Bank Checker](https://github.com/zacfermanis/memory-banks/wiki/Memory-Bank-Checker)**

## Contact

### Primary Support
- **GitHub Issues**: [Report bugs and request features](https://github.com/zacfermanis/memory-banks/issues)
- **GitHub Discussions**: [Ask questions and share experiences](https://github.com/zacfermanis/memory-banks/discussions)

### Emergency Support
For critical issues affecting production use:
1. **Check the troubleshooting guide** above
2. **Search existing issues** on GitHub
3. **Create a detailed issue** with debug information
4. **Consider workarounds** while waiting for resolution

### Community Support
- **Stack Overflow**: Tag questions with `memory-banks`
- **Reddit**: r/nodejs, r/typescript, r/programming
- **Discord**: Various programming communities

---

**Remember**: The memory-banks community is here to help! Don't hesitate to ask questions or share your experiences. 