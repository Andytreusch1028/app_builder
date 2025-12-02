/**
 * FilesystemMiddleware - Document storage and retrieval for DeepAgentsJS
 * Implements LangChain filesystem context engineering patterns
 */

import { FilesystemOperation, FilesystemResult, FilesystemState } from '../types/deepagents.types.js';
import { FileSystemService } from '../services/FileSystemService.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';

export class FilesystemMiddleware {
  private state: FilesystemState;
  private fileSystemService: FileSystemService;
  private workspaceRoot: string;

  constructor(workspaceRoot: string, fileSystemService: FileSystemService) {
    this.workspaceRoot = workspaceRoot;
    this.fileSystemService = fileSystemService;
    this.state = {
      workingDirectory: workspaceRoot,
      recentFiles: [],
      documentCache: new Map()
    };
  }

  /**
   * Execute filesystem operation
   */
  async execute(operation: FilesystemOperation): Promise<FilesystemResult> {
    try {
      let data: any;

      switch (operation.type) {
        case 'ls':
          data = await this.ls(operation.path);
          break;
        case 'read_file':
          data = await this.readFile(operation.path);
          break;
        case 'write_file':
          data = await this.writeFile(operation.path, operation.content || '');
          break;
        case 'edit_file':
          data = await this.editFile(operation.path, operation.content || '');
          break;
        case 'glob':
          data = await this.globSearch(operation.pattern || '*');
          break;
        case 'grep':
          data = await this.grep(operation.path, operation.pattern || '');
          break;
        default:
          throw new Error(`Unknown operation type: ${operation.type}`);
      }

      return {
        success: true,
        data,
        operation
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        operation
      };
    }
  }

  /**
   * List directory contents
   */
  private async ls(dirPath: string): Promise<string[]> {
    const fullPath = path.resolve(this.workspaceRoot, dirPath);
    const entries = await fs.readdir(fullPath, { withFileTypes: true });
    return entries.map(entry => {
      const prefix = entry.isDirectory() ? '[DIR] ' : '[FILE] ';
      return prefix + entry.name;
    });
  }

  /**
   * Read file contents
   */
  private async readFile(filePath: string): Promise<string> {
    const fullPath = path.resolve(this.workspaceRoot, filePath);
    const content = await fs.readFile(fullPath, 'utf-8');
    
    // Update cache and recent files
    this.state.documentCache.set(filePath, content);
    this.addRecentFile(filePath);
    
    return content;
  }

  /**
   * Write file contents
   */
  private async writeFile(filePath: string, content: string): Promise<{ path: string; size: number }> {
    const fullPath = path.resolve(this.workspaceRoot, filePath);
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    
    await fs.writeFile(fullPath, content, 'utf-8');
    
    // Update cache and recent files
    this.state.documentCache.set(filePath, content);
    this.addRecentFile(filePath);
    
    const stats = await fs.stat(fullPath);
    return { path: filePath, size: stats.size };
  }

  /**
   * Edit file contents (append or replace)
   */
  private async editFile(filePath: string, content: string): Promise<{ path: string; size: number }> {
    // For now, edit is the same as write (full replacement)
    // In a more advanced implementation, this could support partial edits
    return this.writeFile(filePath, content);
  }

  /**
   * Search files using glob pattern
   */
  private async globSearch(pattern: string): Promise<string[]> {
    const files = await glob(pattern, {
      cwd: this.workspaceRoot,
      nodir: false
    });
    return files;
  }

  /**
   * Search file contents using grep pattern
   */
  private async grep(filePath: string, pattern: string): Promise<{ line: number; content: string }[]> {
    const fullPath = path.resolve(this.workspaceRoot, filePath);
    const content = await fs.readFile(fullPath, 'utf-8');
    const lines = content.split('\n');
    const regex = new RegExp(pattern, 'i');
    
    const matches: { line: number; content: string }[] = [];
    lines.forEach((line, index) => {
      if (regex.test(line)) {
        matches.push({ line: index + 1, content: line });
      }
    });
    
    return matches;
  }

  /**
   * Add file to recent files list
   */
  private addRecentFile(filePath: string): void {
    this.state.recentFiles = [
      filePath,
      ...this.state.recentFiles.filter(f => f !== filePath)
    ].slice(0, 20); // Keep last 20 files
  }

  /**
   * Get filesystem state
   */
  getState(): FilesystemState {
    return { ...this.state };
  }

  /**
   * Get recent files
   */
  getRecentFiles(): string[] {
    return [...this.state.recentFiles];
  }
}

