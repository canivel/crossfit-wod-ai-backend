import express from 'express';
import { validateAIConfiguration } from '../config/ai.js';

const router = express.Router();

// Basic health check
router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Detailed health check with AI providers
router.get('/detailed', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    services: {
      api: 'healthy',
      database: 'not_configured', // Will be updated when we add database
      ai_providers: {
        claude: 'unknown',
        openai: 'unknown', 
        gemini: 'unknown'
      }
    },
    system: {
      memory: process.memoryUsage(),
      platform: process.platform,
      nodeVersion: process.version
    }
  };

  // Check AI configuration
  try {
    validateAIConfiguration();
    health.services.ai_providers.claude = 'configured';
    health.services.ai_providers.openai = 'configured';
    health.services.ai_providers.gemini = 'configured';
  } catch (error) {
    health.status = 'degraded';
    health.services.ai_providers.claude = 'not_configured';
    health.services.ai_providers.openai = 'not_configured';
    health.services.ai_providers.gemini = 'not_configured';
    health.error = error.message;
  }

  res.json(health);
});

// Readiness check
router.get('/ready', async (req, res) => {
  try {
    validateAIConfiguration();
    res.json({
      ready: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      ready: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Liveness check
router.get('/live', (req, res) => {
  res.json({
    alive: true,
    timestamp: new Date().toISOString()
  });
});

export default router;