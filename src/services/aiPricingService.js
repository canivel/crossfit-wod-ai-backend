/**
 * AI Provider Token-Based Pricing Service
 * Manages current AI model pricing per 1K tokens and cost calculations
 */

// Current AI provider pricing (as of January 2025)
// Prices are per 1K tokens (input/output)
const AI_PRICING_TABLE = {
    anthropic: {
        'claude-3-haiku': {
            input: 0.00025,  // $0.25 per 1M tokens
            output: 0.00125  // $1.25 per 1M tokens
        },
        'claude-3-sonnet': {
            input: 0.003,    // $3 per 1M tokens
            output: 0.015    // $15 per 1M tokens
        },
        'claude-3-opus': {
            input: 0.015,    // $15 per 1M tokens
            output: 0.075    // $75 per 1M tokens
        },
        'claude-3.5-sonnet': {
            input: 0.003,    // $3 per 1M tokens
            output: 0.015    // $15 per 1M tokens
        }
    },
    openai: {
        'gpt-3.5-turbo': {
            input: 0.0005,   // $0.50 per 1M tokens
            output: 0.0015   // $1.50 per 1M tokens
        },
        'gpt-4': {
            input: 0.03,     // $30 per 1M tokens
            output: 0.06     // $60 per 1M tokens
        },
        'gpt-4-turbo': {
            input: 0.01,     // $10 per 1M tokens
            output: 0.03     // $30 per 1M tokens
        },
        'gpt-4o': {
            input: 0.005,    // $5 per 1M tokens
            output: 0.015    // $15 per 1M tokens
        }
    },
    google: {
        'gemini-pro': {
            input: 0.0005,   // $0.50 per 1M tokens
            output: 0.0015   // $1.50 per 1M tokens
        },
        'gemini-ultra': {
            input: 0.01,     // $10 per 1M tokens (estimated)
            output: 0.03     // $30 per 1M tokens (estimated)
        },
        'gemini-1.5-pro': {
            input: 0.0035,   // $3.50 per 1M tokens
            output: 0.0105   // $10.50 per 1M tokens
        }
    }
};

// Average token usage estimates for different workout types
const WORKOUT_TOKEN_ESTIMATES = {
    'amrap': { input: 800, output: 1200 },
    'emom': { input: 750, output: 1100 },
    'for-time': { input: 850, output: 1300 },
    'tabata': { input: 700, output: 1000 },
    'chipper': { input: 900, output: 1400 },
    'ladder': { input: 800, output: 1250 },
    'strength': { input: 750, output: 1150 },
    'metcon': { input: 820, output: 1280 },
    'default': { input: 800, output: 1200 }
};

class AIPricingService {
    /**
     * Get current pricing for a specific AI provider and model
     */
    static getCurrentPricing(provider, model) {
        const providerPricing = AI_PRICING_TABLE[provider?.toLowerCase()];
        if (!providerPricing) {
            return null;
        }

        const modelPricing = providerPricing[model?.toLowerCase()];
        if (!modelPricing) {
            // Try to find a fallback model for the provider
            const fallbackModel = Object.keys(providerPricing)[0];
            return providerPricing[fallbackModel] || null;
        }

        return modelPricing;
    }

    /**
     * Calculate cost based on actual token usage
     */
    static calculateCost(provider, model, inputTokens, outputTokens) {
        const pricing = this.getCurrentPricing(provider, model);
        if (!pricing) {
            console.warn(`No pricing found for ${provider}/${model}, returning $0`);
            return 0;
        }

        const inputCost = (inputTokens / 1000) * pricing.input;
        const outputCost = (outputTokens / 1000) * pricing.output;
        const totalCost = inputCost + outputCost;

        return Math.round(totalCost * 1000000) / 1000000; // Round to 6 decimal places
    }

    /**
     * Estimate cost for a workout generation based on type
     */
    static estimateWorkoutCost(provider, model, workoutType = 'default') {
        const tokenEstimate = WORKOUT_TOKEN_ESTIMATES[workoutType] || WORKOUT_TOKEN_ESTIMATES.default;
        return this.calculateCost(provider, model, tokenEstimate.input, tokenEstimate.output);
    }

    /**
     * Get all available providers and models with pricing
     */
    static getAllPricing() {
        return AI_PRICING_TABLE;
    }

    /**
     * Calculate monthly cost estimates for subscription planning
     */
    static calculateMonthlyCosts(workoutsPerMonth, provider = 'anthropic', model = 'claude-3-sonnet') {
        const avgCostPerWorkout = this.estimateWorkoutCost(provider, model);
        const totalCost = avgCostPerWorkout * workoutsPerMonth;
        
        return {
            costPerWorkout: avgCostPerWorkout,
            totalMonthlyCost: totalCost,
            costWithMarkup100: totalCost * 2,  // 100% markup
            costWithMarkup150: totalCost * 2.5, // 150% markup
            costWithMarkup200: totalCost * 3    // 200% markup
        };
    }

    /**
     * Get premium subscription pricing based on usage tiers (no free plan)
     */
    static getPremiumSubscriptionPricing() {
        // Calculate costs for different usage tiers with premium features
        const fitnessTier = this.calculateMonthlyCosts(30, 'anthropic', 'claude-3-sonnet'); // Daily WODs
        const athleteTier = this.calculateMonthlyCosts(50, 'anthropic', 'claude-3-sonnet'); // Unlimited + coaching
        const proTier = this.calculateMonthlyCosts(75, 'anthropic', 'claude-3-sonnet'); // Everything + premium

        return {
            fitness: {
                name: 'FITNESS',
                workoutsIncluded: 30,
                estimatedCost: fitnessTier.totalMonthlyCost,
                recommendedPrice: 2.99,
                trialDays: 30,
                creditsIncluded: 5,
                workoutOptionsPerDay: 3,
                features: [
                    'Daily WOD delivery at 7pm',
                    '3 workout options per day',
                    'All workout types (AMRAP, EMOM, For Time)',
                    'Scaling options for all levels',
                    'Workout history & progress',
                    '5 monthly credits',
                    'Mobile app access'
                ]
            },
            athlete: {
                name: 'ATHLETE',
                workoutsIncluded: 'unlimited',
                estimatedCost: athleteTier.totalMonthlyCost,
                recommendedPrice: 5.99,
                trialDays: 30,
                creditsIncluded: 15,
                workoutOptionsPerDay: 5,
                features: [
                    'Unlimited WODs',
                    'Live AI coaching during workouts',
                    'Real-time form feedback',
                    'Rep counting and motivation',
                    '4/8/12-week progressive programs',
                    'Competition mode & challenges',
                    'Advanced analytics',
                    '15 monthly credits',
                    'Priority support'
                ]
            },
            pro: {
                name: 'PRO',
                workoutsIncluded: 'unlimited',
                estimatedCost: proTier.totalMonthlyCost,
                recommendedPrice: 9.99,
                trialDays: 30,
                creditsIncluded: 30,
                workoutOptionsPerDay: 10,
                features: [
                    'Everything in ATHLETE',
                    'Personal AI trainer',
                    'Custom program design',
                    'Nutrition coaching & meal planning',
                    'Recovery protocols & mobility',
                    'Video form analysis',
                    'API access',
                    '30 monthly credits',
                    'Early feature access',
                    'Premium support'
                ]
            }
        };
    }

    /**
     * Calculate premium credit pricing for enhanced features
     */
    static getPremiumCreditPricing() {
        const avgCost = this.estimateWorkoutCost('anthropic', 'claude-3-sonnet');
        
        // Premium credit pricing for different features
        const creditPrices = {
            wodRefresh: 0.10,        // $0.10 for WOD refresh
            customWod: 0.30,         // $0.30 for custom WOD (3 credits)
            formAnalysis: 0.40,      // $0.40 for form analysis (4 credits)
            nutritionPlan: 0.50,     // $0.50 for nutrition plan (5 credits)
            recoverySession: 0.20    // $0.20 for recovery session (2 credits)
        };
        
        return {
            costPerWOD: avgCost,
            creditFeatures: {
                'WOD Refresh': { credits: 1, price: creditPrices.wodRefresh, description: 'Get a different workout for today' },
                'Custom WOD': { credits: 3, price: creditPrices.customWod, description: 'AI creates workout based on your goals' },
                'Form Analysis': { credits: 4, price: creditPrices.formAnalysis, description: 'Upload video, get technique feedback' },
                'Nutrition Plan': { credits: 5, price: creditPrices.nutritionPlan, description: 'Custom meal plan for your training' },
                'Recovery Session': { credits: 2, price: creditPrices.recoverySession, description: 'Personalized recovery routine' }
            },
            recommendedPackages: [
                { 
                    name: 'Boost Pack',
                    credits: 10, 
                    price: 2.99,
                    savings: '0%',
                    description: 'Perfect for occasional extras'
                },
                { 
                    name: 'Power Pack',
                    credits: 25, 
                    price: 6.99,
                    savings: '15%',
                    description: 'Great value for regular users'
                },
                { 
                    name: 'Beast Pack',
                    credits: 60, 
                    price: 14.99,
                    savings: '25%', 
                    description: 'Maximum value for power users'
                }
            ]
        };
    }

    /**
     * Log token usage and cost for analytics
     */
    static logUsage(provider, model, inputTokens, outputTokens, workoutType, userId) {
        const cost = this.calculateCost(provider, model, inputTokens, outputTokens);
        
        const logEntry = {
            timestamp: new Date().toISOString(),
            userId,
            provider,
            model,
            workoutType,
            inputTokens,
            outputTokens,
            cost,
            costPerToken: cost / (inputTokens + outputTokens)
        };

        console.log('💰 AI Usage Cost:', logEntry);
        
        // In a production environment, this would be saved to analytics/billing database
        return logEntry;
    }
}

export default AIPricingService;