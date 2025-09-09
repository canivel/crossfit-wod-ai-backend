import express from 'express';
import Joi from 'joi';
import supabaseService from '../services/supabaseService.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { APIError } from '../middleware/errorHandler.js';
import { authenticateRequest, requireSubscription } from '../middleware/supabaseAuth.js';

const router = express.Router();

// Apply authentication to all user routes
router.use(authenticateRequest);

// Validation schemas
const updateProfileSchema = Joi.object({
  displayName: Joi.string().min(2).max(50).optional(),
  fitnessLevel: Joi.string().valid('beginner', 'intermediate', 'advanced').optional(),
  crossfitExperienceYears: Joi.number().min(0).max(50).optional(),
  heightCm: Joi.number().min(100).max(250).optional(),
  weightKg: Joi.number().min(30).max(300).optional(),
  dateOfBirth: Joi.date().max('now').optional(),
  goals: Joi.array().items(Joi.string()).optional(),
  medicalConditions: Joi.array().items(Joi.string()).optional(),
  preferences: Joi.object().optional()
});

const createApiTokenSchema = Joi.object({
  name: Joi.string().min(3).max(50).required(),
  description: Joi.string().max(200).optional(),
  expiresIn: Joi.number().min(1).max(365).optional() // Days
});

/**
 * @swagger
 * /api/v2/user/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *       401:
 *         description: Not authenticated
 */
router.get('/profile', asyncHandler(async (req, res) => {
  console.log('👤 Fetching user profile...');

  try {
    const profile = await supabaseService.getUserById(req.user.id);
    
    if (!profile) {
      // Create profile if it doesn't exist
      const newProfile = await supabaseService.upsertUserProfile(req.user.id, {
        email: req.user.email,
        display_name: req.user.user_metadata?.display_name || req.user.email.split('@')[0]
      });
      
      return res.json({
        success: true,
        data: newProfile
      });
    }

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('❌ Failed to fetch profile:', error);
    throw new APIError('Failed to fetch profile', 500, error.message);
  }
}));

/**
 * @swagger
 * /api/v2/user/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               displayName:
 *                 type: string
 *               fitnessLevel:
 *                 type: string
 *                 enum: [beginner, intermediate, advanced]
 *               goals:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Invalid input
 */
router.put('/profile', asyncHandler(async (req, res) => {
  const { error, value } = updateProfileSchema.validate(req.body);
  if (error) {
    throw new APIError('Validation failed', 400, error.details);
  }

  console.log('✏️ Updating user profile...');

  try {
    // Convert camelCase to snake_case for database
    const profileData = {
      display_name: value.displayName,
      fitness_level: value.fitnessLevel,
      crossfit_experience_years: value.crossfitExperienceYears,
      height_cm: value.heightCm,
      weight_kg: value.weightKg,
      date_of_birth: value.dateOfBirth,
      goals: value.goals,
      medical_conditions: value.medicalConditions,
      preferences: value.preferences
    };

    // Remove undefined values
    Object.keys(profileData).forEach(key => 
      profileData[key] === undefined && delete profileData[key]
    );

    const updatedProfile = await supabaseService.upsertUserProfile(req.user.id, profileData);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedProfile
    });
  } catch (error) {
    console.error('❌ Failed to update profile:', error);
    throw new APIError('Failed to update profile', 500, error.message);
  }
}));

/**
 * @swagger
 * /api/v2/user/subscription:
 *   get:
 *     summary: Get user subscription details
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription details retrieved
 */
router.get('/subscription', asyncHandler(async (req, res) => {
  console.log('💳 Fetching subscription details...');

  try {
    const subscription = await supabaseService.getUserSubscription(req.user.id);
    const usage = await supabaseService.getMonthlyUsage(req.user.id);

    res.json({
      success: true,
      data: {
        subscription: {
          plan: subscription.subscription_plans || subscription.plan,
          status: subscription.status || 'active',
          currentPeriodEnd: subscription.current_period_end,
          cancelAtPeriodEnd: subscription.cancel_at_period_end || false
        },
        usage: {
          current: usage,
          limits: subscription.subscription_plans?.limits || subscription.plan?.limits || {}
        }
      }
    });
  } catch (error) {
    console.error('❌ Failed to fetch subscription:', error);
    throw new APIError('Failed to fetch subscription', 500, error.message);
  }
}));

/**
 * @swagger
 * /api/v2/user/usage:
 *   get:
 *     summary: Get current month usage statistics
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Usage statistics retrieved
 */
router.get('/usage', asyncHandler(async (req, res) => {
  console.log('📊 Fetching usage statistics...');

  try {
    const usage = await supabaseService.getMonthlyUsage(req.user.id);
    const subscription = await supabaseService.getUserSubscription(req.user.id);
    const limits = subscription.subscription_plans?.limits || subscription.plan?.limits || {};

    res.json({
      success: true,
      data: {
        period: {
          start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
        },
        usage: {
          workouts: {
            used: usage.workouts,
            limit: limits.workouts_per_month || 10,
            remaining: Math.max(0, (limits.workouts_per_month || 10) - usage.workouts)
          },
          coachingCues: {
            used: usage.coaching,
            limit: limits.coaching_cues_per_month || 0,
            remaining: Math.max(0, (limits.coaching_cues_per_month || 0) - usage.coaching)
          },
          modifications: {
            used: usage.modifications,
            limit: limits.modifications_per_month || 5,
            remaining: Math.max(0, (limits.modifications_per_month || 5) - usage.modifications)
          },
          total: usage.total
        }
      }
    });
  } catch (error) {
    console.error('❌ Failed to fetch usage:', error);
    throw new APIError('Failed to fetch usage statistics', 500, error.message);
  }
}));

/**
 * @swagger
 * /api/v2/user/api-tokens:
 *   get:
 *     summary: List user's API tokens
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: API tokens retrieved
 */
router.get('/api-tokens', asyncHandler(async (req, res) => {
  console.log('🔑 Fetching API tokens...');

  try {
    const tokens = await supabaseService.getUserApiTokens(req.user.id);

    res.json({
      success: true,
      data: tokens.map(token => ({
        id: token.id,
        name: token.name,
        description: token.description,
        lastUsedAt: token.last_used_at,
        createdAt: token.created_at,
        isActive: token.is_active
      }))
    });
  } catch (error) {
    console.error('❌ Failed to fetch API tokens:', error);
    throw new APIError('Failed to fetch API tokens', 500, error.message);
  }
}));

/**
 * @swagger
 * /api/v2/user/api-tokens:
 *   post:
 *     summary: Create new API token
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               expiresIn:
 *                 type: number
 *                 description: Days until expiration
 *     responses:
 *       201:
 *         description: Token created successfully
 */
router.post('/api-tokens', requireSubscription(['pro', 'elite']), asyncHandler(async (req, res) => {
  const { error, value } = createApiTokenSchema.validate(req.body);
  if (error) {
    throw new APIError('Validation failed', 400, error.details);
  }

  console.log('🔑 Creating API token...');

  try {
    const tokenData = await supabaseService.createApiToken(
      req.user.id,
      value.name,
      value.description
    );

    res.status(201).json({
      success: true,
      message: 'API token created successfully. Store this token securely - it will not be shown again.',
      data: {
        id: tokenData.id,
        name: tokenData.name,
        description: tokenData.description,
        token: tokenData.token, // Only returned once!
        createdAt: tokenData.created_at
      }
    });
  } catch (error) {
    console.error('❌ Failed to create API token:', error);
    throw new APIError('Failed to create API token', 500, error.message);
  }
}));

/**
 * @swagger
 * /api/v2/user/api-tokens/{tokenId}:
 *   delete:
 *     summary: Revoke API token
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tokenId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Token revoked successfully
 */
router.delete('/api-tokens/:tokenId', asyncHandler(async (req, res) => {
  console.log('🔑 Revoking API token...');

  try {
    await supabaseService.revokeApiToken(req.user.id, req.params.tokenId);

    res.json({
      success: true,
      message: 'API token revoked successfully'
    });
  } catch (error) {
    console.error('❌ Failed to revoke API token:', error);
    throw new APIError('Failed to revoke API token', 500, error.message);
  }
}));

/**
 * @swagger
 * /api/v2/user/workout-history:
 *   get:
 *     summary: Get workout history
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Workout history retrieved
 */
router.get('/workout-history', asyncHandler(async (req, res) => {
  console.log('📋 Fetching workout history...');

  const limit = parseInt(req.query.limit) || 20;
  const offset = parseInt(req.query.offset) || 0;

  try {
    const history = await supabaseService.getWorkoutHistory(req.user.id, limit, offset);

    res.json({
      success: true,
      data: {
        workouts: history.data,
        pagination: {
          total: history.total,
          limit,
          offset,
          hasMore: offset + limit < history.total
        }
      }
    });
  } catch (error) {
    console.error('❌ Failed to fetch workout history:', error);
    throw new APIError('Failed to fetch workout history', 500, error.message);
  }
}));

/**
 * @swagger
 * /api/v2/user/delete-account:
 *   delete:
 *     summary: Delete user account
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted successfully
 */
router.delete('/delete-account', asyncHandler(async (req, res) => {
  console.log('⚠️ Processing account deletion...');

  try {
    // Delete user from Supabase Auth (will cascade delete related data)
    const { error } = await supabaseService.admin.auth.admin.deleteUser(req.user.id);
    
    if (error) {
      throw error;
    }

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('❌ Failed to delete account:', error);
    throw new APIError('Failed to delete account', 500, error.message);
  }
}));

export default router;