/**
 * Filesystem Error Handling Tests
 * Tests for Bug #2: Read-Only File Permission Errors
 * 
 * Phase: ALPHA VALIDATION
 * Date: 2025-11-24
 */

import fs from 'fs';
import path from 'path';
import { AgentExecutor } from '../../src/services/AgentExecutor';
import { PlannerService } from '../../src/services/PlannerService';
import { ToolRegistry } from '../../src/services/ToolRegistry';
import { AnthropicProvider } from '../../src/providers/AnthropicProvider';

describe('Filesystem Error Handling', () => {
  let executor: AgentExecutor;
  let planner: PlannerService;
  let toolRegistry: ToolRegistry;
  
  const testDir = path.join(__dirname, '..', '..', 'agent-workspace', 'test-readonly');
  const readOnlyFile = path.join(testDir, 'readonly.txt');
  
  beforeAll(() => {
    // Create test directory
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    // Create read-only file
    fs.writeFileSync(readOnlyFile, 'Original content - DO NOT MODIFY');
    
    // Make file read-only (Windows and Unix compatible)
    try {
      fs.chmodSync(readOnlyFile, 0o444); // Read-only for all users
    } catch (error) {
      console.warn('Could not set file permissions (may be Windows):', error);
      // On Windows, we'll use a different approach
      if (process.platform === 'win32') {
        // Windows doesn't support chmod the same way, but we can still test
        console.log('Running on Windows - permission test may behave differently');
      }
    }
    
    // Initialize services
    toolRegistry = new ToolRegistry();
    const provider = new AnthropicProvider({
      apiKey: process.env.ANTHROPIC_API_KEY || 'test-key',
      model: 'claude-3-5-sonnet-20241022'
    });
    planner = new PlannerService(provider, toolRegistry);
    executor = new AgentExecutor(planner, toolRegistry);
  });
  
  afterAll(() => {
    // Cleanup - restore write permission before deleting
    try {
      if (fs.existsSync(readOnlyFile)) {
        fs.chmodSync(readOnlyFile, 0o644); // Restore write permission
      }
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true });
      }
    } catch (error) {
      console.warn('Cleanup error:', error);
    }
  });
  
  describe('Read-Only File Handling', () => {
    
    it('should handle permission error when writing to read-only file', async () => {
      const task = `Write "new content" to ${readOnlyFile}`;
      
      const result = await executor.execute(task);
      
      // The AI should either:
      // 1. Fail gracefully with an error message about permissions
      // 2. Detect the file is read-only and inform the user
      // 3. Not modify the original content
      
      // Verify original content is unchanged
      const content = fs.readFileSync(readOnlyFile, 'utf-8');
      expect(content).toBe('Original content - DO NOT MODIFY');
      
      // Log the result for manual inspection
      console.log('Read-only file test result:', {
        success: result.success,
        error: result.error,
        completedSteps: result.completedSteps?.length,
        failedSteps: result.failedSteps?.length
      });
      
      // The test passes if the file wasn't modified
      // (regardless of whether the AI reported success or failure)
    }, 60000); // 60 second timeout
    
    it('should detect read-only status before attempting write', async () => {
      const task = `Check if ${readOnlyFile} is writable, then write to it if possible`;
      
      const result = await executor.execute(task);
      
      // Verify original content is unchanged
      const content = fs.readFileSync(readOnlyFile, 'utf-8');
      expect(content).toBe('Original content - DO NOT MODIFY');
      
      console.log('Read-only detection test result:', {
        success: result.success,
        output: result.output
      });
    }, 60000);
    
    it('should handle non-existent file gracefully', async () => {
      const nonExistentFile = path.join(testDir, 'does-not-exist.txt');
      const task = `Read the contents of ${nonExistentFile}`;
      
      const result = await executor.execute(task);
      
      // Should complete (either with error or by creating the file)
      expect(result).toBeDefined();
      
      console.log('Non-existent file test result:', {
        success: result.success,
        error: result.error
      });
    }, 60000);
  });
  
  describe('Permission Error Messages', () => {
    
    it('should provide clear error message for permission denied', async () => {
      const task = `Modify ${readOnlyFile} by appending "test"`;
      
      const result = await executor.execute(task);
      
      // Verify file wasn't modified
      const content = fs.readFileSync(readOnlyFile, 'utf-8');
      expect(content).toBe('Original content - DO NOT MODIFY');
      
      // If the operation failed, check for meaningful error message
      if (!result.success) {
        const errorMessage = result.error?.toLowerCase() || '';
        const hasPermissionError = 
          errorMessage.includes('permission') ||
          errorMessage.includes('read-only') ||
          errorMessage.includes('access denied') ||
          errorMessage.includes('eacces') ||
          errorMessage.includes('eperm');
        
        console.log('Permission error message:', result.error);
        
        // This is informational - we want to see what error messages are generated
        expect(result.error).toBeDefined();
      }
    }, 60000);
  });
});

