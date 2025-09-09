import { ChatAnthropic } from '@langchain/anthropic';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { StringOutputParser, JsonOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Anthropic model with Claude
export const anthropicModel = new ChatAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  modelName: 'claude-3-sonnet-20240229',
  temperature: 0.7,
  maxTokens: 2500,
  verbose: process.env.NODE_ENV === 'development'
});

// Workout generation prompt template
export const workoutGenerationPrompt = ChatPromptTemplate.fromMessages([
  ['system', `You are an expert CrossFit coach with 15+ years of experience. You create personalized, safe, and effective workouts following CrossFit methodology.
  
  Core Principles:
  - Constantly varied functional movements at high intensity
  - Scalable for all fitness levels
  - Focus on measurable, observable, repeatable results
  - Emphasize proper form over speed
  
  Always return valid JSON matching the specified schema.`],
  ['human', `Create a CrossFit workout for:
  Fitness Level: {fitnessLevel}
  Goals: {goals}
  Equipment: {availableEquipment}
  Duration: {duration} minutes
  Limitations: {limitations}
  
  Return JSON with this structure:
  {{
    "name": "Creative workout name",
    "type": "for_time|amrap|emom|tabata|strength|chipper",
    "description": "Brief motivating description",
    "timeCapMinutes": number or null,
    "rounds": number or null,
    "movements": [
      {{
        "exerciseId": "unique_id",
        "exerciseName": "Exercise name",
        "reps": number,
        "weight": number or null,
        "unit": "lbs|kg|bodyweight",
        "notes": "form cues or scaling notes"
      }}
    ],
    "warmup": ["warmup movement 1", "warmup movement 2"],
    "cooldown": ["cooldown movement 1", "cooldown movement 2"],
    "instructions": "How to perform the workout",
    "difficultyScore": 1-10,
    "estimatedDurationMinutes": number,
    "targetHeartRateZone": "Zone 2-5",
    "muscleGroups": ["primary", "secondary"]
  }}`]
]);

// Coaching cues prompt template
export const coachingCuesPrompt = ChatPromptTemplate.fromMessages([
  ['system', `You are an experienced CrossFit coach providing clear, actionable coaching cues. Focus on:
  - Safety and proper form
  - Pacing strategy
  - Mental approach
  - Common mistakes to avoid
  - Breathing patterns
  
  Return an array of 5-7 specific, actionable coaching cues as JSON array.`],
  ['human', `Provide coaching cues for this workout:
  {workout}
  
  User Level: {userLevel}
  
  Return format: ["cue 1", "cue 2", "cue 3", ...]`]
]);

// Exercise modifications prompt template
export const modificationsPrompt = ChatPromptTemplate.fromMessages([
  ['system', `You are a CrossFit coach specializing in movement scaling and accessibility. Provide safe, effective modifications that maintain the intended stimulus while accommodating different abilities and limitations.`],
  ['human', `Provide modifications for:
  Exercise: {exerciseName}
  Description: {exerciseDescription}
  User Level: {userLevel}
  Limitations: {limitations}
  
  Return JSON:
  {{
    "easier": ["3-4 easier variations"],
    "harder": ["3-4 harder progressions"],
    "equipment_alternatives": ["3-4 equipment substitutions"],
    "injury_modifications": ["2-3 injury-specific adaptations"],
    "technique_tips": ["2-3 key form cues"]
  }}`]
]);

// Workout explanation prompt template
export const explanationPrompt = ChatPromptTemplate.fromMessages([
  ['system', `You are a knowledgeable CrossFit coach explaining the science and methodology behind workout programming. Be educational, motivating, and concise.`],
  ['human', `Explain this workout's design and benefits:
  Workout: {workout}
  User Goals: {userGoals}
  
  Address:
  - Why this structure was chosen
  - How it targets their goals
  - Expected physiological adaptations
  - Mental benefits
  
  Keep under 200 words, be motivating and educational.`]
]);

// Create chains for each use case
export const workoutGenerationChain = RunnableSequence.from([
  workoutGenerationPrompt,
  anthropicModel,
  new JsonOutputParser()
]);

export const coachingCuesChain = RunnableSequence.from([
  coachingCuesPrompt,
  anthropicModel,
  new JsonOutputParser()
]);

export const modificationsChain = RunnableSequence.from([
  modificationsPrompt,
  anthropicModel,
  new JsonOutputParser()
]);

export const explanationChain = RunnableSequence.from([
  explanationPrompt,
  anthropicModel,
  new StringOutputParser()
]);

// LangSmith configuration (optional)
export const langsmithConfig = {
  projectName: process.env.LANGCHAIN_PROJECT || 'crossfit-wod-ai',
  tracingEnabled: process.env.LANGCHAIN_TRACING_V2 === 'true',
  apiKey: process.env.LANGCHAIN_API_KEY
};

// Export configuration object
export default {
  model: anthropicModel,
  chains: {
    workoutGeneration: workoutGenerationChain,
    coachingCues: coachingCuesChain,
    modifications: modificationsChain,
    explanation: explanationChain
  },
  prompts: {
    workoutGeneration: workoutGenerationPrompt,
    coachingCues: coachingCuesPrompt,
    modifications: modificationsPrompt,
    explanation: explanationPrompt
  },
  langsmith: langsmithConfig
};