# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev         # Start development server with nodemon (auto-reload)
npm start           # Start production server

# Testing
npm test            # Run Jest tests

# Dependencies
npm install         # Install all dependencies
```

## Architecture

This is an Express.js backend that provides AI-powered CrossFit workout generation through LangChain.js with Supabase authentication and subscription management.

### New Architecture (v2.0.0)
- **AI Integration**: LangChain.js with Anthropic Claude for structured prompt handling
- **Authentication**: Supabase Auth with JWT tokens and API tokens
- **Database**: Supabase PostgreSQL with subscription and usage tracking
- **Documentation**: Swagger UI with comprehensive API docs at `/api-docs`
- **Rate Limiting**: Subscription-tier based limiting with usage tracking

### LangChain Integration
The application uses LangChain.js for AI interactions (`src/services/langchainService.js`):
- Structured prompt templates for different use cases
- JSON output parsers for consistent responses  
- Conversation chains for complex workflows
- Built-in error handling and retries
- Optional LangSmith integration for monitoring

### Supabase Integration
Database operations handled by `src/services/supabaseService.js`:
- User authentication and profile management
- Subscription plan management (free, pro, elite)
- API usage tracking and rate limiting
- Workout history and logging
- API token management for mobile apps

### Authentication Flow
Three authentication methods supported:
1. **JWT Bearer Token** - For web/mobile app users
2. **API Token** - For programmatic access (Pro/Elite plans)  
3. **Legacy API Key** - Backward compatibility (deprecated)

Middleware stack (`src/middleware/supabaseAuth.js`):
- Token validation and user resolution
- Subscription tier verification
- Usage limit checking and tracking
- Rate limiting per subscription plan

## API Structure (v2.0.0)

```
/api/v2/
├── /auth
│   ├── POST /signup      # User registration
│   ├── POST /login       # User login
│   ├── POST /refresh     # Token refresh
│   └── POST /logout      # User logout
├── /user
│   ├── GET  /profile     # User profile
│   ├── PUT  /profile     # Update profile
│   ├── GET  /subscription # Subscription details
│   ├── GET  /usage       # Usage statistics
│   └── /api-tokens       # API token management
├── /subscription
│   ├── GET  /plans       # Available plans
│   ├── POST /upgrade     # Upgrade subscription
│   ├── POST /cancel      # Cancel subscription
│   └── GET  /usage       # Usage analytics
└── /wod
    ├── POST /generate    # Generate workout (all plans)
    ├── POST /coaching-cues # Coaching tips (Pro/Elite)
    ├── POST /explain     # Workout explanation (all)  
    ├── POST /modifications # Exercise scaling (Pro/Elite)
    ├── GET  /history     # Workout history
    └── POST /log         # Log completed workout
```

## Key Technical Details

### Environment Variables
Required for v2.0.0:
```env
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key

# AI Providers
ANTHROPIC_API_KEY=your_claude_key
OPENAI_API_KEY=your_openai_key (optional)
GEMINI_API_KEY=your_gemini_key (optional)

# LangChain (optional)
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=your_langsmith_key
```

### Database Schema
Supabase tables:
- `users` - User profiles and preferences
- `subscription_plans` - Available subscription tiers
- `user_subscriptions` - User subscription status
- `api_usage` - Request tracking and analytics
- `api_tokens` - User API tokens
- `workouts` - Generated workout library
- `workout_logs` - User workout completion logs

### Subscription Tiers
- **Free**: 10 workouts/month, basic features
- **Pro**: 100 workouts/month, coaching cues, modifications, API tokens
- **Elite**: Unlimited usage, priority support, advanced features

### Error Handling
Custom `APIError` class with structured responses:
```javascript
throw new APIError(message, statusCode, details);
```

### Testing Approach
- Framework: Jest with Supertest
- Health check: `GET /api/health`
- API test: `GET /api/v2/wod/test` (requires auth)
- Documentation: Available at `/api-docs`

### Development Workflow
1. **Setup**: Copy `.env.example` to `.env` and configure
2. **Database**: Run Supabase migrations for subscription tables
3. **Start**: `npm run dev` for development with auto-reload
4. **Test**: Visit `/api-docs` for interactive API testing
5. **Monitor**: Check `/api/health/detailed` for system status

### Migration from v1 to v2
- v1 endpoints maintain backward compatibility at `/api/v1/*`
- New features only available in v2 endpoints at `/api/v2/*`
- Legacy API key authentication still supported
- Database migrations handle subscription table creation