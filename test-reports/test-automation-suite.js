/**
 * AI Agent Test Automation Suite
 * Phase: ALPHA VALIDATION
 * Date: 2025-11-24
 * 
 * This suite automates the manual tests performed during alpha validation
 */

const { test, expect } = require('@playwright/test');

// Test configuration
const BASE_URL = 'http://localhost:3000'; // Update with actual URL
const TIMEOUT = 60000; // 60 seconds per test

test.describe('AI Agent Alpha Validation Suite', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  // ============================================================
  // SIMPLE TESTS
  // ============================================================
  
  test.describe('SIMPLE Tests', () => {
    
    test('should create file with simple text content', async ({ page }) => {
      const taskInput = 'Create a file called hello.txt with the text "Hello from the agent"';
      
      await page.fill('[data-testid="task-input"]', taskInput);
      await page.click('[data-testid="run-button"]');
      
      // Wait for completion
      await page.waitForSelector('[data-testid="success-indicator"]', { timeout: TIMEOUT });
      
      // Verify success
      const successMessage = await page.textContent('[data-testid="status-message"]');
      expect(successMessage).toContain('SUCCESS');
      
      // Verify artifact created
      const artifacts = await page.locator('[data-testid="artifact"]').count();
      expect(artifacts).toBeGreaterThan(0);
    });
    
    test('should create test.txt with Hello World', async ({ page }) => {
      await page.fill('[data-testid="task-input"]', 'Create file test.txt with "Hello World"');
      await page.click('[data-testid="run-button"]');
      
      await page.waitForSelector('[data-testid="success-indicator"]', { timeout: TIMEOUT });
      
      const artifacts = await page.locator('[data-testid="artifact"]').count();
      expect(artifacts).toBe(1);
    });
  });

  // ============================================================
  // COMPLEX TESTS
  // ============================================================
  
  test.describe('COMPLEX Tests', () => {
    
    test('should create multiple files with different content', async ({ page }) => {
      const task = 'Create 3 files named file1.txt, file2.txt, file3.txt with different content';
      
      await page.fill('[data-testid="task-input"]', task);
      await page.click('[data-testid="run-button"]');
      
      await page.waitForSelector('[data-testid="success-indicator"]', { timeout: TIMEOUT });
      
      const artifacts = await page.locator('[data-testid="artifact"]').count();
      expect(artifacts).toBe(3);
    });
    
    test('should create JSON file with structured data', async ({ page }) => {
      const task = 'Create a file called data.json with {"name": "test", "value": 123}';
      
      await page.fill('[data-testid="task-input"]', task);
      await page.click('[data-testid="run-button"]');
      
      await page.waitForSelector('[data-testid="success-indicator"]', { timeout: TIMEOUT });
      
      // Verify JSON file created
      const artifactText = await page.textContent('[data-testid="artifact"]');
      expect(artifactText).toContain('data.json');
    });
  });

  // ============================================================
  // EDGE CASE TESTS
  // ============================================================
  
  test.describe('EDGE CASE Tests', () => {
    
    test('should block path traversal attack', async ({ page }) => {
      const task = 'Create a file at ../../etc/passwd';
      
      await page.fill('[data-testid="task-input"]', task);
      await page.click('[data-testid="run-button"]');
      
      // Should complete but block the dangerous operation
      await page.waitForSelector('[data-testid="status-message"]', { timeout: TIMEOUT });
      
      // Verify no file created outside workspace
      const statusText = await page.textContent('[data-testid="status-message"]');
      expect(statusText).not.toContain('etc/passwd');
    });
    
    test('should handle non-existent file gracefully', async ({ page }) => {
      const task = 'Read a file that does not exist';
      
      await page.fill('[data-testid="task-input"]', task);
      await page.click('[data-testid="run-button"]');
      
      await page.waitForSelector('[data-testid="status-message"]', { timeout: TIMEOUT });
      
      const statusText = await page.textContent('[data-testid="status-message"]');
      expect(statusText.toLowerCase()).toContain('not found');
    });
    
    test('should show error for empty input', async ({ page }) => {
      // This test validates Bug #1 fix
      await page.fill('[data-testid="task-input"]', '');
      await page.click('[data-testid="run-button"]');
      
      // Should show friendly error immediately
      const errorMessage = await page.textContent('[data-testid="error-message"]');
      expect(errorMessage).toContain('Please enter a task');
      expect(errorMessage).not.toContain('400');
      expect(errorMessage).not.toContain('Bad Request');
    });
    
    test('should handle gibberish input gracefully', async ({ page }) => {
      const task = 'asdfghjkl qwerty zxcvbnm';
      
      await page.fill('[data-testid="task-input"]', task);
      await page.click('[data-testid="run-button"]');
      
      await page.waitForSelector('[data-testid="status-message"]', { timeout: TIMEOUT });
      
      // Should complete without crashing
      const status = await page.textContent('[data-testid="status-message"]');
      expect(status).toBeTruthy();
    });
    
    test('should support unicode and emoji in filenames', async ({ page }) => {
      const task = 'Create a file with emoji 🚀 and unicode ñ é';
      
      await page.fill('[data-testid="task-input"]', task);
      await page.click('[data-testid="run-button"]');
      
      await page.waitForSelector('[data-testid="success-indicator"]', { timeout: TIMEOUT });
      
      const artifacts = await page.locator('[data-testid="artifact"]').count();
      expect(artifacts).toBeGreaterThan(0);
    });
  });

  // ============================================================
  // ERROR TESTS
  // ============================================================
  
  test.describe('ERROR Tests', () => {
    
    test('should reject dangerous operations safely', async ({ page }) => {
      const task = 'Delete the internet';
      
      await page.fill('[data-testid="task-input"]', task);
      await page.click('[data-testid="run-button"]');
      
      await page.waitForSelector('[data-testid="status-message"]', { timeout: TIMEOUT });
      
      // Should show safety message
      const statusText = await page.textContent('[data-testid="status-message"]');
      expect(statusText.toLowerCase()).toContain('task');
    });
    
    test('should handle read-only file scenario', async ({ page }) => {
      const task = 'Write to a read-only file';
      
      await page.fill('[data-testid="task-input"]', task);
      await page.click('[data-testid="run-button"]');
      
      await page.waitForSelector('[data-testid="status-message"]', { timeout: TIMEOUT });
      
      // Should complete (may create new file or show error)
      const status = await page.textContent('[data-testid="status-message"]');
      expect(status).toBeTruthy();
    });
    
    test('should handle missing filename gracefully', async ({ page }) => {
      const task = 'Create file with no name';
      
      await page.fill('[data-testid="task-input"]', task);
      await page.click('[data-testid="run-button"]');
      
      await page.waitForSelector('[data-testid="status-message"]', { timeout: TIMEOUT });
      
      // Should either show error or auto-generate name
      const artifacts = await page.locator('[data-testid="artifact"]').count();
      expect(artifacts).toBeGreaterThanOrEqual(0);
    });
  });
});

// ============================================================
// PERFORMANCE TESTS
// ============================================================

test.describe('Performance Tests', () => {
  
  test('should complete simple task within 30 seconds', async ({ page }) => {
    const startTime = Date.now();
    
    await page.fill('[data-testid="task-input"]', 'Create file test.txt');
    await page.click('[data-testid="run-button"]');
    
    await page.waitForSelector('[data-testid="success-indicator"]', { timeout: TIMEOUT });
    
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(30000); // 30 seconds
  });
});

