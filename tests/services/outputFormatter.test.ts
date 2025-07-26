import { OutputFormatter } from '../../src/services/outputFormatter';

describe('OutputFormatter', () => {
  let formatter: OutputFormatter;

  beforeEach(() => {
    formatter = new OutputFormatter();
  });

  describe('formatCode', () => {
    it('should format basic code with default options', () => {
      const content = 'function test() {\n  console.log("hello");\n}';
      const result = formatter.formatCode(content, 'test.js');

      expect(result.content).toBe('function test() {\n  console.log("hello");\n}\n');
      expect(result.changes).toContain('Added final newline');
      expect(result.originalLength).toBe(43);
      expect(result.formattedLength).toBe(44);
    });

    it('should normalize line endings', () => {
      const content = 'line1\r\nline2\nline3\r\n';
      const result = formatter.formatCode(content, 'test.txt');

      expect(result.content).toBe('line1\nline2\nline3\n');
      expect(result.changes).toContain('Normalized line endings');
    });

    it('should handle indentation', () => {
      const content = 'function test() {\n\tconsole.log("hello");\n}';
      const result = formatter.formatCode(content, 'test.js', { indentStyle: 'space', indentSize: 2 });

      expect(result.content).toBe('function test() {\nconsole.log("hello");\n}\n');
      expect(result.changes).toContain('Applied consistent indentation');
    });

    it('should trim trailing whitespace', () => {
      const content = 'line1  \nline2  \nline3';
      const result = formatter.formatCode(content, 'test.txt', { trimTrailingWhitespace: true });

      expect(result.content).toBe('line1\nline2\nline3\n');
      expect(result.changes).toContain('Trimmed trailing whitespace');
    });

    it('should detect long lines', () => {
      const longLine = 'a'.repeat(121);
      const content = `line1\n${longLine}\nline3`;
      const result = formatter.formatCode(content, 'test.txt', { maxLineLength: 120 });

      expect(result.warnings).toContain('1 lines exceed 120 characters');
    });

    it('should detect language from file extension', () => {
      const content = 'console.log("test");';
      const result = formatter.formatCode(content, 'test.ts');

      expect(result.content).toBe('console.log("test");\n');
    });
  });

  describe('formatTypeScript', () => {
    it('should format TypeScript code', () => {
      const content = `import { z } from 'zod';
import { a } from 'a';
export default function test() {
  console.log("hello");
}`;
      const result = formatter.formatTypeScript(content);

      expect(result.content).toContain('import { a } from \'a\';');
      expect(result.content).toContain('import { z } from \'zod\';');
      expect(result.changes).toContain('Added final newline');
    });

    it('should format TypeScript imports', () => {
      const content = `import { z } from 'zod';
import { a } from 'a';
const test = "hello";`;
      const result = formatter.formatTypeScript(content);

      // Imports should be sorted
      const lines = result.content.split('\n');
      const importLines = lines.filter(line => line.trim().startsWith('import'));
      expect(importLines[0]).toContain('import { a }');
      expect(importLines[1]).toContain('import { z }');
    });

    it('should format TypeScript exports', () => {
      const content = `export default function test() {}
export { test } from './test';`;
      const result = formatter.formatTypeScript(content);

      expect(result.content).toContain('export default function test()');
      expect(result.content).toContain('export { test } from');
    });

    it('should format TypeScript interfaces', () => {
      const content = `interface Test {
  name: string;
}`;
      const result = formatter.formatTypeScript(content);

      expect(result.content).toContain('interface Test {');
      expect(result.content).toContain('name: string;');
    });

    it('should format TypeScript functions', () => {
      const content = `function test() {
  return "hello";
}
const arrow = () => {
  return "world";
}`;
      const result = formatter.formatTypeScript(content);

      expect(result.content).toContain('function test() {');
      expect(result.content).toContain('=> {');
    });
  });

  describe('formatLua', () => {
    it('should format Lua code', () => {
      const content = `function test()
  print("hello")
end`;
      const result = formatter.formatLua(content);

      expect(result.content).toContain('function test()');
      expect(result.content).toContain('end');
      expect(result.changes).toContain('Added final newline');
    });

    it('should format Lua functions', () => {
      const content = `function test()
  print("hello")
end`;
      const result = formatter.formatLua(content);

      expect(result.content).toContain('function test()');
    });

    it('should format Lua tables', () => {
      const content = `local t = {name = "test", value = 123}`;
      const result = formatter.formatLua(content);

      expect(result.content).toContain('{ name = "test", value = 123 }');
    });

    it('should format Lua comments', () => {
      const content = `-- This is a comment
local test = "hello"  -- inline comment`;
      const result = formatter.formatLua(content);

      expect(result.content).toContain('-- This is a comment');
      expect(result.content).toContain('-- inline comment');
    });
  });

  describe('formatMarkdown', () => {
    it('should format Markdown content', () => {
      const content = `# Title
## Subtitle
- item1
- item2`;
      const result = formatter.formatMarkdown(content);

      expect(result.content).toContain('# Title');
      expect(result.content).toContain('## Subtitle');
      expect(result.changes).toContain('Added final newline');
    });

    it('should format Markdown headers', () => {
      const content = `#Title
##Subtitle`;
      const result = formatter.formatMarkdown(content);

      expect(result.content).toContain('# Title');
      expect(result.content).toContain('## Subtitle');
    });

    it('should format Markdown lists', () => {
      const content = `* item1
+ item2
1. item3`;
      const result = formatter.formatMarkdown(content);

      expect(result.content).toContain('- item1');
      expect(result.content).toContain('- item2');
      expect(result.content).toContain('1. item3');
    });

    it('should format Markdown code blocks', () => {
      const content = `\`\`\`typescript
function test() {}
\`\`\``;
      const result = formatter.formatMarkdown(content);

      expect(result.content).toContain('```typescript');
      expect(result.content).toContain('```');
    });

    it('should format Markdown links', () => {
      const content = `[link text] (https://example.com)`;
      const result = formatter.formatMarkdown(content);

      expect(result.content).toContain('[link text](https://example.com)');
    });
  });

  describe('formatJSON', () => {
    it('should format JSON content', () => {
      const content = '{"name":"test","value":123}';
      const result = formatter.formatJSON(content);

      expect(result.content).toContain('"name": "test"');
      expect(result.content).toContain('"value": 123');
      expect(result.changes).toContain('Formatted JSON structure');
    });

    it('should handle invalid JSON gracefully', () => {
      const content = '{"name": "test", invalid json}';
      const result = formatter.formatJSON(content);

      expect(result.warnings).toContain('Invalid JSON content, skipping JSON-specific formatting');
      expect(result.content).toBe(content + '\n');
    });

    it('should preserve JSON structure', () => {
      const content = JSON.stringify({ name: 'test', nested: { value: 123 } });
      const result = formatter.formatJSON(content);

      expect(result.content).toContain('"nested"');
      expect(result.content).toContain('"value": 123');
    });
  });

  describe('addFileHeader', () => {
    it('should add header to TypeScript file', () => {
      const content = 'console.log("test");';
      const result = formatter.addFileHeader(content, 'test.ts', {
        includeTimestamp: true,
        includeAuthor: true,
        includeDescription: 'Test file',
      });

      expect(result).toContain('// File: test.ts');
      expect(result).toContain('// Generated:');
      expect(result).toContain('// Author: Generated by Memory Banks CLI');
      expect(result).toContain('// Description: Test file');
      expect(result).toContain('console.log("test");');
    });

    it('should add header to Lua file', () => {
      const content = 'print("test")';
      const result = formatter.addFileHeader(content, 'test.lua', {
        includeDescription: 'Test file',
      });

      expect(result).toContain('-- File: test.lua');
      expect(result).toContain('-- Description: Test file');
      expect(result).toContain('print("test")');
    });

    it('should not add header to JSON file', () => {
      const content = '{"test": "value"}';
      const result = formatter.addFileHeader(content, 'test.json', {
        includeDescription: 'Test file',
      });

      expect(result).toBe(content); // JSON doesn't support comments
    });

    it('should add header to Markdown file', () => {
      const content = '# Test';
      const result = formatter.addFileHeader(content, 'test.md', {
        includeDescription: 'Test file',
      });

      expect(result).toContain('<!-- File: test.md');
      expect(result).toContain('<!-- Description: Test file');
      expect(result).toContain('# Test');
    });
  });

  describe('addFileFooter', () => {
    it('should add footer to TypeScript file', () => {
      const content = 'console.log("test");';
      const result = formatter.addFileFooter(content, 'test.ts', {
        includeTimestamp: true,
        includeFooter: 'End of file',
      });

      expect(result).toContain('// End of file');
      expect(result).toContain('// Last modified:');
      expect(result).toContain('console.log("test");');
    });

    it('should add footer to Lua file', () => {
      const content = 'print("test")';
      const result = formatter.addFileFooter(content, 'test.lua', {
        includeFooter: 'End of file',
      });

      expect(result).toContain('-- End of file');
      expect(result).toContain('print("test")');
    });

    it('should not add footer to JSON file', () => {
      const content = '{"test": "value"}';
      const result = formatter.addFileFooter(content, 'test.json', {
        includeFooter: 'End of file',
      });

      expect(result).toBe(content); // JSON doesn't support comments
    });
  });

  describe('validateOutput', () => {
    it('should validate clean output', () => {
      const content = 'console.log("test");\n';
      const result = formatter.validateOutput(content, 'test.ts');

      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should detect mixed line endings', () => {
      const content = 'line1\nline2\r\nline3\n';
      const result = formatter.validateOutput(content, 'test.txt');

      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('Mixed line endings detected');
    });

    it('should detect trailing whitespace', () => {
      const content = 'line1  \nline2\n';
      const result = formatter.validateOutput(content, 'test.txt');

      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('Trailing whitespace found');
    });

    it('should detect missing final newline', () => {
      const content = 'console.log("test");';
      const result = formatter.validateOutput(content, 'test.ts');

      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('Missing final newline');
    });

    it('should suggest removing console.log in TypeScript', () => {
      const content = 'console.log("test");\n';
      const result = formatter.validateOutput(content, 'test.ts');

      expect(result.suggestions).toContain('Consider removing console.log statements for production');
    });

    it('should detect invalid JSON', () => {
      const content = '{"invalid": json}\n';
      const result = formatter.validateOutput(content, 'test.json');

      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('Invalid JSON syntax');
    });

    it('should suggest headers for Markdown', () => {
      const content = 'This is a markdown file without headers.\n';
      const result = formatter.validateOutput(content, 'test.md');

      expect(result.suggestions).toContain('Consider adding headers for better document structure');
    });

    it('should detect long lines', () => {
      const longLine = 'a'.repeat(121);
      const content = `line1\n${longLine}\nline3\n`;
      const result = formatter.validateOutput(content, 'test.txt', { maxLineLength: 120 });

      expect(result.suggestions).toContain('1 lines exceed recommended length');
    });
  });

  describe('language detection', () => {
    it('should detect TypeScript', () => {
      const result = formatter['detectLanguage']('test.ts');
      expect(result).toBe('typescript');
    });

    it('should detect JavaScript', () => {
      const result = formatter['detectLanguage']('test.js');
      expect(result).toBe('javascript');
    });

    it('should detect Lua', () => {
      const result = formatter['detectLanguage']('test.lua');
      expect(result).toBe('lua');
    });

    it('should detect Markdown', () => {
      const result = formatter['detectLanguage']('test.md');
      expect(result).toBe('markdown');
    });

    it('should detect JSON', () => {
      const result = formatter['detectLanguage']('test.json');
      expect(result).toBe('json');
    });

    it('should return text for unknown extensions', () => {
      const result = formatter['detectLanguage']('test.unknown');
      expect(result).toBe('text');
    });
  });

  describe('comment detection', () => {
    it('should detect TypeScript comments', () => {
      const result = formatter['getCommentStart']('.ts');
      expect(result).toBe('//');
    });

    it('should detect Lua comments', () => {
      const result = formatter['getCommentStart']('.lua');
      expect(result).toBe('--');
    });

    it('should detect Markdown comments', () => {
      const result = formatter['getCommentStart']('.md');
      expect(result).toBe('<!--');
    });

    it('should return null for JSON', () => {
      const result = formatter['getCommentStart']('.json');
      expect(result).toBeNull();
    });

    it('should return null for unknown extensions', () => {
      const result = formatter['getCommentStart']('.unknown');
      expect(result).toBeNull();
    });
  });

  describe('line ending normalization', () => {
    it('should convert CRLF to LF', () => {
      const content = 'line1\r\nline2\r\n';
      const result = formatter['normalizeLineEndings'](content, { lineEnding: 'auto' });
      expect(result).toBe('line1\nline2\n');
    });

    it('should handle mixed line endings', () => {
      const content = 'line1\nline2\r\nline3\n';
      const result = formatter['normalizeLineEndings'](content, { lineEnding: 'auto' });
      expect(result).toBe('line1\nline2\nline3\n');
    });

    it('should convert to CRLF when specified', () => {
      const content = 'line1\nline2\n';
      const result = formatter['normalizeLineEndings'](content, { lineEnding: 'crlf' });
      expect(result).toBe('line1\r\nline2\r\n');
    });
  });

  describe('indentation handling', () => {
    it('should handle space indentation', () => {
      const content = 'function test() {\n  console.log("hello");\n}';
      const result = formatter['handleIndentation'](content, { indentStyle: 'space', indentSize: 2 });
      expect(result).toBe('function test() {\n  console.log("hello");\n}');
    });

    it('should handle tab indentation', () => {
      const content = 'function test() {\n  console.log("hello");\n}';
      const result = formatter['handleIndentation'](content, { indentStyle: 'tab', indentSize: 2 });
      expect(result).toBe('function test() {\nconsole.log("hello");\n}');
    });

    it('should preserve empty lines', () => {
      const content = 'line1\n\nline2';
      const result = formatter['handleIndentation'](content, { indentStyle: 'space', indentSize: 2 });
      expect(result).toBe('line1\n\nline2');
    });
  });

  describe('trailing whitespace trimming', () => {
    it('should trim trailing whitespace', () => {
      const content = 'line1  \nline2  \nline3';
      const result = formatter['trimTrailingWhitespace'](content);
      expect(result).toBe('line1\nline2\nline3');
    });

    it('should handle content without trailing whitespace', () => {
      const content = 'line1\nline2\nline3';
      const result = formatter['trimTrailingWhitespace'](content);
      expect(result).toBe('line1\nline2\nline3');
    });
  });

  describe('line length checking', () => {
    it('should detect long lines', () => {
      const longLine = 'a'.repeat(121);
      const content = `line1\n${longLine}\nline3`;
      const result = formatter['checkLineLength'](content, 120);
      expect(result).toContain('Line 2: 121 characters');
    });

    it('should handle content within line limits', () => {
      const content = 'line1\nline2\nline3';
      const result = formatter['checkLineLength'](content, 120);
      expect(result).toHaveLength(0);
    });
  });
}); 