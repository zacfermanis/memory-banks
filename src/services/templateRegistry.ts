import { promises as fs } from 'fs';
import path from 'path';
import { TemplateConfig } from '../types';

export interface TemplateMetadata {
  id: string;
  name: string;
  description: string;
  version: string;
  author?: string;
  tags: string[];
  languages: string[];
  category: string;
  lastModified: Date;
  fileCount: number;
  size: number;
}

export interface TemplateSearchOptions {
  query?: string;
  language?: string;
  category?: string;
  tags?: string[];
  author?: string;
  minVersion?: string;
  maxVersion?: string;
}

export interface TemplateSearchResult {
  templates: TemplateMetadata[];
  total: number;
  filtered: number;
  searchTime: number;
}

export interface TemplateInstallOptions {
  overwrite?: boolean;
  backup?: boolean;
  validate?: boolean;
}

export class TemplateRegistry {
  private templatesPath: string;
  private cache: Map<string, TemplateConfig> = new Map();
  private metadataCache: Map<string, TemplateMetadata> = new Map();
  private lastScan: Date | null = null;

  constructor() {
    this.templatesPath = path.join(process.cwd(), 'templates');
  }

  /**
   * TASK-024: Implement template discovery
   * Create template scanning system
   */
  async scanTemplates(forceRefresh = false): Promise<TemplateMetadata[]> {
    // Return cached results if available and not forcing refresh
    if (!forceRefresh && this.lastScan && this.metadataCache.size > 0) {
      return Array.from(this.metadataCache.values());
    }

    try {
      const templateDirs = await fs.readdir(this.templatesPath);
      const metadata: TemplateMetadata[] = [];

      for (const dir of templateDirs) {
        const templatePath = path.join(this.templatesPath, dir);
        const stat = await fs.stat(templatePath);

        if (stat.isDirectory()) {
          try {
            const templateMetadata = await this.scanTemplateDirectory(
              dir,
              templatePath
            );
            if (templateMetadata) {
              metadata.push(templateMetadata);
              this.metadataCache.set(dir, templateMetadata);
            }
          } catch (error) {
            // eslint-disable-next-line no-console
            console.warn(`Warning: Could not scan template ${dir}: ${error}`);
          }
        }
      }

      this.lastScan = new Date();
      return metadata.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      throw new Error(`Failed to scan templates: ${error}`);
    }
  }

  /**
   * Scan a single template directory
   */
  private async scanTemplateDirectory(
    dir: string,
    templatePath: string
  ): Promise<TemplateMetadata | null> {
    const configPath = path.join(templatePath, 'template.json');

    try {
      const configContent = await fs.readFile(configPath, 'utf8');
      const config: TemplateConfig = JSON.parse(configContent);

      // Get directory stats
      const stat = await fs.stat(templatePath);

      // Count files in template
      const fileCount = await this.countTemplateFiles(templatePath);

      // Calculate total size
      const size = await this.calculateTemplateSize(templatePath);

      // Extract languages from template
      const languages = this.extractLanguages(config);

      // Extract tags from template
      const tags = this.extractTags(config);

      // Determine category
      const category = this.determineCategory(config, languages);

      return {
        id: dir,
        name: config.name,
        description: config.description,
        version: config.version,
        author: (config as any).author,
        tags,
        languages,
        category,
        lastModified: stat.mtime,
        fileCount,
        size,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Count files in template directory
   */
  private async countTemplateFiles(dirPath: string): Promise<number> {
    try {
      const items = await fs.readdir(dirPath);
      let count = 0;

      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stat = await fs.stat(itemPath);

        if (stat.isFile()) {
          count++;
        } else if (stat.isDirectory()) {
          count += await this.countTemplateFiles(itemPath);
        }
      }

      return count;
    } catch {
      return 0;
    }
  }

  /**
   * Calculate total size of template directory
   */
  private async calculateTemplateSize(dirPath: string): Promise<number> {
    try {
      const items = await fs.readdir(dirPath);
      let size = 0;

      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stat = await fs.stat(itemPath);

        if (stat.isFile()) {
          size += stat.size;
        } else if (stat.isDirectory()) {
          size += await this.calculateTemplateSize(itemPath);
        }
      }

      return size;
    } catch {
      return 0;
    }
  }

  /**
   * Extract languages from template configuration
   */
  private extractLanguages(config: TemplateConfig): string[] {
    const languages: string[] = [];

    // Extract from files
    if (config.files) {
      for (const file of config.files) {
        const ext = path.extname(file.path).toLowerCase();
        const language = this.getLanguageFromExtension(ext);
        if (language && !languages.includes(language)) {
          languages.push(language);
        }
      }
    }

    // Extract from template name
    const nameLanguages = this.extractLanguagesFromName(config.name);
    for (const lang of nameLanguages) {
      if (!languages.includes(lang)) {
        languages.push(lang);
      }
    }

    return languages;
  }

  /**
   * Extract tags from template configuration
   */
  private extractTags(config: TemplateConfig): string[] {
    const tags: string[] = [];

    // Extract from template name
    const nameParts = config.name.toLowerCase().split(/[\s\-_]+/);
    tags.push(...nameParts.filter(part => part.length > 2));

    // Extract from description
    const descParts = config.description.toLowerCase().split(/[\s\-_]+/);
    tags.push(...descParts.filter(part => part.length > 2));

    // Add category as tag
    if ((config as any).category) {
      tags.push((config as any).category.toLowerCase());
    }

    // Remove duplicates and common words
    const commonWords = [
      'the',
      'and',
      'or',
      'for',
      'with',
      'from',
      'template',
      'project',
    ];
    return [...new Set(tags)].filter(tag => !commonWords.includes(tag));
  }

  /**
   * Determine template category
   */
  private determineCategory(
    config: TemplateConfig,
    languages: string[]
  ): string {
    if ((config as any).category) {
      return (config as any).category;
    }

    // Determine from languages
    if (languages.includes('typescript') || languages.includes('javascript')) {
      return 'web';
    } else if (languages.includes('lua')) {
      return 'scripting';
    } else if (languages.includes('python')) {
      return 'scripting';
    } else if (languages.includes('java')) {
      return 'enterprise';
    } else if (languages.includes('csharp')) {
      return 'enterprise';
    } else if (languages.includes('go')) {
      return 'system';
    } else if (languages.includes('rust')) {
      return 'system';
    }

    return 'general';
  }

  /**
   * Get language from file extension
   */
  private getLanguageFromExtension(ext: string): string | null {
    const languageMap: Record<string, string> = {
      '.ts': 'typescript',
      '.js': 'javascript',
      '.lua': 'lua',
      '.py': 'python',
      '.java': 'java',
      '.cs': 'csharp',
      '.go': 'go',
      '.rs': 'rust',
      '.php': 'php',
      '.rb': 'ruby',
      '.cpp': 'cpp',
      '.c': 'c',
      '.h': 'c',
      '.md': 'markdown',
      '.json': 'json',
      '.yml': 'yaml',
      '.yaml': 'yaml',
      '.xml': 'xml',
      '.html': 'html',
      '.css': 'css',
      '.scss': 'scss',
    };

    return languageMap[ext] || null;
  }

  /**
   * Extract languages from template name
   */
  private extractLanguagesFromName(name: string): string[] {
    const languages: string[] = [];
    const nameLower = name.toLowerCase();

    const languageKeywords: Record<string, string[]> = {
      typescript: ['typescript', 'ts'],
      javascript: ['javascript', 'js'],
      lua: ['lua'],
      python: ['python', 'py'],
      java: ['java'],
      csharp: ['csharp', 'c#', 'dotnet'],
      go: ['go', 'golang'],
      rust: ['rust'],
      php: ['php'],
      ruby: ['ruby'],
      cpp: ['cpp', 'c++'],
      c: ['c'],
    };

    for (const [language, keywords] of Object.entries(languageKeywords)) {
      if (keywords.some(keyword => nameLower.includes(keyword))) {
        languages.push(language);
      }
    }

    return languages;
  }

  /**
   * TASK-025: Create template management
   * Implement template installation
   */
  async installTemplate(
    sourcePath: string,
    templateName: string,
    options: TemplateInstallOptions = {}
  ): Promise<void> {
    const targetPath = path.join(this.templatesPath, templateName);

    // Check if template already exists
    if (await this.templateExists(templateName)) {
      if (!options.overwrite) {
        throw new Error(
          `Template '${templateName}' already exists. Use overwrite option to replace.`
        );
      }

      if (options.backup) {
        await this.backupTemplate(templateName);
      }
    }

    // Validate template if requested
    if (options.validate) {
      await this.validateTemplateSource(sourcePath);
    }

    // Copy template files
    await this.copyTemplateFiles(sourcePath, targetPath);

    // Clear cache
    this.cache.delete(templateName);
    this.metadataCache.delete(templateName);
  }

  /**
   * Backup existing template
   */
  private async backupTemplate(templateName: string): Promise<void> {
    const templatePath = path.join(this.templatesPath, templateName);
    const backupPath = path.join(
      this.templatesPath,
      `${templateName}.backup.${Date.now()}`
    );

    try {
      await fs.rename(templatePath, backupPath);
    } catch (error) {
      throw new Error(`Failed to backup template '${templateName}': ${error}`);
    }
  }

  /**
   * Validate template source
   */
  private async validateTemplateSource(sourcePath: string): Promise<void> {
    const configPath = path.join(sourcePath, 'template.json');

    try {
      const configContent = await fs.readFile(configPath, 'utf8');
      const config: TemplateConfig = JSON.parse(configContent);

      // Basic validation
      if (!config.name || !config.description || !config.version) {
        throw new Error('Template configuration missing required fields');
      }

      if (!config.files || config.files.length === 0) {
        throw new Error('Template must contain at least one file');
      }
    } catch (error) {
      throw new Error(`Invalid template source: ${error}`);
    }
  }

  /**
   * Copy template files
   */
  private async copyTemplateFiles(
    sourcePath: string,
    targetPath: string
  ): Promise<void> {
    try {
      await fs.mkdir(targetPath, { recursive: true });

      const items = await fs.readdir(sourcePath);

      for (const item of items) {
        const sourceItemPath = path.join(sourcePath, item);
        const targetItemPath = path.join(targetPath, item);

        const stat = await fs.stat(sourceItemPath);

        if (stat.isFile()) {
          await fs.copyFile(sourceItemPath, targetItemPath);
        } else if (stat.isDirectory()) {
          await this.copyTemplateFiles(sourceItemPath, targetItemPath);
        }
      }
    } catch (error) {
      throw new Error(`Failed to copy template files: ${error}`);
    }
  }

  /**
   * Remove template
   */
  async removeTemplate(templateName: string, backup = false): Promise<void> {
    if (!(await this.templateExists(templateName))) {
      throw new Error(`Template '${templateName}' not found`);
    }

    const templatePath = path.join(this.templatesPath, templateName);

    if (backup) {
      await this.backupTemplate(templateName);
    }

    try {
      await fs.rm(templatePath, { recursive: true, force: true });

      // Clear cache
      this.cache.delete(templateName);
      this.metadataCache.delete(templateName);
    } catch (error) {
      throw new Error(`Failed to remove template '${templateName}': ${error}`);
    }
  }

  /**
   * Update template
   */
  async updateTemplate(
    templateName: string,
    sourcePath: string,
    options: TemplateInstallOptions = {}
  ): Promise<void> {
    await this.installTemplate(sourcePath, templateName, {
      ...options,
      overwrite: true,
    });
  }

  /**
   * TASK-026: Implement template search
   * Create template search functionality
   */
  async searchTemplates(
    options: TemplateSearchOptions = {}
  ): Promise<TemplateSearchResult> {
    const startTime = Date.now();

    // Get all templates
    const allTemplates = await this.scanTemplates();
    let filteredTemplates = allTemplates;

    // Apply filters
    if (options.query) {
      filteredTemplates = this.filterByQuery(filteredTemplates, options.query);
    }

    if (options.language) {
      filteredTemplates = this.filterByLanguage(
        filteredTemplates,
        options.language
      );
    }

    if (options.category) {
      filteredTemplates = this.filterByCategory(
        filteredTemplates,
        options.category
      );
    }

    if (options.tags && options.tags.length > 0) {
      filteredTemplates = this.filterByTags(filteredTemplates, options.tags);
    }

    if (options.author) {
      filteredTemplates = this.filterByAuthor(
        filteredTemplates,
        options.author
      );
    }

    if (options.minVersion || options.maxVersion) {
      filteredTemplates = this.filterByVersion(
        filteredTemplates,
        options.minVersion,
        options.maxVersion
      );
    }

    const searchTime = Date.now() - startTime;

    return {
      templates: filteredTemplates,
      total: allTemplates.length,
      filtered: filteredTemplates.length,
      searchTime,
    };
  }

  /**
   * Filter templates by search query
   */
  private filterByQuery(
    templates: TemplateMetadata[],
    query: string
  ): TemplateMetadata[] {
    const queryLower = query.toLowerCase();

    return templates.filter(
      template =>
        template.name.toLowerCase().includes(queryLower) ||
        template.description.toLowerCase().includes(queryLower) ||
        template.tags.some(tag => tag.toLowerCase().includes(queryLower)) ||
        template.languages.some(lang => lang.toLowerCase().includes(queryLower))
    );
  }

  /**
   * Filter templates by language
   */
  private filterByLanguage(
    templates: TemplateMetadata[],
    language: string
  ): TemplateMetadata[] {
    const languageLower = language.toLowerCase();

    return templates.filter(template =>
      template.languages.some(
        lang =>
          lang.toLowerCase() === languageLower ||
          this.matchesLanguageMapping(lang, languageLower)
      )
    );
  }

  /**
   * Filter templates by category
   */
  private filterByCategory(
    templates: TemplateMetadata[],
    category: string
  ): TemplateMetadata[] {
    const categoryLower = category.toLowerCase();

    return templates.filter(
      template => template.category.toLowerCase() === categoryLower
    );
  }

  /**
   * Filter templates by tags
   */
  private filterByTags(
    templates: TemplateMetadata[],
    tags: string[]
  ): TemplateMetadata[] {
    const tagsLower = tags.map(tag => tag.toLowerCase());

    return templates.filter(template =>
      tagsLower.every(tag =>
        template.tags.some(templateTag => templateTag.toLowerCase() === tag)
      )
    );
  }

  /**
   * Filter templates by author
   */
  private filterByAuthor(
    templates: TemplateMetadata[],
    author: string
  ): TemplateMetadata[] {
    const authorLower = author.toLowerCase();

    return templates.filter(
      template =>
        template.author && template.author.toLowerCase().includes(authorLower)
    );
  }

  /**
   * Filter templates by version range
   */
  private filterByVersion(
    templates: TemplateMetadata[],
    minVersion?: string,
    maxVersion?: string
  ): TemplateMetadata[] {
    return templates.filter(template => {
      const version = template.version;

      if (minVersion && this.compareVersions(version, minVersion) < 0) {
        return false;
      }

      if (maxVersion && this.compareVersions(version, maxVersion) > 0) {
        return false;
      }

      return true;
    });
  }

  /**
   * Compare version strings
   */
  private compareVersions(version1: string, version2: string): number {
    const v1Parts = version1.split('.').map(Number);
    const v2Parts = version2.split('.').map(Number);

    const maxLength = Math.max(v1Parts.length, v2Parts.length);

    for (let i = 0; i < maxLength; i++) {
      const v1 = v1Parts[i] || 0;
      const v2 = v2Parts[i] || 0;

      if (v1 < v2) {
        return -1;
      }
      if (v1 > v2) {
        return 1;
      }
    }

    return 0;
  }

  /**
   * Check language mapping
   */
  private matchesLanguageMapping(
    templateLang: string,
    searchLang: string
  ): boolean {
    const languageMappings: Record<string, string[]> = {
      typescript: ['ts', 'typescript'],
      javascript: ['js', 'javascript'],
      lua: ['lua'],
      python: ['py', 'python'],
      java: ['java'],
      csharp: ['cs', 'csharp', 'dotnet'],
      go: ['go', 'golang'],
      rust: ['rust'],
      php: ['php'],
    };

    const mappedLanguages = languageMappings[searchLang] || [searchLang];
    return mappedLanguages.some(lang => templateLang === lang);
  }

  /**
   * TASK-027: Create template documentation
   * Implement template documentation generation
   */
  async generateTemplateDocumentation(templateName: string): Promise<string> {
    const template = await this.getTemplate(templateName);
    const metadata = await this.getTemplateMetadata(templateName);

    if (!metadata) {
      throw new Error(`Template metadata not found for '${templateName}'`);
    }

    let documentation = `# ${template.name}\n\n`;
    documentation += `${template.description}\n\n`;

    // Basic information
    documentation += `## Basic Information\n\n`;
    documentation += `- **Version**: ${template.version}\n`;
    if ((template as any).author) {
      documentation += `- **Author**: ${(template as any).author}\n`;
    }
    documentation += `- **Category**: ${metadata.category}\n`;
    documentation += `- **Languages**: ${metadata.languages.join(', ')}\n`;
    documentation += `- **Tags**: ${metadata.tags.join(', ')}\n`;
    documentation += `- **Files**: ${metadata.fileCount}\n`;
    documentation += `- **Size**: ${this.formatBytes(metadata.size)}\n`;
    documentation += `- **Last Modified**: ${metadata.lastModified.toLocaleDateString()}\n\n`;

    // Template options
    if (template.options && template.options.length > 0) {
      documentation += `## Template Options\n\n`;
      documentation += `| Option | Type | Required | Description |\n`;
      documentation += `|--------|------|----------|-------------|\n`;

      for (const option of template.options) {
        documentation += `| ${option.name} | ${option.type} | ${option.required ? 'Yes' : 'No'} | ${option.description || ''} |\n`;
      }
      documentation += `\n`;
    }

    // Template files
    if (template.files && template.files.length > 0) {
      documentation += `## Template Files\n\n`;

      for (const file of template.files) {
        documentation += `### ${file.path}\n\n`;
        if ((file as any).description) {
          documentation += `${(file as any).description}\n\n`;
        }

        // Show file content preview
        try {
          const content = await this.getTemplateFile(templateName, file.path);
          const preview = content.split('\n').slice(0, 10).join('\n');
          documentation += `\`\`\`${this.getLanguageFromExtension(path.extname(file.path)) || ''}\n${preview}\n\`\`\`\n\n`;
        } catch (error) {
          documentation += `*File content not available*\n\n`;
        }
      }
    }

    // Usage examples
    documentation += `## Usage Examples\n\n`;
    documentation += `### Basic Usage\n\n`;
    documentation += `\`\`\`bash\nmemory-banks init ${templateName} --project-name my-project\n\`\`\`\n\n`;

    if (template.options && template.options.length > 0) {
      documentation += `### With Options\n\n`;
      documentation += `\`\`\`bash\nmemory-banks init ${templateName} --project-name my-project`;

      for (const option of template.options) {
        if (!option.required) {
          documentation += ` --${option.name} value`;
        }
      }

      documentation += `\n\`\`\`\n\n`;
    }

    return documentation;
  }

  /**
   * Get template metadata
   */
  async getTemplateMetadata(
    templateName: string
  ): Promise<TemplateMetadata | null> {
    // Check cache first
    if (this.metadataCache.has(templateName)) {
      return this.metadataCache.get(templateName)!;
    }

    // Scan templates to populate cache
    await this.scanTemplates();

    return this.metadataCache.get(templateName) || null;
  }

  /**
   * Format bytes to human readable format
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) {
      return '0 Bytes';
    }

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  // Existing methods (keeping for backward compatibility)

  /**
   * List all available templates, optionally filtered by language
   */
  async listTemplates(language?: string): Promise<TemplateConfig[]> {
    try {
      const templateDirs = await fs.readdir(this.templatesPath);
      const templates: TemplateConfig[] = [];

      for (const dir of templateDirs) {
        const templatePath = path.join(this.templatesPath, dir);
        const stat = await fs.stat(templatePath);

        if (stat.isDirectory()) {
          const configPath = path.join(templatePath, 'template.json');

          try {
            const configContent = await fs.readFile(configPath, 'utf8');
            const config: TemplateConfig = JSON.parse(configContent);

            // Filter by language if specified
            if (language && !this.matchesLanguage(config, language)) {
              continue;
            }

            templates.push(config);
          } catch (error) {
            // eslint-disable-next-line no-console
            console.warn(`Warning: Could not load template ${dir}: ${error}`);
          }
        }
      }

      return templates.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      throw new Error(`Failed to list templates: ${error}`);
    }
  }

  /**
   * Get a specific template by name
   */
  async getTemplate(templateName: string): Promise<TemplateConfig> {
    // Check cache first
    if (this.cache.has(templateName)) {
      return this.cache.get(templateName)!;
    }

    const configPath = path.join(
      this.templatesPath,
      templateName,
      'template.json'
    );

    try {
      const configContent = await fs.readFile(configPath, 'utf8');
      const config = JSON.parse(configContent);

      // Cache the result
      this.cache.set(templateName, config);

      return config;
    } catch (error) {
      throw new Error(
        `Template '${templateName}' not found or invalid: ${error}`
      );
    }
  }

  /**
   * Check if a template exists
   */
  async templateExists(templateName: string): Promise<boolean> {
    try {
      await this.getTemplate(templateName);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get template file content
   */
  async getTemplateFile(
    templateName: string,
    filePath: string
  ): Promise<string> {
    const fullPath = path.join(this.templatesPath, templateName, filePath);

    try {
      return await fs.readFile(fullPath, 'utf8');
    } catch (error) {
      throw new Error(
        `Template file '${filePath}' not found in template '${templateName}': ${error}`
      );
    }
  }

  /**
   * Check if template matches language filter
   */
  private matchesLanguage(template: TemplateConfig, language: string): boolean {
    const templateName = template.name.toLowerCase();
    const languageLower = language.toLowerCase();

    // Direct match
    if (templateName.includes(languageLower)) {
      return true;
    }

    // Common language mappings
    const languageMappings: Record<string, string[]> = {
      typescript: ['ts', 'typescript'],
      javascript: ['js', 'javascript'],
      lua: ['lua'],
      python: ['py', 'python'],
      java: ['java'],
      csharp: ['cs', 'csharp', 'dotnet'],
      go: ['go', 'golang'],
      rust: ['rust'],
      php: ['php'],
    };

    const mappedLanguages = languageMappings[languageLower] || [languageLower];
    return mappedLanguages.some(lang => templateName.includes(lang));
  }
}
