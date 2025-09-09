# CrossFit WOD AI Backend

A secure, AI-powered backend service for generating personalized CrossFit workouts, coaching cues, and exercise modifications. Built with Express.js, LangChain.js, and Supabase authentication, this service delivers intelligent fitness programming through a subscription-based model.

## 🚀 Version 2.0.0 Features

- **LangChain.js Integration**: Structured AI prompts with Claude, OpenAI, and Gemini
- **Supabase Authentication**: JWT-based auth with user profiles and API tokens
- **Subscription Tiers**: Free, Pro, and Elite plans with usage tracking
- **Swagger API Documentation**: Interactive API docs at `/api-docs`
- **Rate Limiting**: Subscription-based request limits
- **Comprehensive Testing**: Jest test suite with API integration tests

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Mobile App    │───▶│  Backend API     │───▶│  AI Providers   │
│                 │    │                  │    │                 │
│ • iOS/Android   │    │ • Supabase Auth  │    │ • Claude        │
│ • React Native  │    │ • LangChain.js   │    │ • OpenAI        │
│ • Flutter       │    │ • Rate Limiting  │    │ • Gemini        │
└─────────────────┘    │ • Subscriptions  │    └─────────────────┘
                       │ • Usage Tracking │    
                       └──────────────────┘    
                            │
                            ▼
                       ┌──────────────────┐
                       │    Supabase      │
                       │                  │
                       │ • PostgreSQL DB  │
                       │ • Authentication │
                       │ • User Profiles  │
                       └──────────────────┘
```

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **AI Integration**: LangChain.js
- **AI Providers**: 
  - Anthropic Claude SDK
  - OpenAI SDK  
  - Google Generative AI SDK
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (JWT)
- **Documentation**: Swagger/OpenAPI 3.0
- **Testing**: Jest + Supertest
- **Security**: Helmet, CORS, Rate Limiting
- **Validation**: Joi
- **Environment**: dotenv

## 📋 Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn
- Supabase Project ([Create one here](https://supabase.com))
- API keys for AI providers:
  - [Anthropic Claude API key](https://console.anthropic.com/)
  - [OpenAI API key](https://platform.openai.com/api-keys) (optional)
  - [Google Gemini API key](https://makersuite.google.com/app/apikey) (optional)

## 🔧 Installation

### **Quick Setup (Recommended)**
```bash
git clone <repository-url>
cd crossfit-wod-ai-backend
./scripts/setup-dev.sh
```

The setup script will:
- ✅ Check Node.js version
- ✅ Install dependencies  
- ✅ Create `.env.local` from template
- ✅ Set up git hooks to prevent secret commits
- ✅ Run basic tests

### **Manual Setup**

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
cp .env.example .env.local
```

4. **Get secrets from team**
- **Contact team lead** for development API keys and Supabase credentials
- **Never commit real secrets** - `.env.local` is gitignored for security
- **Share via secure channels**: 1Password, encrypted messages, or secure vault

5. **Configure environment variables**
Edit `.env.local` file with actual values from your team:
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Supabase Configuration (Required)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key

# AI Provider API Keys (At least one required)
ANTHROPIC_API_KEY=your_claude_api_key_here
OPENAI_API_KEY=your_openai_api_key_here  # Optional
GEMINI_API_KEY=your_gemini_api_key_here   # Optional

# LangChain Configuration (Optional for monitoring)
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=your_langsmith_key
LANGCHAIN_PROJECT=crossfit-wod-ai

# CORS Origins (comma separated)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080

# Legacy API Support (Optional, for v1 endpoints)
API_SECRET_KEY=your_legacy_api_key_here
```

5. **Set up Supabase Database**
Run the migration to create required tables:
```bash
# Create subscription tables and initial data
# Run these SQL commands in your Supabase SQL editor:
```
See `supabase/migrations/` folder for SQL scripts to set up:
- Subscription plans table
- User subscriptions table
- API tokens table
- API usage tracking table
- Workout logs table

6. **Start development server**
```bash
npm run dev
```

The server will start on `http://localhost:3000`

7. **Access Swagger Documentation**
Open your browser and navigate to:
```
http://localhost:3000/api-docs
```

This provides an interactive API documentation where you can test all endpoints.

## 🧪 Running Tests

### Run Jest Test Suite
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Manual Testing

#### Health Check
```bash
# Basic health check
curl http://localhost:3000/api/health

# Detailed health check with system info
curl http://localhost:3000/api/health/detailed
```

#### Test User Registration and Login
```bash
# Register a new user
curl -X POST http://localhost:3000/api/v2/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "displayName": "Test User",
    "fitnessLevel": "intermediate"
  }'

# Login
curl -X POST http://localhost:3000/api/v2/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!"
  }'
```

#### Generate Sample Workout (with JWT)
```bash
# Use the accessToken from login response
curl -X POST http://localhost:3000/api/v2/wod/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "fitnessLevel": "intermediate",
    "goals": ["strength", "conditioning"],
    "availableEquipment": ["barbell", "dumbbells", "pull_up_bar"],
    "duration": 1200000
  }'
```

#### Test API Endpoint (Authenticated)
```bash
curl -X GET http://localhost:3000/api/v2/wod/test \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 📚 API Documentation

### Interactive Swagger Documentation
Access the full interactive API documentation at:
```
http://localhost:3000/api-docs
```

### Mobile Integration Guide
For mobile app developers, see: `MOBILE_INTEGRATION.md`

### API Versions

#### v2 Endpoints (Current - Requires Authentication)
- **Authentication**
  - `POST /api/v2/auth/signup` - User registration
  - `POST /api/v2/auth/login` - User login
  - `POST /api/v2/auth/refresh` - Refresh access token
  - `POST /api/v2/auth/logout` - Logout user

- **User Management**
  - `GET /api/v2/user/profile` - Get user profile
  - `PUT /api/v2/user/profile` - Update profile
  - `GET /api/v2/user/subscription` - Get subscription details
  - `GET /api/v2/user/usage` - Get usage statistics
  - `GET /api/v2/user/api-tokens` - List API tokens (Pro/Elite)
  - `POST /api/v2/user/api-tokens` - Create API token (Pro/Elite)

- **Workout Generation**
  - `POST /api/v2/wod/generate` - Generate personalized workout
  - `POST /api/v2/wod/coaching-cues` - Get coaching cues (Pro/Elite)
  - `POST /api/v2/wod/explain` - Get workout explanation
  - `POST /api/v2/wod/modifications` - Get exercise modifications (Pro/Elite)
  - `GET /api/v2/wod/history` - Get workout history
  - `POST /api/v2/wod/log` - Log completed workout

- **Subscription Management**
  - `GET /api/v2/subscription/plans` - Get available plans
  - `POST /api/v2/subscription/upgrade` - Upgrade subscription
  - `POST /api/v2/subscription/cancel` - Cancel subscription

#### v1 Endpoints (Legacy - API Key Authentication)
- `POST /api/v1/wod/generate` - Generate workout
- `POST /api/v1/wod/coaching-cues` - Get coaching cues
- `POST /api/v1/wod/explain` - Get workout explanation
- `POST /api/v1/wod/modifications` - Get modifications

## 🔒 Security

### Authentication Methods

#### JWT Bearer Token (v2 API)
```bash
# Login to get token
curl -X POST http://localhost:3000/api/v2/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'

# Use token in requests
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3000/api/v2/wod/generate
```

#### API Token (Pro/Elite Plans)
```bash
curl -H "X-API-Token: wod_api_token_xxx" \
  http://localhost:3000/api/v2/wod/generate
```

#### Legacy API Key (v1 API)
```bash
curl -H "X-API-Key: your_secret_key" \
  http://localhost:3000/api/v1/wod/generate
```

### Rate Limiting by Subscription
- **Free Plan**: 10 requests/minute, 10 workouts/month
- **Pro Plan**: 60 requests/minute, 100 workouts/month
- **Elite Plan**: 120 requests/minute, unlimited workouts

### Security Features
- Helmet.js for security headers
- CORS configured for specific origins
- Input validation with Joi schemas
- SQL injection protection via Supabase
- JWT token expiration and refresh
- API usage tracking and limits

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

# Supabase (Required)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# AI Providers
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AI...

# LangChain (Optional)
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=ls_...

# Security
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com

# Legacy Support (Optional)
API_SECRET_KEY=your-production-api-key
```

## 🔧 Development

### Project Structure
```
crossfit-wod-ai-backend/
├── src/
│   ├── config/         # Configuration files
│   │   ├── swagger.js  # Swagger/OpenAPI configuration
│   │   └── ai.js       # AI provider configuration
│   ├── middleware/     # Express middleware
│   │   ├── supabaseAuth.js  # JWT authentication
│   │   ├── rateLimiter.js   # Rate limiting
│   │   └── errorHandler.js  # Global error handling
│   ├── routes/         # API routes
│   │   ├── auth.js     # Authentication endpoints
│   │   ├── user.js     # User management
│   │   ├── wod.js      # Workout generation
│   │   └── subscription.js  # Subscription management
│   ├── services/       # Business logic
│   │   ├── langchainService.js  # LangChain AI integration
│   │   ├── supabaseService.js   # Database operations
│   │   └── aiService.js         # Direct AI provider calls
│   └── utils/          # Utility functions
├── tests/              # Jest test files
├── supabase/          # Database migrations
├── .env.example       # Environment template
├── server.js          # Main server file
├── package.json       # Dependencies
└── MOBILE_INTEGRATION.md  # Mobile app integration guide
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

### Available Scripts
```bash
# Development
npm run dev          # Start with nodemon (auto-reload)
npm start           # Start production server

# Testing
npm test            # Run Jest tests
npm run test:watch  # Run tests in watch mode
npm run test:coverage # Generate coverage report

# Code Quality
npm run lint        # Run ESLint (if configured)
npm run format      # Format code with Prettier (if configured)
```

### Database Migrations
Create new migrations in `supabase/migrations/`:
```sql
-- Example: Add new table
CREATE TABLE IF NOT EXISTS workout_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  exercises JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
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

## 📱 Mobile App Integration

For detailed mobile integration instructions, see `MOBILE_INTEGRATION.md`

### Quick Start for Mobile Developers

```javascript
// React Native Example
import { ApiClient } from './services/api';

const client = new ApiClient();

// Authenticate
const user = await client.login('user@example.com', 'password');

// Generate workout
const workout = await client.generateWorkout({
  fitnessLevel: 'intermediate',
  goals: ['strength', 'conditioning'],
  availableEquipment: ['barbell', 'dumbbells'],
  duration: 1200000
});
```

### SDK Support
- iOS: Swift example in `MOBILE_INTEGRATION.md`
- Android: Kotlin example in `MOBILE_INTEGRATION.md`
- React Native: JavaScript example in `MOBILE_INTEGRATION.md`
- Flutter: Use HTTP client with JWT authentication

## ⚠️ Troubleshooting

### Common Issues

**"Supabase connection failed"**
- Verify SUPABASE_URL and keys in `.env`
- Check if Supabase project is active
- Ensure database tables are created (run migrations)

**"All AI providers failed"**
- Verify at least one AI API key is valid
- Check ANTHROPIC_API_KEY is set (primary provider)
- Review API provider status pages

**"Authentication failed"**
- For v2 API: Ensure valid JWT token from login
- For API tokens: Verify Pro/Elite subscription
- For v1 API: Check X-API-Key header

**"Usage limit exceeded"**
- Check subscription limits: `GET /api/v2/user/usage`
- Upgrade subscription for more usage
- Wait for monthly reset (1st of each month)

**"Cannot find module"**
- Run `npm install` to install dependencies
- Check Node.js version (requires 18+)
- Delete `node_modules` and reinstall

### Debug Mode
```bash
# Enable debug logging
NODE_ENV=development npm run dev

# Check detailed health status
curl http://localhost:3000/api/health/detailed

# Test Supabase connection
curl http://localhost:3000/api/health/ready
```

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

### Completed (v2.0.0)
- ✅ Supabase authentication system
- ✅ Subscription tiers (Free/Pro/Elite)
- ✅ LangChain.js integration
- ✅ Swagger API documentation
- ✅ Jest test suite
- ✅ API usage tracking
- ✅ Mobile integration guide

### Upcoming Features
- [ ] Stripe payment integration
- [ ] Redis caching layer
- [ ] Webhook support for subscriptions
- [ ] Advanced analytics dashboard
- [ ] GraphQL API option
- [ ] Batch workout generation
- [ ] Team/gym subscriptions
- [ ] Workout plan builder
- [ ] Progress tracking
- [ ] Social features (share workouts)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

- **API Documentation**: http://localhost:3000/api-docs
- **Mobile Integration**: See `MOBILE_INTEGRATION.md`
- **Issues**: GitHub Issues
- **Email**: support@crossfitwod.ai

## 🔗 Quick Links

- [Swagger API Docs](http://localhost:3000/api-docs) - Interactive API documentation
- [Mobile Integration Guide](./MOBILE_INTEGRATION.md) - Complete mobile app integration
- [Supabase Dashboard](https://app.supabase.com) - Database management
- [LangSmith Dashboard](https://smith.langchain.com) - AI monitoring (optional)

---

**Made with ❤️ for the CrossFit community**

**Version 2.0.0** - Powered by LangChain.js, Supabase, and AI