/**
 * FilesystemContextService - LangChain filesystem context engineering
 * Implements infinite context via filesystem operations
 * Based on: https://blog.langchain.com/how-agents-can-use-filesystems-for-context-engineering/
 */

import { FilesystemMiddleware } from '../middleware/FilesystemMiddleware.js';
import { FilesystemOperation, FilesystemResult } from '../types/deepagents.types.js';
import { FileSystemService } from './FileSystemService.js';
import * as path from 'path';

export interface ContextDocument {
  id: string;
  path: string;
  content: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export class FilesystemContextService {
  private middleware: FilesystemMiddleware;
  private contextRoot: string;

  constructor(workspaceRoot: string, fileSystemService: FileSystemService) {
    this.middleware = new FilesystemMiddleware(workspaceRoot, fileSystemService);
    this.contextRoot = path.join(workspaceRoot, 'data', 'context');
  }

  /**
   * Store context document
   */
  async storeContext(
    id: string,
    content: string,
    metadata: Record<string, any> = {}
  ): Promise<ContextDocument> {
    const docPath = path.join(this.contextRoot, `${id}.json`);
    
    const document: ContextDocument = {
      id,
      path: docPath,
      content,
      metadata,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const operation: FilesystemOperation = {
      type: 'write_file',
      path: docPath,
      content: JSON.stringify(document, null, 2)
    };

    const result = await this.middleware.execute(operation);
    
    if (!result.success) {
      throw new Error(`Failed to store context: ${result.error}`);
    }

    return document;
  }

  /**
   * Retrieve context document
   */
  async retrieveContext(id: string): Promise<ContextDocument | null> {
    const docPath = path.join(this.contextRoot, `${id}.json`);

    const operation: FilesystemOperation = {
      type: 'read_file',
      path: docPath
    };

    const result = await this.middleware.execute(operation);
    
    if (!result.success) {
      return null;
    }

    return JSON.parse(result.data) as ContextDocument;
  }

  /**
   * Search context documents by pattern
   */
  async searchContext(pattern: string): Promise<ContextDocument[]> {
    const globPattern = path.join(this.contextRoot, pattern);

    const operation: FilesystemOperation = {
      type: 'glob',
      path: this.contextRoot,
      pattern: globPattern
    };

    const result = await this.middleware.execute(operation);
    
    if (!result.success || !result.data) {
      return [];
    }

    const documents: ContextDocument[] = [];
    for (const filePath of result.data) {
      const readOp: FilesystemOperation = {
        type: 'read_file',
        path: filePath
      };
      
      const readResult = await this.middleware.execute(readOp);
      if (readResult.success) {
        documents.push(JSON.parse(readResult.data) as ContextDocument);
      }
    }

    return documents;
  }

  /**
   * Grep search within context documents
   */
  async grepContext(searchPattern: string): Promise<{ document: ContextDocument; matches: any[] }[]> {
    const allDocs = await this.searchContext('*.json');
    const results: { document: ContextDocument; matches: any[] }[] = [];

    for (const doc of allDocs) {
      const operation: FilesystemOperation = {
        type: 'grep',
        path: doc.path,
        pattern: searchPattern
      };

      const result = await this.middleware.execute(operation);
      if (result.success && result.data && result.data.length > 0) {
        results.push({
          document: doc,
          matches: result.data
        });
      }
    }

    return results;
  }

  /**
   * List all context documents
   */
  async listContext(): Promise<string[]> {
    const operation: FilesystemOperation = {
      type: 'ls',
      path: this.contextRoot
    };

    const result = await this.middleware.execute(operation);
    
    if (!result.success) {
      return [];
    }

    return result.data || [];
  }

  /**
   * Get filesystem middleware
   */
  getMiddleware(): FilesystemMiddleware {
    return this.middleware;
  }
}

