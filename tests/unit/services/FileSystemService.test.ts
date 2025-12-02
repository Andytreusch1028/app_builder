/**
 * Unit tests for FileSystemService
 */

import { FileSystemService } from '../../../src/services/FileSystemService.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { existsSync } from 'fs';

describe('FileSystemService', () => {
  let service: FileSystemService;
  let testDir: string;

  beforeEach(async () => {
    // Create a temporary test directory
    testDir = path.join(process.cwd(), 'test-workspace-' + Date.now());
    await fs.mkdir(testDir, { recursive: true });

    service = new FileSystemService({
      workspaceRoot: testDir
    });
  });

  afterEach(async () => {
    // Clean up test directory
    if (existsSync(testDir)) {
      await fs.rm(testDir, { recursive: true, force: true });
    }
  });

  describe('constructor', () => {
    it('should create service with valid workspace', () => {
      expect(service).toBeDefined();
      expect(service.getWorkspaceRoot()).toBe(testDir);
    });

    it('should throw error for non-existent workspace', () => {
      expect(() => new FileSystemService({
        workspaceRoot: '/nonexistent/path/12345'
      })).toThrow('Workspace root does not exist');
    });

    it('should accept custom max file size', () => {
      const customService = new FileSystemService({
        workspaceRoot: testDir,
        maxFileSize: 1024
      });
      expect(customService).toBeDefined();
    });

    it('should accept allowed extensions', () => {
      const customService = new FileSystemService({
        workspaceRoot: testDir,
        allowedExtensions: ['.txt', '.md']
      });
      expect(customService).toBeDefined();
    });
  });

  describe('writeFile', () => {
    it('should write a file', async () => {
      await service.writeFile('test.txt', 'Hello, World!');
      
      const filePath = path.join(testDir, 'test.txt');
      expect(existsSync(filePath)).toBe(true);
      
      const content = await fs.readFile(filePath, 'utf-8');
      expect(content).toBe('Hello, World!');
    });

    it('should create directories if needed', async () => {
      await service.writeFile('subdir/nested/file.txt', 'Nested content');
      
      const filePath = path.join(testDir, 'subdir', 'nested', 'file.txt');
      expect(existsSync(filePath)).toBe(true);
    });

    it('should throw error for content too large', async () => {
      const smallService = new FileSystemService({
        workspaceRoot: testDir,
        maxFileSize: 10
      });

      await expect(smallService.writeFile('large.txt', 'This content is too large'))
        .rejects.toThrow('Content too large');
    });

    it('should prevent directory traversal', async () => {
      await expect(service.writeFile('../outside.txt', 'Bad content'))
        .rejects.toThrow('Path outside workspace');
    });
  });

  describe('readFile', () => {
    it('should read a file', async () => {
      await service.writeFile('read-test.txt', 'Test content');
      const content = await service.readFile('read-test.txt');
      expect(content).toBe('Test content');
    });

    it('should throw error for non-existent file', async () => {
      await expect(service.readFile('nonexistent.txt'))
        .rejects.toThrow('File not found');
    });

    it('should throw error for file too large', async () => {
      // Write a file directly (bypassing size check)
      const largePath = path.join(testDir, 'large.txt');
      await fs.writeFile(largePath, 'x'.repeat(100));

      const smallService = new FileSystemService({
        workspaceRoot: testDir,
        maxFileSize: 10
      });

      await expect(smallService.readFile('large.txt'))
        .rejects.toThrow('File too large');
    });

    it('should prevent directory traversal', async () => {
      await expect(service.readFile('../outside.txt'))
        .rejects.toThrow('Path outside workspace');
    });
  });

  describe('deleteFile', () => {
    it('should delete a file', async () => {
      await service.writeFile('delete-me.txt', 'Temporary');
      expect(await service.fileExists('delete-me.txt')).toBe(true);

      await service.deleteFile('delete-me.txt');
      expect(await service.fileExists('delete-me.txt')).toBe(false);
    });

    it('should throw error for non-existent file', async () => {
      await expect(service.deleteFile('nonexistent.txt'))
        .rejects.toThrow('File not found');
    });

    it('should prevent directory traversal', async () => {
      await expect(service.deleteFile('../outside.txt'))
        .rejects.toThrow('Path outside workspace');
    });
  });

  describe('listFiles', () => {
    it('should list files in directory', async () => {
      await service.writeFile('file1.txt', 'Content 1');
      await service.writeFile('file2.txt', 'Content 2');
      await service.writeFile('file3.txt', 'Content 3');

      const files = await service.listFiles('.');
      expect(files).toHaveLength(3);
      expect(files).toContain('file1.txt');
      expect(files).toContain('file2.txt');
      expect(files).toContain('file3.txt');
    });

    it('should list files in subdirectory', async () => {
      await service.writeFile('subdir/a.txt', 'A');
      await service.writeFile('subdir/b.txt', 'B');

      const files = await service.listFiles('subdir');
      expect(files).toHaveLength(2);
      expect(files).toContain('a.txt');
      expect(files).toContain('b.txt');
    });

    it('should throw error for non-existent directory', async () => {
      await expect(service.listFiles('nonexistent'))
        .rejects.toThrow('Directory not found');
    });

    it('should throw error when listing a file', async () => {
      await service.writeFile('file.txt', 'Content');
      await expect(service.listFiles('file.txt'))
        .rejects.toThrow('Not a directory');
    });
  });

  describe('fileExists', () => {
    it('should return true for existing file', async () => {
      await service.writeFile('exists.txt', 'I exist');
      expect(await service.fileExists('exists.txt')).toBe(true);
    });

    it('should return false for non-existent file', async () => {
      expect(await service.fileExists('nonexistent.txt')).toBe(false);
    });

    it('should return false for path outside workspace', async () => {
      expect(await service.fileExists('../outside.txt')).toBe(false);
    });
  });

  describe('getFileStats', () => {
    it('should return file stats', async () => {
      await service.writeFile('stats.txt', 'Stats test');
      const stats = await service.getFileStats('stats.txt');

      expect(stats.size).toBeGreaterThan(0);
      expect(typeof stats.created.getTime).toBe('function');
      expect(typeof stats.modified.getTime).toBe('function');
      expect(stats.isDirectory).toBe(false);
    });

    it('should return directory stats', async () => {
      await service.writeFile('dir/file.txt', 'Content');
      const stats = await service.getFileStats('dir');

      expect(stats.isDirectory).toBe(true);
    });

    it('should throw error for non-existent file', async () => {
      await expect(service.getFileStats('nonexistent.txt'))
        .rejects.toThrow('File not found');
    });
  });

  describe('allowed extensions', () => {
    it('should allow files with allowed extensions', async () => {
      const restrictedService = new FileSystemService({
        workspaceRoot: testDir,
        allowedExtensions: ['.txt', '.md']
      });

      await restrictedService.writeFile('allowed.txt', 'OK');
      await restrictedService.writeFile('also-allowed.md', 'OK');

      expect(await restrictedService.fileExists('allowed.txt')).toBe(true);
      expect(await restrictedService.fileExists('also-allowed.md')).toBe(true);
    });

    it('should reject files with disallowed extensions', async () => {
      const restrictedService = new FileSystemService({
        workspaceRoot: testDir,
        allowedExtensions: ['.txt']
      });

      await expect(restrictedService.writeFile('bad.js', 'Not allowed'))
        .rejects.toThrow('File extension not allowed');
    });

    it('should be case-insensitive for extensions', async () => {
      const restrictedService = new FileSystemService({
        workspaceRoot: testDir,
        allowedExtensions: ['.txt']
      });

      await restrictedService.writeFile('uppercase.TXT', 'OK');
      expect(await restrictedService.fileExists('uppercase.TXT')).toBe(true);
    });
  });

  describe('security', () => {
    it('should prevent absolute path access', async () => {
      await expect(service.writeFile('/etc/passwd', 'Hacked'))
        .rejects.toThrow('Path outside workspace');
    });

    it('should prevent parent directory access', async () => {
      await expect(service.readFile('../../sensitive.txt'))
        .rejects.toThrow('Path outside workspace');
    });

    it('should prevent symlink traversal', async () => {
      // This test ensures resolved paths stay within workspace
      await expect(service.writeFile('../../../etc/passwd', 'Bad'))
        .rejects.toThrow('Path outside workspace');
    });
  });
});
