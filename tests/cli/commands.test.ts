import { TemplateRenderer } from '../../src/services/templateRenderer';

describe('Template Renderer', () => {
  let renderer: TemplateRenderer;

  beforeEach(() => {
    renderer = new TemplateRenderer();
  });

  describe('renderTemplate', () => {
    it('should render template with variables', async () => {
      const template = 'Hello {{name}}, welcome to {{project}}!';
      const variables = { name: 'World', project: 'Memory Banks' };
      const expected = 'Hello World, welcome to Memory Banks!';

      const result = await renderer.renderTemplate(template, variables);
      expect(result).toBe(expected);
    });

    it('should handle missing variables', async () => {
      const template = 'Hello {{name}}, welcome to {{project}}!';
      const variables = { name: 'World' };
      const expected = 'Hello World, welcome to {{project}}!';

      const result = await renderer.renderTemplate(template, variables);
      expect(result).toBe(expected);
    });

    it('should handle nested variables', async () => {
      const template = 'Hello {{user.name}}, your role is {{user.role}}!';
      const variables = { user: { name: 'John', role: 'Admin' } };
      const expected = 'Hello John, your role is Admin!';

      const result = await renderer.renderTemplate(template, variables);
      expect(result).toBe(expected);
    });
  });

  describe('validateVariables', () => {
    it('should find missing variables', () => {
      const template = 'Hello {{name}}, welcome to {{project}}!';
      const providedVariables = { name: 'World' };
      const missingVars = ['project'];

      const result = renderer.validateVariables(template, providedVariables);
      expect(result).toEqual(missingVars);
    });

    it('should return empty array when all variables are provided', () => {
      const template = 'Hello {{name}}, welcome to {{project}}!';
      const providedVariables = { name: 'World', project: 'Memory Banks' };

      const result = renderer.validateVariables(template, providedVariables);
      expect(result).toEqual([]);
    });
  });

  describe('getTemplateVariables', () => {
    it('should extract all variables from template', () => {
      const template = 'Hello {{name}}, welcome to {{project}}! Your role is {{user.role}}.';
      const expected = ['name', 'project', 'user.role'];

      const result = renderer.getTemplateVariables(template);
      expect(result).toEqual(expected);
    });

    it('should handle duplicate variables', () => {
      const template = 'Hello {{name}}, {{name}}! Welcome to {{project}}.';
      const expected = ['name', 'project'];

      const result = renderer.getTemplateVariables(template);
      expect(result).toEqual(expected);
    });
  });
}); 