import request from 'supertest';
import { jest } from '@jest/globals';

// Test individual endpoints by making direct HTTP requests to localhost:3000
// This assumes the server is running during tests

const BASE_URL = 'http://localhost:3000';

describe('Live Endpoint Tests', () => {
  let authToken = null;
  let testUser = {
    email: `endpoint-test-${Date.now()}@example.com`,
    password: 'testpassword123',
    displayName: 'Endpoint Test User',
    fitnessLevel: 'intermediate'
  };

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

  describe('Server Status', () => {
    test('Server should be running and accessible', async () => {
      const response = await request(BASE_URL)
        .get('/api/health')
        .timeout(5000);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'healthy');
    }, 10000);
  });

  describe('Authentication Flow', () => {
    test('Create test user account', async () => {
      const response = await request(BASE_URL)
        .post('/api/v2/auth/signup')
        .send(testUser)
        .timeout(10000);

      if (response.status === 201) {
        expect(response.body).toHaveProperty('success', true);
        authToken = response.body.data.session.access_token;
      } else if (response.status === 400 && response.body.message?.includes('already registered')) {
        // User already exists, try to login
        const loginResponse = await request(BASE_URL)
          .post('/api/v2/auth/login')
          .send({
            email: testUser.email,
            password: testUser.password
          });
        
        expect(loginResponse.status).toBe(200);
        authToken = loginResponse.body.data.session.access_token;
      } else {
        throw new Error(`Unexpected signup response: ${response.status} ${JSON.stringify(response.body)}`);
      }

      expect(authToken).toBeTruthy();
    }, 15000);
  });

  describe('WOD Endpoints', () => {
    test('Test endpoint should work', async () => {
      const response = await request(BASE_URL)
        .get('/api/v2/wod/test')
        .set('Authorization', `Bearer ${authToken}`)
        .timeout(10000);

      console.log('Test endpoint response:', response.status, response.body);
      
      if (response.status !== 200) {
        console.error('Test endpoint failed:', {
          status: response.status,
          body: response.body,
          headers: response.headers
        });
      }

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    }, 15000);

    test('Generate workout should work', async () => {
      const workoutRequest = {
        fitnessLevel: 'intermediate',
        goals: ['strength', 'conditioning'],
        availableEquipment: ['dumbbells', 'jump_rope'],
        duration: 900000
      };

      const response = await request(BASE_URL)
        .post('/api/v2/wod/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(workoutRequest)
        .timeout(15000);

      console.log('Generate workout response:', response.status, response.body?.message || response.body?.error);

      if (response.status !== 200) {
        console.error('Generate workout failed:', {
          status: response.status,
          body: response.body,
          request: workoutRequest
        });
      }

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('workout');
    }, 20000);

    test('Explain workout should work', async () => {
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

      const response = await request(BASE_URL)
        .post('/api/v2/wod/explain')
        .set('Authorization', `Bearer ${authToken}`)
        .send(explanationRequest)
        .timeout(15000);

      console.log('Explain workout response:', response.status, response.body?.message || 'Success');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    }, 20000);

    test('Get workout history should work', async () => {
      const response = await request(BASE_URL)
        .get('/api/v2/wod/history?limit=5')
        .set('Authorization', `Bearer ${authToken}`)
        .timeout(10000);

      console.log('Workout history response:', response.status, 'workouts count:', response.body?.data?.workouts?.length || 0);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('workouts');
    }, 15000);
  });

  describe('User Endpoints', () => {
    test('Get user profile should work', async () => {
      const response = await request(BASE_URL)
        .get('/api/v2/user/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .timeout(10000);

      console.log('User profile response:', response.status);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('user');
    }, 15000);

    test('Get subscription info should work', async () => {
      const response = await request(BASE_URL)
        .get('/api/v2/user/subscription')
        .set('Authorization', `Bearer ${authToken}`)
        .timeout(10000);

      console.log('Subscription info response:', response.status, response.body?.data?.plan?.name || 'unknown');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    }, 15000);

    test('Get usage stats should work', async () => {
      const response = await request(BASE_URL)
        .get('/api/v2/user/usage')
        .set('Authorization', `Bearer ${authToken}`)
        .timeout(10000);

      console.log('Usage stats response:', response.status);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    }, 15000);
  });

  describe('Subscription Endpoints', () => {
    test('Get subscription plans should work', async () => {
      const response = await request(BASE_URL)
        .get('/api/v2/subscription/plans')
        .set('Authorization', `Bearer ${authToken}`)
        .timeout(10000);

      console.log('Subscription plans response:', response.status, 'plans count:', response.body?.data?.plans?.length || 0);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('plans');
    }, 15000);
  });

  describe('Error Handling', () => {
    test('Invalid endpoint should return 404', async () => {
      const response = await request(BASE_URL)
        .get('/api/v2/invalid-endpoint')
        .timeout(5000);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', true);
    }, 10000);

    test('Unauthenticated request should return 401', async () => {
      const response = await request(BASE_URL)
        .get('/api/v2/user/profile')
        .timeout(5000);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', true);
    }, 10000);

    test('Invalid workout generation should return 400', async () => {
      const invalidRequest = {
        fitnessLevel: 'invalid',
        goals: [],
        availableEquipment: []
      };

      const response = await request(BASE_URL)
        .post('/api/v2/wod/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidRequest)
        .timeout(10000);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', true);
    }, 15000);
  });

  describe('Premium Features', () => {
    test('Coaching cues endpoint exists', async () => {
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

      const response = await request(BASE_URL)
        .post('/api/v2/wod/coaching-cues')
        .set('Authorization', `Bearer ${authToken}`)
        .send(coachingRequest)
        .timeout(15000);

      console.log('Coaching cues response:', response.status, response.body?.message || 'Success');

      // Should either succeed (pro plan) or return 403 (free plan)
      expect([200, 403]).toContain(response.status);
    }, 20000);

    test('Modifications endpoint exists', async () => {
      const modificationRequest = {
        exercise: {
          name: 'Pull-ups',
          description: 'Strict pull-ups from dead hang'
        },
        userLevel: 'beginner',
        limitations: ['shoulder_injury']
      };

      const response = await request(BASE_URL)
        .post('/api/v2/wod/modifications')
        .set('Authorization', `Bearer ${authToken}`)
        .send(modificationRequest)
        .timeout(15000);

      console.log('Modifications response:', response.status, response.body?.message || 'Success');

      // Should either succeed (pro plan) or return 403 (free plan)
      expect([200, 403]).toContain(response.status);
    }, 20000);
  });
});