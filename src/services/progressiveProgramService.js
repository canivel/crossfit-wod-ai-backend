/**
 * Progressive Program Service
 * Manages structured 4/8/12-week training programs for ATHLETE and PRO subscribers
 */

class ProgressiveProgramService {
    constructor() {
        this.programTypes = {
            'strength_focus': {
                name: 'Strength Building Program',
                description: 'Progressive strength development with compound movements',
                weeks: [4, 8, 12],
                phases: ['foundation', 'development', 'peaking']
            },
            'conditioning': {
                name: 'Conditioning Program',
                description: 'Cardiovascular and metabolic conditioning progression',
                weeks: [4, 8, 12],
                phases: ['base_building', 'intensity', 'competition_prep']
            },
            'olympic_lifting': {
                name: 'Olympic Lifting Program',
                description: 'Technical progression in snatch and clean & jerk',
                weeks: [8, 12],
                phases: ['technique', 'strength', 'competition']
            },
            'gymnastics': {
                name: 'Gymnastics Skills Program',
                description: 'Bodyweight movement progression and skill development',
                weeks: [4, 8, 12],
                phases: ['foundation', 'skill_development', 'mastery']
            },
            'competition_prep': {
                name: 'Competition Preparation',
                description: 'Complete preparation for CrossFit competitions',
                weeks: [8, 12],
                phases: ['base', 'build', 'peak', 'taper']
            }
        };

        this.intensityProgression = {
            4: [0.6, 0.7, 0.8, 0.85],      // 4-week program
            8: [0.6, 0.65, 0.7, 0.75, 0.8, 0.82, 0.85, 0.87], // 8-week program
            12: [0.6, 0.62, 0.65, 0.67, 0.7, 0.72, 0.75, 0.77, 0.8, 0.82, 0.85, 0.87] // 12-week program
        };

        this.volumeProgression = {
            4: [1.0, 1.1, 1.2, 1.0],       // Deload in week 4
            8: [1.0, 1.05, 1.1, 1.15, 1.2, 1.1, 1.25, 1.0], // Deload weeks 6 and 8
            12: [1.0, 1.05, 1.1, 1.15, 1.2, 1.1, 1.25, 1.3, 1.2, 1.35, 1.4, 1.0] // Multiple deloads
        };
    }

    /**
     * Create a new progressive program for a user
     */
    async createProgram(userId, programType, duration, startDate = null) {
        try {
            // Verify user has access to progressive programs
            const hasAccess = await this.verifyProgramAccess(userId);
            if (!hasAccess) {
                throw new Error('Progressive programs require ATHLETE or PRO subscription');
            }

            const program = this.programTypes[programType];
            if (!program) {
                throw new Error(`Unknown program type: ${programType}`);
            }

            if (!program.weeks.includes(duration)) {
                throw new Error(`Duration ${duration} weeks not available for ${programType}`);
            }

            const { default: supabaseService } = await import('./supabaseService.js');
            
            // Get user preferences and fitness level
            const userProfile = await this.getUserFitnessProfile(userId);
            
            // Generate program structure
            const programStructure = await this.generateProgramStructure(
                programType, 
                duration, 
                userProfile
            );

            // Save program to database
            const programData = {
                userId: userId,
                programType: programType,
                programName: program.name,
                duration: duration,
                startDate: startDate || new Date().toISOString().split('T')[0],
                endDate: this.calculateEndDate(startDate, duration),
                status: 'active',
                currentWeek: 1,
                currentDay: 1,
                structure: programStructure,
                userProfile: userProfile,
                createdAt: new Date().toISOString()
            };

            const savedProgram = await supabaseService.createProgressiveProgram(programData);

            console.log(`🏋️ Created ${duration}-week ${program.name} for user ${userId}`);

            return {
                success: true,
                programId: savedProgram.id,
                program: savedProgram,
                nextWorkout: programStructure.weeks[0].days[0]
            };

        } catch (error) {
            console.error('💥 Error creating progressive program:', error);
            throw error;
        }
    }

    /**
     * Generate structured program with weekly progression
     */
    async generateProgramStructure(programType, duration, userProfile) {
        try {
            const { default: langchainService } = await import('./langchainService.js');
            
            const program = this.programTypes[programType];
            const intensities = this.intensityProgression[duration];
            const volumes = this.volumeProgression[duration];

            const weeks = [];

            for (let week = 1; week <= duration; week++) {
                const weekIntensity = intensities[week - 1];
                const weekVolume = volumes[week - 1];
                const phase = this.calculatePhase(week, duration, program.phases);

                // Generate week structure
                const weekData = await this.generateWeekStructure(
                    programType,
                    week,
                    weekIntensity,
                    weekVolume,
                    phase,
                    userProfile
                );

                weeks.push({
                    week: week,
                    phase: phase,
                    intensity: weekIntensity,
                    volume: weekVolume,
                    focus: weekData.focus,
                    days: weekData.days
                });
            }

            return {
                programType: programType,
                programName: program.name,
                duration: duration,
                description: program.description,
                totalWeeks: duration,
                weeks: weeks
            };

        } catch (error) {
            console.error('💥 Error generating program structure:', error);
            throw error;
        }
    }

    /**
     * Generate individual week structure with daily workouts
     */
    async generateWeekStructure(programType, week, intensity, volume, phase, userProfile) {
        try {
            const { default: langchainService } = await import('./langchainService.js');

            // Define training days per week based on program type
            const trainingDays = this.getTrainingDays(programType);
            const weekFocus = this.getWeekFocus(programType, week, phase);

            const days = [];

            for (let day = 1; day <= 7; day++) {
                if (trainingDays.includes(day)) {
                    // Generate training day
                    const workout = await this.generateProgramWorkout(
                        programType,
                        week,
                        day,
                        intensity,
                        volume,
                        phase,
                        weekFocus,
                        userProfile
                    );
                    
                    days.push({
                        day: day,
                        type: 'training',
                        workout: workout
                    });
                } else {
                    // Rest or active recovery day
                    const recoveryType = this.getRecoveryType(day, trainingDays);
                    days.push({
                        day: day,
                        type: recoveryType,
                        activities: this.getRecoveryActivities(recoveryType)
                    });
                }
            }

            return {
                focus: weekFocus,
                days: days
            };

        } catch (error) {
            console.error('💥 Error generating week structure:', error);
            throw error;
        }
    }

    /**
     * Generate specific workout for program progression
     */
    async generateProgramWorkout(programType, week, day, intensity, volume, phase, focus, userProfile) {
        try {
            const { default: langchainService } = await import('./langchainService.js');

            const workoutPrompt = this.buildProgramWorkoutPrompt(
                programType,
                week,
                day,
                intensity,
                volume,
                phase,
                focus,
                userProfile
            );

            const workout = await langchainService.generateStructuredWorkout(workoutPrompt);

            // Add program-specific metadata
            workout.programData = {
                programType: programType,
                week: week,
                day: day,
                intensity: intensity,
                volume: volume,
                phase: phase,
                focus: focus
            };

            return workout;

        } catch (error) {
            console.error('💥 Error generating program workout:', error);
            throw error;
        }
    }

    /**
     * Get current program for user
     */
    async getCurrentProgram(userId) {
        try {
            const { default: supabaseService } = await import('./supabaseService.js');
            
            const program = await supabaseService.getCurrentProgram(userId);
            
            if (!program) {
                return {
                    hasProgram: false,
                    availablePrograms: Object.keys(this.programTypes)
                };
            }

            // Calculate progress
            const progress = this.calculateProgress(program);
            const nextWorkout = this.getNextWorkout(program);

            return {
                hasProgram: true,
                program: program,
                progress: progress,
                nextWorkout: nextWorkout,
                isComplete: progress.percentComplete >= 100
            };

        } catch (error) {
            console.error('💥 Error getting current program:', error);
            return {
                hasProgram: false,
                availablePrograms: Object.keys(this.programTypes)
            };
        }
    }

    /**
     * Complete a program workout and advance progression
     */
    async completeWorkout(userId, programId, week, day, results = {}) {
        try {
            const { default: supabaseService } = await import('./supabaseService.js');
            
            // Mark workout as completed
            await supabaseService.completeProgramWorkout(userId, programId, week, day, results);
            
            // Update program progress
            const updatedProgram = await this.updateProgramProgress(userId, programId, week, day);
            
            // Calculate next workout
            const nextWorkout = this.getNextWorkout(updatedProgram);
            
            console.log(`✅ User ${userId} completed Week ${week}, Day ${day} of program ${programId}`);

            return {
                success: true,
                completed: { week, day },
                nextWorkout: nextWorkout,
                programProgress: this.calculateProgress(updatedProgram)
            };

        } catch (error) {
            console.error('💥 Error completing program workout:', error);
            throw error;
        }
    }

    /**
     * Get available program types based on subscription
     */
    async getAvailablePrograms(userId) {
        try {
            const hasAccess = await this.verifyProgramAccess(userId);
            
            if (!hasAccess) {
                return {
                    hasAccess: false,
                    requiresUpgrade: true,
                    availablePrograms: []
                };
            }

            return {
                hasAccess: true,
                availablePrograms: Object.entries(this.programTypes).map(([key, program]) => ({
                    id: key,
                    name: program.name,
                    description: program.description,
                    availableWeeks: program.weeks,
                    phases: program.phases
                }))
            };

        } catch (error) {
            console.error('💥 Error getting available programs:', error);
            return {
                hasAccess: false,
                availablePrograms: []
            };
        }
    }

    /**
     * Verify user has access to progressive programs
     */
    async verifyProgramAccess(userId) {
        try {
            const { default: freeTrialService } = await import('./freeTrialService.js');
            
            const userFeatures = await freeTrialService.getUserPlanFeatures(userId);
            
            if (!userFeatures) {
                return false;
            }

            // Progressive programs available for ATHLETE and PRO plans
            return ['athlete-2025', 'pro-2025'].includes(userFeatures.plan_id);

        } catch (error) {
            console.error('💥 Error verifying program access:', error);
            return false;
        }
    }

    /**
     * Get user fitness profile for program customization
     */
    async getUserFitnessProfile(userId) {
        try {
            const { default: supabaseService } = await import('./supabaseService.js');
            
            const profile = await supabaseService.getUserFitnessProfile(userId);
            
            return {
                experience: profile?.experience_level || 'intermediate',
                goals: profile?.fitness_goals || ['general_fitness'],
                availableEquipment: profile?.available_equipment || ['bodyweight'],
                trainingDaysPerWeek: profile?.training_days_per_week || 5,
                injuries: profile?.injuries || [],
                preferences: profile?.workout_preferences || {}
            };

        } catch (error) {
            console.error('💥 Error getting user fitness profile:', error);
            return {
                experience: 'intermediate',
                goals: ['general_fitness'],
                availableEquipment: ['bodyweight'],
                trainingDaysPerWeek: 5,
                injuries: [],
                preferences: {}
            };
        }
    }

    /**
     * Calculate program phase based on week and duration
     */
    calculatePhase(week, duration, phases) {
        const phaseLength = Math.ceil(duration / phases.length);
        const phaseIndex = Math.min(Math.floor((week - 1) / phaseLength), phases.length - 1);
        return phases[phaseIndex];
    }

    /**
     * Get training days for program type
     */
    getTrainingDays(programType) {
        const trainingSchedules = {
            'strength_focus': [1, 2, 3, 5, 6],        // Mon, Tue, Wed, Fri, Sat
            'conditioning': [1, 2, 3, 4, 5, 6],      // 6 days per week
            'olympic_lifting': [1, 2, 3, 5, 6],      // Mon, Tue, Wed, Fri, Sat
            'gymnastics': [1, 3, 5, 6],              // Mon, Wed, Fri, Sat
            'competition_prep': [1, 2, 3, 4, 5, 6]   // 6 days per week
        };

        return trainingSchedules[programType] || [1, 3, 5]; // Default MWF
    }

    /**
     * Get week focus based on program type and phase
     */
    getWeekFocus(programType, week, phase) {
        const focusMap = {
            'strength_focus': {
                'foundation': 'Movement patterns and technique',
                'development': 'Progressive overload and volume',
                'peaking': 'Maximum strength expression'
            },
            'conditioning': {
                'base_building': 'Aerobic capacity and work capacity',
                'intensity': 'Anaerobic power and lactate threshold',
                'competition_prep': 'Mixed modal conditioning and recovery'
            },
            'olympic_lifting': {
                'technique': 'Movement refinement and mobility',
                'strength': 'Positional strength and power development',
                'competition': 'Competition simulation and timing'
            },
            'gymnastics': {
                'foundation': 'Basic positions and strength building',
                'skill_development': 'Complex movements and coordination',
                'mastery': 'Advanced skills and combinations'
            },
            'competition_prep': {
                'base': 'General physical preparation',
                'build': 'Sport-specific conditioning',
                'peak': 'Competition simulation',
                'taper': 'Recovery and maintenance'
            }
        };

        return focusMap[programType][phase] || 'General fitness development';
    }

    /**
     * Get recovery type for non-training days
     */
    getRecoveryType(day, trainingDays) {
        // Sunday is typically complete rest
        if (day === 7) return 'rest';
        
        // Other non-training days are active recovery
        return 'active_recovery';
    }

    /**
     * Get recovery activities for rest days
     */
    getRecoveryActivities(recoveryType) {
        const activities = {
            'rest': [
                'Complete rest and sleep focus',
                'Light stretching or meditation',
                'Nutrition and hydration focus'
            ],
            'active_recovery': [
                'Light walking or yoga',
                'Mobility and stretching routine',
                'Foam rolling and self-massage',
                'Low-intensity recreational activities'
            ]
        };

        return activities[recoveryType] || activities.rest;
    }

    /**
     * Build workout prompt for program generation
     */
    buildProgramWorkoutPrompt(programType, week, day, intensity, volume, phase, focus, userProfile) {
        return {
            programType: programType,
            week: week,
            day: day,
            intensity: intensity,
            volume: volume,
            phase: phase,
            focus: focus,
            experience: userProfile.experience,
            equipment: userProfile.availableEquipment,
            goals: userProfile.goals,
            constraints: userProfile.injuries
        };
    }

    /**
     * Calculate program progress
     */
    calculateProgress(program) {
        const totalWorkouts = program.structure.weeks.reduce((total, week) => {
            return total + week.days.filter(day => day.type === 'training').length;
        }, 0);

        const completedWorkouts = program.completedWorkouts?.length || 0;
        const percentComplete = Math.round((completedWorkouts / totalWorkouts) * 100);

        return {
            currentWeek: program.currentWeek,
            currentDay: program.currentDay,
            totalWeeks: program.duration,
            completedWorkouts: completedWorkouts,
            totalWorkouts: totalWorkouts,
            percentComplete: percentComplete,
            daysRemaining: this.calculateDaysRemaining(program)
        };
    }

    /**
     * Get next workout in program
     */
    getNextWorkout(program) {
        if (!program.structure || !program.structure.weeks) {
            return null;
        }

        const currentWeek = program.currentWeek - 1; // Zero-indexed
        const currentDay = program.currentDay - 1;   // Zero-indexed

        // Find next training day
        for (let w = currentWeek; w < program.structure.weeks.length; w++) {
            const week = program.structure.weeks[w];
            const startDay = w === currentWeek ? currentDay : 0;

            for (let d = startDay; d < week.days.length; d++) {
                const day = week.days[d];
                if (day.type === 'training') {
                    return {
                        week: w + 1,
                        day: d + 1,
                        workout: day.workout,
                        phase: week.phase,
                        focus: week.focus
                    };
                }
            }
        }

        return null; // Program complete
    }

    /**
     * Update program progress after workout completion
     */
    async updateProgramProgress(userId, programId, week, day) {
        try {
            const { default: supabaseService } = await import('./supabaseService.js');
            
            // Find next training day
            const program = await supabaseService.getProgram(programId);
            let nextWeek = week;
            let nextDay = day + 1;

            // Find next training day
            const weekData = program.structure.weeks[week - 1];
            let foundNext = false;

            while (nextWeek <= program.duration && !foundNext) {
                const currentWeekData = program.structure.weeks[nextWeek - 1];
                
                for (let d = nextDay - 1; d < currentWeekData.days.length; d++) {
                    if (currentWeekData.days[d].type === 'training') {
                        nextDay = d + 1;
                        foundNext = true;
                        break;
                    }
                }

                if (!foundNext) {
                    nextWeek++;
                    nextDay = 1;
                }
            }

            // Update program with new current position
            const updatedProgram = await supabaseService.updateProgramProgress(
                programId, 
                nextWeek, 
                nextDay
            );

            return updatedProgram;

        } catch (error) {
            console.error('💥 Error updating program progress:', error);
            throw error;
        }
    }

    /**
     * Calculate days remaining in program
     */
    calculateDaysRemaining(program) {
        const startDate = new Date(program.startDate);
        const endDate = new Date(program.endDate);
        const today = new Date();

        const msPerDay = 24 * 60 * 60 * 1000;
        const daysRemaining = Math.ceil((endDate - today) / msPerDay);

        return Math.max(0, daysRemaining);
    }

    /**
     * Calculate program end date
     */
    calculateEndDate(startDate, duration) {
        const start = new Date(startDate || new Date());
        const end = new Date(start);
        end.setDate(end.getDate() + (duration * 7)); // duration in weeks
        return end.toISOString().split('T')[0];
    }
}

// Create singleton instance
const progressiveProgramService = new ProgressiveProgramService();

export default progressiveProgramService;