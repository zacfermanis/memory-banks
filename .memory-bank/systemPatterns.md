# System Patterns: Memory Banks

## Architecture Overview

### High-Level Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Input    │───▶│  CLI Interface  │───▶│ Template Engine │
│   (npx command) │    │  (Commander +   │    │                 │
│                 │    │   Inquirer)     │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │  Configuration  │    │   File System   │
                       │   Management    │    │   Operations    │
                       │                 │    │                 │
                       └─────────────────┘    └─────────────────┘
```

### Core Components

#### 1. CLI Interface Layer
- **Commander.js**: Command-line argument parsing and help generation
- **Inquirer.js**: Interactive prompts for user configuration
- **Chalk**: Colored output and formatting

#### 2. Template Engine
- **Template Registry**: Collection of available templates by language/framework
- **Template Renderer**: Processes templates with user configuration
- **File Generator**: Creates files and directories in target repository

#### 3. Configuration Management
- **User Preferences**: Stores user selections and defaults
- **Project Detection**: Identifies existing project structure
- **Validation**: Ensures configuration is valid for target project

#### 4. File System Operations
- **Safe File Creation**: Prevents overwriting existing files
- **Directory Structure**: Creates appropriate folder hierarchy
- **Backup Management**: Handles existing files gracefully

## Design Patterns

### 1. Template Pattern
```typescript
interface Template {
  id: string;
  name: string;
  description: string;
  language: string;
  framework?: string;
  files: TemplateFile[];
  questions: Question[];
}

interface TemplateFile {
  path: string;
  content: string | ((config: Config) => string);
  overwrite: boolean;
}
```

### 2. Command Pattern
```typescript
interface Command {
  name: string;
  description: string;
  action: (options: CommandOptions) => Promise<void>;
  options?: Option[];
}

interface CommandOptions {
  [key: string]: any;
}
```

### 3. Configuration Pattern
```typescript
interface Config {
  projectType: string;
  memoryBankPattern: string;
  customizations: Record<string, any>;
  outputPath: string;
}
```

### 4. Template Registry Pattern
```typescript
class TemplateRegistry {
  private templates: Map<string, Template> = new Map();
  
  register(template: Template): void;
  get(id: string): Template | undefined;
  list(): Template[];
  filterByLanguage(language: string): Template[];
}
```

## Key Technical Decisions

### 1. Template System Design
**Decision**: Use string-based templates with configuration interpolation
**Rationale**: 
- Simple to implement and understand
- Easy to version control
- Flexible for different file types
- No complex templating engine dependencies

**Implementation**:
```typescript
const renderTemplate = (template: string, config: Config): string => {
  return template
    .replace(/\{\{(\w+)\}\}/g, (match, key) => config[key] || match)
    .replace(/\{\{if (\w+)\}\}(.*?)\{\{\/if\}\}/g, (match, condition, content) => {
      return config[condition] ? content : '';
    });
};
```

### 2. File System Safety
**Decision**: Never overwrite existing files without explicit permission
**Rationale**:
- Prevents accidental data loss
- Respects existing project structure
- Provides clear feedback to users

**Implementation**:
```typescript
const safeWriteFile = async (path: string, content: string): Promise<void> => {
  if (await fs.exists(path)) {
    const backupPath = `${path}.backup.${Date.now()}`;
    await fs.copyFile(path, backupPath);
    console.log(`Backed up existing file to: ${backupPath}`);
  }
  await fs.writeFile(path, content);
};
```

### 3. Configuration Validation
**Decision**: Validate configuration before file generation
**Rationale**:
- Prevents partial installations
- Clear error messages
- Consistent behavior

**Implementation**:
```typescript
const validateConfig = (config: Config): ValidationResult => {
  const errors: string[] = [];
  
  if (!config.projectType) {
    errors.push('Project type is required');
  }
  
  if (!config.memoryBankPattern) {
    errors.push('Memory bank pattern is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
```

## Component Relationships

### Template Selection Flow
```
User runs command
    ↓
Show available templates
    ↓
User selects template
    ↓
Load template configuration
    ↓
Present template-specific questions
    ↓
Validate user responses
    ↓
Generate files
    ↓
Provide feedback and next steps
```

### File Generation Flow
```
Template + Config
    ↓
Validate configuration
    ↓
Check existing files
    ↓
Create backup if needed
    ↓
Render template content
    ↓
Write files to disk
    ↓
Update project files (package.json, etc.)
    ↓
Generate success report
```

## Critical Implementation Paths

### 1. Template Registration System
- Templates must be easily discoverable
- Support for custom templates
- Version control for template updates
- Validation of template structure

### 2. User Experience Flow
- Clear progress indicators
- Helpful error messages
- Undo/rollback capabilities
- Post-installation guidance

### 3. Cross-Platform Compatibility
- Windows path handling
- Unix/Linux compatibility
- macOS specific considerations
- Node.js version compatibility

### 4. Package Distribution
- npx compatibility
- Minimal dependencies
- Fast installation
- Clear documentation

## Error Handling Strategy

### 1. Graceful Degradation
- Continue with partial installation if possible
- Provide clear feedback on what failed
- Suggest manual steps for completion

### 2. User-Friendly Messages
- Avoid technical jargon
- Provide actionable next steps
- Include relevant documentation links

### 3. Recovery Options
- Automatic backup creation
- Rollback capabilities
- Manual cleanup instructions

## Testing Strategy

### 1. Unit Tests
- Template rendering logic
- Configuration validation
- File system operations
- CLI command parsing

### 2. Integration Tests
- End-to-end installation flows
- Cross-platform compatibility
- Template generation accuracy

### 3. User Acceptance Tests
- Real-world project scenarios
- Different project types
- Error condition handling 