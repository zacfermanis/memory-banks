export class TemplateRenderer {
  /**
   * Render a template string by replacing variables with values
   */
  async renderTemplate(
    template: string,
    variables: Record<string, any>
  ): Promise<string> {
    let result = template;

    // Replace {{variable}} patterns with values
    const variablePattern = /\{\{([^}]+)\}\}/g;
    result = result.replace(variablePattern, (match, variableName) => {
      const value = this.getNestedValue(variables, variableName.trim());
      return value !== undefined ? String(value) : match;
    });

    return result;
  }

  /**
   * Get a nested value from an object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * Validate that all required variables are provided
   */
  validateVariables(
    template: string,
    providedVariables: Record<string, any>
  ): string[] {
    const variablePattern = /\{\{([^}]+)\}\}/g;
    const requiredVariables: string[] = [];
    let match;

    while ((match = variablePattern.exec(template)) !== null) {
      const variableName = match[1]?.trim();
      if (
        variableName &&
        !this.getNestedValue(providedVariables, variableName)
      ) {
        requiredVariables.push(variableName);
      }
    }

    return [...new Set(requiredVariables)]; // Remove duplicates
  }

  /**
   * Get all variables used in a template
   */
  getTemplateVariables(template: string): string[] {
    const variablePattern = /\{\{([^}]+)\}\}/g;
    const variables: string[] = [];
    let match;

    while ((match = variablePattern.exec(template)) !== null) {
      const variableName = match[1]?.trim();
      if (variableName) {
        variables.push(variableName);
      }
    }

    return [...new Set(variables)]; // Remove duplicates
  }
}
