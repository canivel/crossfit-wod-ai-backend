import express from 'express';
import Joi from 'joi';
import supabaseService from '../services/supabaseService.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { APIError } from '../middleware/errorHandler.js';
import { authenticateRequest } from '../middleware/supabaseAuth.js';

const router = express.Router();

// Validation schemas
const signupSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  displayName: Joi.string().min(2).max(50).optional(),
  fitnessLevel: Joi.string().valid('beginner', 'intermediate', 'advanced').optional(),
  goals: Joi.array().items(Joi.string()).optional(),
  metadata: Joi.object().optional()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const refreshSchema = Joi.object({
  refreshToken: Joi.string().required()
});

const resetPasswordSchema = Joi.object({
  email: Joi.string().email().required()
});

const updatePasswordSchema = Joi.object({
  password: Joi.string().min(8).required(),
  token: Joi.string().required()
});

/**
 * @swagger
 * /api/v2/auth/signup:
 *   post:
 *     summary: Create a new user account
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               displayName:
 *                 type: string
 *               fitnessLevel:
 *                 type: string
 *                 enum: [beginner, intermediate, advanced]
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Invalid input
 *       409:
 *         description: User already exists
 */
router.post('/signup', asyncHandler(async (req, res) => {
  const { error, value } = signupSchema.validate(req.body);
  if (error) {
    throw new APIError('Validation failed', 400, error.details);
  }

  console.log('👤 Creating new user account...');

  try {
    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabaseService.public.auth.signUp({
      email: value.email,
      password: value.password,
      options: {
        data: {
          display_name: value.displayName,
          fitness_level: value.fitnessLevel
        }
      }
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        throw new APIError('User already exists', 409, 'Email is already registered');
      }
      throw authError;
    }

    // Create user profile in our database
    if (authData.user) {
      await supabaseService.upsertUserProfile(authData.user.id, {
        email: value.email,
        display_name: value.displayName,
        fitness_level: value.fitnessLevel,
        goals: value.goals || [],
        created_at: new Date().toISOString()
      });

      // Assign free plan by default
      const { data: freePlan } = await supabaseService.admin
        .from('subscription_plans')
        .select('id')
        .eq('name', 'free')
        .single();

      if (freePlan) {
        await supabaseService.updateUserSubscription(authData.user.id, freePlan.id);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Account created successfully. Please check your email to verify your account.',
      data: {
        user: {
          id: authData.user.id,
          email: authData.user.email,
          emailConfirmed: authData.user.email_confirmed_at != null
        },
        session: authData.session ? {
          accessToken: authData.session.access_token,
          refreshToken: authData.session.refresh_token,
          expiresAt: authData.session.expires_at
        } : null
      }
    });
  } catch (error) {
    console.error('❌ Signup failed:', error);
    if (error instanceof APIError) throw error;
    throw new APIError('Failed to create account', 500, error.message);
  }
}));

/**
 * @swagger
 * /api/v2/auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', asyncHandler(async (req, res) => {
  const { error, value } = loginSchema.validate(req.body);
  if (error) {
    throw new APIError('Validation failed', 400, error.details);
  }

  console.log('🔐 Processing login request...');

  try {
    const { data, error: authError } = await supabaseService.public.auth.signInWithPassword({
      email: value.email,
      password: value.password
    });

    if (authError) {
      throw new APIError('Invalid credentials', 401, 'Email or password is incorrect');
    }

    // Get user's subscription info
    const subscription = await supabaseService.getUserSubscription(data.user.id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: data.user.id,
          email: data.user.email,
          emailConfirmed: data.user.email_confirmed_at != null,
          metadata: data.user.user_metadata
        },
        subscription: {
          plan: subscription.subscription_plans?.name || subscription.plan?.name || 'free',
          status: subscription.status,
          limits: subscription.subscription_plans?.limits || subscription.plan?.limits
        },
        session: {
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token,
          expiresAt: data.session.expires_at,
          expiresIn: data.session.expires_in
        }
      }
    });
  } catch (error) {
    console.error('❌ Login failed:', error);
    if (error instanceof APIError) throw error;
    throw new APIError('Login failed', 500, error.message);
  }
}));

/**
 * @swagger
 * /api/v2/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         description: Invalid refresh token
 */
router.post('/refresh', asyncHandler(async (req, res) => {
  const { error, value } = refreshSchema.validate(req.body);
  if (error) {
    throw new APIError('Validation failed', 400, error.details);
  }

  console.log('🔄 Refreshing access token...');

  try {
    const { data, error: refreshError } = await supabaseService.public.auth.refreshSession({
      refresh_token: value.refreshToken
    });

    if (refreshError) {
      throw new APIError('Invalid refresh token', 401, 'Token is invalid or expired');
    }

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        session: {
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token,
          expiresAt: data.session.expires_at,
          expiresIn: data.session.expires_in
        },
        user: {
          id: data.user.id,
          email: data.user.email
        }
      }
    });
  } catch (error) {
    console.error('❌ Token refresh failed:', error);
    if (error instanceof APIError) throw error;
    throw new APIError('Failed to refresh token', 500, error.message);
  }
}));

/**
 * @swagger
 * /api/v2/auth/logout:
 *   post:
 *     summary: Logout current user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Not authenticated
 */
router.post('/logout', authenticateRequest, asyncHandler(async (req, res) => {
  console.log('👋 Processing logout...');

  try {
    // Logout from Supabase
    const { error } = await supabaseService.public.auth.signOut();
    
    if (error) {
      console.warn('Logout error:', error);
    }

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('❌ Logout failed:', error);
    // Even if logout fails, we return success to clear client session
    res.json({
      success: true,
      message: 'Logout processed'
    });
  }
}));

/**
 * @swagger
 * /api/v2/auth/reset-password:
 *   post:
 *     summary: Request password reset email
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Reset email sent
 *       400:
 *         description: Invalid email
 */
router.post('/reset-password', asyncHandler(async (req, res) => {
  const { error, value } = resetPasswordSchema.validate(req.body);
  if (error) {
    throw new APIError('Validation failed', 400, error.details);
  }

  console.log('📧 Sending password reset email...');

  try {
    const { error: resetError } = await supabaseService.public.auth.resetPasswordForEmail(
      value.email,
      {
        redirectTo: `${process.env.APP_URL || 'http://localhost:3000'}/reset-password`
      }
    );

    if (resetError) {
      console.error('Reset error:', resetError);
    }

    // Always return success to prevent email enumeration
    res.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.'
    });
  } catch (error) {
    console.error('❌ Password reset failed:', error);
    // Still return success to prevent email enumeration
    res.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.'
    });
  }
}));

/**
 * @swagger
 * /api/v2/auth/update-password:
 *   post:
 *     summary: Update password with reset token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *               - token
 *             properties:
 *               password:
 *                 type: string
 *                 minLength: 8
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password updated successfully
 *       400:
 *         description: Invalid token or password
 */
router.post('/update-password', asyncHandler(async (req, res) => {
  const { error, value } = updatePasswordSchema.validate(req.body);
  if (error) {
    throw new APIError('Validation failed', 400, error.details);
  }

  console.log('🔑 Updating password...');

  try {
    const { data, error: updateError } = await supabaseService.public.auth.updateUser({
      password: value.password
    });

    if (updateError) {
      throw new APIError('Failed to update password', 400, updateError.message);
    }

    res.json({
      success: true,
      message: 'Password updated successfully',
      data: {
        user: {
          id: data.user.id,
          email: data.user.email
        }
      }
    });
  } catch (error) {
    console.error('❌ Password update failed:', error);
    if (error instanceof APIError) throw error;
    throw new APIError('Failed to update password', 500, error.message);
  }
}));

/**
 * @swagger
 * /api/v2/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved
 *       401:
 *         description: Not authenticated
 */
router.get('/me', authenticateRequest, asyncHandler(async (req, res) => {
  console.log('👤 Fetching user profile...');

  try {
    // Get full user profile
    const userProfile = await supabaseService.getUserById(req.user.id);
    const subscription = req.subscription;

    res.json({
      success: true,
      data: {
        user: {
          id: req.user.id,
          email: req.user.email,
          ...userProfile,
          metadata: req.user.user_metadata
        },
        subscription: {
          plan: subscription.subscription_plans?.name || subscription.plan?.name || 'free',
          status: subscription.status,
          limits: subscription.subscription_plans?.limits || subscription.plan?.limits,
          features: subscription.subscription_plans?.features || subscription.plan?.features
        }
      }
    });
  } catch (error) {
    console.error('❌ Failed to fetch profile:', error);
    throw new APIError('Failed to fetch profile', 500, error.message);
  }
}));

export default router;