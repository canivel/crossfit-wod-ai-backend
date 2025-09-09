import {
  workoutGenerationChain,
  coachingCuesChain,
  modificationsChain,
  explanationChain
} from '../config/langchain.js';
import { APIError } from '../middleware/errorHandler.js';

export class LangChainService {
  constructor() {
    this.chains = {
      workoutGeneration: workoutGenerationChain,
      coachingCues: coachingCuesChain,
      modifications: modificationsChain,
      explanation: explanationChain
    };
  }

  /**
   * Generate a personalized workout using LangChain
   */
  async generateWorkout(request) {
    try {
      console.log('🏋️ Generating workout with LangChain...');
      
      // Prepare input for the chain
      const input = {
        fitnessLevel: request.fitnessLevel,
        goals: Array.isArray(request.goals) ? request.goals.join(', ') : 'general fitness',
        availableEquipment: Array.isArray(request.availableEquipment) 
          ? request.availableEquipment.join(', ') 
          : 'bodyweight only',
        duration: request.duration ? Math.floor(request.duration / 60000) : 20,
        limitations: Array.isArray(request.limitations) 
          ? request.limitations.join(', ') 
          : 'none'
      };

      // Invoke the chain
      const workout = await this.chains.workoutGeneration.invoke(input);

      // Validate the response structure
      if (!workout.name || !workout.movements || !Array.isArray(workout.movements)) {
        throw new Error('Invalid workout structure returned from AI');
      }

      // Add metadata
      return {
        content: workout,
        provider: 'claude-langchain',
        timestamp: new Date().toISOString(),
        tokens: workout.movements.length * 50 // Rough estimate
      };
    } catch (error) {
      console.error('❌ LangChain workout generation failed:', error);
      
      if (error.message?.includes('rate limit')) {
        throw new APIError('AI rate limit exceeded', 429, 'Please try again in a few moments');
      }
      
      if (error.message?.includes('API key')) {
        throw new APIError('AI authentication failed', 503, 'Configuration issue');
      }
      
      throw new APIError(
        'Failed to generate workout',
        500,
        error.message || 'AI service error'
      );
    }
  }

  /**
   * Generate coaching cues for a workout
   */
  async generateCoachingCues(workout, userLevel = 'intermediate') {
    try {
      console.log('💬 Generating coaching cues with LangChain...');
      
      const input = {
        workout: JSON.stringify(workout, null, 2),
        userLevel: userLevel
      };

      const cues = await this.chains.coachingCues.invoke(input);

      // Validate response
      if (!Array.isArray(cues)) {
        throw new Error('Invalid coaching cues format');
      }

      return {
        content: cues,
        provider: 'claude-langchain',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ LangChain coaching cues generation failed:', error);
      throw new APIError(
        'Failed to generate coaching cues',
        500,
        error.message || 'AI service error'
      );
    }
  }

  /**
   * Generate exercise modifications
   */
  async generateModifications(exercise, userLevel, limitations = []) {
    try {
      console.log('🔄 Generating modifications with LangChain...');
      
      const input = {
        exerciseName: exercise.name,
        exerciseDescription: exercise.description || 'Standard CrossFit movement',
        userLevel: userLevel,
        limitations: Array.isArray(limitations) 
          ? limitations.join(', ') 
          : 'none'
      };

      const modifications = await this.chains.modifications.invoke(input);

      // Validate structure
      if (!modifications.easier || !modifications.harder) {
        throw new Error('Invalid modifications structure');
      }

      return {
        content: modifications,
        provider: 'claude-langchain',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ LangChain modifications generation failed:', error);
      throw new APIError(
        'Failed to generate modifications',
        500,
        error.message || 'AI service error'
      );
    }
  }

  /**
   * Generate workout explanation
   */
  async generateExplanation(workout, userGoals = []) {
    try {
      console.log('📝 Generating explanation with LangChain...');
      
      const input = {
        workout: JSON.stringify(workout, null, 2),
        userGoals: Array.isArray(userGoals) 
          ? userGoals.join(', ') 
          : 'general fitness'
      };

      const explanation = await this.chains.explanation.invoke(input);

      return {
        content: explanation,
        provider: 'claude-langchain',
        timestamp: new Date().toISOString(),
        wordCount: explanation.split(' ').length
      };
    } catch (error) {
      console.error('❌ LangChain explanation generation failed:', error);
      throw new APIError(
        'Failed to generate explanation',
        500,
        error.message || 'AI service error'
      );
    }
  }

  /**
   * Generate a custom prompt response (for future flexibility)
   */
  async generateCustom(prompt, options = {}) {
    try {
      const { temperature = 0.7, maxTokens = 1500 } = options;
      
      // Direct model call for custom prompts
      const response = await this.chains.workoutGeneration.getLangChainModel().invoke(
        prompt,
        {
          temperature,
          maxTokens
        }
      );

      return {
        content: response.content,
        provider: 'claude-langchain',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ LangChain custom generation failed:', error);
      throw new APIError(
        'Failed to generate response',
        500,
        error.message || 'AI service error'
      );
    }
  }

  /**
   * Validate workout structure
   */
  validateWorkout(workout) {
    const requiredFields = ['name', 'type', 'movements'];
    const missingFields = requiredFields.filter(field => !workout[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
    
    if (!Array.isArray(workout.movements) || workout.movements.length === 0) {
      throw new Error('Workout must have at least one movement');
    }
    
    return true;
  }
}

// Export singleton instance
export default new LangChainService();