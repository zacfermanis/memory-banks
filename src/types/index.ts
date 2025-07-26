export interface TemplateConfig {
  name: string;
  description: string;
  version: string;
  files: TemplateFile[];
  options?: TemplateOption[];
}

export interface TemplateFile {
  path: string;
  content: string;
  overwrite?: boolean;
}

export interface TemplateOption {
  name: string;
  type: 'string' | 'boolean' | 'number' | 'select';
  description: string;
  default?: string | boolean | number;
  choices?: string[];
  required?: boolean;
}

export interface InitOptions {
  template: string;
  yes: boolean;
  projectName?: string;
  projectPath?: string;
  dryRun?: boolean;
  force?: boolean;
  outputDir?: string;
  verbose?: boolean;
  debug?: boolean;
  quiet?: boolean;
}

export interface ProjectConfig {
  name: string;
  type: string;
  description?: string;
  version?: string;
  author?: string;
  license?: string;
  // Template variables
  projectName?: string;
  projectType?: string;
  projectDescription?: string;
  framework?: string;
  buildTool?: string;
  requirement1?: string;
  requirement2?: string;
  requirement3?: string;
  success1?: string;
  success2?: string;
  success3?: string;
  problemStatement?: string;
  solutionOverview?: string;
  uxGoal1?: string;
  uxGoal2?: string;
  uxGoal3?: string;
  architectureOverview?: string;
  pattern1?: string;
  pattern2?: string;
  pattern3?: string;
  componentRelationships?: string;
  devSetup?: string;
  dependencies?: string;
  currentFocus?: string;
  recentChanges?: string;
  nextSteps?: string;
  activeDecisions?: string;
  whatWorks?: string;
  whatsLeft?: string;
  currentStatus?: string;
  knownIssues?: string;
}
