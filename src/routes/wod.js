import express from 'express';
import Joi from 'joi';
import langchainService from '../services/langchainService.js';
import supabaseService from '../services/supabaseService.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { APIError } from '../middleware/errorHandler.js';
import { authenticateRequest, requireSubscription, trackAndLimitUsage } from '../middleware/supabaseAuth.js';

const router = express.Router();

// Apply authentication and usage tracking to all routes
router.use(authenticateRequest);
router.use(trackAndLimitUsage);

// Validation schemas
const wodGenerationSchema = Joi.object({
  fitnessLevel: Joi.string().valid('beginner', 'intermediate', 'advanced').required(),
  goals: Joi.array().items(Joi.string()).min(1).required(),
  availableEquipment: Joi.array().items(Joi.string()).min(1).required(),
  duration: Joi.number().min(300000).max(7200000).optional(), // 5 minutes to 2 hours in milliseconds
  limitations: Joi.array().items(Joi.string()).optional(),
  preferences: Joi.object().optional()
});

const coachingCuesSchema = Joi.object({
  workout: Joi.object().required(),
  userLevel: Joi.string().valid('beginner', 'intermediate', 'advanced').optional()
});

const explanationSchema = Joi.object({
  workout: Joi.object().required(),
  userGoals: Joi.array().items(Joi.string()).optional()
});

const modificationSchema = Joi.object({
  exercise: Joi.object({
    name: Joi.string().required(),
    description: Joi.string().optional(),
    difficulty: Joi.number().min(1).max(5).optional()
  }).required(),
  userLevel: Joi.string().valid('beginner', 'intermediate', 'advanced').required(),
  limitations: Joi.array().items(Joi.string()).optional()
});

/**
 * @swagger
 * /api/v2/wod/generate:
 *   post:
 *     summary: Generate a personalized CrossFit workout
 *     tags: [WOD]
 *     security:
 *       - bearerAuth: []
 *       - apiToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fitnessLevel
 *               - goals
 *               - availableEquipment
 *             properties:
 *               fitnessLevel:
 *                 type: string
 *                 enum: [beginner, intermediate, advanced]
 *               goals:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["strength", "conditioning"]
 *               availableEquipment:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["dumbbells", "kettlebells", "pull_up_bar"]
 *               duration:
 *                 type: integer
 *                 description: Workout duration in milliseconds
 *                 example: 1200000
 *               limitations:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["knee_injury"]
 *               preferences:
 *                 type: object
 *                 properties:
 *                   workoutType:
 *                     type: string
 *                     enum: [amrap, for_time, emom, strength]
 *                   intensity:
 *                     type: string
 *                     enum: [low, medium, high]
 *     responses:
 *       200:
 *         description: Workout generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         workout:
 *                           $ref: '#/components/schemas/Workout'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.post('/generate', asyncHandler(async (req, res) => {
  // Validate request body
  const { error, value } = wodGenerationSchema.validate(req.body);
  if (error) {
    throw new APIError('Validation failed', 400, error.details);
  }

  console.log('🏋️ Generating WOD for user:', req.user.id);

  try {
    // Add user ID to the request
    const requestData = {
      ...value,
      userId: req.user.id
    };

    // Generate workout using LangChain service
    const aiResponse = await langchainService.generateWorkout(requestData);
    
    // Store AI provider for usage tracking
    res.locals.aiProvider = aiResponse.provider;
    
    // Save workout to database for future reference
    let savedWorkout = null;
    try {
      const { data: workout, error: saveError } = await supabaseService.admin
        .from('workouts')
        .insert({
          name: aiResponse.content.name,
          workout_type: aiResponse.content.type,
          time_cap_minutes: aiResponse.content.timeCapMinutes,
          rounds: aiResponse.content.rounds,
          description: aiResponse.content.description,
          exercises: aiResponse.content.movements,
          difficulty_level: req.user.fitness_level || 'intermediate',
          estimated_duration_minutes: aiResponse.content.estimatedDurationMinutes
        })
        .select()
        .single();
        
      if (!saveError) {
        savedWorkout = workout;
      }
    } catch (saveError) {
      console.warn('Failed to save workout to database:', saveError);
    }

    // Add metadata
    const response = {
      success: true,
      data: {
        workout: {
          ...aiResponse.content,
          id: savedWorkout?.id || null
        },
        metadata: {
          generatedAt: aiResponse.timestamp,
          provider: aiResponse.provider,
          version: '2.0.0',
          requestId: `wod_${Date.now()}`,
          tokensUsed: aiResponse.tokens || 0
        }
      }
    };

    console.log('✅ WOD generated successfully with LangChain');
    res.json(response);

  } catch (error) {
    console.error('❌ WOD generation failed:', error.message);
    if (error instanceof APIError) throw error;
    throw new APIError('Failed to generate workout', 500, error.message);
  }
}));

/**
 * @swagger
 * /api/v2/wod/coaching-cues:
 *   post:
 *     summary: Generate AI coaching cues for a workout
 *     tags: [WOD]
 *     security:
 *       - bearerAuth: []
 *       - apiToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - workout
 *             properties:
 *               workout:
 *                 $ref: '#/components/schemas/Workout'
 *               userLevel:
 *                 type: string
 *                 enum: [beginner, intermediate, advanced]
 *                 default: intermediate
 *     responses:
 *       200:
 *         description: Coaching cues generated successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/coaching-cues', requireSubscription(['pro', 'elite']), asyncHandler(async (req, res) => {
  const { error, value } = coachingCuesSchema.validate(req.body);
  if (error) {
    throw new APIError('Validation failed', 400, error.details);
  }

  console.log('💬 Generating coaching cues with LangChain...');

  try {
    const userLevel = value.userLevel || req.user.fitness_level || 'intermediate';
    const aiResponse = await langchainService.generateCoachingCues(value.workout, userLevel);
    
    // Store AI provider for usage tracking
    res.locals.aiProvider = aiResponse.provider;
    
    const response = {
      success: true,
      data: {
        coachingCues: aiResponse.content,
        metadata: {
          generatedAt: aiResponse.timestamp,
          provider: aiResponse.provider,
          count: aiResponse.content.length,
          userLevel: userLevel
        }
      }
    };

    console.log('✅ Coaching cues generated successfully with LangChain');
    res.json(response);

  } catch (error) {
    console.error('❌ Coaching cues generation failed:', error.message);
    if (error instanceof APIError) throw error;
    throw new APIError('Failed to generate coaching cues', 500, error.message);
  }
}));

/**
 * @swagger
 * /api/v2/wod/explain:
 *   post:
 *     summary: Get AI explanation of workout design and benefits
 *     tags: [WOD]
 *     security:
 *       - bearerAuth: []
 *       - apiToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - workout
 *             properties:
 *               workout:
 *                 $ref: '#/components/schemas/Workout'
 *               userGoals:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["strength", "muscle_gain"]
 *     responses:
 *       200:
 *         description: Workout explanation generated successfully
 */
router.post('/explain', asyncHandler(async (req, res) => {
  const { error, value } = explanationSchema.validate(req.body);
  if (error) {
    throw new APIError('Validation failed', 400, error.details);
  }

  console.log('📝 Generating workout explanation with LangChain...');

  try {
    const aiResponse = await langchainService.generateExplanation(value.workout, value.userGoals);
    
    // Store AI provider for usage tracking
    res.locals.aiProvider = aiResponse.provider;

    const response = {
      success: true,
      data: {
        explanation: aiResponse.content.trim(),
        metadata: {
          generatedAt: aiResponse.timestamp,
          provider: aiResponse.provider,
          wordCount: aiResponse.wordCount || aiResponse.content.split(' ').length
        }
      }
    };

    console.log('✅ Workout explanation generated successfully with LangChain');
    res.json(response);

  } catch (error) {
    console.error('❌ Explanation generation failed:', error.message);
    if (error instanceof APIError) throw error;
    throw new APIError('Failed to generate explanation', 500, error.message);
  }
}));

/**
 * @swagger
 * /api/v2/wod/modifications:
 *   post:
 *     summary: Generate exercise modifications and scaling options
 *     tags: [WOD]
 *     security:
 *       - bearerAuth: []
 *       - apiToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - exercise
 *               - userLevel
 *             properties:
 *               exercise:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 *               userLevel:
 *                 type: string
 *                 enum: [beginner, intermediate, advanced]
 *               limitations:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Exercise modifications generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         modifications:
 *                           $ref: '#/components/schemas/ExerciseModifications'
 */
router.post('/modifications', requireSubscription(['pro', 'elite']), asyncHandler(async (req, res) => {
  const { error, value } = modificationSchema.validate(req.body);
  if (error) {
    throw new APIError('Validation failed', 400, error.details);
  }

  console.log('🔄 Generating exercise modifications with LangChain...');

  try {
    const aiResponse = await langchainService.generateModifications(
      value.exercise,
      value.userLevel,
      value.limitations || []
    );
    
    // Store AI provider for usage tracking
    res.locals.aiProvider = aiResponse.provider;

    const response = {
      success: true,
      data: {
        modifications: aiResponse.content,
        metadata: {
          generatedAt: aiResponse.timestamp,
          provider: aiResponse.provider,
          exercise: value.exercise.name,
          userLevel: value.userLevel
        }
      }
    };

    console.log('✅ Exercise modifications generated successfully with LangChain');
    res.json(response);

  } catch (error) {
    console.error('❌ Modifications generation failed:', error.message);
    if (error instanceof APIError) throw error;
    throw new APIError('Failed to generate modifications', 500, error.message);
  }
}));

/**
 * @swagger
 * /api/v2/wod/test:
 *   get:
 *     summary: Test endpoint to verify AI integration
 *     tags: [WOD]
 *     security:
 *       - bearerAuth: []
 *       - apiToken: []
 *     responses:
 *       200:
 *         description: Test completed successfully
 */
router.get('/test', asyncHandler(async (req, res) => {
  console.log('🧪 Running WOD API test with LangChain...');

  const testRequest = {
    userId: req.user.id,
    fitnessLevel: 'intermediate',
    goals: ['strength', 'conditioning'],
    availableEquipment: ['dumbbells', 'jump_rope'],
    duration: 900000 // 15 minutes
  };

  try {
    const aiResponse = await langchainService.generateWorkout(testRequest);
    
    // Store AI provider for usage tracking
    res.locals.aiProvider = aiResponse.provider;
    
    const response = {
      success: true,
      message: 'WOD API test completed successfully with LangChain',
      data: {
        testRequest: testRequest,
        aiProvider: aiResponse.provider,
        workoutName: aiResponse.content.name,
        movementsCount: aiResponse.content.movements?.length || 0,
        timestamp: aiResponse.timestamp,
        user: {
          id: req.user.id,
          subscription: req.subscription?.plan?.name || 'free'
        }
      }
    };

    console.log('✅ WOD API test passed with LangChain');
    res.json(response);

  } catch (error) {
    console.error('❌ WOD API test failed:', error.message);
    if (error instanceof APIError) throw error;
    throw new APIError('WOD API test failed', 500, error.message);
  }
}));

/**
 * @swagger
 * /api/v2/wod/history:
 *   get:
 *     summary: Get user's workout history
 *     tags: [WOD]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of workouts to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of workouts to skip
 *     responses:
 *       200:
 *         description: Workout history retrieved
 */
router.get('/history', asyncHandler(async (req, res) => {
  console.log('📋 Fetching workout history...');

  const limit = Math.min(parseInt(req.query.limit) || 20, 100); // Max 100
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
 * /api/v2/wod/log:
 *   post:
 *     summary: Log a completed workout
 *     tags: [WOD]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               workoutId:
 *                 type: string
 *                 format: uuid
 *               durationSeconds:
 *                 type: integer
 *               roundsCompleted:
 *                 type: integer
 *               repsCompleted:
 *                 type: integer
 *               weightUsed:
 *                 type: object
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Workout logged successfully
 */
router.post('/log', asyncHandler(async (req, res) => {
  console.log('📊 Logging workout completion...');

  try {
    const workoutLog = await supabaseService.logWorkout(req.user.id, {
      workout_id: req.body.workoutId,
      duration_seconds: req.body.durationSeconds,
      rounds_completed: req.body.roundsCompleted,
      reps_completed: req.body.repsCompleted,
      weight_used: req.body.weightUsed || {},
      notes: req.body.notes,
      performance_data: req.body.performanceData || {}
    });

    res.status(201).json({
      success: true,
      message: 'Workout logged successfully',
      data: workoutLog
    });
  } catch (error) {
    console.error('❌ Failed to log workout:', error);
    throw new APIError('Failed to log workout', 500, error.message);
  }
}));

export default router;