# SPEC-Driven Development: Memory Banks

This folder contains the SPEC-driven development documentation for the memory-banks CLI tool. Each feature is organized in its own folder with requirements, design, and tasks documentation.

## SPEC Structure

Each feature folder contains:
- `requirements.md` - User stories and acceptance criteria in EARS format
- `design.md` - Architecture, components, data models, testing strategy
- `tasks.md` - Implementation checklist with coding tasks

## Feature Organization

### Core Features (MVP)
1. **project-setup** - Basic TypeScript project structure and development environment
2. **cli-framework** - Commander.js and Inquirer.js CLI interface
3. **template-engine** - Template registry and rendering system
4. **typescript-template** - First memory bank template for TypeScript projects
5. **file-operations** - Safe file system operations and backup management

### Testing and Quality
6. **testing-infrastructure** - Unit and integration test framework
7. **error-handling** - Comprehensive error handling and user feedback

### Distribution and Documentation
8. **package-distribution** - npm package configuration and npx compatibility
9. **user-documentation** - User guides and installation instructions
10. **developer-documentation** - Contributing guidelines and API docs

### Future Features
11. **lua-template** - Memory bank template for Lua/Love2D projects
12. **template-customization** - Advanced template customization options
13. **project-detection** - Automatic project type detection and configuration

## Development Workflow

1. **Requirements Phase**: Define user stories and acceptance criteria
2. **Design Phase**: Create technical design and architecture
3. **Tasks Phase**: Break down into actionable coding tasks
4. **Execution**: Implement one task at a time with TDD

## Entry Points

- **New Feature**: Start with requirements phase
- **Update Feature**: Enter at appropriate phase
- **Execute Tasks**: Read all spec files, then execute specific task

## Integration with Memory Bank

- Update `memory-bank/activeContext.md` to reference current spec work
- Document patterns in `memory-bank/systemPatterns.md`
- Track progress in `memory-bank/progress.md`
- Maintain technical context in `memory-bank/techContext.md` 