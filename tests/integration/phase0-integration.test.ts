/**
 * Integration Tests for Phase 0 Setup
 * Tests the complete server setup and configuration
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../src/index.js';
import fs from 'fs';
import path from 'path';

describe('Phase 0 - Integration Tests', () => {
  
  describe('Project Structure', () => {
    it('should have all required source directories', () => {
      const requiredDirs = [
        'src/api',
        'src/services',
        'src/providers',
        'src/middleware',
        'src/types',
        'src/config',
        'src/utils'
      ];

      requiredDirs.forEach(dir => {
        const dirPath = path.join(process.cwd(), dir);
        expect(fs.existsSync(dirPath)).toBe(true);
      });
    });

    it('should have all required test directories', () => {
      const requiredDirs = [
        'tests/unit',
        'tests/integration',
        'tests/api',
        'tests/e2e',
        'tests/performance',
        'tests/security'
      ];

      requiredDirs.forEach(dir => {
        const dirPath = path.join(process.cwd(), dir);
        expect(fs.existsSync(dirPath)).toBe(true);
      });
    });

    it('should have data directories', () => {
      const requiredDirs = ['data/memory', 'models', 'logs'];

      requiredDirs.forEach(dir => {
        const dirPath = path.join(process.cwd(), dir);
        expect(fs.existsSync(dirPath)).toBe(true);
      });
    });

    it('should have configuration files', () => {
      const requiredFiles = [
        'package.json',
        'tsconfig.json',
        'jest.config.js',
        '.env.example',
        '.gitignore'
      ];

      requiredFiles.forEach(file => {
        const filePath = path.join(process.cwd(), file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });
  });

  describe('TypeScript Configuration', () => {
    it('should have valid tsconfig.json', () => {
      const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
      const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));

      expect(tsconfig.compilerOptions).toBeDefined();
      expect(tsconfig.compilerOptions.target).toBe('ES2022');
      expect(tsconfig.compilerOptions.module).toBe('ES2022');
      expect(tsconfig.compilerOptions.strict).toBe(true);
    });

    it('should compile TypeScript successfully', () => {
      const distPath = path.join(process.cwd(), 'dist');
      expect(fs.existsSync(distPath)).toBe(true);
      
      const indexPath = path.join(distPath, 'index.js');
      expect(fs.existsSync(indexPath)).toBe(true);
    });
  });

  describe('Package Configuration', () => {
    it('should have ES module type', () => {
      const packagePath = path.join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));

      expect(packageJson.type).toBe('module');
    });

    it('should have required dependencies', () => {
      const packagePath = path.join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));

      const requiredDeps = ['express', 'typescript', 'cors', 'dotenv'];
      requiredDeps.forEach(dep => {
        expect(packageJson.dependencies).toHaveProperty(dep);
      });
    });

    it('should have required dev dependencies', () => {
      const packagePath = path.join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));

      const requiredDevDeps = ['jest', 'ts-jest', 'supertest'];
      requiredDevDeps.forEach(dep => {
        expect(packageJson.devDependencies).toHaveProperty(dep);
      });
    });

    it('should have required npm scripts', () => {
      const packagePath = path.join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));

      const requiredScripts = ['build', 'dev', 'start', 'test', 'test:coverage'];
      requiredScripts.forEach(script => {
        expect(packageJson.scripts).toHaveProperty(script);
      });
    });
  });

  describe('Server Integration', () => {
    it('should start server and respond to requests', async () => {
      const response = await request(app).get('/api/health');
      
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
    });

    it('should handle multiple concurrent requests', async () => {
      const requests = Array(10).fill(null).map(() => 
        request(app).get('/api/health')
      );

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('ok');
      });
    });

    it('should maintain consistent response format', async () => {
      const response1 = await request(app).get('/api/health');
      const response2 = await request(app).get('/api/health');

      expect(Object.keys(response1.body).sort()).toEqual(
        Object.keys(response2.body).sort()
      );
    });
  });
});

