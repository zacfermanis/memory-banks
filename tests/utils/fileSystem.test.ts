import { FileSystemUtils } from '../../src/utils/fileSystem';
import { promises as fs } from 'fs';

// Mock fs module
jest.mock('fs', () => ({
  promises: {
    access: jest.fn(),
    mkdir: jest.fn(),
    writeFile: jest.fn(),
    readFile: jest.fn(),
    readdir: jest.fn(),
    copyFile: jest.fn(),
  },
}));

describe('FileSystemUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ensureDirectory', () => {
    it('should create directory if it does not exist', async () => {
      const mockAccess = fs.access as jest.MockedFunction<typeof fs.access>;
      const mockMkdir = fs.mkdir as jest.MockedFunction<typeof fs.mkdir>;
      
      mockAccess.mockRejectedValueOnce(new Error('Directory does not exist'));
      
      await FileSystemUtils.ensureDirectory('/test/dir');
      
      expect(mockMkdir).toHaveBeenCalledWith('/test/dir', { recursive: true });
    });

    it('should not create directory if it already exists', async () => {
      const mockAccess = fs.access as jest.MockedFunction<typeof fs.access>;
      const mockMkdir = fs.mkdir as jest.MockedFunction<typeof fs.mkdir>;
      
      mockAccess.mockResolvedValueOnce(undefined);
      
      await FileSystemUtils.ensureDirectory('/test/dir');
      
      expect(mockMkdir).not.toHaveBeenCalled();
    });
  });

  describe('fileExists', () => {
    it('should return true if file exists', async () => {
      const mockAccess = fs.access as jest.MockedFunction<typeof fs.access>;
      mockAccess.mockResolvedValueOnce(undefined);
      
      const result = await FileSystemUtils.fileExists('/test/file.txt');
      
      expect(result).toBe(true);
    });

    it('should return false if file does not exist', async () => {
      const mockAccess = fs.access as jest.MockedFunction<typeof fs.access>;
      mockAccess.mockRejectedValueOnce(new Error('File not found'));
      
      const result = await FileSystemUtils.fileExists('/test/file.txt');
      
      expect(result).toBe(false);
    });
  });
}); 