import { TemplateRenderer } from '../../src/services/templateRenderer';

describe('TemplateRenderer', () => {
  let renderer: TemplateRenderer;

  beforeEach(() => {
    renderer = new TemplateRenderer();
  });

  describe('Variable Substitution', () => {
    it('should substitute simple variables', async () => {
      const template = 'Hello {{name}}, welcome to {{project}}!';
      const variables = { name: 'John', project: 'Memory Banks' };
      
      const result = await renderer.renderTemplate(template, variables);
      
      expect(result).toBe('Hello John, welcome to Memory Banks!');
    });

    it('should handle nested variables', async () => {
      const template = 'User: {{user.name}}, Role: {{user.role}}';
      const variables = { 
        user: { 
          name: 'Alice', 
          role: 'Developer' 
        } 
      };
      
      const result = await renderer.renderTemplate(template, variables);
      
      expect(result).toBe('User: Alice, Role: Developer');
    });

    it('should leave unmatched variables unchanged', async () => {
      const template = 'Hello {{name}}, your age is {{age}}';
      const variables = { name: 'Bob' };
      
      const result = await renderer.renderTemplate(template, variables);
      
      expect(result).toBe('Hello Bob, your age is {{age}}');
    });

    it('should handle empty variables object', async () => {
      const template = 'Hello {{name}}, welcome to {{project}}!';
      const variables = {};
      
      const result = await renderer.renderTemplate(template, variables);
      
      expect(result).toBe('Hello {{name}}, welcome to {{project}}!');
    });
  });

  describe('Conditional Logic', () => {
    it('should render content when condition is true', async () => {
      const template = 'Hello {% if showGreeting %}Welcome to our project!{% endif %}';
      const variables = { showGreeting: true };
      
      const result = await renderer.renderTemplate(template, variables);
      
      expect(result).toBe('Hello Welcome to our project!');
    });

    it('should not render content when condition is false', async () => {
      const template = 'Hello {% if showGreeting %}Welcome to our project!{% endif %}';
      const variables = { showGreeting: false };
      
      const result = await renderer.renderTemplate(template, variables);
      
      expect(result).toBe('Hello ');
    });

    it('should handle string truthiness', async () => {
      const template = '{% if name %}Hello {{name}}!{% endif %}';
      const variables = { name: 'Alice' };
      
      const result = await renderer.renderTemplate(template, variables);
      
      expect(result).toBe('Hello Alice!');
    });

    it('should handle empty string as falsy', async () => {
      const template = '{% if name %}Hello {{name}}!{% endif %}';
      const variables = { name: '' };
      
      const result = await renderer.renderTemplate(template, variables);
      
      expect(result).toBe('');
    });

    it('should handle undefined variables as falsy', async () => {
      const template = '{% if name %}Hello {{name}}!{% endif %}';
      const variables = {};
      
      const result = await renderer.renderTemplate(template, variables);
      
      expect(result).toBe('');
    });

    it('should handle number truthiness', async () => {
      const template = '{% if count %}Count: {{count}}{% endif %}';
      const variables = { count: 5 };
      
      const result = await renderer.renderTemplate(template, variables);
      
      expect(result).toBe('Count: 5');
    });

    it('should handle zero as falsy', async () => {
      const template = '{% if count %}Count: {{count}}{% endif %}';
      const variables = { count: 0 };
      
      const result = await renderer.renderTemplate(template, variables);
      
      expect(result).toBe('');
    });

    it('should handle boolean values', async () => {
      const template = '{% if isActive %}Active{% endif %}{% if isVisible %}Visible{% endif %}';
      const variables = { isActive: true, isVisible: false };
      
      const result = await renderer.renderTemplate(template, variables);
      
      expect(result).toBe('Active');
    });
  });

  describe('Comparison Operators', () => {
    it('should handle equality comparison', async () => {
      const template = '{% if status == "active" %}Status is active{% endif %}';
      const variables = { status: 'active' };
      
      const result = await renderer.renderTemplate(template, variables);
      
      expect(result).toBe('Status is active');
    });

    it('should handle inequality comparison', async () => {
      const template = '{% if status != "inactive" %}Status is not inactive{% endif %}';
      const variables = { status: 'active' };
      
      const result = await renderer.renderTemplate(template, variables);
      
      expect(result).toBe('Status is not inactive');
    });

    it('should handle numeric comparisons', async () => {
      const template = '{% if count > 5 %}High count{% endif %}{% if count <= 10 %}Low count{% endif %}';
      const variables = { count: 7 };
      
      const result = await renderer.renderTemplate(template, variables);
      
      expect(result).toBe('High countLow count');
    });

    it('should handle boolean comparisons', async () => {
      const template = '{% if flag == true %}Flag is true{% endif %}{% if flag == false %}Flag is false{% endif %}';
      const variables = { flag: true };
      
      const result = await renderer.renderTemplate(template, variables);
      
      expect(result).toBe('Flag is true');
    });

    it('should handle quoted string comparisons', async () => {
      const template = '{% if name == "John" %}Hello John!{% endif %}';
      const variables = { name: 'John' };
      
      const result = await renderer.renderTemplate(template, variables);
      
      expect(result).toBe('Hello John!');
    });
  });

  describe('Logical Operators', () => {
    it('should handle AND operator', async () => {
      const template = '{% if isActive and isVisible %}Both active and visible{% endif %}';
      const variables = { isActive: true, isVisible: true };
      
      const result = await renderer.renderTemplate(template, variables);
      
      expect(result).toBe('Both active and visible');
    });

    it('should handle OR operator', async () => {
      const template = '{% if isAdmin or isModerator %}Has privileges{% endif %}';
      const variables = { isAdmin: false, isModerator: true };
      
      const result = await renderer.renderTemplate(template, variables);
      
      expect(result).toBe('Has privileges');
    });

    it('should handle NOT operator', async () => {
      const template = '{% if not isHidden %}Content is visible{% endif %}';
      const variables = { isHidden: false };
      
      const result = await renderer.renderTemplate(template, variables);
      
      expect(result).toBe('Content is visible');
    });

    it('should handle complex logical expressions', async () => {
      const template = '{% if isActive and not isHidden and count > 0 %}Valid content{% endif %}';
      const variables = { isActive: true, isHidden: false, count: 5 };
      
      const result = await renderer.renderTemplate(template, variables);
      
      expect(result).toBe('Valid content');
    });
  });

  describe('Variable Validation', () => {
    it('should identify missing required variables', () => {
      const template = 'Hello {{name}}, your age is {{age}} and role is {{role}}';
      const providedVariables = { name: 'Alice', age: 25 };
      
      const missingVars = renderer.validateVariables(template, providedVariables);
      
      expect(missingVars).toEqual(['role']);
    });

    it('should return empty array when all variables are provided', () => {
      const template = 'Hello {{name}}, your age is {{age}}';
      const providedVariables = { name: 'Bob', age: 30 };
      
      const missingVars = renderer.validateVariables(template, providedVariables);
      
      expect(missingVars).toEqual([]);
    });

    it('should handle nested variables in validation', () => {
      const template = 'User: {{user.name}}, Role: {{user.role}}';
      const providedVariables = { user: { name: 'Alice' } };
      
      const missingVars = renderer.validateVariables(template, providedVariables);
      
      expect(missingVars).toEqual(['user.role']);
    });
  });

  describe('Template Variable Extraction', () => {
    it('should extract all variables from template', () => {
      const template = 'Hello {{name}}, your age is {{age}} and role is {{role}}';
      
      const variables = renderer.getTemplateVariables(template);
      
      expect(variables).toEqual(['name', 'age', 'role']);
    });

    it('should handle duplicate variables', () => {
      const template = 'Hello {{name}}, goodbye {{name}}';
      
      const variables = renderer.getTemplateVariables(template);
      
      expect(variables).toEqual(['name']);
    });

    it('should extract conditional variables', () => {
      const template = '{% if isActive and not isHidden %}Hello {{name}}{% endif %}';
      
      const variables = renderer.getConditionalVariables(template);
      
      expect(variables).toEqual(['isActive', 'isHidden']);
    });
  });

  describe('Conditional Syntax Validation', () => {
    it('should validate correct conditional syntax', () => {
      const template = '{% if condition %}content{% endif %}';
      
      const result = renderer.validateConditionalSyntax(template);
      

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should detect unmatched if/endif blocks', () => {
      const template = '{% if condition %}content{% if another %}more{% endif %}';
      
      const result = renderer.validateConditionalSyntax(template);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Mismatched if/endif blocks: 2 if blocks, 1 endif blocks');
    });

    it('should detect malformed conditional syntax', () => {
      const template = '{% invalid %}content{% endif %}';
      
      const result = renderer.validateConditionalSyntax(template);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Malformed conditional syntax: {% invalid %}');
    });
  });

  describe('Complex Templates', () => {
    it('should handle complex templates with variables and conditionals', async () => {
      const template = `
# {{projectName}}

{% if description %}
## Description
{{description}}
{% endif %}

{% if features and features.length > 0 %}
## Features
{% for feature in features %}
- {{feature}}
{% endfor %}
{% endif %}

{% if isActive and not isHidden %}
Status: Active
{% endif %}
      `;
      
      const variables = {
        projectName: 'Memory Banks',
        description: 'A powerful memory bank system',
        features: ['Template Engine', 'CLI Interface', 'File Operations'],
        isActive: true,
        isHidden: false
      };
      
      const result = await renderer.renderTemplate(template, variables);
      
      expect(result).toContain('# Memory Banks');
      expect(result).toContain('## Description');
      expect(result).toContain('A powerful memory bank system');
      expect(result).toContain('Status: Active');
      // Note: For loops are not implemented yet, so features won't be processed
    });

    it('should handle nested conditionals', async () => {
      const template = `
{% if user %}
  {% if user.isAdmin %}
    Admin Panel
  {% endif %}
  {% if user.isModerator %}
    Moderator Tools
  {% endif %}
{% endif %}
      `;
      
      const variables = {
        user: {
          isAdmin: true,
          isModerator: false
        }
      };
      
      const result = await renderer.renderTemplate(template, variables);
      
      expect(result).toContain('Admin Panel');
      expect(result).not.toContain('Moderator Tools');
    });
  });
}); 