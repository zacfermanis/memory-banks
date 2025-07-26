import path from 'path';

export interface FormattingOptions {
  indentSize?: number;
  indentStyle?: 'space' | 'tab';
  lineEnding?: 'lf' | 'crlf' | 'auto';
  maxLineLength?: number;
  trimTrailingWhitespace?: boolean;
  insertFinalNewline?: boolean;
  language?: string;
}

export interface FormattingResult {
  content: string;
  originalLength: number;
  formattedLength: number;
  changes: string[];
  warnings: string[];
}

export class OutputFormatter {
  private defaultOptions: FormattingOptions = {
    indentSize: 2,
    indentStyle: 'space',
    lineEnding: 'auto',
    maxLineLength: 120,
    trimTrailingWhitespace: true,
    insertFinalNewline: true,
  };

  /**
   * TASK-020: Create code formatter
   * Implement basic code formatting
   */
  formatCode(
    content: string,
    filePath: string,
    options: FormattingOptions = {}
  ): FormattingResult {
    const mergedOptions = { ...this.defaultOptions, ...options };
    const changes: string[] = [];
    const warnings: string[] = [];
    const originalLength = content.length;

    let formattedContent = content;

    // Detect language from file extension if not provided
    if (!mergedOptions.language) {
      mergedOptions.language = this.detectLanguage(filePath);
    }

    // Normalize line endings
    formattedContent = this.normalizeLineEndings(
      formattedContent,
      mergedOptions
    );
    if (formattedContent !== content) {
      changes.push('Normalized line endings');
    }

    // Handle indentation
    formattedContent = this.handleIndentation(formattedContent, mergedOptions);
    if (formattedContent !== content) {
      changes.push('Applied consistent indentation');
    }

    // Trim trailing whitespace
    if (mergedOptions.trimTrailingWhitespace) {
      formattedContent = this.trimTrailingWhitespace(formattedContent);
      if (formattedContent !== content) {
        changes.push('Trimmed trailing whitespace');
      }
    }

    // Insert final newline
    if (mergedOptions.insertFinalNewline && !formattedContent.endsWith('\n')) {
      formattedContent += '\n';
      changes.push('Added final newline');
    }

    // Check line length
    const longLines = this.checkLineLength(
      formattedContent,
      mergedOptions.maxLineLength!
    );
    if (longLines.length > 0) {
      warnings.push(
        `${longLines.length} lines exceed ${mergedOptions.maxLineLength} characters`
      );
    }

    return {
      content: formattedContent,
      originalLength,
      formattedLength: formattedContent.length,
      changes,
      warnings,
    };
  }

  /**
   * TASK-021: Implement language-specific formatting
   * Create TypeScript formatting
   */
  formatTypeScript(
    content: string,
    options: FormattingOptions = {}
  ): FormattingResult {
    const tsOptions: FormattingOptions = {
      ...this.defaultOptions,
      indentSize: 2,
      indentStyle: 'space',
      maxLineLength: 100,
      ...options,
    };

    let formattedContent = content;
    const changes: string[] = [];
    const warnings: string[] = [];

    // TypeScript-specific formatting rules
    formattedContent = this.formatTypeScriptImports(formattedContent);
    formattedContent = this.formatTypeScriptExports(formattedContent);
    formattedContent = this.formatTypeScriptInterfaces(formattedContent);
    formattedContent = this.formatTypeScriptFunctions(formattedContent);

    // Apply general formatting
    const generalResult = this.formatCode(
      formattedContent,
      'file.ts',
      tsOptions
    );

    return {
      content: generalResult.content,
      originalLength: content.length,
      formattedLength: generalResult.content.length,
      changes: [...changes, ...generalResult.changes],
      warnings: [...warnings, ...generalResult.warnings],
    };
  }

  /**
   * Format Lua code
   */
  formatLua(
    content: string,
    options: FormattingOptions = {}
  ): FormattingResult {
    const luaOptions: FormattingOptions = {
      ...this.defaultOptions,
      indentSize: 2,
      indentStyle: 'space',
      maxLineLength: 80,
      ...options,
    };

    let formattedContent = content;
    const changes: string[] = [];
    const warnings: string[] = [];

    // Lua-specific formatting rules
    formattedContent = this.formatLuaFunctions(formattedContent);
    formattedContent = this.formatLuaTables(formattedContent);
    formattedContent = this.formatLuaComments(formattedContent);

    // Apply general formatting
    const generalResult = this.formatCode(
      formattedContent,
      'file.lua',
      luaOptions
    );

    return {
      content: generalResult.content,
      originalLength: content.length,
      formattedLength: generalResult.content.length,
      changes: [...changes, ...generalResult.changes],
      warnings: [...warnings, ...generalResult.warnings],
    };
  }

  /**
   * Format Markdown content
   */
  formatMarkdown(
    content: string,
    options: FormattingOptions = {}
  ): FormattingResult {
    const mdOptions: FormattingOptions = {
      ...this.defaultOptions,
      indentSize: 2,
      indentStyle: 'space',
      maxLineLength: 80,
      ...options,
    };

    let formattedContent = content;
    const changes: string[] = [];
    const warnings: string[] = [];

    // Markdown-specific formatting rules
    formattedContent = this.formatMarkdownHeaders(formattedContent);
    formattedContent = this.formatMarkdownLists(formattedContent);
    formattedContent = this.formatMarkdownCodeBlocks(formattedContent);
    formattedContent = this.formatMarkdownLinks(formattedContent);

    // Apply general formatting
    const generalResult = this.formatCode(
      formattedContent,
      'file.md',
      mdOptions
    );

    return {
      content: generalResult.content,
      originalLength: content.length,
      formattedLength: generalResult.content.length,
      changes: [...changes, ...generalResult.changes],
      warnings: [...warnings, ...generalResult.warnings],
    };
  }

  /**
   * Format JSON content
   */
  formatJSON(
    content: string,
    options: FormattingOptions = {}
  ): FormattingResult {
    const jsonOptions: FormattingOptions = {
      ...this.defaultOptions,
      indentSize: 2,
      indentStyle: 'space',
      maxLineLength: 120,
      ...options,
    };

    let formattedContent = content;
    const changes: string[] = [];
    const warnings: string[] = [];

    try {
      // Parse and re-stringify JSON for consistent formatting
      const parsed = JSON.parse(content);
      formattedContent = JSON.stringify(parsed, null, jsonOptions.indentSize);
      changes.push('Formatted JSON structure');
    } catch (error) {
      warnings.push('Invalid JSON content, skipping JSON-specific formatting');
    }

    // Apply general formatting
    const generalResult = this.formatCode(
      formattedContent,
      'file.json',
      jsonOptions
    );

    return {
      content: generalResult.content,
      originalLength: content.length,
      formattedLength: generalResult.content.length,
      changes: [...changes, ...generalResult.changes],
      warnings: [...warnings, ...generalResult.warnings],
    };
  }

  /**
   * TASK-022: Create file header/footer system
   * Implement file header generation
   */
  addFileHeader(
    content: string,
    filePath: string,
    options: {
      includeTimestamp?: boolean;
      includeAuthor?: boolean;
      includeDescription?: string;
      includeLicense?: string;
    } = {}
  ): string {
    const header: string[] = [];
    const ext = path.extname(filePath).toLowerCase();

    // Add language-specific comment start
    const commentStart = this.getCommentStart(ext);
    if (!commentStart) {
      return content; // No comment support for this file type
    }

    header.push(
      commentStart.repeat(
        commentStart === '//' ? 1 : commentStart === '<!--' ? 1 : 2
      )
    );

    // Add file path
    header.push(`${commentStart} File: ${path.basename(filePath)}`);

    // Add timestamp if requested
    if (options.includeTimestamp) {
      const timestamp = new Date().toISOString();
      header.push(`${commentStart} Generated: ${timestamp}`);
    }

    // Add author if requested
    if (options.includeAuthor) {
      header.push(`${commentStart} Author: Generated by Memory Banks CLI`);
    }

    // Add description if provided
    if (options.includeDescription) {
      header.push(`${commentStart} Description: ${options.includeDescription}`);
    }

    // Add license if provided
    if (options.includeLicense) {
      header.push(`${commentStart} License: ${options.includeLicense}`);
    }

    header.push('');

    return header.join('\n') + content;
  }

  /**
   * Add file footer
   */
  addFileFooter(
    content: string,
    filePath: string,
    options: {
      includeTimestamp?: boolean;
      includeFooter?: string;
    } = {}
  ): string {
    const footer: string[] = [];
    const ext = path.extname(filePath).toLowerCase();

    // Add language-specific comment start
    const commentStart = this.getCommentStart(ext);
    if (!commentStart) {
      return content; // No comment support for this file type
    }

    // Add custom footer if provided
    if (options.includeFooter) {
      footer.push('');
      footer.push(
        commentStart.repeat(
          commentStart === '//' ? 1 : commentStart === '<!--' ? 1 : 2
        )
      );
      footer.push(`${commentStart} ${options.includeFooter}`);
    }

    // Add timestamp if requested
    if (options.includeTimestamp) {
      const timestamp = new Date().toISOString();
      footer.push(`${commentStart} Last modified: ${timestamp}`);
    }

    if (footer.length > 0) {
      return content + '\n' + footer.join('\n');
    }

    return content;
  }

  /**
   * TASK-023: Implement output consistency
   * Create output validation
   */
  validateOutput(
    content: string,
    filePath: string,
    options: FormattingOptions = {}
  ): {
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];
    const ext = path.extname(filePath).toLowerCase();

    // Check for common issues
    if (
      content.includes('\r\n') &&
      content.includes('\n') &&
      !content.includes('\r\n\n')
    ) {
      issues.push('Mixed line endings detected');
    }

    if (content.includes('  \n')) {
      issues.push('Trailing whitespace found');
    }

    if (!content.endsWith('\n')) {
      issues.push('Missing final newline');
    }

    // Check line length
    const lines = content.split('\n');
    const longLines = lines.filter(
      line => line.length > (options.maxLineLength || 120)
    );
    if (longLines.length > 0) {
      suggestions.push(`${longLines.length} lines exceed recommended length`);
    }

    // Language-specific validation
    switch (ext) {
      case '.ts':
      case '.js':
        if (content.includes('console.log(')) {
          suggestions.push(
            'Consider removing console.log statements for production'
          );
        }
        break;
      case '.json':
        try {
          JSON.parse(content);
        } catch {
          issues.push('Invalid JSON syntax');
        }
        break;
      case '.md':
        if (!content.includes('#')) {
          suggestions.push(
            'Consider adding headers for better document structure'
          );
        }
        break;
    }

    return {
      isValid: issues.length === 0,
      issues,
      suggestions,
    };
  }

  // Private helper methods

  private detectLanguage(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const languageMap: Record<string, string> = {
      '.ts': 'typescript',
      '.js': 'javascript',
      '.lua': 'lua',
      '.md': 'markdown',
      '.json': 'json',
      '.yml': 'yaml',
      '.yaml': 'yaml',
      '.xml': 'xml',
      '.html': 'html',
      '.css': 'css',
      '.scss': 'scss',
      '.py': 'python',
      '.java': 'java',
      '.cpp': 'cpp',
      '.c': 'c',
      '.h': 'c',
      '.cs': 'csharp',
      '.php': 'php',
      '.rb': 'ruby',
      '.go': 'go',
      '.rs': 'rust',
    };
    return languageMap[ext] || 'text';
  }

  private normalizeLineEndings(
    content: string,
    options: FormattingOptions
  ): string {
    if (options.lineEnding === 'auto') {
      // Detect and normalize to most common line ending
      const hasCRLF = content.includes('\r\n');
      const hasLF = content.includes('\n') && !content.includes('\r\n');

      if (hasCRLF && hasLF) {
        // Mixed line endings, convert to LF
        return content.replace(/\r\n/g, '\n');
      } else if (hasCRLF) {
        // Convert CRLF to LF
        return content.replace(/\r\n/g, '\n');
      }
      return content;
    } else if (options.lineEnding === 'crlf') {
      return content.replace(/\r\n/g, '\n').replace(/\n/g, '\r\n');
    } else {
      return content.replace(/\r\n/g, '\n');
    }
  }

  private handleIndentation(
    content: string,
    options: FormattingOptions
  ): string {
    const lines = content.split('\n');
    const indentChar =
      options.indentStyle === 'tab' ? '\t' : ' '.repeat(options.indentSize!);

    return lines
      .map(line => {
        // Preserve empty lines
        if (line.trim() === '') {
          return '';
        }

        // Count leading spaces/tabs and convert to indent level
        const leadingWhitespace = line.match(/^[\s\t]*/)?.[0] || '';
        let indentLevel = 0;

        if (options.indentStyle === 'tab') {
          // Count tabs
          indentLevel = (leadingWhitespace.match(/\t/g) || []).length;
        } else {
          // Count spaces and convert to indent level
          const spaceCount = leadingWhitespace.length;
          indentLevel = Math.floor(spaceCount / options.indentSize!);
        }

        // Apply consistent indentation
        return indentChar.repeat(indentLevel) + line.trim();
      })
      .join('\n');
  }

  private trimTrailingWhitespace(content: string): string {
    return content
      .split('\n')
      .map(line => line.replace(/\s+$/, ''))
      .join('\n');
  }

  private checkLineLength(content: string, maxLength: number): string[] {
    const lines = content.split('\n');
    const longLines: string[] = [];

    lines.forEach((line, index) => {
      if (line.length > maxLength) {
        longLines.push(`Line ${index + 1}: ${line.length} characters`);
      }
    });

    return longLines;
  }

  private getCommentStart(ext: string): string | null {
    const commentMap: Record<string, string | null> = {
      '.ts': '//',
      '.js': '//',
      '.lua': '--',
      '.md': '<!--',
      '.json': null, // JSON doesn't support comments
      '.yml': '#',
      '.yaml': '#',
      '.xml': '<!--',
      '.html': '<!--',
      '.css': '/*',
      '.scss': '/*',
      '.py': '#',
      '.java': '//',
      '.cpp': '//',
      '.c': '//',
      '.h': '//',
      '.cs': '//',
      '.php': '//',
      '.rb': '#',
      '.go': '//',
      '.rs': '//',
    };
    return commentMap[ext] || null;
  }

  // TypeScript-specific formatting methods

  private formatTypeScriptImports(content: string): string {
    // Group and sort imports
    const lines = content.split('\n');
    const importLines: string[] = [];
    const otherLines: string[] = [];

    lines.forEach(line => {
      if (line.trim().startsWith('import ')) {
        importLines.push(line);
      } else {
        otherLines.push(line);
      }
    });

    // Sort imports
    importLines.sort();

    return [...importLines, '', ...otherLines].join('\n');
  }

  private formatTypeScriptExports(content: string): string {
    // Ensure consistent export formatting
    return content
      .replace(/export\s+default\s+/g, 'export default ')
      .replace(/export\s+{\s*/g, 'export { ')
      .replace(/\s*}\s*from\s+/g, ' } from ');
  }

  private formatTypeScriptInterfaces(content: string): string {
    // Ensure consistent interface formatting
    return content
      .replace(/interface\s+(\w+)\s*{/g, 'interface $1 {')
      .replace(/:\s*(\w+)\s*;/g, ': $1;');
  }

  private formatTypeScriptFunctions(content: string): string {
    // Ensure consistent function formatting
    return content
      .replace(/function\s+(\w+)\s*\(/g, 'function $1(')
      .replace(/=>\s*{/g, ' => {');
  }

  // Lua-specific formatting methods

  private formatLuaFunctions(content: string): string {
    // Ensure consistent function formatting
    return content
      .replace(/function\s+(\w+)\s*\(/g, 'function $1(')
      .replace(/end\s*$/gm, 'end');
  }

  private formatLuaTables(content: string): string {
    // Ensure consistent table formatting
    return content.replace(/{\s*/g, '{ ').replace(/\s*}/g, ' }');
  }

  private formatLuaComments(content: string): string {
    // Ensure consistent comment formatting
    return content.replace(/--\s*$/gm, '--').replace(/--\s{2,}/g, '-- ');
  }

  // Markdown-specific formatting methods

  private formatMarkdownHeaders(content: string): string {
    // Ensure consistent header formatting
    return content
      .replace(/^(#{1,6})\s*(\w)/gm, '$1 $2')
      .replace(/^(#{1,6})\s+(\w.*?)\s*$/gm, '$1 $2');
  }

  private formatMarkdownLists(content: string): string {
    // Ensure consistent list formatting
    return content
      .replace(/^(\s*)[*+-]\s+/gm, '$1- ')
      .replace(/^(\s*)\d+\.\s+/gm, '$11. ');
  }

  private formatMarkdownCodeBlocks(content: string): string {
    // Ensure consistent code block formatting
    return content
      .replace(/```(\w+)?\s*$/gm, '```$1')
      .replace(/^\s*```\s*$/gm, '```');
  }

  private formatMarkdownLinks(content: string): string {
    // Ensure consistent link formatting
    return content.replace(/\[([^\]]+)\]\s*\(([^)]+)\)/g, '[$1]($2)');
  }
}
