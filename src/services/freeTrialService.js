/**
 * Free Trial Service
 * Manages 30-day free trials for all premium subscription plans
 */

class FreeTrialService {
    constructor() {
        this.trialDurationDays = 30;
    }

    /**
     * Start a free trial for a user
     */
    async startFreeTrial(userId, planId) {
        try {
            const { default: supabaseService } = await import('./supabaseService.js');
            
            // Check if user already had a trial for this plan
            const existingTrial = await this.getExistingTrial(userId, planId);
            
            if (existingTrial) {
                throw new Error(`User already used free trial for ${planId} plan`);
            }
            
            // Calculate trial end date
            const trialEndDate = new Date();
            trialEndDate.setDate(trialEndDate.getDate() + this.trialDurationDays);
            
            // Create trial record using database function
            const { data, error } = await supabaseService.supabase.rpc('start_free_trial', {
                p_user_id: userId,
                p_plan_id: planId,
                p_trial_days: this.trialDurationDays
            });
            
            if (error) {
                throw new Error(`Failed to start trial: ${error.message}`);
            }
            
            if (!data || data.length === 0 || !data[0].success) {
                throw new Error('User already used trial for this plan');
            }
            
            const trialData = data[0];
            
            console.log(`🎁 Free trial started for user ${userId} on ${planId} plan until ${trialData.trial_end_date}`);
            
            return {
                success: true,
                trialId: trialData.trial_id,
                trialEndDate: trialData.trial_end_date,
                daysRemaining: this.trialDurationDays,
                planId: planId
            };
            
        } catch (error) {
            console.error('💥 Error starting free trial:', error);
            throw error;
        }
    }

    /**
     * Check if user is currently in trial period
     */
    async isUserInTrial(userId, planId) {
        try {
            const { default: supabaseService } = await import('./supabaseService.js');
            
            const { data, error } = await supabaseService.supabase.rpc('is_user_in_trial', {
                p_user_id: userId,
                p_plan_id: planId
            });
            
            if (error) {
                console.error('Error checking trial status:', error);
                return false;
            }
            
            return data || false;
            
        } catch (error) {
            console.error('💥 Error checking trial status:', error);
            return false;
        }
    }

    /**
     * Get trial status and remaining days
     */
    async getTrialStatus(userId, planId) {
        try {
            const { default: supabaseService } = await import('./supabaseService.js');
            
            const { data, error } = await supabaseService.supabase
                .from('user_trials')
                .select('*')
                .eq('user_id', userId)
                .eq('plan_id', planId)
                .single();
            
            if (error || !data) {
                return {
                    hasTrialHistory: false,
                    isActive: false,
                    daysRemaining: 0
                };
            }
            
            const now = new Date();
            const trialEndDate = new Date(data.trial_end_date);
            const isActive = trialEndDate > now && !data.converted_to_paid;
            const daysRemaining = isActive ? 
                Math.ceil((trialEndDate - now) / (1000 * 60 * 60 * 24)) : 0;
            
            return {
                hasTrialHistory: true,
                isActive: isActive,
                daysRemaining: daysRemaining,
                trialStartDate: data.trial_start_date,
                trialEndDate: data.trial_end_date,
                convertedToPaid: data.converted_to_paid,
                conversionDate: data.conversion_date
            };
            
        } catch (error) {
            console.error('💥 Error getting trial status:', error);
            return {
                hasTrialHistory: false,
                isActive: false,
                daysRemaining: 0
            };
        }
    }

    /**
     * Convert trial to paid subscription
     */
    async convertTrialToPaid(userId, planId) {
        try {
            const { default: supabaseService } = await import('./supabaseService.js');
            
            const { data, error } = await supabaseService.supabase.rpc('convert_trial_to_paid', {
                p_user_id: userId,
                p_plan_id: planId
            });
            
            if (error) {
                throw new Error(`Failed to convert trial: ${error.message}`);
            }
            
            if (!data) {
                throw new Error('No active trial found to convert');
            }
            
            console.log(`💳 Trial converted to paid for user ${userId} on ${planId} plan`);
            
            return {
                success: true,
                planId: planId,
                conversionDate: new Date()
            };
            
        } catch (error) {
            console.error('💥 Error converting trial to paid:', error);
            throw error;
        }
    }

    /**
     * Check if user can start a trial for any plan
     */
    async getAvailableTrials(userId) {
        try {
            const { default: supabaseService } = await import('./supabaseService.js');
            const AIPricingService = (await import('./aiPricingService.js')).default;
            
            // Get all available plans
            const plans = AIPricingService.getPremiumSubscriptionPricing();
            const availableTrials = [];
            
            for (const [planKey, planData] of Object.entries(plans)) {
                const planId = `${planKey}-2025`;
                const trialStatus = await this.getTrialStatus(userId, planId);
                
                if (!trialStatus.hasTrialHistory) {
                    availableTrials.push({
                        planId: planId,
                        planName: planData.name,
                        price: planData.recommendedPrice,
                        trialDays: planData.trialDays,
                        features: planData.features
                    });
                }
            }
            
            return availableTrials;
            
        } catch (error) {
            console.error('💥 Error getting available trials:', error);
            return [];
        }
    }

    /**
     * Get existing trial for user and plan
     */
    async getExistingTrial(userId, planId) {
        try {
            const { default: supabaseService } = await import('./supabaseService.js');
            
            const { data, error } = await supabaseService.supabase
                .from('user_trials')
                .select('*')
                .eq('user_id', userId)
                .eq('plan_id', planId)
                .single();
            
            if (error || !data) {
                return null;
            }
            
            return data;
            
        } catch (error) {
            console.error('💥 Error getting existing trial:', error);
            return null;
        }
    }

    /**
     * Get user's complete plan features including trial status
     */
    async getUserPlanFeatures(userId) {
        try {
            const { default: supabaseService } = await import('./supabaseService.js');
            
            const { data, error } = await supabaseService.supabase.rpc('get_user_plan_features', {
                p_user_id: userId
            });
            
            if (error || !data || data.length === 0) {
                return null;
            }
            
            return data[0];
            
        } catch (error) {
            console.error('💥 Error getting user plan features:', error);
            return null;
        }
    }

    /**
     * Send trial expiration reminders
     */
    async sendTrialReminders() {
        try {
            const { default: supabaseService } = await import('./supabaseService.js');
            
            // Get trials expiring in 3 days
            const threeDaysFromNow = new Date();
            threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
            
            const { data: expiringTrials, error } = await supabaseService.supabase
                .from('user_trials')
                .select(`
                    *,
                    users:user_id (email, first_name),
                    subscription_plans:plan_id (name, price_monthly)
                `)
                .lt('trial_end_date', threeDaysFromNow.toISOString())
                .gt('trial_end_date', new Date().toISOString())
                .eq('converted_to_paid', false);
            
            if (error) {
                throw new Error(`Failed to get expiring trials: ${error.message}`);
            }
            
            for (const trial of expiringTrials || []) {
                await this.sendTrialReminderEmail(trial);
            }
            
            console.log(`📧 Sent trial reminders to ${expiringTrials?.length || 0} users`);
            
        } catch (error) {
            console.error('💥 Error sending trial reminders:', error);
        }
    }

    /**
     * Send trial reminder email
     */
    async sendTrialReminderEmail(trial) {
        try {
            const daysRemaining = Math.ceil(
                (new Date(trial.trial_end_date) - new Date()) / (1000 * 60 * 60 * 24)
            );
            
            console.log(`📧 Trial reminder: ${trial.users.email} has ${daysRemaining} days left on ${trial.subscription_plans.name} plan`);
            
            // TODO: Implement actual email sending
            // This would integrate with your email service (SendGrid, AWS SES, etc.)
            
        } catch (error) {
            console.error('💥 Error sending trial reminder email:', error);
        }
    }

    /**
     * Get trial conversion statistics (admin function)
     */
    async getTrialStatistics() {
        try {
            const { default: supabaseService } = await import('./supabaseService.js');
            
            const { data, error } = await supabaseService.supabase
                .from('user_trials')
                .select('*');
            
            if (error) {
                throw new Error(`Failed to get trial statistics: ${error.message}`);
            }
            
            const totalTrials = data.length;
            const convertedTrials = data.filter(trial => trial.converted_to_paid).length;
            const activeTrials = data.filter(trial => 
                new Date(trial.trial_end_date) > new Date() && !trial.converted_to_paid
            ).length;
            const expiredTrials = data.filter(trial => 
                new Date(trial.trial_end_date) <= new Date() && !trial.converted_to_paid
            ).length;
            
            const conversionRate = totalTrials > 0 ? (convertedTrials / totalTrials) * 100 : 0;
            
            return {
                totalTrials,
                convertedTrials,
                activeTrials,
                expiredTrials,
                conversionRate: Math.round(conversionRate * 100) / 100
            };
            
        } catch (error) {
            console.error('💥 Error getting trial statistics:', error);
            return {
                totalTrials: 0,
                convertedTrials: 0,
                activeTrials: 0,
                expiredTrials: 0,
                conversionRate: 0
            };
        }
    }
}

// Create singleton instance
const freeTrialService = new FreeTrialService();

export default freeTrialService;