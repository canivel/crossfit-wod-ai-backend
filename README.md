# CrossFit WOD AI Backend

A secure, AI-powered backend service for generating personalized CrossFit workouts, coaching cues, and exercise modifications. This service integrates with multiple AI providers (Claude, OpenAI, Gemini) to deliver intelligent fitness programming while protecting API keys from client exposure.

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Flutter App   │───▶│  Backend API     │───▶│  AI Providers   │
│                 │    │                  │    │                 │
│ • UI/UX Layer   │    │ • Authentication │    │ • Claude        │
│ • State Mgmt    │    │ • Rate Limiting  │    │ • OpenAI        │
│ • HTTP Client   │    │ • Request Valid  │    │ • Gemini        │
└─────────────────┘    │ • AI Integration │    └─────────────────┘
                       │ • Error Handling │    
                       └──────────────────┘    
```

## 🚀 Features

- **Multi-AI Provider Integration**: Claude, OpenAI, and Gemini with intelligent fallback
- **Secure API Key Management**: All API keys protected server-side
- **Personalized Workouts**: AI-generated WODs based on user fitness level, goals, and equipment
- **Coaching Intelligence**: Dynamic coaching cues and workout explanations
- **Exercise Modifications**: Automatic scaling and alternatives for different abilities
- **Rate Limiting & Security**: Built-in protection against abuse
- **Health Monitoring**: Comprehensive health checks and monitoring
- **Fallback Systems**: Graceful degradation when AI services are unavailable

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **AI SDKs**: 
  - Anthropic Claude SDK
  - OpenAI SDK  
  - Google Generative AI SDK
- **Security**: Helmet, CORS, Rate Limiting, JWT
- **Validation**: Joi
- **HTTP Client**: Axios
- **Environment**: dotenv

## 📋 Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn
- API keys for AI providers:
  - [Anthropic Claude API key](https://console.anthropic.com/)
  - [OpenAI API key](https://platform.openai.com/api-keys)
  - [Google Gemini API key](https://makersuite.google.com/app/apikey)

## 🔧 Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd crossfit-wod-ai-backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment setup**
```bash
cp .env.example .env
```

4. **Configure environment variables**
Edit `.env` file with your API keys:
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# AI Provider API Keys
ANTHROPIC_API_KEY=your_claude_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here

# Security
JWT_SECRET=your_jwt_secret_here
API_SECRET_KEY=your_api_secret_key_here

# CORS Origins (comma separated)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080
```

5. **Start development server**
```bash
npm run dev
```

6. **Verify installation**
```bash
curl http://localhost:3000/api/health
```

## 🧪 Testing

### Health Check
```bash
curl http://localhost:3000/api/health/detailed
```

### API Test
```bash
curl -X GET http://localhost:3000/api/v1/wod/test \
  -H "X-API-Key: your_api_secret_key_here"
```

### Generate Sample Workout
```bash
curl -X POST http://localhost:3000/api/v1/wod/generate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_secret_key_here" \
  -d '{
    "userId": "test-user",
    "fitnessLevel": "intermediate",
    "goals": ["strength", "conditioning"],
    "availableEquipment": ["dumbbells", "kettlebells"],
    "duration": 900000
  }'
```

## 📚 API Documentation

Comprehensive API documentation is available at `/docs/API_DOCUMENTATION.md` or visit `http://localhost:3000/docs` when running the server.

### Key Endpoints

- `GET /api/health` - Basic health check
- `POST /api/v1/wod/generate` - Generate personalized workout
- `POST /api/v1/wod/coaching-cues` - Get coaching cues for workout
- `POST /api/v1/wod/explain` - Get workout explanation
- `POST /api/v1/wod/modifications` - Get exercise modifications

## 🔒 Security

### Authentication
API uses API key authentication via `X-API-Key` header:
```bash
curl -H "X-API-Key: your_secret_key" http://localhost:3000/api/v1/wod/generate
```

### Rate Limiting
- **Window**: 15 minutes
- **Limit**: 100 requests per IP
- **Response**: HTTP 429 when exceeded

### Security Headers
- Helmet.js for security headers
- CORS configured for specific origins
- Input validation with Joi schemas

## 🌐 Deployment

### Railway (Recommended)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway up
```

### Render
1. Connect GitHub repository to Render
2. Set environment variables in Render dashboard
3. Deploy automatically on git push

### Docker
```bash
# Build image
docker build -t crossfit-wod-ai-backend .

# Run container
docker run -p 3000:3000 --env-file .env crossfit-wod-ai-backend
```

### Environment Variables for Production
```env
NODE_ENV=production
PORT=3000
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AI...
JWT_SECRET=your-production-jwt-secret
API_SECRET_KEY=your-production-api-key
ALLOWED_ORIGINS=https://yourdomain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🔧 Development

### Project Structure
```
crossfit-wod-ai-backend/
├── src/
│   ├── config/         # Configuration files
│   ├── controllers/    # Request handlers (future)
│   ├── middleware/     # Express middleware
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   └── utils/          # Utility functions
├── docs/               # Documentation
├── tests/              # Test files
├── .env.example        # Environment template
├── server.js           # Main server file
└── package.json        # Dependencies
```

### Adding New AI Providers

1. **Add SDK dependency**
```bash
npm install new-ai-provider-sdk
```

2. **Update configuration** (`src/config/ai.js`)
```javascript
export const AI_PROVIDERS = {
  CLAUDE: 'claude',
  OPENAI: 'openai',
  GEMINI: 'gemini',
  NEW_PROVIDER: 'new_provider'  // Add here
};
```

3. **Implement client method** (`src/services/aiService.js`)
```javascript
async callNewProvider(prompt, context = {}) {
  // Implementation
}
```

### Running Tests
```bash
npm test
```

### Linting
```bash
npm run lint
```

## 📊 Monitoring

### Health Endpoints
- `/api/health` - Basic health check
- `/api/health/detailed` - Detailed system status
- `/api/health/ready` - Readiness probe
- `/api/health/live` - Liveness probe

### Logging
All requests and errors are logged with:
- Timestamp
- Request ID
- User agent
- Response time
- Error details

## 🤝 Flutter Integration

The Flutter app communicates with this backend using the `AIBackendService`:

```dart
// In your Flutter app
final aiService = AIBackendService();

try {
  final workout = await aiService.generateWorkout(request);
  print('Generated workout: ${workout.name}');
} catch (e) {
  print('Error: $e');
}
```

## ⚠️ Troubleshooting

### Common Issues

**"All AI providers failed"**
- Verify all API keys are valid and active
- Check internet connectivity
- Review API provider status pages

**"Authentication required"**
- Ensure `X-API-Key` header is included
- Verify API key matches `.env` configuration

**"Rate limit exceeded"**
- Reduce request frequency
- Implement exponential backoff
- Consider upgrading API limits

### Debug Mode
Set `NODE_ENV=development` for detailed error messages and stack traces.

## 📈 Performance

### Caching Strategy
- Response caching for similar requests
- Redis integration (future enhancement)
- CDN for static assets

### Optimization
- Request timeout handling
- Connection pooling
- Graceful shutdown

## 🛣️ Roadmap

- [ ] Redis caching layer
- [ ] User authentication system  
- [ ] Webhook support
- [ ] Metrics and analytics
- [ ] Docker containerization
- [ ] GraphQL API option
- [ ] Batch processing endpoints

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

- **Documentation**: `/docs/API_DOCUMENTATION.md`
- **Issues**: GitHub Issues
- **Email**: support@yourdomain.com

---

**Made with ❤️ for the CrossFit community**