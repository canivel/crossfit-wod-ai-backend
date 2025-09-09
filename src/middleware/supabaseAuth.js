import jwt from 'jsonwebtoken';
import supabaseService from '../services/supabaseService.js';
import { APIError } from './errorHandler.js';

/**
 * Verify Supabase JWT token
 */
export const verifySupabaseToken = async (token) => {
  try {
    // Decode and verify the JWT
    const decoded = jwt.decode(token, { complete: true });
    
    if (!decoded) {
      throw new Error('Invalid token format');
    }

    // Verify with Supabase
    const { data: { user }, error } = await supabaseService.public.auth.getUser(token);
    
    if (error || !user) {
      throw new Error('Invalid or expired token');
    }

    return user;
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return null;
  }
};

/**
 * Middleware to authenticate requests using Supabase JWT or API tokens
 */
export const authenticateRequest = async (req, res, next) => {
  try {
    let user = null;
    let authMethod = null;

    // Check for Bearer token (Supabase JWT)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      user = await verifySupabaseToken(token);
      authMethod = 'jwt';
    }

    // Check for API token
    const apiToken = req.headers['x-api-token'];
    if (!user && apiToken) {
      const tokenData = await supabaseService.verifyApiToken(apiToken);
      if (tokenData) {
        user = tokenData.users;
        authMethod = 'api_token';
        req.apiToken = tokenData;
      }
    }

    // Legacy API key support (will be deprecated)
    const apiKey = req.headers['x-api-key'];
    if (!user && apiKey && apiKey === process.env.API_SECRET_KEY) {
      // Create a default user object for legacy API key
      user = {
        id: 'legacy-api-user',
        email: 'api@legacy.com',
        role: 'authenticated'
      };
      authMethod = 'legacy_api_key';
    }

    if (!user) {
      throw new APIError(
        'Authentication required',
        401,
        'Please provide a valid authentication token'
      );
    }

    // Attach user and auth method to request
    req.user = user;
    req.authMethod = authMethod;

    // Get user's subscription
    if (user.id !== 'legacy-api-user') {
      try {
        const subscription = await supabaseService.getUserSubscription(user.id);
        req.subscription = subscription;
      } catch (error) {
        console.error('Failed to fetch subscription:', error);
        // Default to free plan if subscription fetch fails
        req.subscription = {
          plan: { name: 'free', workout_limit_monthly: 10 },
          status: 'active',
          is_free: true
        };
      }
    }

    next();
  } catch (error) {
    if (error instanceof APIError) {
      return res.status(error.statusCode).json({
        error: true,
        message: error.message,
        details: error.details
      });
    }

    return res.status(401).json({
      error: true,
      message: 'Authentication failed',
      details: error.message
    });
  }
};

/**
 * Middleware to check if user has required subscription tier
 */
export const requireSubscription = (requiredPlans = []) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new APIError('Authentication required', 401);
      }

      // Skip for legacy API users
      if (req.user.id === 'legacy-api-user') {
        return next();
      }

      const subscription = req.subscription;
      const planName = subscription?.subscription_plans?.name || subscription?.plan?.name || 'free';

      // If no specific plans required, just need any active subscription
      if (requiredPlans.length === 0) {
        return next();
      }

      // Check if user's plan is in the required list
      if (!requiredPlans.includes(planName)) {
        throw new APIError(
          'Subscription upgrade required',
          403,
          `This feature requires one of the following plans: ${requiredPlans.join(', ')}`
        );
      }

      next();
    } catch (error) {
      if (error instanceof APIError) {
        return res.status(error.statusCode).json({
          error: true,
          message: error.message,
          details: error.details,
          upgrade_url: '/api/v2/subscription/plans'
        });
      }

      return res.status(403).json({
        error: true,
        message: 'Subscription check failed',
        details: error.message
      });
    }
  };
};

/**
 * Middleware to track API usage and check limits
 */
export const trackAndLimitUsage = async (req, res, next) => {
  try {
    // Skip for health checks and non-authenticated routes
    if (!req.user || req.user.id === 'legacy-api-user') {
      return next();
    }

    const userId = req.user.id;
    const endpoint = req.path;
    const method = req.method;

    // Check usage limits before processing
    const limitCheck = await supabaseService.checkUsageLimits(userId, endpoint);
    
    if (limitCheck.exceeded) {
      // Track the blocked request
      await supabaseService.trackApiUsage(userId, endpoint, method, {
        status_code: 429,
        blocked: true,
        reason: 'limit_exceeded'
      });

      throw new APIError(
        'Usage limit exceeded',
        429,
        limitCheck.message || `Monthly limit of ${limitCheck.limit} ${limitCheck.type} reached`,
        {
          limit: limitCheck.limit,
          current: limitCheck.current,
          type: limitCheck.type,
          upgrade_required: limitCheck.upgrade_required
        }
      );
    }

    // Track successful request (will be updated with response details later)
    const startTime = Date.now();
    
    // Store tracking data for later
    req.trackingData = {
      userId,
      endpoint,
      method,
      startTime
    };

    // Continue to next middleware
    next();

    // After response is sent, track the usage
    res.on('finish', async () => {
      const responseTime = Date.now() - startTime;
      
      await supabaseService.trackApiUsage(userId, endpoint, method, {
        status_code: res.statusCode,
        response_time_ms: responseTime,
        subscription_plan: req.subscription?.plan?.name || 'free',
        ai_provider: res.locals.aiProvider || 'unknown'
      });
    });
  } catch (error) {
    if (error instanceof APIError) {
      return res.status(error.statusCode).json({
        error: true,
        message: error.message,
        details: error.details,
        upgrade_url: error.details?.upgrade_required ? '/api/v2/subscription/plans' : undefined
      });
    }

    next(error);
  }
};

/**
 * Optional authentication - doesn't fail if no auth provided
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const apiToken = req.headers['x-api-token'];

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      req.user = await verifySupabaseToken(token);
    } else if (apiToken) {
      const tokenData = await supabaseService.verifyApiToken(apiToken);
      if (tokenData) {
        req.user = tokenData.users;
        req.apiToken = tokenData;
      }
    }

    // Get subscription if user is authenticated
    if (req.user && req.user.id !== 'legacy-api-user') {
      try {
        req.subscription = await supabaseService.getUserSubscription(req.user.id);
      } catch (error) {
        console.error('Failed to fetch subscription:', error);
      }
    }
  } catch (error) {
    // Don't fail on optional auth
    console.error('Optional auth error:', error);
  }

  next();
};

export default {
  authenticateRequest,
  requireSubscription,
  trackAndLimitUsage,
  optionalAuth,
  verifySupabaseToken
};