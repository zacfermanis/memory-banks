import { promises as fs } from 'fs';
import path from 'path';
import { TemplateConfig } from '../types';

export class TemplateRegistry {
  private templatesPath: string;

  constructor() {
    this.templatesPath = path.join(process.cwd(), 'templates');
  }

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
    const configPath = path.join(
      this.templatesPath,
      templateName,
      'template.json'
    );

    try {
      const configContent = await fs.readFile(configPath, 'utf8');
      return JSON.parse(configContent);
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
