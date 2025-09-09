import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

// Initialize AI clients
export const anthropicClient = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
export const geminiModel = geminiClient.getGenerativeModel({ model: 'gemini-pro' });

// AI Provider configurations
export const AI_PROVIDERS = {
  CLAUDE: 'claude',
  OPENAI: 'openai', 
  GEMINI: 'gemini'
};

export const AI_MODELS = {
  [AI_PROVIDERS.CLAUDE]: 'claude-3-sonnet-20240229',
  [AI_PROVIDERS.OPENAI]: 'gpt-4',
  [AI_PROVIDERS.GEMINI]: 'gemini-pro'
};

// Provider selection strategy for different use cases
export const PROVIDER_STRATEGY = {
  WOD_GENERATION: [AI_PROVIDERS.CLAUDE, AI_PROVIDERS.OPENAI, AI_PROVIDERS.GEMINI],
  COACHING_CUES: [AI_PROVIDERS.CLAUDE, AI_PROVIDERS.OPENAI],
  EXERCISE_MODIFICATIONS: [AI_PROVIDERS.GEMINI, AI_PROVIDERS.CLAUDE],
  EXPLANATIONS: [AI_PROVIDERS.OPENAI, AI_PROVIDERS.CLAUDE],
  RECOMMENDATIONS: [AI_PROVIDERS.CLAUDE, AI_PROVIDERS.GEMINI]
};

// Validate that all required API keys are present
export function validateAIConfiguration() {
  const errors = [];
  
  if (!process.env.ANTHROPIC_API_KEY) {
    errors.push('ANTHROPIC_API_KEY is required');
  }
  
  if (!process.env.OPENAI_API_KEY) {
    errors.push('OPENAI_API_KEY is required');
  }
  
  if (!process.env.GEMINI_API_KEY) {
    errors.push('GEMINI_API_KEY is required');
  }
  
  if (errors.length > 0) {
    throw new Error(`AI Configuration errors: ${errors.join(', ')}`);
  }
  
  console.log('✅ All AI providers configured successfully');
}