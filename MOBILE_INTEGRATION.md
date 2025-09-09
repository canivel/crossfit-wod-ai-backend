# CrossFit WOD AI Backend - Mobile Integration Guide

## Version 2.0.0

This document provides comprehensive integration guidelines for mobile applications connecting to the CrossFit WOD AI Backend API.

## Table of Contents
- [Base Configuration](#base-configuration)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
- [Request/Response Formats](#requestresponse-formats)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Code Examples](#code-examples)
- [Testing](#testing)

---

## Base Configuration

### API Base URLs
```
Development: http://localhost:3000/api/v2
Production: https://your-production-domain.com/api/v2
```

### Required Headers
```json
{
  "Content-Type": "application/json",
  "Accept": "application/json"
}
```

### Authentication Headers
```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```
OR
```json
{
  "X-API-Token": "YOUR_API_TOKEN"
}
```

---

## Authentication

### Authentication Methods

#### 1. JWT Bearer Token (Recommended for Mobile Apps)
- Obtained via login endpoint
- Expires after session timeout
- Requires refresh token for renewal
- Best for user-specific sessions

#### 2. API Token (For Backend Services)
- Available for Pro/Elite plans only
- Long-lived tokens
- Best for server-to-server communication

### Authentication Flow

#### 1. User Registration
```http
POST /api/v2/auth/signup
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123!",
  "displayName": "John Doe",
  "fitnessLevel": "intermediate",
  "goals": ["strength", "conditioning"]
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Account created successfully. Please check your email to verify your account.",
  "data": {
    "user": {
      "id": "uuid-string",
      "email": "user@example.com",
      "emailConfirmed": false
    },
    "session": {
      "accessToken": "jwt-token-string",
      "refreshToken": "refresh-token-string",
      "expiresAt": 1234567890,
      "expiresIn": 3600
    }
  }
}
```

#### 2. User Login
```http
POST /api/v2/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid-string",
      "email": "user@example.com",
      "emailConfirmed": true,
      "metadata": {
        "display_name": "John Doe",
        "fitness_level": "intermediate"
      }
    },
    "subscription": {
      "plan": "free",
      "status": "active",
      "limits": {
        "workouts_per_month": 10,
        "coaching_cues_per_month": 0,
        "modifications_per_month": 5
      }
    },
    "session": {
      "accessToken": "jwt-token-string",
      "refreshToken": "refresh-token-string",
      "expiresAt": 1234567890,
      "expiresIn": 3600
    }
  }
}
```

#### 3. Token Refresh
```http
POST /api/v2/auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "refresh-token-string"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "session": {
      "accessToken": "new-jwt-token",
      "refreshToken": "new-refresh-token",
      "expiresAt": 1234567890,
      "expiresIn": 3600
    },
    "user": {
      "id": "uuid-string",
      "email": "user@example.com"
    }
  }
}
```

#### 4. Logout
```http
POST /api/v2/auth/logout
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

## API Endpoints

### User Management

#### Get User Profile
```http
GET /api/v2/user/profile
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "email": "user@example.com",
    "display_name": "John Doe",
    "fitness_level": "intermediate",
    "crossfit_experience_years": 2,
    "height_cm": 180,
    "weight_kg": 75,
    "date_of_birth": "1990-01-01",
    "goals": ["strength", "conditioning"],
    "medical_conditions": [],
    "preferences": {
      "workout_duration": 30,
      "preferred_equipment": ["barbell", "kettlebell"]
    }
  }
}
```

#### Update User Profile
```http
PUT /api/v2/user/profile
Authorization: Bearer YOUR_JWT_TOKEN
```

**Request Body:**
```json
{
  "displayName": "John Doe",
  "fitnessLevel": "advanced",
  "crossfitExperienceYears": 3,
  "heightCm": 180,
  "weightKg": 75,
  "dateOfBirth": "1990-01-01",
  "goals": ["strength", "muscle_gain"],
  "medicalConditions": ["knee_injury"],
  "preferences": {
    "workoutDuration": 45,
    "preferredEquipment": ["barbell", "dumbbells"]
  }
}
```

#### Get Subscription Details
```http
GET /api/v2/user/subscription
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "success": true,
  "data": {
    "subscription": {
      "plan": {
        "name": "pro",
        "display_name": "Pro Plan",
        "limits": {
          "workouts_per_month": 100,
          "coaching_cues_per_month": 50,
          "modifications_per_month": 50
        }
      },
      "status": "active",
      "currentPeriodEnd": "2024-02-01T00:00:00Z",
      "cancelAtPeriodEnd": false
    },
    "usage": {
      "current": {
        "workouts": 15,
        "coaching": 5,
        "modifications": 3,
        "total": 23
      },
      "limits": {
        "workouts_per_month": 100,
        "coaching_cues_per_month": 50,
        "modifications_per_month": 50
      }
    }
  }
}
```

#### Get Usage Statistics
```http
GET /api/v2/user/usage
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "success": true,
  "data": {
    "period": {
      "start": "2024-01-01T00:00:00Z",
      "end": "2024-01-31T23:59:59Z"
    },
    "usage": {
      "workouts": {
        "used": 5,
        "limit": 10,
        "remaining": 5
      },
      "coachingCues": {
        "used": 0,
        "limit": 0,
        "remaining": 0
      },
      "modifications": {
        "used": 2,
        "limit": 5,
        "remaining": 3
      },
      "total": 7
    }
  }
}
```

### Workout Generation

#### Generate Workout
```http
POST /api/v2/wod/generate
Authorization: Bearer YOUR_JWT_TOKEN
```

**Request Body:**
```json
{
  "fitnessLevel": "intermediate",
  "goals": ["strength", "conditioning"],
  "availableEquipment": ["barbell", "dumbbells", "pull_up_bar", "jump_rope"],
  "duration": 1200000,
  "limitations": ["shoulder_injury"],
  "preferences": {
    "workoutType": "amrap",
    "intensity": "medium"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "workout": {
      "id": "workout-uuid",
      "name": "Thunder Strike",
      "type": "amrap",
      "description": "A balanced AMRAP focusing on strength and conditioning",
      "timeCapMinutes": 20,
      "rounds": null,
      "movements": [
        {
          "exerciseId": "deadlift",
          "exerciseName": "Deadlifts",
          "reps": 10,
          "weight": 135,
          "unit": "lbs",
          "notes": "Keep back straight, drive through heels"
        },
        {
          "exerciseId": "box_jump",
          "exerciseName": "Box Jumps",
          "reps": 15,
          "weight": null,
          "unit": "bodyweight",
          "notes": "24 inch box, step down for safety"
        },
        {
          "exerciseId": "pull_up",
          "exerciseName": "Pull-ups",
          "reps": 10,
          "weight": null,
          "unit": "bodyweight",
          "notes": "Kipping allowed, full extension at bottom"
        }
      ],
      "warmup": [
        "5 min row or bike at easy pace",
        "2 rounds: 10 air squats, 10 push-ups, 10 sit-ups",
        "Dynamic stretching: leg swings, arm circles"
      ],
      "cooldown": [
        "5 min walk",
        "Stretching: hamstrings, shoulders, lats"
      ],
      "instructions": "Complete as many rounds as possible in 20 minutes. Rest as needed but keep moving. Scale weights and movements as necessary.",
      "difficultyScore": 7.5,
      "estimatedDurationMinutes": 20
    },
    "metadata": {
      "generatedAt": "2024-01-15T10:30:00Z",
      "provider": "claude-langchain",
      "version": "2.0.0",
      "requestId": "wod_1705316400000",
      "tokensUsed": 450
    }
  }
}
```

#### Generate Coaching Cues (Pro/Elite Only)
```http
POST /api/v2/wod/coaching-cues
Authorization: Bearer YOUR_JWT_TOKEN
```

**Request Body:**
```json
{
  "workout": {
    "name": "Thunder Strike",
    "type": "amrap",
    "movements": [
      {
        "exerciseId": "deadlift",
        "exerciseName": "Deadlifts",
        "reps": 10,
        "weight": 135,
        "unit": "lbs"
      }
    ]
  },
  "userLevel": "intermediate"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "coachingCues": [
      "Maintain a neutral spine throughout the deadlift movement",
      "Break up the pull-ups early to avoid burnout - consider 5-3-2 rep scheme",
      "Focus on explosive hip drive for box jumps to conserve energy",
      "Breathe consistently - exhale on exertion, inhale on recovery",
      "Pace yourself in the first 5 minutes to maintain intensity throughout"
    ],
    "metadata": {
      "generatedAt": "2024-01-15T10:35:00Z",
      "provider": "claude-langchain",
      "count": 5,
      "userLevel": "intermediate"
    }
  }
}
```

#### Get Workout Explanation
```http
POST /api/v2/wod/explain
Authorization: Bearer YOUR_JWT_TOKEN
```

**Request Body:**
```json
{
  "workout": {
    "name": "Thunder Strike",
    "type": "amrap",
    "movements": [...]
  },
  "userGoals": ["strength", "muscle_gain"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "explanation": "This AMRAP workout combines compound movements to maximize strength development and muscle engagement. The deadlifts target your posterior chain (hamstrings, glutes, and back), building foundational strength. Box jumps add explosive power training while maintaining cardiovascular intensity. Pull-ups complete the workout by targeting your upper body pulling muscles. The 20-minute time cap creates metabolic stress that promotes muscle growth while improving your work capacity. This combination effectively addresses both your strength and muscle gain goals through progressive overload and time under tension.",
    "metadata": {
      "generatedAt": "2024-01-15T10:40:00Z",
      "provider": "claude-langchain",
      "wordCount": 85
    }
  }
}
```

#### Generate Exercise Modifications (Pro/Elite Only)
```http
POST /api/v2/wod/modifications
Authorization: Bearer YOUR_JWT_TOKEN
```

**Request Body:**
```json
{
  "exercise": {
    "name": "Pull-ups",
    "description": "Strict pull-ups from dead hang"
  },
  "userLevel": "beginner",
  "limitations": ["shoulder_injury"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "modifications": {
      "easier": [
        "Ring rows - adjust body angle for difficulty",
        "Banded pull-ups - use resistance bands for assistance",
        "Jumping pull-ups with controlled negative",
        "Lat pulldowns if machine available"
      ],
      "harder": [
        "Weighted pull-ups with vest or belt",
        "Chest-to-bar pull-ups",
        "L-sit pull-ups",
        "Muscle-ups"
      ],
      "equipmentAlternatives": [
        "TRX rows",
        "Dumbbell bent-over rows",
        "Resistance band lat pulls"
      ],
      "injuryModifications": [
        "Isometric holds at top position (if tolerable)",
        "Single-arm dumbbell rows (unaffected side)",
        "Face pulls with light resistance for shoulder rehab",
        "Consult physical therapist before attempting overhead movements"
      ],
      "techniqueTips": [
        "Engage lats by thinking 'pull elbows down'",
        "Keep core tight throughout movement",
        "Full range of motion: arms fully extended at bottom",
        "Avoid swinging or kipping for strict pull-ups"
      ]
    },
    "metadata": {
      "generatedAt": "2024-01-15T10:45:00Z",
      "provider": "claude-langchain",
      "exercise": "Pull-ups",
      "userLevel": "beginner"
    }
  }
}
```

### Workout History

#### Get Workout History
```http
GET /api/v2/user/workout-history?limit=20&offset=0
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "success": true,
  "data": {
    "workouts": [
      {
        "id": "log-uuid",
        "workout_id": "workout-uuid",
        "workout_name": "Thunder Strike",
        "completed_at": "2024-01-14T15:30:00Z",
        "duration_minutes": 22,
        "rounds_completed": 8,
        "notes": "Felt good, scaled pull-ups to banded",
        "performance_rating": 4
      }
    ],
    "pagination": {
      "total": 45,
      "limit": 20,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

#### Log Completed Workout
```http
POST /api/v2/wod/log
Authorization: Bearer YOUR_JWT_TOKEN
```

**Request Body:**
```json
{
  "workoutId": "workout-uuid",
  "completedAt": "2024-01-15T15:30:00Z",
  "durationMinutes": 22,
  "roundsCompleted": 8,
  "notes": "Felt good, scaled pull-ups to banded",
  "performanceRating": 4,
  "modifications": ["Used 115lbs for deadlifts", "Banded pull-ups"]
}
```

### Subscription Management

#### Get Available Plans
```http
GET /api/v2/subscription/plans
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "plan-uuid-free",
      "name": "free",
      "displayName": "Free Plan",
      "description": "Get started with AI-powered workouts",
      "priceMonthly": 0,
      "priceYearly": null,
      "features": [
        "10 AI-generated workouts per month",
        "Basic workout explanations",
        "Workout history tracking"
      ],
      "limits": {
        "workoutsPerMonth": 10,
        "coachingCuesPerMonth": 0,
        "modificationsPerMonth": 5
      },
      "isCurrentPlan": true,
      "recommended": false
    },
    {
      "id": "plan-uuid-pro",
      "name": "pro",
      "displayName": "Pro Plan",
      "description": "Unlock advanced features and coaching",
      "priceMonthly": 19.99,
      "priceYearly": 199.99,
      "features": [
        "100 AI-generated workouts per month",
        "AI coaching cues and tips",
        "Exercise modifications and scaling",
        "API token access",
        "Priority support"
      ],
      "limits": {
        "workoutsPerMonth": 100,
        "coachingCuesPerMonth": 50,
        "modificationsPerMonth": 50
      },
      "isCurrentPlan": false,
      "recommended": true
    }
  ]
}
```

#### Upgrade Subscription
```http
POST /api/v2/subscription/upgrade
Authorization: Bearer YOUR_JWT_TOKEN
```

**Request Body:**
```json
{
  "planId": "plan-uuid-pro",
  "billingPeriod": "monthly",
  "paymentMethodId": "pm_stripe_method_id"
}
```

### API Token Management (Pro/Elite Only)

#### List API Tokens
```http
GET /api/v2/user/api-tokens
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "token-uuid",
      "name": "Mobile App Token",
      "description": "Token for iOS app",
      "lastUsedAt": "2024-01-15T08:00:00Z",
      "createdAt": "2024-01-01T10:00:00Z",
      "isActive": true
    }
  ]
}
```

#### Create API Token
```http
POST /api/v2/user/api-tokens
Authorization: Bearer YOUR_JWT_TOKEN
```

**Request Body:**
```json
{
  "name": "Mobile App Token",
  "description": "Token for iOS app integration",
  "expiresIn": 90
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "API token created successfully. Store this token securely - it will not be shown again.",
  "data": {
    "id": "token-uuid",
    "name": "Mobile App Token",
    "description": "Token for iOS app integration",
    "token": "wod_api_token_abc123xyz789_secret",
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

---

## Request/Response Formats

### Standard Success Response
```json
{
  "success": true,
  "message": "Optional success message",
  "data": {
    // Response data object
  },
  "metadata": {
    // Optional metadata
  }
}
```

### Standard Error Response
```json
{
  "error": true,
  "message": "Human-readable error message",
  "statusCode": 400,
  "details": "Additional error details",
  "timestamp": "2024-01-15T10:00:00Z",
  "path": "/api/v2/endpoint"
}
```

### Pagination Format
```json
{
  "data": [],
  "pagination": {
    "total": 100,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Insufficient permissions/plan |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

### Common Error Scenarios

#### Authentication Errors
```json
{
  "error": true,
  "message": "Authentication required",
  "statusCode": 401,
  "details": "Please provide a valid authentication token"
}
```

#### Validation Errors
```json
{
  "error": true,
  "message": "Validation failed",
  "statusCode": 400,
  "details": [
    {
      "message": "\"fitnessLevel\" is required",
      "path": ["fitnessLevel"],
      "type": "any.required"
    }
  ]
}
```

#### Rate Limit Errors
```json
{
  "error": true,
  "message": "Usage limit exceeded",
  "statusCode": 429,
  "details": "Monthly limit of 10 workouts reached. Upgrade to Pro for more."
}
```

#### Subscription Required
```json
{
  "error": true,
  "message": "Subscription upgrade required",
  "statusCode": 403,
  "details": "This feature requires Pro or Elite plan"
}
```

---

## Rate Limiting

### Limits by Subscription Tier

| Feature | Free | Pro | Elite |
|---------|------|-----|-------|
| Workouts/month | 10 | 100 | Unlimited |
| Coaching Cues/month | 0 | 50 | Unlimited |
| Modifications/month | 5 | 50 | Unlimited |
| API Tokens | 0 | 3 | 10 |
| Rate Limit (req/min) | 10 | 60 | 120 |

### Rate Limit Headers
Response headers include rate limit information:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1705316460
```

---

## Code Examples

### Swift (iOS)

#### Authentication Manager
```swift
import Foundation

class AuthManager {
    static let shared = AuthManager()
    private let baseURL = "https://api.crossfitwod.ai/api/v2"
    
    private var accessToken: String?
    private var refreshToken: String?
    
    func login(email: String, password: String) async throws -> User {
        let url = URL(string: "\(baseURL)/auth/login")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body = ["email": email, "password": password]
        request.httpBody = try JSONEncoder().encode(body)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw APIError.authenticationFailed
        }
        
        let loginResponse = try JSONDecoder().decode(LoginResponse.self, from: data)
        
        self.accessToken = loginResponse.data.session.accessToken
        self.refreshToken = loginResponse.data.session.refreshToken
        
        return loginResponse.data.user
    }
    
    func getAuthenticatedRequest(for endpoint: String) -> URLRequest {
        let url = URL(string: "\(baseURL)\(endpoint)")!
        var request = URLRequest(url: url)
        request.setValue("Bearer \(accessToken ?? "")", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        return request
    }
}
```

#### Workout Service
```swift
class WorkoutService {
    static let shared = WorkoutService()
    
    func generateWorkout(params: WorkoutParams) async throws -> Workout {
        var request = AuthManager.shared.getAuthenticatedRequest(for: "/wod/generate")
        request.httpMethod = "POST"
        request.httpBody = try JSONEncoder().encode(params)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        
        switch httpResponse.statusCode {
        case 200:
            let response = try JSONDecoder().decode(WorkoutResponse.self, from: data)
            return response.data.workout
        case 429:
            throw APIError.rateLimitExceeded
        case 401:
            // Try to refresh token
            try await AuthManager.shared.refreshAccessToken()
            return try await generateWorkout(params: params)
        default:
            throw APIError.requestFailed(statusCode: httpResponse.statusCode)
        }
    }
}
```

### Kotlin (Android)

#### Retrofit Service Definition
```kotlin
interface CrossFitWodApi {
    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>
    
    @POST("auth/refresh")
    suspend fun refreshToken(@Body request: RefreshRequest): Response<TokenResponse>
    
    @POST("wod/generate")
    suspend fun generateWorkout(
        @Header("Authorization") token: String,
        @Body request: WorkoutRequest
    ): Response<WorkoutResponse>
    
    @GET("user/profile")
    suspend fun getUserProfile(
        @Header("Authorization") token: String
    ): Response<UserProfileResponse>
    
    @PUT("user/profile")
    suspend fun updateProfile(
        @Header("Authorization") token: String,
        @Body request: UpdateProfileRequest
    ): Response<ApiResponse>
}
```

#### Repository Implementation
```kotlin
class WorkoutRepository(
    private val api: CrossFitWodApi,
    private val authManager: AuthManager
) {
    suspend fun generateWorkout(
        fitnessLevel: String,
        goals: List<String>,
        equipment: List<String>,
        duration: Long? = null
    ): Result<Workout> {
        return try {
            val token = authManager.getAccessToken() ?: return Result.failure(
                Exception("Not authenticated")
            )
            
            val request = WorkoutRequest(
                fitnessLevel = fitnessLevel,
                goals = goals,
                availableEquipment = equipment,
                duration = duration
            )
            
            val response = api.generateWorkout("Bearer $token", request)
            
            when {
                response.isSuccessful -> {
                    response.body()?.let {
                        Result.success(it.data.workout)
                    } ?: Result.failure(Exception("Empty response"))
                }
                response.code() == 401 -> {
                    // Try to refresh token
                    authManager.refreshToken()
                    generateWorkout(fitnessLevel, goals, equipment, duration)
                }
                response.code() == 429 -> {
                    Result.failure(RateLimitException("Usage limit exceeded"))
                }
                else -> {
                    Result.failure(
                        ApiException(response.code(), response.message())
                    )
                }
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
```

### React Native

#### API Client
```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

class ApiClient {
  constructor() {
    this.baseURL = 'https://api.crossfitwod.ai/api/v2';
  }

  async getHeaders() {
    const token = await AsyncStorage.getItem('accessToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : undefined,
    };
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = await this.getHeaders();
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        await this.refreshToken();
        return this.request(endpoint, options);
      }
      throw new Error(data.message || 'Request failed');
    }

    return data;
  }

  async login(email, password) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    await AsyncStorage.setItem('accessToken', response.data.session.accessToken);
    await AsyncStorage.setItem('refreshToken', response.data.session.refreshToken);
    
    return response.data.user;
  }

  async generateWorkout(params) {
    return this.request('/wod/generate', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async refreshToken() {
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    if (!refreshToken) throw new Error('No refresh token');

    const response = await this.request('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });

    await AsyncStorage.setItem('accessToken', response.data.session.accessToken);
    await AsyncStorage.setItem('refreshToken', response.data.session.refreshToken);
  }
}

export default new ApiClient();
```

#### Usage Hook
```javascript
import { useState, useCallback } from 'react';
import apiClient from './apiClient';

export function useWorkoutGenerator() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [workout, setWorkout] = useState(null);

  const generateWorkout = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.generateWorkout(params);
      setWorkout(response.data.workout);
      return response.data.workout;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    generateWorkout,
    workout,
    loading,
    error,
  };
}
```

---

## Testing

### Test Credentials (Development Only)
```json
{
  "email": "test@example.com",
  "password": "TestPassword123!"
}
```

### Test Endpoint
```http
GET /api/v2/wod/test
Authorization: Bearer YOUR_JWT_TOKEN
```

This endpoint generates a sample workout to verify integration.

### Postman Collection
Import the following collection for testing:
```json
{
  "info": {
    "name": "CrossFit WOD API v2",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "auth": {
    "type": "bearer",
    "bearer": [
      {
        "key": "token",
        "value": "{{access_token}}",
        "type": "string"
      }
    ]
  },
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:3000/api/v2"
    },
    {
      "key": "access_token",
      "value": ""
    }
  ]
}
```

### cURL Examples

#### Login
```bash
curl -X POST https://api.crossfitwod.ai/api/v2/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

#### Generate Workout
```bash
curl -X POST https://api.crossfitwod.ai/api/v2/wod/generate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fitnessLevel": "intermediate",
    "goals": ["strength", "conditioning"],
    "availableEquipment": ["barbell", "dumbbells"],
    "duration": 1200000
  }'
```

---

## Support

For API support and questions:
- Email: support@crossfitwod.ai
- Documentation: https://docs.crossfitwod.ai
- Status Page: https://status.crossfitwod.ai

## Version History

- **v2.0.0** (Current) - LangChain integration, Supabase auth, subscription tiers
- **v1.0.0** - Initial release with basic workout generation

---

Last Updated: January 2024