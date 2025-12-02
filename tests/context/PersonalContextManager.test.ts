/**
 * Tests for Personal Context Manager
 */

import { PersonalContextManager } from '../../src/context/PersonalContextManager.js';
import { DEFAULT_USER_CONTEXT } from '../../src/context/schemas/UserContext.js';
import fs from 'fs/promises';
import path from 'path';

describe('PersonalContextManager', () => {
  let manager: PersonalContextManager;
  const testContextPath = './data/test-user-context';

  beforeEach(() => {
    manager = new PersonalContextManager(testContextPath);
  });

  afterEach(async () => {
    // Clean up test files
    try {
      await fs.rm(testContextPath, { recursive: true, force: true });
    } catch (error) {
      // Ignore errors
    }
  });

  describe('load', () => {
    it('should create default context if file does not exist', async () => {
      const context = await manager.load();
      expect(context).toBeDefined();
      expect(context.version).toBe(DEFAULT_USER_CONTEXT.version);
    });

    it('should load existing context from file', async () => {
      // Create a context file first
      await manager.save(DEFAULT_USER_CONTEXT);

      // Create new manager and load
      const newManager = new PersonalContextManager(testContextPath);
      const context = await newManager.load();

      expect(context.preferences.codingStyle.language).toBe('TypeScript');
    });
  });

  describe('save', () => {
    it('should save context to file', async () => {
      await manager.save(DEFAULT_USER_CONTEXT);

      const filePath = path.join(testContextPath, 'context.json');
      const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
      expect(fileExists).toBe(true);
    });

    it('should update lastUpdated timestamp', async () => {
      const context = { ...DEFAULT_USER_CONTEXT };
      const oldTimestamp = context.lastUpdated;

      // Wait a bit to ensure timestamp changes
      await new Promise(resolve => setTimeout(resolve, 10));

      await manager.save(context);
      const savedContext = manager.getContext();

      expect(savedContext?.lastUpdated).not.toBe(oldTimestamp);
    });
  });

  describe('getRelevantContext', () => {
    beforeEach(async () => {
      await manager.load();
    });

    it('should return coding style for code-related queries', () => {
      const context = manager.getRelevantContext('build a React component');
      expect(context).toContain('TypeScript');
      expect(context).toContain('Node.js');
    });

    it('should return project context', () => {
      const context = manager.getRelevantContext('what is the current project?');
      expect(context).toContain('Builder App');
    });

    it('should return relevant knowledge', () => {
      const context = manager.getRelevantContext('local-first ai strategy');
      expect(context).toContain('local-first-ai');
    });

    it('should return quality standards for implementation queries', () => {
      const context = manager.getRelevantContext('implement a new feature');
      expect(context).toContain('Quality Standards');
    });
  });

  describe('updatePreferences', () => {
    it('should update user preferences', async () => {
      await manager.load();

      await manager.updatePreferences({
        communicationStyle: 'detailed'
      });

      const context = manager.getContext();
      expect(context?.preferences.communicationStyle).toBe('detailed');
    });
  });

  describe('addProject', () => {
    it('should add a new project', async () => {
      await manager.load();

      await manager.addProject({
        name: 'Test Project',
        techStack: ['React', 'TypeScript'],
        currentPhase: 'Development',
        requirements: ['Build UI', 'Add tests']
      });

      const context = manager.getContext();
      expect(context?.projects.length).toBeGreaterThan(1);
      expect(context?.projects.some(p => p.name === 'Test Project')).toBe(true);
    });
  });

  describe('addKnowledge', () => {
    it('should add domain knowledge', async () => {
      await manager.load();

      await manager.addKnowledge({
        domain: 'testing',
        content: 'Use Jest for unit testing',
        tags: ['testing', 'jest']
      });

      const context = manager.getContext();
      expect(context?.knowledge.some(k => k.domain === 'testing')).toBe(true);
    });

    it('should set lastUpdated timestamp', async () => {
      await manager.load();

      await manager.addKnowledge({
        domain: 'testing',
        content: 'Use Jest for unit testing'
      });

      const context = manager.getContext();
      const knowledge = context?.knowledge.find(k => k.domain === 'testing');
      expect(knowledge?.lastUpdated).toBeDefined();
    });
  });

  describe('addHistory', () => {
    it('should add conversation history', async () => {
      await manager.load();

      await manager.addHistory({
        date: '2025-11-25',
        learnings: ['Implemented Pack 11'],
        decisions: ['Use Letta for memory']
      });

      const context = manager.getContext();
      expect(context?.history.length).toBeGreaterThan(1);
    });
  });

  describe('getFullContext', () => {
    it('should return formatted full context', async () => {
      await manager.load();

      const fullContext = manager.getFullContext();
      expect(fullContext).toContain('User Preferences');
      expect(fullContext).toContain('Active Projects');
      expect(fullContext).toContain('Domain Knowledge');
    });
  });
});

