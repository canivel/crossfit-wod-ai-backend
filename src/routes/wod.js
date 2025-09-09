import express from 'express';
import Joi from 'joi';
import aiService from '../services/aiService.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { APIError } from '../middleware/errorHandler.js';

const router = express.Router();

// Validation schemas
const wodGenerationSchema = Joi.object({
  userId: Joi.string().required(),
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
 * POST /api/v1/wod/generate
 * Generate a new WOD based on user parameters
 */
router.post('/generate', asyncHandler(async (req, res) => {
  // Validate request body
  const { error, value } = wodGenerationSchema.validate(req.body);
  if (error) {
    throw new APIError('Validation failed', 400, error.details);
  }

  console.log('🏋️ Generating WOD for user:', value.userId);

  try {
    // Generate workout using AI service
    const aiResponse = await aiService.generateWorkout(value);
    
    // Parse the AI response (it should be JSON)
    let workout;
    try {
      workout = JSON.parse(aiResponse.content);
    } catch (parseError) {
      // If JSON parsing fails, create a structured response
      console.warn('⚠️ AI response was not valid JSON, attempting to structure it...');
      workout = {
        name: 'AI Generated Workout',
        type: 'amrap',
        description: aiResponse.content.substring(0, 500), // First 500 chars
        movements: [],
        error: 'Response parsing failed',
        rawResponse: aiResponse.content
      };
    }

    // Add metadata
    const response = {
      success: true,
      data: {
        workout: workout,
        metadata: {
          generatedAt: new Date().toISOString(),
          provider: aiResponse.provider,
          version: '1.0.0',
          requestId: `wod_${Date.now()}`
        }
      }
    };

    console.log('✅ WOD generated successfully');
    res.json(response);

  } catch (error) {
    console.error('❌ WOD generation failed:', error.message);
    throw new APIError('Failed to generate workout', 500, error.message);
  }
}));

/**
 * POST /api/v1/wod/coaching-cues
 * Generate coaching cues for a workout
 */
router.post('/coaching-cues', asyncHandler(async (req, res) => {
  const { error, value } = coachingCuesSchema.validate(req.body);
  if (error) {
    throw new APIError('Validation failed', 400, error.details);
  }

  console.log('💬 Generating coaching cues...');

  try {
    const aiResponse = await aiService.generateCoachingCues(value.workout);
    
    let cues;
    try {
      cues = JSON.parse(aiResponse.content);
      if (!Array.isArray(cues)) {
        throw new Error('Response is not an array');
      }
    } catch (parseError) {
      // Fallback: split by lines and filter
      cues = aiResponse.content
        .split('\n')
        .filter(line => line.trim().length > 0)
        .map(line => line.replace(/^[-•*]\s*/, '').trim());
    }

    const response = {
      success: true,
      data: {
        coachingCues: cues,
        metadata: {
          generatedAt: new Date().toISOString(),
          provider: aiResponse.provider,
          count: cues.length
        }
      }
    };

    console.log('✅ Coaching cues generated successfully');
    res.json(response);

  } catch (error) {
    console.error('❌ Coaching cues generation failed:', error.message);
    throw new APIError('Failed to generate coaching cues', 500, error.message);
  }
}));

/**
 * POST /api/v1/wod/explain
 * Generate explanation for a workout
 */
router.post('/explain', asyncHandler(async (req, res) => {
  const { error, value } = explanationSchema.validate(req.body);
  if (error) {
    throw new APIError('Validation failed', 400, error.details);
  }

  console.log('📝 Generating workout explanation...');

  try {
    const aiResponse = await aiService.generateExplanation(value.workout, value.userGoals);

    const response = {
      success: true,
      data: {
        explanation: aiResponse.content.trim(),
        metadata: {
          generatedAt: new Date().toISOString(),
          provider: aiResponse.provider,
          wordCount: aiResponse.content.split(' ').length
        }
      }
    };

    console.log('✅ Workout explanation generated successfully');
    res.json(response);

  } catch (error) {
    console.error('❌ Explanation generation failed:', error.message);
    throw new APIError('Failed to generate explanation', 500, error.message);
  }
}));

/**
 * POST /api/v1/wod/modifications
 * Generate exercise modifications
 */
router.post('/modifications', asyncHandler(async (req, res) => {
  const { error, value } = modificationSchema.validate(req.body);
  if (error) {
    throw new APIError('Validation failed', 400, error.details);
  }

  console.log('🔄 Generating exercise modifications...');

  try {
    const aiResponse = await aiService.generateModifications(
      value.exercise,
      value.userLevel,
      value.limitations || []
    );

    let modifications;
    try {
      modifications = JSON.parse(aiResponse.content);
    } catch (parseError) {
      // Fallback structure
      modifications = {
        easier: ['Scale as needed'],
        harder: ['Increase intensity'],
        equipment_alternatives: ['Bodyweight alternative'],
        injury_modifications: ['Consult a trainer'],
        rawResponse: aiResponse.content
      };
    }

    const response = {
      success: true,
      data: {
        modifications: modifications,
        metadata: {
          generatedAt: new Date().toISOString(),
          provider: aiResponse.provider,
          exercise: value.exercise.name
        }
      }
    };

    console.log('✅ Exercise modifications generated successfully');
    res.json(response);

  } catch (error) {
    console.error('❌ Modifications generation failed:', error.message);
    throw new APIError('Failed to generate modifications', 500, error.message);
  }
}));

/**
 * GET /api/v1/wod/test
 * Test endpoint to verify AI integration
 */
router.get('/test', asyncHandler(async (req, res) => {
  console.log('🧪 Running WOD API test...');

  const testRequest = {
    userId: 'test-user',
    fitnessLevel: 'intermediate',
    goals: ['strength', 'conditioning'],
    availableEquipment: ['dumbbells', 'jump_rope'],
    duration: 900000 // 15 minutes
  };

  try {
    const aiResponse = await aiService.generateWorkout(testRequest);
    
    const response = {
      success: true,
      message: 'WOD API test completed successfully',
      data: {
        testRequest: testRequest,
        aiProvider: aiResponse.provider,
        responseLength: aiResponse.content.length,
        timestamp: new Date().toISOString()
      }
    };

    console.log('✅ WOD API test passed');
    res.json(response);

  } catch (error) {
    console.error('❌ WOD API test failed:', error.message);
    throw new APIError('WOD API test failed', 500, error.message);
  }
}));

export default router;