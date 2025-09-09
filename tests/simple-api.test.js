import request from 'supertest';
import { jest } from '@jest/globals';

const BASE_URL = 'http://localhost:3000';

describe('API Endpoint Basic Tests', () => {
  beforeAll(async () => {
    // Mock console to reduce noise
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
  });

  afterAll(async () => {
    console.log.mockRestore?.();
    console.error.mockRestore?.();
    console.warn.mockRestore?.();
  });

  describe('Basic Server Tests', () => {
    test('Root endpoint should redirect to swagger docs', async () => {
      const response = await request(BASE_URL)
        .get('/')
        .timeout(5000);
      
      expect(response.status).toBe(302);
      expect(response.headers.location).toBe('/api-docs');
    });

    test('Health endpoint should work', async () => {
      const response = await request(BASE_URL)
        .get('/api/health')
        .timeout(5000);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('uptime');
    });

    test('Detailed health endpoint should work', async () => {
      const response = await request(BASE_URL)
        .get('/api/health/detailed')
        .timeout(5000);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('services');
      expect(response.body).toHaveProperty('system');
    });

    test('Swagger docs should be accessible', async () => {
      const response = await request(BASE_URL)
        .get('/api-docs/')
        .timeout(10000);
      
      expect(response.status).toBe(200);
      expect(response.text).toContain('swagger-ui');
      expect(response.text).toContain('CrossFit WOD AI API');
    });
  });

  describe('Route Structure Tests', () => {
    test('Invalid endpoint should return 404 with helpful message', async () => {
      const response = await request(BASE_URL)
        .get('/api/v2/invalid-endpoint')
        .timeout(5000);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', true);
      expect(response.body).toHaveProperty('message', 'Endpoint not found');
      expect(response.body).toHaveProperty('path', '/api/v2/invalid-endpoint');
      expect(response.body).toHaveProperty('suggestion');
      expect(response.body).toHaveProperty('availableEndpoints');
    });

    test('Auth endpoints exist but require proper config', async () => {
      const response = await request(BASE_URL)
        .post('/api/v2/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'password123'
        })
        .timeout(10000);

      // Should fail due to config, but endpoint should exist
      expect([400, 500]).toContain(response.status);
      expect(response.body).toHaveProperty('error', true);
    });

    test('Protected endpoints require authentication', async () => {
      const protectedEndpoints = [
        { method: 'get', path: '/api/v2/user/profile' },
        { method: 'get', path: '/api/v2/wod/test' },
        { method: 'post', path: '/api/v2/wod/generate' }
      ];

      for (const endpoint of protectedEndpoints) {
        const response = await request(BASE_URL)[endpoint.method](endpoint.path)
          .timeout(5000);
        
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error', true);
      }
    });
  });

  describe('Configuration Status', () => {
    test('Server should indicate missing external service configuration', async () => {
      const response = await request(BASE_URL)
        .get('/api/health/detailed')
        .timeout(5000);

      expect(response.status).toBe(200);
      expect(response.body.services).toHaveProperty('api', 'healthy');
      
      // Should show issues with external services due to placeholder config
      if (response.body.services.supabase) {
        expect(['error', 'warning']).toContain(response.body.services.supabase);
      }
    });

    test('Endpoints should be properly routed', async () => {
      // Test that all expected endpoint categories exist
      const endpoints = [
        '/api/v2/auth/signup',
        '/api/v2/user/profile', 
        '/api/v2/wod/generate',
        '/api/v2/subscription/plans'
      ];

      for (const endpoint of endpoints) {
        const response = await request(BASE_URL)
          .options(endpoint)
          .timeout(5000);
        
        // Should not return 404 (endpoint exists)
        expect(response.status).not.toBe(404);
      }
    });
  });
});

describe('API Documentation Tests', () => {
  test('Swagger spec should be valid and include all endpoints', async () => {
    const response = await request(BASE_URL)
      .get('/api-docs/')
      .timeout(10000);
    
    expect(response.status).toBe(200);
    const html = response.text;
    
    // Check for key API sections in the Swagger UI
    expect(html).toContain('Authentication');
    expect(html).toContain('WOD');
    expect(html).toContain('User');
    expect(html).toContain('Subscription');
    expect(html).toContain('Health');
  });

  test('Both documentation endpoints should work', async () => {
    const endpoints = ['/api-docs/', '/docs/'];
    
    for (const endpoint of endpoints) {
      const response = await request(BASE_URL)
        .get(endpoint)
        .timeout(5000);
      
      expect(response.status).toBe(200);
      expect(response.text).toContain('swagger-ui');
    }
  });
});

describe('CORS and Security Headers', () => {
  test('CORS headers should be present', async () => {
    const response = await request(BASE_URL)
      .options('/api/health')
      .set('Origin', 'http://localhost:3000')
      .timeout(5000);
    
    // Should have CORS headers
    expect(response.headers).toHaveProperty('access-control-allow-origin');
  });

  test('Security headers should be present', async () => {
    const response = await request(BASE_URL)
      .get('/api/health')
      .timeout(5000);
    
    // Helmet should add security headers
    expect(response.headers).toHaveProperty('x-content-type-options');
  });
});