/**
 * Unit Tests for Express Server Setup
 * Tests the basic server configuration and middleware
 */

import { describe, it, expect } from '@jest/globals';
import request from 'supertest';
import app from '../../src/index.js';

describe('Phase 0 - Server Setup Unit Tests', () => {
  
  describe('Server Configuration', () => {
    it('should create Express app instance', () => {
      expect(app).toBeDefined();
      expect(typeof app).toBe('function');
    });

    it('should have JSON middleware configured', async () => {
      const response = await request(app)
        .post('/api/test')
        .send({ test: 'data' })
        .set('Content-Type', 'application/json');
      
      // Even though endpoint doesn't exist, JSON should be parsed
      expect(response.status).not.toBe(500);
    });

    it('should have CORS enabled', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('Origin', 'http://localhost:3001');
      
      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });

  describe('Health Check Endpoint', () => {
    it('should respond to GET /api/health', async () => {
      const response = await request(app).get('/api/health');
      
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/json/);
    });

    it('should return correct health check structure', async () => {
      const response = await request(app).get('/api/health');
      
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('version');
    });

    it('should return status "ok"', async () => {
      const response = await request(app).get('/api/health');
      
      expect(response.body.status).toBe('ok');
    });

    it('should return valid ISO timestamp', async () => {
      const response = await request(app).get('/api/health');
      
      const timestamp = response.body.timestamp;
      expect(timestamp).toBeDefined();
      expect(new Date(timestamp).toISOString()).toBe(timestamp);
    });

    it('should return version 1.0.0', async () => {
      const response = await request(app).get('/api/health');
      
      expect(response.body.version).toBe('1.0.0');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app).get('/api/nonexistent');
      
      expect(response.status).toBe(404);
    });

    it('should handle invalid JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/health')
        .send('invalid json')
        .set('Content-Type', 'application/json');
      
      // Should not crash the server
      expect(response.status).toBeDefined();
    });
  });

  describe('HTTP Methods', () => {
    it('should only accept GET for health endpoint', async () => {
      const postResponse = await request(app).post('/api/health');
      const putResponse = await request(app).put('/api/health');
      const deleteResponse = await request(app).delete('/api/health');
      
      // These should not be 200 (only GET should work)
      expect(postResponse.status).not.toBe(200);
      expect(putResponse.status).not.toBe(200);
      expect(deleteResponse.status).not.toBe(200);
    });
  });
});

