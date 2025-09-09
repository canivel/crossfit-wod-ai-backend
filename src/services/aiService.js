import { anthropicClient, openaiClient, geminiModel, AI_PROVIDERS, PROVIDER_STRATEGY } from '../config/ai.js';
import { APIError } from '../middleware/errorHandler.js';

export class AIService {
  constructor() {
    this.providers = {
      [AI_PROVIDERS.CLAUDE]: this.callClaude.bind(this),
      [AI_PROVIDERS.OPENAI]: this.callOpenAI.bind(this),
      [AI_PROVIDERS.GEMINI]: this.callGemini.bind(this)
    };
  }

  /**
   * Generic method to call AI providers with fallback strategy
   */
  async callAI(prompt, useCase = 'WOD_GENERATION', context = {}) {
    const providerOrder = PROVIDER_STRATEGY[useCase] || [AI_PROVIDERS.CLAUDE];
    
    let lastError;
    
    for (const provider of providerOrder) {
      try {
        console.log(`🤖 Attempting AI call with ${provider}...`);
        const result = await this.providers[provider](prompt, context);
        console.log(`✅ Successfully got response from ${provider}`);
        return {
          content: result,
          provider: provider,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        console.warn(`❌ ${provider} failed:`, error.message);
        lastError = error;
        
        // If it's a rate limit error, try next provider immediately
        if (error.message?.includes('rate limit') || error.message?.includes('quota')) {
          continue;
        }
        
        // For other errors, still try the next provider
        continue;
      }
    }
    
    // If all providers failed, throw the last error
    throw new APIError(
      `All AI providers failed. Last error: ${lastError?.message || 'Unknown error'}`,
      503,
      'Try again later or contact support'
    );
  }

  /**
   * Call Claude/Anthropic API
   */
  async callClaude(prompt, context = {}) {
    try {
      const response = await anthropicClient.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: context.maxTokens || 2000,
        temperature: context.temperature || 0.7,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      return response.content[0]?.text || 'No response from Claude';
    } catch (error) {
      if (error.status === 429) {
        throw new APIError('Claude rate limit exceeded', 429, 'Please try again later');
      }
      if (error.status === 401) {
        throw new APIError('Claude authentication failed', 503, 'API key issue');
      }
      throw new APIError(`Claude API error: ${error.message}`, 503);
    }
  }

  /**
   * Call OpenAI API
   */
  async callOpenAI(prompt, context = {}) {
    try {
      const response = await openaiClient.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: context.maxTokens || 2000,
        temperature: context.temperature || 0.7
      });

      return response.choices[0]?.message?.content || 'No response from OpenAI';
    } catch (error) {
      if (error.status === 429) {
        throw new APIError('OpenAI rate limit exceeded', 429, 'Please try again later');
      }
      if (error.status === 401) {
        throw new APIError('OpenAI authentication failed', 503, 'API key issue');
      }
      throw new APIError(`OpenAI API error: ${error.message}`, 503);
    }
  }

  /**
   * Call Gemini API
   */
  async callGemini(prompt, context = {}) {
    try {
      const result = await geminiModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: context.maxTokens || 2000,
          temperature: context.temperature || 0.7,
        }
      });

      const response = await result.response;
      return response.text() || 'No response from Gemini';
    } catch (error) {
      if (error.message?.includes('quota') || error.message?.includes('limit')) {
        throw new APIError('Gemini rate limit exceeded', 429, 'Please try again later');
      }
      if (error.message?.includes('API_KEY')) {
        throw new APIError('Gemini authentication failed', 503, 'API key issue');
      }
      throw new APIError(`Gemini API error: ${error.message}`, 503);
    }
  }

  /**
   * Generate a workout using AI
   */
  async generateWorkout(request) {
    const prompt = this.buildWodPrompt(request);
    return await this.callAI(prompt, 'WOD_GENERATION', { 
      temperature: 0.8,
      maxTokens: 2500
    });
  }

  /**
   * Generate coaching cues using AI
   */
  async generateCoachingCues(workout) {
    const prompt = this.buildCoachingCuesPrompt(workout);
    return await this.callAI(prompt, 'COACHING_CUES', {
      temperature: 0.6,
      maxTokens: 1500
    });
  }

  /**
   * Generate workout explanation using AI
   */
  async generateExplanation(workout, userGoals) {
    const prompt = this.buildExplanationPrompt(workout, userGoals);
    return await this.callAI(prompt, 'EXPLANATIONS', {
      temperature: 0.7,
      maxTokens: 1000
    });
  }

  /**
   * Generate exercise modifications using AI
   */
  async generateModifications(exercise, userLevel, limitations = []) {
    const prompt = this.buildModificationPrompt(exercise, userLevel, limitations);
    return await this.callAI(prompt, 'EXERCISE_MODIFICATIONS', {
      temperature: 0.6,
      maxTokens: 800
    });
  }

  /**
   * Build WOD generation prompt
   */
  buildWodPrompt(request) {
    return `You are an expert CrossFit coach creating a personalized workout. Generate a workout in JSON format with the following structure:

{
  "name": "Workout name",
  "type": "for_time|amrap|emom|tabata|strength|chipper", 
  "description": "Brief description",
  "timeCapMinutes": number or null,
  "rounds": number or null,
  "movements": [
    {
      "exerciseId": "unique_id",
      "exerciseName": "Exercise name",
      "reps": number,
      "weight": number or null,
      "unit": "lbs|kg|bodyweight",
      "notes": "scaling or form cues"
    }
  ],
  "instructions": "How to perform the workout",
  "difficultyScore": number (1-10),
  "estimatedDurationMinutes": number
}

User Details:
- Fitness Level: ${request.fitnessLevel}
- Goals: ${request.goals?.join(', ') || 'general fitness'}
- Available Equipment: ${request.availableEquipment?.join(', ') || 'bodyweight only'}
- Preferred Duration: ${request.duration ? Math.floor(request.duration / 60000) + ' minutes' : '15-20 minutes'}
- Limitations: ${request.limitations?.join(', ') || 'none specified'}

CrossFit Methodology Guidelines:
- Constantly varied (mix modalities and movements)
- High intensity (appropriate for user's level)
- Functional movements (real-world applicable)
- Scalable for all fitness levels

Create a challenging but achievable workout that aligns with CrossFit principles and the user's specific requirements. Ensure all exercises can be performed with their available equipment.`;
  }

  /**
   * Build coaching cues prompt
   */
  buildCoachingCuesPrompt(workout) {
    return `As an experienced CrossFit coach, provide 5-7 specific coaching cues for this workout. Return as JSON array of strings.

Workout: ${JSON.stringify(workout, null, 2)}

Focus on:
- Pacing strategy
- Form cues for key movements
- Breathing patterns
- Mental approach
- Safety considerations
- Scaling options if needed

Return format: ["cue 1", "cue 2", "cue 3", ...]`;
  }

  /**
   * Build explanation prompt
   */
  buildExplanationPrompt(workout, userGoals) {
    return `Explain why this workout was designed this way and how it helps achieve the user's goals. Keep it under 200 words and make it motivational.

Workout: ${JSON.stringify(workout, null, 2)}
User Goals: ${userGoals?.join(', ') || 'general fitness'}

Explain:
- The purpose behind the workout structure
- How it addresses their goals
- What fitness domains it targets
- What they should expect during the workout`;
  }

  /**
   * Build modification prompt
   */
  buildModificationPrompt(exercise, userLevel, limitations) {
    return `Provide exercise modifications for different ability levels. Return as JSON object.

Exercise: ${exercise.name}
Description: ${exercise.description || 'Standard CrossFit movement'}
User Level: ${userLevel}
Limitations: ${limitations.join(', ') || 'none'}

Return format:
{
  "easier": ["modification 1", "modification 2"],
  "harder": ["progression 1", "progression 2"], 
  "equipment_alternatives": ["alternative 1", "alternative 2"],
  "injury_modifications": ["safe option 1", "safe option 2"]
}

Focus on maintaining the movement pattern while adjusting intensity.`;
  }
}

// Export singleton instance
export default new AIService();