import request from 'supertest';
import { jest } from '@jest/globals';

// Mock the server startup to avoid port conflicts during testing
const mockApp = {
  get: jest.fn(),
  use: jest.fn(),
  listen: jest.fn(),
};

describe('Health Endpoints', () => {
  beforeAll(() => {
    // Mock console methods to reduce test noise
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterAll(() => {
    // Restore console methods
    console.log.mockRestore();
    console.error.mockRestore();
  });

  test('should have basic health check endpoint', async () => {
    const response = await request('http://localhost:3000')
      .get('/api/health')
      .expect(200);

    expect(response.body).toHaveProperty('status', 'healthy');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('uptime');
    expect(response.body).toHaveProperty('version');
    expect(response.body).toHaveProperty('environment');
  });

  test('should have detailed health check endpoint', async () => {
    const response = await request('http://localhost:3000')
      .get('/api/health/detailed')
      .expect(200);

    expect(response.body).toHaveProperty('status', 'healthy');
    expect(response.body).toHaveProperty('services');
    expect(response.body).toHaveProperty('system');
    expect(response.body.services).toHaveProperty('api', 'healthy');
    expect(response.body.services).toHaveProperty('ai_providers');
  });

  test('should have swagger documentation endpoint', async () => {
    const response = await request('http://localhost:3000')
      .get('/api-docs/')
      .expect(200);

    expect(response.text).toContain('CrossFit WOD AI API Documentation');
    expect(response.text).toContain('swagger-ui');
  });
});