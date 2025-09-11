/**
 * Multiple WOD Generation Service
 * Generates multiple workout options daily based on user's subscription plan
 */

class MultipleWodService {
    constructor() {
        this.workoutVariations = {
            'fitness-2025': 3,     // FITNESS plan gets 3 options
            'athlete-2025': 5,     // ATHLETE plan gets 5 options  
            'pro-2025': 10         // PRO plan gets 10 options
        };
        
        this.workoutTypes = [
            'amrap', 'emom', 'for-time', 'tabata', 
            'chipper', 'ladder', 'strength', 'metcon'
        ];
        
        this.intensityLevels = ['beginner', 'intermediate', 'advanced'];
        this.timeCapOptions = [10, 12, 15, 18, 20, 25, 30];
    }

    /**
     * Generate multiple WOD options for a user's daily delivery
     */
    async generateDailyWodOptions(userId, date = null) {
        try {
            const targetDate = date || new Date().toISOString().split('T')[0];
            
            // Get user's subscription plan features
            const { default: freeTrialService } = await import('./freeTrialService.js');
            const userFeatures = await freeTrialService.getUserPlanFeatures(userId);
            
            if (!userFeatures) {
                throw new Error('User does not have an active subscription');
            }
            
            const numOptions = userFeatures.workout_options_per_day || 3;
            
            // Get user preferences for personalization
            const userPreferences = await this.getUserWorkoutPreferences(userId);
            
            // Generate multiple workout options
            const workoutOptions = [];
            
            for (let i = 0; i < numOptions; i++) {
                const workout = await this.generateSingleWodOption(userId, userPreferences, i, targetDate);
                workoutOptions.push(workout);
            }
            
            // Save options to database
            await this.saveDailyWodOptions(userId, targetDate, workoutOptions);
            
            console.log(`🏋️ Generated ${numOptions} WOD options for user ${userId} on ${targetDate}`);
            
            return {
                date: targetDate,
                userId: userId,
                planId: userFeatures.plan_id,
                optionsGenerated: numOptions,
                workouts: workoutOptions
            };
            
        } catch (error) {
            console.error('💥 Error generating daily WOD options:', error);
            throw error;
        }
    }

    /**
     * Generate a single workout option with variety
     */
    async generateSingleWodOption(userId, userPreferences, optionIndex, date) {
        try {
            const { default: langchainService } = await import('./langchainService.js');
            
            // Create variety by varying workout parameters
            const workoutType = this.selectWorkoutType(userPreferences, optionIndex);
            const intensity = this.selectIntensity(userPreferences, optionIndex);
            const timeCap = this.selectTimeCap(userPreferences, optionIndex);
            const focusArea = this.selectFocusArea(optionIndex);
            
            // Generate workout with specific parameters
            const workout = await langchainService.generateWorkout({
                type: workoutType,
                difficulty: intensity,
                timeCapMinutes: timeCap,
                equipment: userPreferences.equipment || ['bodyweight'],
                focusArea: focusArea,
                userId: userId,
                optionIndex: optionIndex,
                generationDate: date,
                variation: this.getVariationStyle(optionIndex)
            });
            
            // Add metadata for tracking
            workout.optionIndex = optionIndex;
            workout.generatedAt = new Date().toISOString();
            workout.focusArea = focusArea;
            workout.variationStyle = this.getVariationStyle(optionIndex);
            
            return workout;
            
        } catch (error) {
            console.error(`💥 Error generating WOD option ${optionIndex}:`, error);
            throw error;
        }
    }

    /**
     * Select workout type with variety
     */
    selectWorkoutType(preferences, optionIndex) {
        const preferredTypes = preferences.workoutTypes || this.workoutTypes;
        
        // Ensure variety across options
        const typeIndex = optionIndex % preferredTypes.length;
        return preferredTypes[typeIndex];
    }

    /**
     * Select intensity level with variety
     */
    selectIntensity(preferences, optionIndex) {
        const userLevel = preferences.difficulty || 'intermediate';
        
        // Vary intensity slightly based on option
        switch (optionIndex % 3) {
            case 0: return userLevel; // User's preferred level
            case 1: // Slightly easier
                return userLevel === 'advanced' ? 'intermediate' : 
                       userLevel === 'intermediate' ? 'beginner' : 'beginner';
            case 2: // Slightly harder  
                return userLevel === 'beginner' ? 'intermediate' :
                       userLevel === 'intermediate' ? 'advanced' : 'advanced';
            default: return userLevel;
        }
    }

    /**
     * Select time cap with variety
     */
    selectTimeCap(preferences, optionIndex) {
        const preferredTime = preferences.timeCapMinutes || 20;
        const timeVariations = [
            preferredTime,           // User's preferred time
            Math.max(10, preferredTime - 5),  // 5 minutes shorter
            Math.min(30, preferredTime + 5),  // 5 minutes longer
            Math.max(12, preferredTime - 3),  // 3 minutes shorter
            Math.min(25, preferredTime + 3)   // 3 minutes longer
        ];
        
        return timeVariations[optionIndex % timeVariations.length];
    }

    /**
     * Select focus area for workout variety
     */
    selectFocusArea(optionIndex) {
        const focusAreas = [
            'cardio', 'strength', 'power', 'endurance', 
            'flexibility', 'core', 'upper_body', 'lower_body'
        ];
        
        return focusAreas[optionIndex % focusAreas.length];
    }

    /**
     * Get variation style description
     */
    getVariationStyle(optionIndex) {
        const styles = [
            'Balanced', 'High Intensity', 'Strength Focus', 
            'Cardio Blast', 'Power & Speed', 'Endurance Build',
            'Core Crusher', 'Full Body', 'Quick Burner', 'Steady State'
        ];
        
        return styles[optionIndex % styles.length];
    }

    /**
     * Get user's workout preferences
     */
    async getUserWorkoutPreferences(userId) {
        try {
            const { default: supabaseService } = await import('./supabaseService.js');
            
            const preferences = await supabaseService.getUserPreferences(userId);
            
            return {
                workoutTypes: preferences?.preferred_workout_types || this.workoutTypes,
                difficulty: preferences?.difficulty_level || 'intermediate',
                timeCapMinutes: preferences?.preferred_time_cap || 20,
                equipment: preferences?.available_equipment || ['bodyweight'],
                goals: preferences?.fitness_goals || ['general_fitness']
            };
            
        } catch (error) {
            console.error('💥 Error getting user preferences:', error);
            return {
                workoutTypes: this.workoutTypes,
                difficulty: 'intermediate',
                timeCapMinutes: 20,
                equipment: ['bodyweight'],
                goals: ['general_fitness']
            };
        }
    }

    /**
     * Save daily WOD options to database
     */
    async saveDailyWodOptions(userId, date, workoutOptions) {
        try {
            const { default: supabaseService } = await import('./supabaseService.js');
            
            // Save each workout option
            for (const workout of workoutOptions) {
                await supabaseService.saveDailyWorkoutOption({
                    userId: userId,
                    workout: workout,
                    date: date,
                    optionIndex: workout.optionIndex,
                    isSelected: false // User hasn't selected this option yet
                });
            }
            
            console.log(`💾 Saved ${workoutOptions.length} workout options for ${userId} on ${date}`);
            
        } catch (error) {
            console.error('💥 Error saving daily WOD options:', error);
        }
    }

    /**
     * Get daily WOD options for a user
     */
    async getDailyWodOptions(userId, date = null) {
        try {
            const targetDate = date || new Date().toISOString().split('T')[0];
            const { default: supabaseService } = await import('./supabaseService.js');
            
            const workoutOptions = await supabaseService.getDailyWorkoutOptions(userId, targetDate);
            
            if (!workoutOptions || workoutOptions.length === 0) {
                // Generate options if they don't exist
                console.log(`🔄 No options found for ${userId} on ${targetDate}, generating now...`);
                return await this.generateDailyWodOptions(userId, targetDate);
            }
            
            return {
                date: targetDate,
                userId: userId,
                optionsAvailable: workoutOptions.length,
                workouts: workoutOptions
            };
            
        } catch (error) {
            console.error('💥 Error getting daily WOD options:', error);
            throw error;
        }
    }

    /**
     * User selects a workout option
     */
    async selectWorkoutOption(userId, date, optionIndex) {
        try {
            const { default: supabaseService } = await import('./supabaseService.js');
            
            // Mark selected option
            await supabaseService.selectDailyWorkoutOption(userId, date, optionIndex);
            
            // Get the selected workout
            const workoutOptions = await supabaseService.getDailyWorkoutOptions(userId, date);
            const selectedWorkout = workoutOptions.find(w => w.optionIndex === optionIndex);
            
            if (!selectedWorkout) {
                throw new Error('Selected workout option not found');
            }
            
            console.log(`✅ User ${userId} selected workout option ${optionIndex} for ${date}`);
            
            return {
                success: true,
                selectedWorkout: selectedWorkout,
                optionIndex: optionIndex,
                date: date
            };
            
        } catch (error) {
            console.error('💥 Error selecting workout option:', error);
            throw error;
        }
    }

    /**
     * Refresh/regenerate a specific workout option (uses credits)
     */
    async refreshWorkoutOption(userId, date, optionIndex) {
        try {
            const { default: creditService } = await import('./creditService.js');
            
            // Check if user can use credits
            const canGenerate = await creditService.canGenerateWorkout(userId);
            
            if (!canGenerate.canGenerate) {
                throw new Error('Insufficient credits to refresh workout option');
            }
            
            // Deduct credit for refresh
            if (canGenerate.reason === 'credits_available') {
                await creditService.deductCredits(userId, 'wod_refresh', 'anthropic', 'claude-3-sonnet');
            }
            
            // Get user preferences
            const userPreferences = await this.getUserWorkoutPreferences(userId);
            
            // Generate new workout option
            const newWorkout = await this.generateSingleWodOption(userId, userPreferences, optionIndex, date);
            
            // Update the option in database
            const { default: supabaseService } = await import('./supabaseService.js');
            await supabaseService.updateDailyWorkoutOption(userId, date, optionIndex, newWorkout);
            
            console.log(`🔄 Refreshed workout option ${optionIndex} for user ${userId} on ${date}`);
            
            return {
                success: true,
                newWorkout: newWorkout,
                optionIndex: optionIndex,
                creditsUsed: canGenerate.reason === 'credits_available' ? 1 : 0
            };
            
        } catch (error) {
            console.error('💥 Error refreshing workout option:', error);
            throw error;
        }
    }

    /**
     * Get workout statistics for user
     */
    async getWorkoutStatistics(userId, days = 30) {
        try {
            const { default: supabaseService } = await import('./supabaseService.js');
            
            const stats = await supabaseService.getUserWorkoutStatistics(userId, days);
            
            return {
                totalOptionsGenerated: stats.totalOptions || 0,
                optionsSelected: stats.selectedOptions || 0,
                selectionRate: stats.totalOptions > 0 ? 
                    Math.round((stats.selectedOptions / stats.totalOptions) * 100) : 0,
                favoriteWorkoutType: stats.favoriteType || 'Not enough data',
                averageWorkoutTime: stats.averageTime || 0,
                totalWorkoutsCompleted: stats.completedWorkouts || 0
            };
            
        } catch (error) {
            console.error('💥 Error getting workout statistics:', error);
            return {
                totalOptionsGenerated: 0,
                optionsSelected: 0,
                selectionRate: 0,
                favoriteWorkoutType: 'Not enough data',
                averageWorkoutTime: 0,
                totalWorkoutsCompleted: 0
            };
        }
    }
}

// Create singleton instance
const multipleWodService = new MultipleWodService();

export default multipleWodService;