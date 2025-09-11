/**
 * Video Form Analysis Service
 * Processes uploaded workout videos and provides AI-powered technique feedback
 */

import multer from 'multer';
import path from 'path';
import fs from 'fs';

class FormAnalysisService {
    constructor() {
        this.supportedFormats = ['.mp4', '.mov', '.avi', '.webm'];
        this.maxFileSize = 100 * 1024 * 1024; // 100MB
        this.maxDuration = 300; // 5 minutes
        
        this.exerciseTypes = {
            'squat': {
                name: 'Squat',
                keyPoints: ['knee_tracking', 'depth', 'back_position', 'foot_position'],
                commonIssues: ['knee_cave', 'forward_lean', 'partial_depth', 'heel_rise']
            },
            'deadlift': {
                name: 'Deadlift',
                keyPoints: ['bar_path', 'back_position', 'hip_hinge', 'lockout'],
                commonIssues: ['rounded_back', 'bar_drift', 'incomplete_lockout', 'hyperextension']
            },
            'bench_press': {
                name: 'Bench Press',
                keyPoints: ['bar_path', 'elbow_position', 'arch', 'foot_position'],
                commonIssues: ['flared_elbows', 'bouncing', 'uneven_bar', 'foot_movement']
            },
            'overhead_press': {
                name: 'Overhead Press',
                keyPoints: ['bar_path', 'core_stability', 'shoulder_position', 'lockout'],
                commonIssues: ['forward_head', 'excessive_arch', 'incomplete_lockout', 'elbow_flare']
            },
            'pullup': {
                name: 'Pull-up',
                keyPoints: ['full_range', 'shoulder_position', 'core_engagement', 'descent_control'],
                commonIssues: ['partial_range', 'kipping_error', 'shoulder_shrug', 'swinging']
            },
            'clean': {
                name: 'Clean',
                keyPoints: ['bar_path', 'receiving_position', 'timing', 'footwork'],
                commonIssues: ['bar_crash', 'early_arm_bend', 'poor_receiving', 'foot_timing']
            },
            'snatch': {
                name: 'Snatch',
                keyPoints: ['bar_path', 'overhead_position', 'timing', 'mobility'],
                commonIssues: ['bar_forward', 'press_out', 'poor_receiving', 'mobility_issues']
            },
            'thruster': {
                name: 'Thruster',
                keyPoints: ['squat_depth', 'transition', 'press_path', 'timing'],
                commonIssues: ['partial_squat', 'pause_transition', 'press_out', 'foot_movement']
            }
        };

        this.analysisFramework = {
            'movement_quality': {
                weight: 0.4,
                factors: ['range_of_motion', 'technique', 'control', 'consistency']
            },
            'safety': {
                weight: 0.3,
                factors: ['injury_risk', 'load_management', 'joint_health', 'progression']
            },
            'efficiency': {
                weight: 0.3,
                factors: ['energy_efficiency', 'speed', 'power_output', 'coordination']
            }
        };
    }

    /**
     * Configure multer for video uploads
     */
    configureUpload() {
        const storage = multer.diskStorage({
            destination: (req, file, cb) => {
                const uploadDir = path.join(process.cwd(), 'uploads', 'form-analysis');
                if (!fs.existsSync(uploadDir)) {
                    fs.mkdirSync(uploadDir, { recursive: true });
                }
                cb(null, uploadDir);
            },
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const ext = path.extname(file.originalname);
                cb(null, `form-analysis-${uniqueSuffix}${ext}`);
            }
        });

        const fileFilter = (req, file, cb) => {
            const ext = path.extname(file.originalname).toLowerCase();
            if (this.supportedFormats.includes(ext)) {
                cb(null, true);
            } else {
                cb(new Error(`Unsupported file format. Supported: ${this.supportedFormats.join(', ')}`));
            }
        };

        return multer({
            storage: storage,
            limits: {
                fileSize: this.maxFileSize
            },
            fileFilter: fileFilter
        });
    }

    /**
     * Analyze uploaded video for form feedback
     */
    async analyzeFormVideo(userId, videoPath, exerciseType, metadata = {}) {
        try {
            // Verify user can use form analysis feature
            const canUse = await this.verifyFormAnalysisAccess(userId);
            if (!canUse.canUse) {
                throw new Error('Form analysis requires credits or PRO subscription');
            }

            // Deduct credits if needed
            if (canUse.requiresCredits) {
                const { default: creditService } = await import('./creditService.js');
                await creditService.useFormAnalysis(userId, {
                    exerciseType: exerciseType,
                    videoPath: videoPath,
                    analysisType: 'video_form_analysis'
                });
            }

            // Extract video metadata
            const videoInfo = await this.extractVideoMetadata(videoPath);
            
            // Validate video constraints
            await this.validateVideo(videoInfo);

            // Process video for analysis
            const frameAnalysis = await this.processVideoFrames(videoPath, exerciseType);
            
            // Generate AI-powered feedback
            const aiAnalysis = await this.generateAIFeedback(frameAnalysis, exerciseType, metadata);
            
            // Create comprehensive analysis report
            const analysis = await this.createAnalysisReport(
                userId,
                exerciseType,
                videoInfo,
                frameAnalysis,
                aiAnalysis,
                metadata
            );

            // Save analysis to database
            const { default: supabaseService } = await import('./supabaseService.js');
            const savedAnalysis = await supabaseService.saveFormAnalysis(analysis);

            // Clean up video file if requested
            if (metadata.deleteAfterAnalysis) {
                this.scheduleVideoCleanup(videoPath);
            }

            console.log(`🎥 Form analysis completed for user ${userId}: ${exerciseType}`);

            return {
                success: true,
                analysisId: savedAnalysis.id,
                analysis: analysis,
                creditsUsed: canUse.requiresCredits ? 4 : 0
            };

        } catch (error) {
            console.error('💥 Error analyzing form video:', error);
            throw error;
        }
    }

    /**
     * Extract metadata from video file
     */
    async extractVideoMetadata(videoPath) {
        try {
            // In a production environment, this would use ffprobe or similar
            // For now, we'll simulate video metadata extraction
            const stats = fs.statSync(videoPath);
            
            return {
                fileSize: stats.size,
                duration: this.estimateVideoDuration(stats.size), // Simulated
                resolution: { width: 1920, height: 1080 }, // Simulated
                fps: 30, // Simulated
                format: path.extname(videoPath),
                createdAt: stats.birthtime
            };

        } catch (error) {
            console.error('💥 Error extracting video metadata:', error);
            throw new Error('Failed to process video file');
        }
    }

    /**
     * Validate video meets analysis requirements
     */
    async validateVideo(videoInfo) {
        if (videoInfo.duration > this.maxDuration) {
            throw new Error(`Video too long. Maximum duration: ${this.maxDuration} seconds`);
        }

        if (videoInfo.fileSize > this.maxFileSize) {
            throw new Error(`File too large. Maximum size: ${this.maxFileSize / 1024 / 1024}MB`);
        }

        if (videoInfo.duration < 5) {
            throw new Error('Video too short. Minimum duration: 5 seconds');
        }

        return true;
    }

    /**
     * Process video frames for movement analysis
     */
    async processVideoFrames(videoPath, exerciseType) {
        try {
            // In production, this would use computer vision libraries
            // to extract pose estimation and movement patterns
            
            const exercise = this.exerciseTypes[exerciseType];
            if (!exercise) {
                throw new Error(`Unsupported exercise type: ${exerciseType}`);
            }

            // Simulate frame-by-frame analysis
            const frameAnalysis = {
                totalFrames: 150, // Simulated 5-second video at 30fps
                keyFrames: this.identifyKeyFrames(exerciseType),
                movementPattern: this.analyzeMovementPattern(exerciseType),
                techniqueScores: this.calculateTechniqueScores(exerciseType),
                detectedIssues: this.detectFormIssues(exerciseType)
            };

            return frameAnalysis;

        } catch (error) {
            console.error('💥 Error processing video frames:', error);
            throw error;
        }
    }

    /**
     * Generate AI-powered feedback based on analysis
     */
    async generateAIFeedback(frameAnalysis, exerciseType, metadata) {
        try {
            const { default: langchainService } = await import('./langchainService.js');
            
            const exercise = this.exerciseTypes[exerciseType];
            
            const analysisPrompt = this.buildFormAnalysisPrompt(
                exerciseType,
                exercise,
                frameAnalysis,
                metadata
            );

            const feedback = await langchainService.generateFormFeedback(analysisPrompt);

            return {
                overallScore: this.calculateOverallScore(frameAnalysis.techniqueScores),
                strengthAreas: feedback.strengths || [],
                improvementAreas: feedback.improvements || [],
                specificCues: feedback.cues || [],
                safetyAlerts: feedback.safety || [],
                progressionSuggestions: feedback.progression || [],
                nextSteps: feedback.nextSteps || []
            };

        } catch (error) {
            console.error('💥 Error generating AI feedback:', error);
            throw error;
        }
    }

    /**
     * Create comprehensive analysis report
     */
    async createAnalysisReport(userId, exerciseType, videoInfo, frameAnalysis, aiAnalysis, metadata) {
        const exercise = this.exerciseTypes[exerciseType];
        
        return {
            userId: userId,
            exerciseType: exerciseType,
            exerciseName: exercise.name,
            analysisDate: new Date().toISOString(),
            videoMetadata: videoInfo,
            
            // Technical Analysis
            frameAnalysis: {
                totalFrames: frameAnalysis.totalFrames,
                keyFrames: frameAnalysis.keyFrames,
                movementQuality: frameAnalysis.movementPattern,
                techniqueBreakdown: frameAnalysis.techniqueScores
            },

            // AI Feedback
            feedback: {
                overallScore: aiAnalysis.overallScore,
                categoryScores: this.calculateCategoryScores(frameAnalysis.techniqueScores),
                strengths: aiAnalysis.strengthAreas,
                improvements: aiAnalysis.improvementAreas,
                actionableCues: aiAnalysis.specificCues,
                safetyConsiderations: aiAnalysis.safetyAlerts
            },

            // Recommendations
            recommendations: {
                immediate: aiAnalysis.nextSteps.slice(0, 3),
                progression: aiAnalysis.progressionSuggestions,
                drills: this.suggestDrills(exerciseType, frameAnalysis.detectedIssues),
                followUp: this.suggestFollowUp(exerciseType, aiAnalysis.overallScore)
            },

            // Metrics
            metrics: {
                detectedIssues: frameAnalysis.detectedIssues,
                riskFactors: this.assessRiskFactors(frameAnalysis),
                improvementPotential: this.calculateImprovementPotential(aiAnalysis.overallScore)
            },

            // Metadata
            metadata: {
                analysisVersion: '1.0',
                processingTime: Date.now(),
                userMetadata: metadata
            }
        };
    }

    /**
     * Verify user access to form analysis
     */
    async verifyFormAnalysisAccess(userId) {
        try {
            const { default: freeTrialService } = await import('./freeTrialService.js');
            const { default: creditService } = await import('./creditService.js');
            
            // Check if user has PRO subscription (includes form analysis)
            const userFeatures = await freeTrialService.getUserPlanFeatures(userId);
            
            if (userFeatures && userFeatures.plan_id === 'pro-2025') {
                return {
                    canUse: true,
                    requiresCredits: false,
                    reason: 'included_in_plan'
                };
            }

            // Check if user has enough credits
            const canUseFeature = await creditService.canUseFeature(userId, 'form_analysis');
            
            if (canUseFeature.canUse) {
                return {
                    canUse: true,
                    requiresCredits: true,
                    creditsRequired: 4,
                    creditsAvailable: canUseFeature.creditsAvailable
                };
            }

            return {
                canUse: false,
                reason: 'insufficient_credits_or_subscription',
                creditsRequired: 4,
                creditsAvailable: canUseFeature.creditsAvailable || 0
            };

        } catch (error) {
            console.error('💥 Error verifying form analysis access:', error);
            return { canUse: false, reason: 'error' };
        }
    }

    /**
     * Get user's form analysis history
     */
    async getUserAnalysisHistory(userId, limit = 20) {
        try {
            const { default: supabaseService } = await import('./supabaseService.js');
            
            const analyses = await supabaseService.getUserFormAnalyses(userId, limit);
            
            return {
                totalAnalyses: analyses.length,
                recentAnalyses: analyses.map(analysis => ({
                    id: analysis.id,
                    exerciseType: analysis.exercise_type,
                    exerciseName: analysis.exercise_name,
                    overallScore: analysis.feedback.overallScore,
                    analysisDate: analysis.analysis_date,
                    improvements: analysis.feedback.improvements?.length || 0,
                    strengths: analysis.feedback.strengths?.length || 0
                })),
                averageScore: this.calculateAverageScore(analyses),
                improvementTrend: this.calculateImprovementTrend(analyses)
            };

        } catch (error) {
            console.error('💥 Error getting analysis history:', error);
            return {
                totalAnalyses: 0,
                recentAnalyses: [],
                averageScore: 0,
                improvementTrend: 'no_data'
            };
        }
    }

    /**
     * Get detailed analysis by ID
     */
    async getAnalysisDetails(analysisId, userId) {
        try {
            const { default: supabaseService } = await import('./supabaseService.js');
            
            const analysis = await supabaseService.getFormAnalysis(analysisId);
            
            if (!analysis || analysis.user_id !== userId) {
                throw new Error('Analysis not found or access denied');
            }

            return {
                analysis: analysis,
                suggestions: this.generateActionPlan(analysis),
                relatedExercises: this.suggestRelatedExercises(analysis.exercise_type),
                progressTracking: await this.getProgressTracking(userId, analysis.exercise_type)
            };

        } catch (error) {
            console.error('💥 Error getting analysis details:', error);
            throw error;
        }
    }

    // Helper methods for analysis simulation (in production, these would use real CV/ML)

    identifyKeyFrames(exerciseType) {
        const keyFramePatterns = {
            'squat': [{ frame: 0, phase: 'start' }, { frame: 45, phase: 'bottom' }, { frame: 90, phase: 'top' }],
            'deadlift': [{ frame: 0, phase: 'setup' }, { frame: 30, phase: 'liftoff' }, { frame: 60, phase: 'lockout' }],
            'bench_press': [{ frame: 0, phase: 'start' }, { frame: 40, phase: 'bottom' }, { frame: 80, phase: 'lockout' }]
        };
        return keyFramePatterns[exerciseType] || keyFramePatterns.squat;
    }

    analyzeMovementPattern(exerciseType) {
        return {
            smoothness: Math.random() * 40 + 60, // 60-100
            consistency: Math.random() * 30 + 70, // 70-100
            timing: Math.random() * 25 + 75 // 75-100
        };
    }

    calculateTechniqueScores(exerciseType) {
        const exercise = this.exerciseTypes[exerciseType];
        const scores = {};
        
        exercise.keyPoints.forEach(point => {
            scores[point] = Math.random() * 30 + 70; // 70-100
        });
        
        return scores;
    }

    detectFormIssues(exerciseType) {
        const exercise = this.exerciseTypes[exerciseType];
        const detectedIssues = [];
        
        exercise.commonIssues.forEach(issue => {
            if (Math.random() > 0.7) { // 30% chance of detecting each issue
                detectedIssues.push({
                    issue: issue,
                    severity: Math.random() > 0.5 ? 'moderate' : 'minor',
                    frequency: Math.floor(Math.random() * 5) + 1
                });
            }
        });
        
        return detectedIssues;
    }

    calculateOverallScore(techniqueScores) {
        const scores = Object.values(techniqueScores);
        return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    }

    calculateCategoryScores(techniqueScores) {
        const overall = this.calculateOverallScore(techniqueScores);
        return {
            movement_quality: overall + Math.random() * 10 - 5,
            safety: overall + Math.random() * 10 - 5,
            efficiency: overall + Math.random() * 10 - 5
        };
    }

    suggestDrills(exerciseType, detectedIssues) {
        const drillDatabase = {
            'squat': ['goblet squats', 'box squats', 'wall sits', 'ankle mobility'],
            'deadlift': ['Romanian deadlifts', 'rack pulls', 'hip hinges', 'glute bridges'],
            'bench_press': ['push-ups', 'dumbbell press', 'tricep dips', 'band pull-aparts']
        };
        
        return drillDatabase[exerciseType] || drillDatabase.squat;
    }

    suggestFollowUp(exerciseType, score) {
        if (score >= 90) return 'Continue current technique, consider progression';
        if (score >= 80) return 'Minor adjustments needed, practice regularly';
        if (score >= 70) return 'Focus on specific improvement areas';
        return 'Consider working with a coach for fundamental improvements';
    }

    estimateVideoDuration(fileSize) {
        // Rough estimation: assume ~10MB per minute for decent quality
        return Math.floor(fileSize / (10 * 1024 * 1024) * 60);
    }

    buildFormAnalysisPrompt(exerciseType, exercise, frameAnalysis, metadata) {
        return {
            exerciseType: exerciseType,
            exerciseName: exercise.name,
            keyPoints: exercise.keyPoints,
            commonIssues: exercise.commonIssues,
            frameAnalysis: frameAnalysis,
            userLevel: metadata.experienceLevel || 'intermediate',
            goals: metadata.goals || ['technique_improvement'],
            previousAnalyses: metadata.previousAnalyses || 0
        };
    }

    calculateAverageScore(analyses) {
        if (!analyses.length) return 0;
        const total = analyses.reduce((sum, analysis) => 
            sum + (analysis.feedback?.overallScore || 0), 0);
        return Math.round(total / analyses.length);
    }

    calculateImprovementTrend(analyses) {
        if (analyses.length < 2) return 'insufficient_data';
        
        const recent = analyses.slice(0, 3);
        const older = analyses.slice(3, 6);
        
        if (!older.length) return 'insufficient_data';
        
        const recentAvg = recent.reduce((sum, a) => sum + (a.feedback?.overallScore || 0), 0) / recent.length;
        const olderAvg = older.reduce((sum, a) => sum + (a.feedback?.overallScore || 0), 0) / older.length;
        
        if (recentAvg > olderAvg + 2) return 'improving';
        if (recentAvg < olderAvg - 2) return 'declining';
        return 'stable';
    }

    assessRiskFactors(frameAnalysis) {
        return frameAnalysis.detectedIssues
            .filter(issue => issue.severity === 'moderate' || issue.severity === 'high')
            .map(issue => issue.issue);
    }

    calculateImprovementPotential(currentScore) {
        if (currentScore >= 90) return 'high_level';
        if (currentScore >= 80) return 'refinement';
        if (currentScore >= 70) return 'moderate_improvement';
        return 'significant_improvement';
    }

    generateActionPlan(analysis) {
        const improvements = analysis.feedback?.improvements || [];
        const cues = analysis.feedback?.actionableCues || [];
        
        return {
            immediate: cues.slice(0, 3),
            weekly: improvements.slice(0, 2),
            monthly: analysis.recommendations?.progression || []
        };
    }

    suggestRelatedExercises(exerciseType) {
        const related = {
            'squat': ['front_squat', 'overhead_squat', 'goblet_squat'],
            'deadlift': ['sumo_deadlift', 'romanian_deadlift', 'rack_pull'],
            'bench_press': ['incline_press', 'dumbbell_press', 'push_up']
        };
        
        return related[exerciseType] || [];
    }

    async getProgressTracking(userId, exerciseType) {
        try {
            const { default: supabaseService } = await import('./supabaseService.js');
            
            const history = await supabaseService.getUserFormAnalyses(userId, 10);
            const exerciseHistory = history.filter(a => a.exercise_type === exerciseType);
            
            if (exerciseHistory.length < 2) {
                return { hasProgress: false, message: 'Need more analyses for progress tracking' };
            }
            
            const scores = exerciseHistory.map(a => a.feedback?.overallScore || 0);
            const trend = scores[0] - scores[scores.length - 1];
            
            return {
                hasProgress: true,
                totalAnalyses: exerciseHistory.length,
                currentScore: scores[0],
                previousScore: scores[1],
                improvement: trend,
                trend: trend > 2 ? 'improving' : trend < -2 ? 'declining' : 'stable'
            };
            
        } catch (error) {
            console.error('💥 Error getting progress tracking:', error);
            return { hasProgress: false, message: 'Error loading progress data' };
        }
    }

    scheduleVideoCleanup(videoPath) {
        // Clean up video file after 24 hours
        setTimeout(() => {
            try {
                if (fs.existsSync(videoPath)) {
                    fs.unlinkSync(videoPath);
                    console.log(`🗑️ Cleaned up video file: ${videoPath}`);
                }
            } catch (error) {
                console.error('💥 Error cleaning up video file:', error);
            }
        }, 24 * 60 * 60 * 1000); // 24 hours
    }
}

// Create singleton instance
const formAnalysisService = new FormAnalysisService();

export default formAnalysisService;