/**
 * Configuration for custom development guides
 */
export interface CustomGuideConfig {
  /** Version of the configuration format */
  version: string;
  /** Path to the folder containing custom development guides */
  customGuidesFolder: string;
  /** Custom menu item configurations */
  menuItems: CustomMenuItem[];
}

/**
 * Configuration for a custom menu item
 */
export interface CustomMenuItem {
  /** Unique identifier for the menu item */
  id: string;
  /** Display name shown in the menu */
  displayName: string;
  /** Path to the guide folder */
  folderPath: string;
  /** Optional category for grouping */
  category?: string;
  /** Optional description for the guide */
  description?: string;
}

/**
 * Information about a development guide (built-in or custom)
 */
export interface GuideInfo {
  /** Unique identifier for the guide */
  id: string;
  /** Display name shown in the menu */
  displayName: string;
  /** Type of guide (built-in or custom) */
  type: 'built-in' | 'custom';
  /** Path to the guide folder */
  folderPath: string;
  /** Whether the guide has associated cursor rules */
  hasCursorRules: boolean;
  /** Optional category for grouping */
  category?: string;
  /** Optional description for the guide */
  description?: string;
}

/**
 * Result of a validation operation
 */
export interface ValidationResult {
  /** Whether the validation was successful */
  isValid: boolean;
  /** Error message if validation failed */
  error?: string;
  /** Warning messages for non-critical issues */
  warnings?: string[];
}

/**
 * Result of a file copy operation
 */
export interface CopyResult {
  /** Whether the copy operation was successful */
  success: boolean;
  /** Error message if copy failed */
  error?: string;
  /** Path to the copied file */
  copiedFilePath?: string;
  /** Whether an existing file was overwritten */
  overwritten?: boolean;
  /** Path to the backup file (if created) */
  backupPath?: string;
  /** Whether the operation was rolled back */
  rolledBack?: boolean;
  /** Error message if rollback failed */
  rollbackError?: string;
}

/**
 * Built-in memory bank type configuration
 */
export interface MemoryBankType {
  name: string;
  cursorRulesPath: string;
  developmentGuidePath: string;
} 