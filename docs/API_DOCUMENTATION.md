# CrossFit WOD AI Backend - API Documentation

## Overview

The CrossFit WOD AI Backend is a secure REST API service that provides AI-powered workout generation and coaching services. It integrates with multiple AI providers (Claude, OpenAI, Gemini) to deliver personalized CrossFit workouts, coaching cues, and exercise modifications.

## Base URL

- **Development**: `http://localhost:3000`
- **Production**: `https://your-production-domain.com`

## Authentication

All API endpoints (except health checks) require authentication via one of the following methods:

### API Key Authentication
Include the API key in the request headers:
```
X-API-Key: your_api_secret_key_here
```

### JWT Token Authentication (Future)
Include the JWT token in the Authorization header:
```
Authorization: Bearer your_jwt_token_here
```

## Rate Limiting

- **Window**: 15 minutes
- **Limit**: 100 requests per IP address
- **Headers**: Rate limit information is included in response headers

## Common Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "metadata": {
    "generatedAt": "2024-01-01T00:00:00.000Z",
    "provider": "claude|openai|gemini",
    "requestId": "unique_request_id"
  }
}
```

### Error Response
```json
{
  "error": true,
  "message": "Human readable error message",
  "statusCode": 400,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/v1/wod/generate",
  "details": "Additional error details (optional)"
}
```

## API Endpoints

### Health Check Endpoints

#### GET /api/health
Basic health check endpoint (no authentication required).

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "version": "1.0.0",
  "environment": "development"
}
```

#### GET /api/health/detailed
Detailed health check including AI provider status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "services": {
    "api": "healthy",
    "ai_providers": {
      "claude": "configured",
      "openai": "configured", 
      "gemini": "configured"
    }
  },
  "system": {
    "memory": { "rss": 45678912, "heapTotal": 32768 },
    "platform": "darwin",
    "nodeVersion": "v18.17.0"
  }
}
```

### WOD Generation Endpoints

#### POST /api/v1/wod/generate
Generate a personalized CrossFit workout.

**Request Body:**
```json
{
  "userId": "user_123",
  "fitnessLevel": "beginner|intermediate|advanced",
  "goals": ["strength", "conditioning", "weight_loss", "muscle_gain"],
  "availableEquipment": ["dumbbells", "kettlebells", "barbell", "pull_up_bar"],
  "duration": 900000,
  "limitations": ["knee_injury", "back_pain"],
  "preferences": {
    "workoutType": "amrap|for_time|emom|strength",
    "intensity": "low|medium|high"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "workout": {
      "name": "Strength Builder AMRAP",
      "type": "amrap",
      "description": "20 minute AMRAP focusing on strength movements",
      "timeCapMinutes": 20,
      "rounds": null,
      "movements": [
        {
          "exerciseId": "air_squat",
          "exerciseName": "Air Squat",
          "reps": 15,
          "weight": null,
          "unit": "bodyweight",
          "notes": "Full depth, chest up"
        },
        {
          "exerciseId": "push_up",
          "exerciseName": "Push-up",
          "reps": 10,
          "weight": null,
          "unit": "bodyweight",
          "notes": "Chest to floor"
        }
      ],
      "instructions": "Complete as many rounds as possible in 20 minutes",
      "difficultyScore": 6.5,
      "estimatedDurationMinutes": 20
    },
    "metadata": {
      "generatedAt": "2024-01-01T00:00:00.000Z",
      "provider": "claude",
      "requestId": "wod_1704067200000"
    }
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid request parameters
- `429 Too Many Requests`: Rate limit exceeded
- `503 Service Unavailable`: AI services unavailable

#### POST /api/v1/wod/coaching-cues
Generate coaching cues for a specific workout.

**Request Body:**
```json
{
  "workout": {
    "name": "Test AMRAP",
    "type": "amrap",
    "movements": [
      {
        "exerciseName": "Air Squat",
        "reps": 15
      }
    ]
  },
  "userLevel": "beginner"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "coachingCues": [
      "Start at a sustainable pace - don't go out too hot",
      "Focus on full range of motion in the air squats",
      "Breathe consistently throughout the workout",
      "Take short breaks if needed to maintain form"
    ],
    "metadata": {
      "generatedAt": "2024-01-01T00:00:00.000Z",
      "provider": "claude",
      "count": 4
    }
  }
}
```

#### POST /api/v1/wod/explain
Generate an explanation for why a workout was designed a certain way.

**Request Body:**
```json
{
  "workout": {
    "name": "Strength Focus",
    "type": "strength",
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
    "explanation": "This strength-focused workout is designed to build raw power and muscle mass through compound movements. The rep scheme and rest periods are optimized for strength gains while supporting your muscle building goals.",
    "metadata": {
      "generatedAt": "2024-01-01T00:00:00.000Z",
      "provider": "openai",
      "wordCount": 34
    }
  }
}
```

#### POST /api/v1/wod/modifications
Generate exercise modifications and scaling options.

**Request Body:**
```json
{
  "exercise": {
    "name": "Pull-up",
    "description": "Dead hang pull-up to chin over bar"
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
        "Assisted pull-ups with band",
        "Ring rows",
        "Jumping pull-ups"
      ],
      "harder": [
        "Weighted pull-ups",
        "Chest-to-bar pull-ups",
        "L-sit pull-ups"
      ],
      "equipment_alternatives": [
        "Lat pulldown machine",
        "Resistance band pull-aparts",
        "Inverted rows"
      ],
      "injury_modifications": [
        "Avoid overhead movements",
        "Focus on horizontal pulling",
        "Consult physical therapist"
      ]
    },
    "metadata": {
      "generatedAt": "2024-01-01T00:00:00.000Z",
      "provider": "gemini",
      "exercise": "Pull-up"
    }
  }
}
```

#### GET /api/v1/wod/test
Test endpoint to verify AI integration is working.

**Response:**
```json
{
  "success": true,
  "message": "WOD API test completed successfully",
  "data": {
    "testRequest": {
      "userId": "test-user",
      "fitnessLevel": "intermediate",
      "goals": ["strength", "conditioning"],
      "availableEquipment": ["dumbbells", "jump_rope"],
      "duration": 900000
    },
    "aiProvider": "claude",
    "responseLength": 1234,
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

## Error Codes

| Status Code | Description | Solution |
|-------------|-------------|----------|
| 400 | Bad Request | Check request format and required fields |
| 401 | Unauthorized | Provide valid API key or JWT token |
| 429 | Rate Limited | Reduce request frequency, try again later |
| 500 | Internal Server Error | Check server logs, contact support |
| 503 | Service Unavailable | AI providers temporarily unavailable |

## AI Provider Fallback Strategy

The system uses multiple AI providers with intelligent fallback:

1. **Primary**: Claude (Anthropic) - Best for workout programming
2. **Secondary**: OpenAI GPT-4 - Good for explanations and coaching
3. **Tertiary**: Gemini - Specialized for modifications and alternatives

If one provider fails, the system automatically attempts the next in line.

## Request/Response Examples

### Complete WOD Generation Flow

1. **Generate Workout**
```bash
curl -X POST http://localhost:3000/api/v1/wod/generate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key" \
  -d '{
    "userId": "user_123",
    "fitnessLevel": "intermediate", 
    "goals": ["strength", "conditioning"],
    "availableEquipment": ["barbell", "dumbbells"],
    "duration": 1200000
  }'
```

2. **Get Coaching Cues**
```bash
curl -X POST http://localhost:3000/api/v1/wod/coaching-cues \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key" \
  -d '{
    "workout": { /* workout object from step 1 */ },
    "userLevel": "intermediate"
  }'
```

3. **Get Explanation**
```bash
curl -X POST http://localhost:3000/api/v1/wod/explain \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key" \
  -d '{
    "workout": { /* workout object */ },
    "userGoals": ["strength", "conditioning"]
  }'
```

## SDK Integration (Flutter)

The Flutter app uses the `AIBackendService` class to communicate with this API:

```dart
final aiService = AIBackendService();

// Generate workout
final wod = await aiService.generateWorkout(request);

// Get coaching cues
final cues = await aiService.generateCoachingCues(workout.toMap());

// Check health
final health = await aiService.checkHealth();
```

## Development Setup

1. **Install Dependencies**
```bash
cd crossfit-wod-ai-backend
npm install
```

2. **Environment Configuration**
```bash
cp .env.example .env
# Edit .env with your API keys
```

3. **Start Development Server**
```bash
npm run dev
```

4. **Test API Health**
```bash
curl http://localhost:3000/api/health
```

## Production Deployment

### Environment Variables Required
- `ANTHROPIC_API_KEY`: Claude API key
- `OPENAI_API_KEY`: OpenAI API key  
- `GEMINI_API_KEY`: Google Gemini API key
- `JWT_SECRET`: Secret for JWT token signing
- `API_SECRET_KEY`: API key for client authentication
- `ALLOWED_ORIGINS`: CORS allowed origins

### Deployment Platforms
- **Railway**: `railway up`
- **Render**: Connect GitHub repository
- **AWS Lambda**: Use Serverless framework
- **Digital Ocean**: Docker deployment

## Security Best Practices

1. **API Keys**: Never expose API keys in client code
2. **Rate Limiting**: Implemented per IP address
3. **CORS**: Configured for specific origins only
4. **Helmet**: Security headers included
5. **Input Validation**: All inputs validated with Joi
6. **Error Handling**: Secure error messages (no internal details exposed)

## Support & Troubleshooting

### Common Issues

**"AI service unavailable"**
- Check API keys are valid
- Verify internet connectivity
- Try different AI provider

**"Rate limit exceeded"** 
- Reduce request frequency
- Implement client-side caching
- Consider upgrading API limits

**"Authentication failed"**
- Verify API key in request headers
- Check key format and spelling
- Ensure key has proper permissions

### Logs
All requests and errors are logged with timestamps and request IDs for troubleshooting.

### Contact
- GitHub Issues: [Repository Issues](https://github.com/your-repo/issues)
- Email: support@your-domain.com

---

**Last Updated**: January 2024  
**API Version**: 1.0.0