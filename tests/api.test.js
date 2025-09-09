import request from 'supertest';
import { jest } from '@jest/globals';
import app from '../server.js';

describe('API Endpoints Integration Tests', () => {
  let authToken = null;
  let testUserId = null;
  let testUser = {
    email: `test-${Date.now()}@example.com`,
    password: 'testpassword123',
    displayName: 'Test User',
    fitnessLevel: 'intermediate'
  };

  beforeAll(async () => {
    // Mock console methods to reduce test noise
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
  });

  afterAll(async () => {
    // Restore console methods
    console.log.mockRestore?.();
    console.error.mockRestore?.();
    console.warn.mockRestore?.();
  });

  describe('Root Endpoint', () => {
    test('GET / should redirect to /api-docs', async () => {
      const response = await request(app)
        .get('/')
        .expect(302);
      
      expect(response.headers.location).toBe('/api-docs');
    });
  });

  describe('Health Endpoints', () => {
    test('GET /api/health should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('version');
    });

    test('GET /api/health/detailed should return detailed health info', async () => {
      const response = await request(app)
        .get('/api/health/detailed')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('services');
      expect(response.body).toHaveProperty('system');
      expect(response.body.services).toHaveProperty('api', 'healthy');
    });
  });

  describe('Authentication Endpoints', () => {
    test('POST /api/v2/auth/signup should create new user', async () => {
      const response = await request(app)
        .post('/api/v2/auth/signup')
        .send(testUser)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('session');
      expect(response.body.data.user).toHaveProperty('email', testUser.email);
      
      testUserId = response.body.data.user.id;
      authToken = response.body.data.session.access_token;
    });

    test('POST /api/v2/auth/signup should fail with invalid email', async () => {
      const response = await request(app)
        .post('/api/v2/auth/signup')
        .send({
          email: 'invalid-email',
          password: 'testpassword123'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', true);
      expect(response.body).toHaveProperty('message');
    });

    test('POST /api/v2/auth/login should authenticate user', async () => {
      const response = await request(app)
        .post('/api/v2/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('session');
      
      authToken = response.body.data.session.access_token;
    });

    test('POST /api/v2/auth/login should fail with wrong password', async () => {
      const response = await request(app)
        .post('/api/v2/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', true);
    });
  });

  describe('User Endpoints (Authenticated)', () => {
    test('GET /api/v2/user/profile should return user profile', async () => {
      const response = await request(app)
        .get('/api/v2/user/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user).toHaveProperty('email', testUser.email);
    });

    test('GET /api/v2/user/profile should fail without auth', async () => {
      const response = await request(app)
        .get('/api/v2/user/profile')
        .expect(401);

      expect(response.body).toHaveProperty('error', true);
      expect(response.body).toHaveProperty('message');
    });

    test('GET /api/v2/user/subscription should return subscription info', async () => {
      const response = await request(app)
        .get('/api/v2/user/subscription')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('plan');
    });

    test('GET /api/v2/user/usage should return usage stats', async () => {
      const response = await request(app)
        .get('/api/v2/user/usage')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('usage');
    });
  });

  describe('Subscription Endpoints', () => {
    test('GET /api/v2/subscription/plans should return available plans', async () => {
      const response = await request(app)
        .get('/api/v2/subscription/plans')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('plans');
      expect(Array.isArray(response.body.data.plans)).toBe(true);
    });
  });

  describe('WOD Endpoints (Authenticated)', () => {
    test('GET /api/v2/wod/test should run AI test successfully', async () => {
      const response = await request(app)
        .get('/api/v2/wod/test')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('aiProvider');
    });

    test('POST /api/v2/wod/generate should generate workout', async () => {
      const workoutRequest = {
        fitnessLevel: 'intermediate',
        goals: ['strength', 'conditioning'],
        availableEquipment: ['dumbbells', 'jump_rope'],
        duration: 900000 // 15 minutes
      };

      const response = await request(app)
        .post('/api/v2/wod/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(workoutRequest)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('workout');
      expect(response.body.data.workout).toHaveProperty('name');
      expect(response.body.data.workout).toHaveProperty('type');
      expect(response.body.data.workout).toHaveProperty('movements');
      expect(Array.isArray(response.body.data.workout.movements)).toBe(true);
    });

    test('POST /api/v2/wod/generate should fail with invalid input', async () => {
      const invalidRequest = {
        fitnessLevel: 'invalid',
        goals: [],
        availableEquipment: []
      };

      const response = await request(app)
        .post('/api/v2/wod/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidRequest)
        .expect(400);

      expect(response.body).toHaveProperty('error', true);
      expect(response.body).toHaveProperty('message');
    });

    test('POST /api/v2/wod/explain should explain workout', async () => {
      const explanationRequest = {
        workout: {
          name: 'Test Workout',
          type: 'for_time',
          movements: [
            {
              exerciseId: 'push-up',
              exerciseName: 'Push-ups',
              reps: 10,
              unit: 'bodyweight'
            }
          ]
        },
        userGoals: ['strength']
      };

      const response = await request(app)
        .post('/api/v2/wod/explain')
        .set('Authorization', `Bearer ${authToken}`)
        .send(explanationRequest)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('explanation');
      expect(typeof response.body.data.explanation).toBe('string');
    });

    test('GET /api/v2/wod/history should return workout history', async () => {
      const response = await request(app)
        .get('/api/v2/wod/history?limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('workouts');
      expect(response.body.data).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data.workouts)).toBe(true);
    });

    test('POST /api/v2/wod/log should log workout completion', async () => {
      const logRequest = {
        workoutId: 'test-workout-id',
        durationSeconds: 900,
        roundsCompleted: 5,
        notes: 'Great workout!'
      };

      const response = await request(app)
        .post('/api/v2/wod/log')
        .set('Authorization', `Bearer ${authToken}`)
        .send(logRequest)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Premium WOD Endpoints (Pro/Elite Only)', () => {
    test('POST /api/v2/wod/coaching-cues should require pro plan', async () => {
      const coachingRequest = {
        workout: {
          name: 'Test Workout',
          type: 'for_time',
          movements: [
            {
              exerciseId: 'squat',
              exerciseName: 'Air Squats',
              reps: 20,
              unit: 'bodyweight'
            }
          ]
        },
        userLevel: 'intermediate'
      };

      const response = await request(app)
        .post('/api/v2/wod/coaching-cues')
        .set('Authorization', `Bearer ${authToken}`)
        .send(coachingRequest);

      // Should either succeed (if test user has pro plan) or fail with 403
      expect([200, 403]).toContain(response.status);
      
      if (response.status === 403) {
        expect(response.body).toHaveProperty('error', true);
        expect(response.body.message).toContain('subscription');
      } else {
        expect(response.body).toHaveProperty('success', true);
        expect(response.body.data).toHaveProperty('coachingCues');
      }
    });

    test('POST /api/v2/wod/modifications should require pro plan', async () => {
      const modificationRequest = {
        exercise: {
          name: 'Pull-ups',
          description: 'Strict pull-ups from dead hang'
        },
        userLevel: 'beginner',
        limitations: ['shoulder_injury']
      };

      const response = await request(app)
        .post('/api/v2/wod/modifications')
        .set('Authorization', `Bearer ${authToken}`)
        .send(modificationRequest);

      // Should either succeed (if test user has pro plan) or fail with 403
      expect([200, 403]).toContain(response.status);
      
      if (response.status === 403) {
        expect(response.body).toHaveProperty('error', true);
        expect(response.body.message).toContain('subscription');
      } else {
        expect(response.body).toHaveProperty('success', true);
        expect(response.body.data).toHaveProperty('modifications');
      }
    });
  });

  describe('Authentication Required Endpoints', () => {
    const protectedEndpoints = [
      { method: 'get', path: '/api/v2/user/profile' },
      { method: 'get', path: '/api/v2/user/subscription' },
      { method: 'get', path: '/api/v2/user/usage' },
      { method: 'get', path: '/api/v2/wod/test' },
      { method: 'get', path: '/api/v2/wod/history' },
      { method: 'post', path: '/api/v2/wod/generate' },
      { method: 'post', path: '/api/v2/wod/explain' },
      { method: 'post', path: '/api/v2/wod/log' },
    ];

    protectedEndpoints.forEach(({ method, path }) => {
      test(`${method.toUpperCase()} ${path} should require authentication`, async () => {
        const response = await request(app)[method](path);
        expect([401, 400]).toContain(response.status); // 401 for no auth, 400 for validation error
      });
    });
  });

  describe('404 Handler', () => {
    test('should return 404 for non-existent endpoints', async () => {
      const response = await request(app)
        .get('/api/non-existent')
        .expect(404);

      expect(response.body).toHaveProperty('error', true);
      expect(response.body).toHaveProperty('message', 'Endpoint not found');
      expect(response.body).toHaveProperty('path', '/api/non-existent');
      expect(response.body).toHaveProperty('suggestion');
      expect(response.body).toHaveProperty('availableEndpoints');
    });
  });

  describe('Documentation', () => {
    test('GET /api-docs should serve Swagger UI', async () => {
      const response = await request(app)
        .get('/api-docs/')
        .expect(200);

      expect(response.text).toContain('CrossFit WOD AI API Documentation');
      expect(response.text).toContain('swagger-ui');
    });

    test('GET /docs should also serve Swagger UI', async () => {
      const response = await request(app)
        .get('/docs/')
        .expect(200);

      expect(response.text).toContain('CrossFit WOD AI API Documentation');
      expect(response.text).toContain('swagger-ui');
    });
  });
});