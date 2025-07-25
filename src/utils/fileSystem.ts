import { promises as fs } from 'fs';
import path from 'path';

export class FileSystemUtils {
  /**
   * Safely create a directory if it doesn't exist
   */
  static async ensureDirectory(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  /**
   * Safely write a file, creating backup if it already exists
   */
  static async safeWriteFile(
    filePath: string,
    content: string,
    overwrite = false
  ): Promise<void> {
    try {
      await fs.access(filePath);

      if (!overwrite) {
        const backupPath = `${filePath}.backup.${Date.now()}`;
        await fs.copyFile(filePath, backupPath);
        console.log(`Backup created: ${backupPath}`);
      }
    } catch {
      // File doesn't exist, safe to write
    }

    await this.ensureDirectory(path.dirname(filePath));
    await fs.writeFile(filePath, content, 'utf8');
  }

  /**
   * Check if a file exists
   */
  static async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Read a file safely
   */
  static async readFile(filePath: string): Promise<string> {
    return await fs.readFile(filePath, 'utf8');
  }

  /**
   * List files in a directory
   */
  static async listFiles(dirPath: string): Promise<string[]> {
    try {
      const files = await fs.readdir(dirPath);
      return files.filter((file: string) => !file.startsWith('.'));
    } catch {
      return [];
    }
  }
}
