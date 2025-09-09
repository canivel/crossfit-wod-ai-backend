import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { swaggerSpec, swaggerOptions } from './src/config/swagger.js';

// Import routes
import wodRoutes from './src/routes/wod.js';
import healthRoutes from './src/routes/health.js';
import authRoutes from './src/routes/auth.js';
import userRoutes from './src/routes/user.js';
import subscriptionRoutes from './src/routes/subscription.js';
import adminRoutes from './src/routes/admin.js';

// Import middleware
import { errorHandler } from './src/middleware/errorHandler.js';
import { requestLogger } from './src/middleware/requestLogger.js';
import { authMiddleware } from './src/middleware/auth.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-API-Token'],
  credentials: true
};
app.use(cors(corsOptions));

// Rate limiting (global baseline)
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 300, // Higher limit for authenticated users
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000) / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Serve Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerOptions));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerOptions));

// Serve static files
app.use(express.static(join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.redirect('/api-docs');
});

// Admin dashboard route
app.get('/admin', (req, res) => {
  res.sendFile(join(__dirname, 'public/admin/index.html'));
});

// Health routes (no auth required)
app.use('/api/health', healthRoutes);

// API v2 routes with proper authentication
app.use('/api/v2/auth', authRoutes);
app.use('/api/v2/user', userRoutes);
app.use('/api/v2/subscription', subscriptionRoutes);
app.use('/api/v2/wod', wodRoutes);
app.use('/api/v2/admin', adminRoutes);

// Legacy v1 routes (maintain backward compatibility)
app.use('/api/v1/wod', authMiddleware, wodRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: true,
    message: 'Endpoint not found',
    path: req.originalUrl,
    suggestion: 'Visit /api-docs for comprehensive API documentation',
    availableEndpoints: {
      documentation: '/api-docs',
      health: '/api/health',
      auth: '/api/v2/auth/*',
      wod: '/api/v2/wod/*',
      user: '/api/v2/user/*',
      subscription: '/api/v2/subscription/*'
    }
  });
});

// Global error handler (must be last)
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  console.log('🚀 CrossFit WOD AI Backend v2.0.0 starting...');
  console.log('🌍 Environment:', process.env.NODE_ENV || 'development');
  console.log('🔑 CORS origins:', process.env.ALLOWED_ORIGINS || 'http://localhost:3000');
  console.log('🤖 AI Integration: LangChain + Anthropic Claude');
  console.log('💾 Database: Supabase PostgreSQL');
  console.log('📝 Documentation: http://localhost:' + PORT + '/api-docs');
  console.log('✅ Server is ready and listening on port', PORT);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('🔴 Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('🔴 Process terminated');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

export default app;