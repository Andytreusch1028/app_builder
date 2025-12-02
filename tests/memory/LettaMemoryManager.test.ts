/**
 * Tests for Letta Memory Manager
 */

import { MemoryBlockManager, MemoryBlock } from '../../src/memory/MemoryBlock.js';

describe('MemoryBlockManager', () => {
  let manager: MemoryBlockManager;

  beforeEach(() => {
    manager = new MemoryBlockManager();
  });

  describe('create', () => {
    it('should create a new memory block', () => {
      const block = manager.create({
        label: 'test',
        value: 'test value',
        description: 'test description'
      });

      expect(block.id).toBeDefined();
      expect(block.label).toBe('test');
      expect(block.value).toBe('test value');
      expect(block.description).toBe('test description');
      expect(block.createdAt).toBeDefined();
      expect(block.updatedAt).toBeDefined();
    });

    it('should add block to in-context hierarchy', () => {
      const block = manager.create({
        label: 'test',
        value: 'test value'
      });

      const hierarchy = manager.getHierarchy();
      expect(hierarchy.inContext).toContainEqual(block);
      expect(hierarchy.outOfContext).not.toContainEqual(block);
    });
  });

  describe('update', () => {
    it('should update an existing memory block', async () => {
      const block = manager.create({
        label: 'test',
        value: 'original value'
      });

      // Wait a bit to ensure timestamp changes
      await new Promise(resolve => setTimeout(resolve, 10));

      const updated = manager.update(block.id, {
        value: 'updated value'
      });

      expect(updated.value).toBe('updated value');
      expect(updated.updatedAt?.getTime()).toBeGreaterThan(block.updatedAt?.getTime() || 0);
    });

    it('should throw error for non-existent block', () => {
      expect(() => {
        manager.update('non-existent-id', { value: 'test' });
      }).toThrow('Memory block non-existent-id not found');
    });
  });

  describe('search', () => {
    beforeEach(() => {
      manager.create({
        label: 'coding',
        value: 'TypeScript is a typed superset of JavaScript'
      });
      manager.create({
        label: 'project',
        value: 'Building a local-first AI application'
      });
      manager.create({
        label: 'preferences',
        value: 'User prefers concise responses'
      });
    });

    it('should find blocks by value match', () => {
      const results = manager.search('TypeScript');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].block.label).toBe('coding');
    });

    it('should find blocks by label match', () => {
      const results = manager.search('project');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].block.label).toBe('project');
    });

    it('should return empty array for no matches', () => {
      const results = manager.search('nonexistent');
      expect(results).toEqual([]);
    });

    it('should limit results', () => {
      const results = manager.search('a', 2);
      expect(results.length).toBeLessThanOrEqual(2);
    });

    it('should sort by relevance', () => {
      const results = manager.search('local');
      expect(results[0].relevanceScore).toBeGreaterThan(0);
    });
  });

  describe('archive and restore', () => {
    it('should move block to out-of-context', () => {
      const block = manager.create({
        label: 'test',
        value: 'test value'
      });

      manager.archive(block.id);

      const hierarchy = manager.getHierarchy();
      expect(hierarchy.inContext).not.toContainEqual(block);
      expect(hierarchy.outOfContext).toContainEqual(block);
    });

    it('should restore block to in-context', () => {
      const block = manager.create({
        label: 'test',
        value: 'test value'
      });

      manager.archive(block.id);
      manager.restore(block.id);

      const hierarchy = manager.getHierarchy();
      expect(hierarchy.inContext).toContainEqual(block);
      expect(hierarchy.outOfContext).not.toContainEqual(block);
    });
  });

  describe('clear', () => {
    it('should clear all memory blocks', () => {
      manager.create({ label: 'test1', value: 'value1' });
      manager.create({ label: 'test2', value: 'value2' });

      manager.clear();

      expect(manager.getAll()).toEqual([]);
      const hierarchy = manager.getHierarchy();
      expect(hierarchy.inContext).toEqual([]);
      expect(hierarchy.outOfContext).toEqual([]);
    });
  });
});

