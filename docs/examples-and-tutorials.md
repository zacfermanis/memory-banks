# Examples and Tutorials

Comprehensive examples and tutorials for using memory-banks effectively in various scenarios.

## Table of Contents

- [Basic Usage Examples](#basic-usage-examples)
- [Advanced Usage Examples](#advanced-usage-examples)
- [Integration Examples](#integration-examples)
- [Tutorials](#tutorials)
- [Real-World Scenarios](#real-world-scenarios)
- [Best Practices](#best-practices)

## Basic Usage Examples

### Example 1: Simple TypeScript Project

**Scenario**: Setting up a memory bank for a new TypeScript web application.

```bash
# Create a new project
mkdir my-typescript-app
cd my-typescript-app

# Initialize memory bank
npx memory-banks init --template typescript --yes

# Verify setup
npx memory-banks validate
```

**Generated Memory Bank Structure**:
```
.memory-bank/
├── projectBrief.md      # Project overview and requirements
├── productContext.md    # Problem statement and solution
├── systemPatterns.md    # Architecture and design patterns
├── techContext.md       # Technology stack and setup
├── activeContext.md     # Current work focus and decisions
└── progress.md          # What works and what's left to build
```

**Using with AI Agent**:
```
"Please read the .memory-bank/projectBrief.md and .memory-bank/activeContext.md 
files to understand my TypeScript web application project. I need help implementing 
user authentication."
```

### Example 2: Lua Game Development

**Scenario**: Setting up a memory bank for a Lua/Love2D game project.

```bash
# Navigate to game project
cd my-lua-game

# Initialize with Lua template
npx memory-banks init --template lua

# Interactive configuration
? Project name: (my-lua-game) Space Adventure
? Game description: (A new game) 2D space shooter game
? Author name: (Your Name) Game Developer
? Love2D version: (11.4) 11.4
? Include physics: (Y/n) Y
? Include audio: (Y/n) Y
```

**Generated Game-Specific Memory Bank**:
```markdown
# .memory-bank/projectBrief.md
# Project: Space Adventure

A 2D space shooter game built with Lua and Love2D.

## Requirements
- Love2D 11.4
- Physics engine integration
- Audio system
- Player movement and shooting
- Enemy AI
- Score system
```

### Example 3: Existing Project Enhancement

**Scenario**: Adding a memory bank to an existing project.

```bash
# Navigate to existing project
cd existing-react-app

# Initialize memory bank (non-interactive)
npx memory-banks init --template typescript --yes --output-dir ./docs/memory-bank

# Update existing files
npx memory-banks update --force
```

**Custom Configuration**:
```bash
# Use custom output directory
npx memory-banks init --output-dir ./project-docs

# Force overwrite existing files
npx memory-banks init --force

# Preview what would be created
npx memory-banks init --dry-run
```

## Advanced Usage Examples

### Example 4: Team Project Setup

**Scenario**: Setting up memory banks for team collaboration.

```bash
# Clone team project
git clone https://github.com/team/awesome-project.git
cd awesome-project

# Initialize memory bank for team
npx memory-banks init --template typescript --yes

# Customize for team needs
cat > .memory-bank/team-guidelines.md << EOF
# Team Guidelines

## Development Workflow
1. Create feature branches from main
2. Write tests for new features
3. Update memory bank when architecture changes
4. Review memory bank before major decisions

## AI Agent Usage
- Always reference memory bank files
- Update activeContext.md with current work
- Document decisions in systemPatterns.md
EOF

# Commit memory bank to repository
git add .memory-bank/
git commit -m "Add memory bank system for team collaboration"
git push origin main
```

**Team Workflow**:
```bash
# New team member onboarding
git clone https://github.com/team/awesome-project.git
cd awesome-project

# Read memory bank for context
cat .memory-bank/projectBrief.md
cat .memory-bank/activeContext.md

# Start development with AI assistance
# "Please read our memory bank files to understand the project context"
```

### Example 5: Multi-Language Project

**Scenario**: Managing a project with multiple programming languages.

```bash
# Create multi-language project
mkdir multi-language-api
cd multi-language-api

# Initialize with TypeScript template (primary)
npx memory-banks init --template typescript --yes

# Create language-specific memory banks
mkdir .memory-bank/languages

# Python backend memory bank
cat > .memory-bank/languages/python-backend.md << EOF
# Python Backend

## Technology Stack
- FastAPI
- SQLAlchemy
- PostgreSQL
- Redis

## API Endpoints
- /api/v1/users
- /api/v1/auth
- /api/v1/data

## Development Setup
\`\`\`bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
\`\`\`
EOF

# Go microservice memory bank
cat > .memory-bank/languages/go-service.md << EOF
# Go Microservice

## Technology Stack
- Go 1.21
- Gin framework
- GORM
- Docker

## Service Architecture
- User service
- Auth service
- Data service

## Development Setup
\`\`\`bash
go mod init myproject
go mod tidy
go run cmd/main.go
\`\`\`
EOF
```

### Example 6: CI/CD Integration

**Scenario**: Integrating memory banks into CI/CD pipelines.

```yaml
# .github/workflows/memory-bank.yml
name: Memory Bank Validation

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  validate-memory-bank:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install memory-banks
        run: npm install -g memory-banks
      
      - name: Validate memory bank
        run: memory-banks validate --verbose
      
      - name: Check memory bank completeness
        run: |
          if [ ! -f ".memory-bank/projectBrief.md" ]; then
            echo "❌ Missing projectBrief.md"
            exit 1
          fi
          if [ ! -f ".memory-bank/activeContext.md" ]; then
            echo "❌ Missing activeContext.md"
            exit 1
          fi
          echo "✅ Memory bank validation passed"
```

**Automated Memory Bank Updates**:
```bash
#!/bin/bash
# scripts/update-memory-bank.sh

# Update memory bank with latest template
memory-banks update --force

# Commit changes if any
if git diff --quiet .memory-bank/; then
  echo "No memory bank changes"
else
  git add .memory-bank/
  git commit -m "Update memory bank with latest template"
  git push origin main
fi
```

## Integration Examples

### Example 7: VS Code Integration

**Scenario**: Using memory banks with VS Code and AI extensions.

```json
// .vscode/settings.json
{
  "memory-banks.enabled": true,
  "memory-banks.path": ".memory-bank",
  "memory-banks.autoUpdate": true,
  "memory-banks.templates": {
    "typescript": "default",
    "lua": "game-development"
  }
}
```

**VS Code Extension Configuration**:
```json
// .vscode/extensions.json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "github.copilot",
    "github.copilot-chat"
  ]
}
```

**AI Agent Prompt Template**:
```
Please read the following memory bank files to understand the project context:

1. .memory-bank/projectBrief.md - Project overview and requirements
2. .memory-bank/activeContext.md - Current work focus and decisions
3. .memory-bank/systemPatterns.md - Architecture and design patterns
4. .memory-bank/techContext.md - Technology stack and setup

Based on this context, help me with: [YOUR REQUEST]
```

### Example 8: Documentation Generation

**Scenario**: Using memory banks to generate project documentation.

```bash
#!/bin/bash
# scripts/generate-docs.sh

# Generate project documentation from memory bank
cat > docs/README.md << EOF
# Project Documentation

$(cat .memory-bank/projectBrief.md)

## Current Status

$(cat .memory-bank/progress.md)

## Architecture

$(cat .memory-bank/systemPatterns.md)

## Technology Stack

$(cat .memory-bank/techContext.md)
EOF

# Generate API documentation
if [ -f ".memory-bank/api-spec.md" ]; then
  cat .memory-bank/api-spec.md > docs/API.md
fi

# Generate development guide
cat > docs/DEVELOPMENT.md << EOF
# Development Guide

## Setup

$(cat .memory-bank/techContext.md | grep -A 20 "## Development Setup")

## Current Focus

$(cat .memory-bank/activeContext.md | grep -A 10 "## Current Work Focus")
EOF
```

### Example 9: Project Migration

**Scenario**: Migrating an existing project to use memory banks.

```bash
# Step 1: Analyze existing project
ls -la
cat package.json
cat README.md

# Step 2: Initialize memory bank
npx memory-banks init --template typescript --yes

# Step 3: Extract existing information
cat README.md > .memory-bank/existing-readme.md
cat package.json | jq '.name, .description, .version' > .memory-bank/project-info.txt

# Step 4: Update memory bank with existing context
cat > .memory-bank/migration-notes.md << EOF
# Migration Notes

## Original Project Structure
$(find . -type f -name "*.ts" | head -10)

## Key Dependencies
$(cat package.json | jq '.dependencies')

## Migration Steps
1. ✅ Initialize memory bank
2. ✅ Extract existing documentation
3. 🔄 Update memory bank with project context
4. ⏳ Refactor based on memory bank patterns
EOF
```

## Tutorials

### Tutorial 1: Building a Complete Web Application

**Step 1: Project Setup**
```bash
# Create new project
mkdir todo-app
cd todo-app

# Initialize memory bank
npx memory-banks init --template typescript --yes

# Configure project details
cat > .memory-bank/projectBrief.md << EOF
# Project: Todo Application

A modern todo application built with React, TypeScript, and Node.js.

## Requirements
- User authentication
- CRUD operations for todos
- Real-time updates
- Mobile responsive design
- Offline support
EOF
```

**Step 2: Architecture Planning**
```bash
# Update system patterns
cat > .memory-bank/systemPatterns.md << EOF
# System Architecture

## Frontend (React + TypeScript)
- Component-based architecture
- State management with Redux Toolkit
- Styling with Tailwind CSS
- Testing with Jest and React Testing Library

## Backend (Node.js + Express)
- RESTful API design
- JWT authentication
- MongoDB database
- Socket.io for real-time features

## Development Workflow
- Git flow branching strategy
- Automated testing and deployment
- Code quality with ESLint and Prettier
EOF
```

**Step 3: Development with AI Assistance**
```bash
# Start development with AI context
echo "Please read the memory bank files and help me implement the user authentication system for my todo application."
```

### Tutorial 2: Game Development with Memory Banks

**Step 1: Game Project Setup**
```bash
# Create game project
mkdir space-game
cd space-game

# Initialize with Lua template
npx memory-banks init --template lua --yes

# Configure game details
cat > .memory-bank/projectBrief.md << EOF
# Project: Space Shooter Game

A 2D space shooter game built with Lua and Love2D.

## Game Features
- Player spaceship with movement and shooting
- Multiple enemy types with AI
- Power-ups and upgrades
- Score system and high scores
- Sound effects and background music
- Particle effects and visual polish
EOF
```

**Step 2: Game Architecture**
```bash
# Define game architecture
cat > .memory-bank/systemPatterns.md << EOF
# Game Architecture

## Core Systems
- Game state management
- Entity component system
- Collision detection
- Audio system
- Particle system

## Game Objects
- Player (spaceship)
- Enemies (various types)
- Projectiles (player and enemy)
- Power-ups
- UI elements

## File Structure
- main.lua (entry point)
- states/ (game states)
- entities/ (game objects)
- systems/ (game systems)
- assets/ (images, sounds)
EOF
```

**Step 3: Development Workflow**
```bash
# Update active context
cat > .memory-bank/activeContext.md << EOF
# Current Development Focus

## Current Sprint: Player Movement
- Implement smooth player movement
- Add boundary checking
- Create movement animations
- Test on different screen sizes

## Next Steps
- Enemy spawning system
- Collision detection
- Basic shooting mechanics

## Technical Decisions
- Using Love2D's built-in physics for collision
- Implementing custom state machine for game states
- Using object-oriented approach for entities
EOF
```

### Tutorial 3: API Development with Memory Banks

**Step 1: API Project Setup**
```bash
# Create API project
mkdir user-api
cd user-api

# Initialize memory bank
npx memory-banks init --template typescript --yes

# Configure API details
cat > .memory-bank/projectBrief.md << EOF
# Project: User Management API

A RESTful API for user management with authentication and authorization.

## API Features
- User registration and authentication
- JWT token management
- Role-based access control
- User profile management
- Password reset functionality
- API rate limiting
EOF
```

**Step 2: API Design**
```bash
# Define API architecture
cat > .memory-bank/systemPatterns.md << EOF
# API Architecture

## Technology Stack
- Node.js with Express
- TypeScript for type safety
- PostgreSQL database
- Redis for caching
- JWT for authentication

## API Endpoints
- POST /api/auth/register
- POST /api/auth/login
- GET /api/users/profile
- PUT /api/users/profile
- POST /api/auth/refresh
- POST /api/auth/logout

## Security Features
- Password hashing with bcrypt
- JWT token validation
- Rate limiting with express-rate-limit
- CORS configuration
- Input validation with Joi
EOF
```

**Step 3: Development Process**
```bash
# Set up development environment
npm init -y
npm install express typescript @types/node @types/express
npm install --save-dev ts-node nodemon

# Create development scripts
cat > package.json << EOF
{
  "scripts": {
    "dev": "nodemon src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "jest"
  }
}
EOF

# Update active context
cat > .memory-bank/activeContext.md << EOF
# Current Development Focus

## Current Sprint: Authentication System
- Implement user registration endpoint
- Add JWT token generation
- Create login endpoint
- Set up password hashing

## Next Steps
- User profile endpoints
- Role-based authorization
- Password reset functionality

## Technical Decisions
- Using bcrypt for password hashing
- JWT tokens with 24-hour expiration
- PostgreSQL for user data storage
- Redis for session management
EOF
```

## Real-World Scenarios

### Scenario 1: Open Source Project Maintenance

**Challenge**: Maintaining context across multiple contributors and long development cycles.

**Solution**:
```bash
# Initialize memory bank for open source project
npx memory-banks init --template typescript --yes

# Create contributor guidelines
cat > .memory-bank/contributor-guidelines.md << EOF
# Contributor Guidelines

## Development Setup
1. Fork the repository
2. Clone your fork
3. Read the memory bank files
4. Create a feature branch
5. Make your changes
6. Update memory bank if needed
7. Submit a pull request

## Memory Bank Usage
- Always read projectBrief.md for context
- Update activeContext.md with your work
- Document architectural decisions in systemPatterns.md
- Keep progress.md updated with current status
EOF
```

### Scenario 2: Legacy Code Migration

**Challenge**: Understanding and modernizing legacy codebases.

**Solution**:
```bash
# Analyze legacy project
find . -name "*.js" -o -name "*.ts" | head -20 > .memory-bank/legacy-files.txt

# Create migration plan
cat > .memory-bank/migration-plan.md << EOF
# Legacy Code Migration Plan

## Current State Analysis
- 50+ JavaScript files
- No TypeScript
- No modern build system
- Outdated dependencies

## Migration Strategy
1. Set up TypeScript configuration
2. Gradually convert files to TypeScript
3. Update dependencies
4. Implement modern build system
5. Add comprehensive testing

## Memory Bank Integration
- Document original architecture
- Track migration progress
- Maintain context during refactoring
EOF
```

### Scenario 3: Team Onboarding

**Challenge**: Quickly onboarding new team members to complex projects.

**Solution**:
```bash
# Create onboarding memory bank
cat > .memory-bank/onboarding.md << EOF
# Team Onboarding Guide

## First Day Checklist
1. Read projectBrief.md for project overview
2. Review techContext.md for setup instructions
3. Check activeContext.md for current work
4. Set up development environment
5. Run the application locally
6. Make a small contribution

## Key Files to Understand
- src/index.ts (application entry point)
- src/config/ (configuration files)
- src/services/ (business logic)
- tests/ (test files)

## Common Issues and Solutions
- Database connection issues: Check .env file
- Build failures: Run npm install
- Test failures: Check Node.js version
EOF
```

## Best Practices

### Memory Bank Maintenance

1. **Regular Updates**
   ```bash
   # Weekly memory bank review
   npx memory-banks update
   
   # Update active context
   cat > .memory-bank/activeContext.md << EOF
   # Updated: $(date)
   
   ## Current Sprint Goals
   - [ ] Feature A implementation
   - [ ] Bug fixes for issue #123
   - [ ] Performance optimization
   
   ## Recent Decisions
   - Chose Redux Toolkit over plain Redux
   - Decided to use TypeScript strict mode
   - Selected Jest for testing framework
   EOF
   ```

2. **Version Control Integration**
   ```bash
   # Commit memory bank changes
   git add .memory-bank/
   git commit -m "Update memory bank with latest project context"
   
   # Include memory bank in pull requests
   # Review memory bank changes during code review
   ```

3. **AI Agent Optimization**
   ```bash
   # Create AI agent prompts
   cat > .memory-bank/ai-prompts.md << EOF
   # AI Agent Prompts
   
   ## General Context
   "Please read the memory bank files to understand this project's context, 
   architecture, and current state before helping me."
   
   ## Code Review
   "Based on the memory bank context, please review this code for consistency 
   with our established patterns and architecture."
   
   ## Feature Development
   "Using the memory bank as context, help me implement [feature] following 
   our established patterns and conventions."
   EOF
   ```

### Template Customization

1. **Creating Custom Templates**
   ```bash
   # Create custom template directory
   mkdir -p templates/custom-project
   
   # Create template configuration
   cat > templates/custom-project/template.json << EOF
   {
     "name": "custom-project",
     "description": "Custom project template",
     "version": "1.0.0",
     "language": "typescript",
     "files": [
       {
         "path": "projectBrief.md",
         "content": "# Project: {{projectName}}\n\n{{projectDescription}}",
         "overwrite": false
       }
     ],
     "options": [
       {
         "name": "projectName",
         "type": "string",
         "description": "Project name",
         "default": "my-project",
         "required": true
       }
     ]
   }
   EOF
   ```

2. **Template Validation**
   ```bash
   # Validate custom template
   npx memory-banks info custom-project
   
   # Test template rendering
   npx memory-banks init --template custom-project --dry-run
   ```

### Performance Optimization

1. **Memory Bank Size Management**
   ```bash
   # Monitor memory bank size
   du -sh .memory-bank/
   
   # Archive old context
   tar -czf .memory-bank/archive-$(date +%Y%m%d).tar.gz .memory-bank/old-files/
   
   # Keep only essential files
   find .memory-bank/ -name "*.md" -size +1M -exec ls -lh {} \;
   ```

2. **Efficient AI Agent Usage**
   ```bash
   # Create focused context files
   cat > .memory-bank/current-focus.md << EOF
   # Current Focus (Updated: $(date))
   
   ## Active Development
   - User authentication system
   - API endpoint /api/auth/login
   
   ## Key Context
   - Using JWT tokens
   - PostgreSQL database
   - Express.js framework
   
   ## Recent Changes
   - Updated user model
   - Added password validation
   EOF
   ```

---

For more examples and tutorials, see the [Quick Start Guide](quick-start-guide.md) or [create an issue](https://github.com/zacfermanis/memory-banks/issues) on GitHub. 