# CrossFit WOD AI - Complete SaaS Business Operations Guide

## 🚀 System Overview

This guide covers the complete SaaS business setup for CrossFit WOD AI, a comprehensive platform for AI-powered fitness workout generation with subscription-based monetization and mobile app analytics.

### Architecture Summary
- **Backend**: Express.js with LangChain.js AI integration
- **Database**: Supabase PostgreSQL with comprehensive schema
- **Authentication**: Supabase Auth with JWT tokens and API keys
- **AI Provider**: Anthropic Claude with LangChain orchestration
- **Admin Dashboard**: Full-featured SaaS control center
- **Analytics**: Complete mobile app tracking and business metrics

---

## 📊 Admin Dashboard Features

### Access
- **URL**: `http://localhost:3000/admin`
- **Features**: 7 comprehensive tabs for business operations

### 1. Dashboard Overview
- Real-time business metrics
- User growth trends
- Revenue tracking
- Subscription analytics
- Mobile app performance KPIs

### 2. User Management
- Complete user profiles
- Subscription status
- Usage analytics per user
- Support ticket integration
- User segmentation tools

### 3. Subscription Management  
- Plan configuration (Free, Pro, Elite)
- Pricing management
- Subscription analytics
- Churn analysis
- Revenue projections

### 4. Workout Analytics
- AI-generated workout statistics
- Popular workout types
- User engagement metrics
- Content performance analysis

### 5. Support Center
- Ticket management system
- User communication tools
- FAQ management
- Response time tracking

### 6. Billing & Revenue
- Revenue dashboards
- Payment processing insights
- Subscription lifecycle metrics
- Financial reporting

### 7. Mobile App Operations
- Cross-platform analytics (iOS/Android)
- User engagement tracking
- App performance metrics
- Push notification management

---

## 🛢️ Database Schema

### Core Tables

#### Users & Authentication
```sql
-- Users table (managed by Supabase Auth)
-- Stores user profiles, preferences, fitness levels

-- API Tokens for mobile app authentication  
api_tokens: token management, expiration, scopes

-- User Subscriptions
user_subscriptions: plan management, billing cycles, status
```

#### Business Operations
```sql
-- Subscription Plans
subscription_plans: free/pro/elite tiers, features, limits

-- Coupon System
coupons: discount codes, credit grants, usage limits
coupon_usage: redemption tracking

-- Credits System  
user_credits: workout/coaching/modification credits
```

#### Analytics & Tracking
```sql
-- API Usage Tracking
api_usage: endpoint calls, response times, user patterns

-- Mobile App Analytics
app_sessions: user sessions, platform data
feature_usage: detailed feature interaction tracking
app_errors: crash reporting, error analysis
push_notifications: delivery and engagement tracking
user_engagement_metrics: daily/weekly/monthly aggregates
app_performance: response times, load metrics
```

#### Content Management
```sql
-- Workout System
workouts: AI-generated workout library
workout_logs: user completion tracking
exercises: movement database with scaling options
```

---

## 🔌 API Endpoints Reference

### Base URL: `http://localhost:3000`

### Authentication Endpoints (`/api/v2/auth`)
```javascript
POST /signup      // User registration
POST /login       // User authentication  
POST /refresh     // Token refresh
POST /logout      // Session termination
```

### User Management (`/api/v2/user`)
```javascript
GET  /profile     // User profile data
PUT  /profile     // Update profile
GET  /subscription // Current subscription
GET  /usage       // Usage statistics
GET  /api-tokens  // Mobile API tokens
POST /api-tokens  // Create new API token
```

### Subscription System (`/api/v2/subscription`) 
```javascript
GET  /plans       // Available plans (Free/Pro/Elite)
GET  /current     // Current subscription details
POST /upgrade     // Change subscription plan
POST /cancel      // Cancel subscription
POST /reactivate  // Reactivate cancelled subscription
GET  /usage       // Detailed usage analytics
```

### Workout Generation (`/api/v2/wod`)
```javascript
POST /generate         // AI workout generation
POST /coaching-cues    // AI coaching tips (Pro/Elite)
POST /modifications    // Exercise scaling (Pro/Elite)
POST /explain         // Workout explanation
GET  /history         // User workout history
POST /log            // Log completed workout
```

### Admin Operations (`/api/v2/admin`)
```javascript
// Dashboard & Analytics
GET  /dashboard           // Business metrics overview
GET  /users              // User management with filters
GET  /subscriptions      // Subscription analytics
GET  /support/tickets    // Support ticket system

// Coupon Management
GET  /coupons           // List all coupons
POST /coupons           // Create new coupon
PUT  /coupons/:id       // Update coupon
DELETE /coupons/:id     // Deactivate coupon

// Credits Management  
POST /credits/grant        // Grant credits to user
GET  /credits/users/:id    // User credit balance
GET  /credits/history      // Credit usage history

// Mobile Analytics
GET  /analytics/overview   // App performance overview
GET  /analytics/users      // User behavior analytics
POST /analytics/sessions   // Track app sessions
POST /analytics/events     // Track custom events
```

### Health & Documentation
```javascript
GET  /api/health          // System health check
GET  /api-docs           // Interactive API documentation
```

---

## 📱 Mobile App Analytics

### Real-Time Tracking Capabilities

#### Session Analytics
- User session duration and frequency
- Platform-specific usage (iOS vs Android)
- App version performance comparison
- Geographic usage patterns

#### Feature Usage Tracking
```javascript
// Track feature interactions
POST /api/v2/admin/analytics/events
{
  "eventName": "workout_generated",
  "userId": "user-uuid",
  "properties": {
    "workoutType": "amrap",
    "duration": 900,
    "difficulty": "intermediate"
  },
  "platform": "ios"
}
```

#### Performance Monitoring
- API response times
- App crash reporting
- Error rate tracking
- User experience metrics

#### Engagement Metrics
- Daily/Weekly/Monthly Active Users
- Retention rates (Day 1, 7, 30)
- Feature adoption rates
- Conversion funnel analysis

---

## 💰 Revenue & Business Model

### Subscription Tiers

#### Free Plan
- 10 workouts per month
- Basic workout generation
- Standard exercises only
- **Price**: $0/month

#### Pro Plan  
- 100 workouts per month
- AI coaching cues
- Exercise modifications
- Workout history
- Performance tracking
- API token access
- **Price**: $9.99/month or $99.99/year

#### Elite Plan
- Unlimited workouts
- All Pro features
- Custom programs
- Priority support
- Advanced analytics
- Export capabilities
- **Price**: $19.99/month or $199.99/year

### Monetization Features

#### Coupon System
```javascript
// Create discount coupon
POST /api/v2/admin/coupons
{
  "code": "WELCOME10",
  "name": "Welcome Discount", 
  "type": "percentage",
  "value": 10,
  "validUntil": "2025-12-31",
  "applicablePlans": ["pro", "elite"]
}
```

#### Credits System
- Flexible credit allocation
- Admin-managed credit grants
- Expiration date controls
- Usage tracking and analytics

---

## 🔧 Operations & Deployment

### Development Setup
```bash
# Start development server
npm run dev

# Run tests
npm test

# Install dependencies
npm install
```

### Environment Configuration
```env
# Server
PORT=3000
NODE_ENV=development

# Supabase Database
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key

# AI Providers
ANTHROPIC_API_KEY=your_claude_key
OPENAI_API_KEY=your_openai_key (optional)

# Security
JWT_SECRET=your_jwt_secret
API_SECRET_KEY=your_api_secret

# CORS & Rate Limiting
ALLOWED_ORIGINS=localhost:3000,your-app-domain.com
RATE_LIMIT_MAX_REQUESTS=300
```

### Key Operational URLs
- **API Documentation**: `http://localhost:3000/api-docs`
- **Admin Dashboard**: `http://localhost:3000/admin`
- **Health Check**: `http://localhost:3000/api/health`

---

## 📈 Business Metrics & KPIs

### User Acquisition
- New user registrations
- Conversion rate from free to paid
- Customer acquisition cost (CAC)
- Organic vs paid user growth

### Revenue Metrics
- Monthly Recurring Revenue (MRR)
- Annual Recurring Revenue (ARR)
- Average Revenue Per User (ARPU)
- Customer Lifetime Value (CLV)

### Engagement Metrics
- Daily/Weekly/Monthly Active Users
- Session duration and frequency
- Feature adoption rates
- Retention cohorts

### Support Metrics
- Response time to support tickets
- Customer satisfaction scores
- Churn rate and reasons
- Support ticket volume trends

---

## 🔐 Security & Compliance

### Authentication Security
- JWT token-based authentication
- API key management for mobile apps
- Rate limiting by subscription tier
- CORS configuration for web security

### Data Privacy
- User data encryption at rest
- Secure API endpoints
- GDPR compliance considerations
- User data export capabilities

### Monitoring & Alerts
- Real-time error tracking
- Performance monitoring
- Usage anomaly detection
- Security incident logging

---

## 🚀 Scaling Considerations

### Database Optimization
- Indexed queries for analytics
- Partition strategies for large datasets
- Read replicas for dashboard queries
- Automated backup systems

### API Performance
- Response caching strategies
- Database query optimization
- CDN integration for static assets
- Load balancing for high traffic

### Mobile App Support
- Platform-specific optimization
- Push notification infrastructure
- Offline capability planning
- App store optimization

---

## 📞 Support & Maintenance

### Regular Maintenance Tasks
- Database performance optimization
- Security updates and patches
- Analytics data archiving
- User engagement analysis

### Monitoring Dashboards
- Real-time system health
- Business metrics tracking
- User behavior analysis
- Revenue trend monitoring

### Incident Response
- Error alerting systems
- Performance degradation detection
- User support escalation
- System recovery procedures

---

## 🎯 Business Growth Strategies

### User Acquisition
- Referral program implementation
- Content marketing automation
- Social media integration
- Influencer partnership tools

### Retention Optimization
- Personalized workout recommendations
- Achievement and gamification systems
- Community features
- Progressive workout difficulty

### Revenue Expansion
- Usage-based pricing tiers
- Corporate/gym licensing
- White-label solution offerings
- Premium content partnerships

---

This comprehensive guide provides everything needed to operate and scale the CrossFit WOD AI SaaS business. All systems are production-ready with proper monitoring, analytics, and administrative controls.

**🔗 Quick Access Links:**
- Admin Dashboard: http://localhost:3000/admin
- API Documentation: http://localhost:3000/api-docs  
- System Health: http://localhost:3000/api/health