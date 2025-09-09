# CrossFit WOD AI Backend - Project Summary

## Quick Reference

This backend serves the CrossFit WOD AI Flutter mobile application with secure AI-powered workout generation capabilities.

### Key Information
- **Technology**: Node.js + Express.js
- **AI Providers**: Claude (Primary), OpenAI (Secondary), Gemini (Tertiary)
- **Authentication**: API Key via `X-API-Key` header
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Base URL**: `http://localhost:3000` (dev), `https://your-domain.com` (prod)

### Flutter Project Location
- **Path**: `../crossfit-wod-ai/` (sibling directory)
- **Flutter Docs**: `../crossfit-wod-ai/docs/`
- **Integration Guide**: `../crossfit-wod-ai/docs/BACKEND_API_REFERENCE.md`

## Core API Endpoints

### WOD Generation
```bash
POST /api/v1/wod/generate
Content-Type: application/json  
X-API-Key: your_api_key

{
  "userId": "user_123",
  "fitnessLevel": "intermediate", 
  "goals": ["strength", "conditioning"],
  "availableEquipment": ["dumbbells", "kettlebells"],
  "duration": 900000
}
```

### Coaching Cues
```bash
POST /api/v1/wod/coaching-cues
X-API-Key: your_api_key

{
  "workout": { /* workout object */ },
  "userLevel": "intermediate"
}
```

### Health Check
```bash
GET /api/health/detailed
# No auth required
```

## Flutter Integration Points

### Expected Flutter Data Models
```dart
// Flutter sends this format
class WodGenerationRequest {
  final String userId;
  final String fitnessLevel; // 'beginner'|'intermediate'|'advanced'
  final List<String> goals;
  final List<String> availableEquipment;
  final int? duration; // milliseconds
}

// Flutter expects this response
class GeneratedWod {
  final WorkoutModel workout;
  final String explanation;
  final List<String> coachingCues;
  final double difficultyScore;
  final Duration estimatedDuration;
  final DateTime generatedAt;
}
```

### Flutter Service Integration
The Flutter app uses `AIBackendService` to communicate with this backend:

```dart
// In Flutter app: lib/core/services/ai_backend_service.dart
final response = await http.post(
  Uri.parse('$baseUrl/api/v1/wod/generate'),
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': apiKey,
  },
  body: jsonEncode(request.toJson()),
);
```

## AI Provider Strategy

### Provider Hierarchy
1. **Claude (Anthropic)** - Primary for WOD generation and coaching
2. **OpenAI GPT-4** - Secondary for explanations and alternative generation  
3. **Google Gemini** - Tertiary for exercise modifications and scaling

### Fallback Logic
```javascript
// Backend tries providers in order
async callAI(prompt, useCase = 'WOD_GENERATION') {
  const providers = ['claude', 'openai', 'gemini'];
  
  for (const provider of providers) {
    try {
      return await this.providers[provider](prompt);
    } catch (error) {
      continue; // Try next provider
    }
  }
  
  throw new Error('All AI providers failed');
}
```

## Environment Configuration

### Required Environment Variables
```bash
# AI Provider API Keys
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AI...

# Security
API_SECRET_KEY=your_flutter_app_key
JWT_SECRET=your_jwt_secret

# Server
PORT=3000
NODE_ENV=development

# CORS
ALLOWED_ORIGINS=http://localhost:8080,https://yourdomain.com
```

### Development Setup
```bash
# Clone and setup
git clone <repo>
cd crossfit-wod-ai-backend
npm install
cp .env.example .env
# Edit .env with your API keys

# Start development server
npm run dev

# Test health
curl http://localhost:3000/api/health
```

## Error Handling

### HTTP Status Codes
- `200` - Success
- `400` - Bad Request (validation failed)
- `401` - Unauthorized (missing/invalid API key)
- `429` - Rate Limit Exceeded
- `503` - Service Unavailable (AI providers down)
- `500` - Internal Server Error

### Error Response Format
```json
{
  "error": true,
  "message": "Human readable error message",
  "statusCode": 400,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/v1/wod/generate",
  "details": "Additional context (optional)"
}
```

### Flutter Error Handling
The Flutter app should handle these error patterns:
```dart
if (response.statusCode == 429) {
  // Rate limited - implement backoff
  throw RateLimitException();
} else if (response.statusCode == 503) {
  // Service unavailable - use fallback
  return await localWodGenerator.generate(request);
}
```

## Security Features

### Authentication
- API key authentication via `X-API-Key` header
- JWT support ready for future user authentication
- Environment-based key validation

### Rate Limiting
- 100 requests per 15-minute window per IP address
- Configurable limits via environment variables
- Proper HTTP 429 responses with retry headers

### Input Validation
- Joi schema validation for all requests
- Sanitization of user inputs
- Length limits and format validation

### Security Headers
- Helmet.js for security headers
- CORS configured for specific origins
- Request logging for security monitoring

## Performance Features

### AI Provider Optimization
- Intelligent provider selection based on use case
- Automatic failover between providers
- Request timeout handling (30s)
- Response caching potential

### Resource Management
- Connection pooling ready
- Memory usage monitoring
- Graceful shutdown handling
- Request/response logging

## Testing

### Test Structure
```
tests/
├── unit/
│   ├── services/
│   ├── middleware/
│   └── utils/
├── integration/
│   └── api/
└── mocks/
    └── ai-providers.js
```

### Running Tests
```bash
npm test                 # All tests
npm run test:unit       # Unit tests only
npm run test:integration # Integration tests
npm run test:watch      # Watch mode
```

## Deployment Options

### Railway (Recommended)
```bash
railway up
# Set environment variables in Railway dashboard
```

### Render
1. Connect GitHub repository
2. Set environment variables
3. Deploy automatically on push

### Docker
```bash
docker build -t crossfit-backend .
docker run -p 3000:3000 --env-file .env crossfit-backend
```

### AWS Lambda
Use Serverless framework with `serverless.yml`

## Monitoring

### Health Endpoints
- `GET /api/health` - Basic status
- `GET /api/health/detailed` - Full system status
- `GET /api/health/ready` - Kubernetes readiness probe
- `GET /api/health/live` - Kubernetes liveness probe

### Logging
All requests and errors logged with:
- Timestamp
- Request ID
- Response time
- Error details
- User agent (Flutter identification)

### Metrics to Monitor
- Request rate and response times
- AI provider success/failure rates
- Error rates by endpoint
- Memory and CPU usage

## Development Workflow

### Adding New Features
1. Update API documentation
2. Implement backend endpoint
3. Update Flutter integration docs
4. Test with Flutter app
5. Deploy and verify

### Code Style
- ESLint for JavaScript linting
- Prettier for code formatting
- Joi for request validation
- JSDoc comments for functions

### Git Workflow
- Feature branches from `main`
- Pull requests required
- Tests must pass
- Documentation updates required

## Troubleshooting

### Common Issues

**"All AI providers failed"**
- Check API keys are valid
- Verify internet connectivity  
- Check provider status pages

**"Authentication required"**  
- Verify `X-API-Key` header included
- Check API key matches environment

**"Rate limit exceeded"**
- Implement exponential backoff in Flutter
- Consider caching responses
- Review rate limit settings

### Debug Mode
Set `NODE_ENV=development` for:
- Detailed error messages
- Stack traces in responses
- Request/response logging
- AI provider debug info

### Health Check Debugging
```bash
# Check basic health
curl http://localhost:3000/api/health

# Check detailed status  
curl http://localhost:3000/api/health/detailed

# Test AI integration
curl -X GET http://localhost:3000/api/v1/wod/test \
  -H "X-API-Key: your_api_key"
```

## Flutter App Dependencies

### When Flutter Changes Affect Backend
- **Data Models**: Update request/response validation schemas
- **New Features**: Add corresponding API endpoints
- **Authentication**: Update auth middleware as needed
- **Error Handling**: Ensure consistent error responses

### Flutter Integration Files to Monitor
- `../crossfit-wod-ai/lib/core/services/ai_backend_service.dart`
- `../crossfit-wod-ai/lib/core/models/*.dart`
- `../crossfit-wod-ai/pubspec.yaml` (dependency changes)

## Future Enhancements

### Planned Features
- [ ] User authentication with JWT
- [ ] Redis caching layer
- [ ] WebSocket support for real-time updates
- [ ] Batch request processing
- [ ] GraphQL API option
- [ ] Advanced analytics and metrics

### Scalability Considerations
- Database integration (PostgreSQL/MongoDB)
- Load balancing for multiple instances
- CDN for static assets
- Advanced caching strategies
- Message queue for async processing

---

**Repository**: `crossfit-wod-ai-backend/`  
**Flutter App**: `../crossfit-wod-ai/`  
**Last Updated**: January 2024  
**Version**: 1.0.0