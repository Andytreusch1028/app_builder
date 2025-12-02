/**
 * File System Service - Safe file operations sandboxed to workspace root
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { existsSync } from 'fs';
import { webSocketManager } from './WebSocketManager.js';
import { createFileChangeMessage } from '../types/websocket.types.js';

export interface FileSystemConfig {
  workspaceRoot: string;
  maxFileSize?: number; // in bytes
  allowedExtensions?: string[];
  projectId?: string; // For WebSocket broadcasting
}

export class FileSystemService {
  private workspaceRoot: string;
  private maxFileSize: number;
  private allowedExtensions: string[] | null;
  private projectId?: string;

  constructor(config: FileSystemConfig) {
    this.workspaceRoot = path.resolve(config.workspaceRoot);
    this.maxFileSize = config.maxFileSize || 10 * 1024 * 1024; // 10MB default
    this.allowedExtensions = config.allowedExtensions || null;
    this.projectId = config.projectId;

    // Ensure workspace root exists
    if (!existsSync(this.workspaceRoot)) {
      throw new Error(`Workspace root does not exist: ${this.workspaceRoot}`);
    }
  }

  /**
   * Read a file
   */
  async readFile(filePath: string): Promise<string> {
    const safePath = this.resolveSafePath(filePath);
    
    // Check file exists
    if (!existsSync(safePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    // Check file size
    const stats = await fs.stat(safePath);
    if (stats.size > this.maxFileSize) {
      throw new Error(`File too large: ${filePath} (${stats.size} bytes, max ${this.maxFileSize})`);
    }

    return await fs.readFile(safePath, 'utf-8');
  }

  /**
   * Write to a file
   */
  async writeFile(filePath: string, content: string): Promise<void> {
    const safePath = this.resolveSafePath(filePath);
    const fileExists = existsSync(safePath);

    // Check content size
    const contentSize = Buffer.byteLength(content, 'utf-8');
    if (contentSize > this.maxFileSize) {
      throw new Error(`Content too large: ${contentSize} bytes, max ${this.maxFileSize}`);
    }

    // Ensure directory exists
    const dir = path.dirname(safePath);
    await fs.mkdir(dir, { recursive: true });

    await fs.writeFile(safePath, content, 'utf-8');

    // Broadcast file change via WebSocket
    this.broadcastFileChange(
      fileExists ? 'modified' : 'created',
      filePath,
      content
    );
  }

  /**
   * Delete a file
   */
  async deleteFile(filePath: string): Promise<void> {
    const safePath = this.resolveSafePath(filePath);

    if (!existsSync(safePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    await fs.unlink(safePath);

    // Broadcast file deletion via WebSocket
    this.broadcastFileChange('deleted', filePath);
  }

  /**
   * List files in a directory
   */
  async listFiles(dirPath: string = '.'): Promise<string[]> {
    const safePath = this.resolveSafePath(dirPath);

    if (!existsSync(safePath)) {
      throw new Error(`Directory not found: ${dirPath}`);
    }

    const stats = await fs.stat(safePath);
    if (!stats.isDirectory()) {
      throw new Error(`Not a directory: ${dirPath}`);
    }

    const entries = await fs.readdir(safePath, { withFileTypes: true });
    return entries
      .filter(entry => entry.isFile())
      .map(entry => entry.name);
  }

  /**
   * Check if a file exists
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      const safePath = this.resolveSafePath(filePath);
      return existsSync(safePath);
    } catch {
      return false;
    }
  }

  /**
   * Get file stats
   */
  async getFileStats(filePath: string): Promise<{
    size: number;
    created: Date;
    modified: Date;
    isDirectory: boolean;
  }> {
    const safePath = this.resolveSafePath(filePath);

    if (!existsSync(safePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const stats = await fs.stat(safePath);
    return {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      isDirectory: stats.isDirectory()
    };
  }

  /**
   * Resolve a path safely within workspace root
   */
  private resolveSafePath(filePath: string): string {
    // Resolve the path relative to workspace root
    const resolved = path.resolve(this.workspaceRoot, filePath);

    // Ensure the resolved path is within workspace root (prevent directory traversal)
    if (!resolved.startsWith(this.workspaceRoot)) {
      throw new Error(`Path outside workspace: ${filePath}`);
    }

    // Check file extension if restrictions are set
    if (this.allowedExtensions) {
      const ext = path.extname(resolved).toLowerCase();
      if (!this.allowedExtensions.includes(ext)) {
        throw new Error(`File extension not allowed: ${ext}`);
      }
    }

    return resolved;
  }

  /**
   * Get workspace root
   */
  getWorkspaceRoot(): string {
    return this.workspaceRoot;
  }

  /**
   * Broadcast file change via WebSocket
   */
  private broadcastFileChange(
    action: 'created' | 'modified' | 'deleted',
    filePath: string,
    content?: string
  ): void {
    if (!this.projectId) return;

    const wsMessage = createFileChangeMessage(
      this.projectId,
      action,
      filePath,
      content
    );

    webSocketManager.broadcastToProject(this.projectId, wsMessage);
  }
}

