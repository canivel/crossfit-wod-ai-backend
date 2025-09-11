/**
 * Credit System Service
 * Handles credit-based WOD generations for users who need extra workouts
 */

import AIPricingService from './aiPricingService.js';

class CreditService {
    constructor() {
        // Premium credit pricing for enhanced features
        this.creditFeatures = {
            'wod_refresh': { credits: 1, name: 'WOD Refresh' },
            'custom_wod': { credits: 3, name: 'Custom WOD' },
            'form_analysis': { credits: 4, name: 'Form Analysis' },
            'nutrition_plan': { credits: 5, name: 'Nutrition Plan' },
            'recovery_session': { credits: 2, name: 'Recovery Session' },
            'competition_entry': { credits: 5, name: 'Competition Entry' },
            'personal_training': { credits: 8, name: 'Personal Training Session' }
        };
        
        this.creditPackages = [
            { name: 'Boost Pack', credits: 10, price: 2.99, savings: 0 },
            { name: 'Power Pack', credits: 25, price: 6.99, savings: 15 },
            { name: 'Beast Pack', credits: 60, price: 14.99, savings: 25 }
        ];
    }

    /**
     * Check user's credit balance
     */
    async getUserCredits(userId) {
        try {
            const { default: supabaseService } = await import('./supabaseService.js');
            return await supabaseService.getUserCredits(userId);
        } catch (error) {
            console.error('💥 Error getting user credits:', error);
            return 0;
        }
    }

    /**
     * Deduct credits for premium features
     */
    async deductCredits(userId, featureType, provider = 'anthropic', model = 'claude-3-sonnet', metadata = {}) {
        try {
            const feature = this.creditFeatures[featureType];
            
            if (!feature) {
                throw new Error(`Unknown feature type: ${featureType}`);
            }
            
            const creditsRequired = feature.credits;
            const currentBalance = await this.getUserCredits(userId);
            
            if (currentBalance < creditsRequired) {
                throw new Error(`Insufficient credits. Required: ${creditsRequired}, Available: ${currentBalance}`);
            }

            const { default: supabaseService } = await import('./supabaseService.js');
            
            // Create enhanced deduction transaction
            const transaction = await supabaseService.createEnhancedCreditTransaction({
                userId,
                transactionType: featureType,
                creditsUsed: creditsRequired,
                description: `${feature.name} - Premium feature usage`,
                metadata: {
                    featureType,
                    featureName: feature.name,
                    aiProvider: provider,
                    aiModel: model,
                    ...metadata
                }
            });

            // Update user's credit balance
            const newBalance = await supabaseService.updateUserCredits(userId, -creditsRequired);
            
            console.log(`💳 Deducted ${creditsRequired} credit(s) for ${feature.name} from user ${userId}. New balance: ${newBalance}`);
            
            return {
                success: true,
                creditsDeducted: creditsRequired,
                newBalance,
                transactionId: transaction.id,
                featureUsed: feature.name
            };
            
        } catch (error) {
            console.error('💥 Error deducting credits:', error);
            throw error;
        }
    }

    /**
     * Add credits to user account (purchase or grant)
     */
    async addCredits(userId, amount, reason = 'purchase', metadata = {}) {
        try {
            const { default: supabaseService } = await import('./supabaseService.js');
            
            // Create addition transaction
            const transaction = await supabaseService.createCreditTransaction({
                userId,
                type: 'addition',
                amount,
                description: reason,
                metadata
            });

            // Update user's credit balance
            const newBalance = await supabaseService.updateUserCredits(userId, amount);
            
            console.log(`💰 Added ${amount} credit(s) to user ${userId}. New balance: ${newBalance}`);
            
            return {
                success: true,
                creditsAdded: amount,
                newBalance,
                transactionId: transaction.id
            };
            
        } catch (error) {
            console.error('💥 Error adding credits:', error);
            throw error;
        }
    }

    /**
     * Purchase credits with different package options
     */
    async purchaseCredits(userId, packageIndex) {
        try {
            if (packageIndex < 0 || packageIndex >= this.creditPackages.length) {
                throw new Error('Invalid credit package selected');
            }

            const package_ = this.creditPackages[packageIndex];
            
            // In a real application, this would process payment first
            // For now, we'll simulate successful payment
            
            const result = await this.addCredits(userId, package_.credits, 'credit_purchase', {
                packageIndex,
                package: package_,
                paymentStatus: 'completed',
                purchaseDate: new Date().toISOString()
            });

            return {
                ...result,
                package: package_,
                discount: package_.discount
            };
            
        } catch (error) {
            console.error('💥 Error purchasing credits:', error);
            throw error;
        }
    }

    /**
     * Get available credit packages
     */
    getCreditPackages() {
        return this.creditPackages.map((pkg, index) => ({
            ...pkg,
            index,
            pricePerCredit: pkg.price / pkg.credits,
            savingsAmount: (pkg.credits * this.creditPrice) - pkg.price
        }));
    }

    /**
     * Check if user can generate a workout (has enough credits or subscription limit)
     */
    async canGenerateWorkout(userId) {
        try {
            const { default: supabaseService } = await import('./supabaseService.js');
            
            // Check if user has active subscription with remaining allowance
            const subscription = await supabaseService.getUserSubscription(userId);
            
            if (subscription && subscription.plan_id !== 'free-2025') {
                const usage = await supabaseService.getMonthlyUsage(userId);
                
                // Elite plan has unlimited (-1)
                if (subscription.max_requests_per_month === -1) {
                    return { canGenerate: true, reason: 'unlimited_plan' };
                }
                
                // Check if within monthly limit
                if (usage.total < subscription.max_requests_per_month) {
                    return { 
                        canGenerate: true, 
                        reason: 'subscription_allowance',
                        remaining: subscription.max_requests_per_month - usage.total
                    };
                }
            }
            
            // Check credit balance
            const credits = await this.getUserCredits(userId);
            
            if (credits >= 1) {
                return { 
                    canGenerate: true, 
                    reason: 'credits_available',
                    credits: credits
                };
            }
            
            return { 
                canGenerate: false, 
                reason: 'insufficient_credits_and_quota',
                credits: credits,
                needsUpgrade: true
            };
            
        } catch (error) {
            console.error('💥 Error checking workout generation eligibility:', error);
            return { canGenerate: false, reason: 'error', error: error.message };
        }
    }

    /**
     * Get user's credit transaction history
     */
    async getCreditHistory(userId, limit = 50) {
        try {
            const { default: supabaseService } = await import('./supabaseService.js');
            return await supabaseService.getCreditHistory(userId, limit);
        } catch (error) {
            console.error('💥 Error getting credit history:', error);
            return [];
        }
    }

    /**
     * Grant credits to user (admin function)
     */
    async grantCredits(userId, amount, reason = 'admin_grant', adminId = null) {
        try {
            const result = await this.addCredits(userId, amount, reason, {
                grantedBy: adminId,
                grantDate: new Date().toISOString(),
                type: 'admin_grant'
            });

            console.log(`🎁 Admin granted ${amount} credits to user ${userId}. Reason: ${reason}`);
            
            return result;
            
        } catch (error) {
            console.error('💥 Error granting credits:', error);
            throw error;
        }
    }

    /**
     * Refund credits (admin function)
     */
    async refundCredits(transactionId, adminId = null) {
        try {
            const { default: supabaseService } = await import('./supabaseService.js');
            
            const transaction = await supabaseService.getCreditTransaction(transactionId);
            if (!transaction) {
                throw new Error('Transaction not found');
            }
            
            if (transaction.type !== 'deduction') {
                throw new Error('Can only refund deduction transactions');
            }
            
            // Add the credits back
            const result = await this.addCredits(
                transaction.user_id, 
                transaction.amount, 
                `Refund for transaction ${transactionId}`,
                {
                    refundedTransaction: transactionId,
                    refundedBy: adminId,
                    refundDate: new Date().toISOString()
                }
            );

            console.log(`🔄 Refunded ${transaction.amount} credits for transaction ${transactionId}`);
            
            return result;
            
        } catch (error) {
            console.error('💥 Error refunding credits:', error);
            throw error;
        }
    }

    /**
     * Get credit system statistics (admin function)
     */
    async getCreditStatistics() {
        try {
            const { default: supabaseService } = await import('./supabaseService.js');
            
            const stats = await supabaseService.getCreditStatistics();
            
            return {
                totalCreditsIssued: stats.totalIssued || 0,
                totalCreditsUsed: stats.totalUsed || 0,
                totalCreditsOutstanding: stats.totalOutstanding || 0,
                averageCreditsPerUser: stats.avgPerUser || 0,
                totalRevenue: stats.totalRevenue || 0,
                packagesSold: stats.packagesSold || 0
            };
            
        } catch (error) {
            console.error('💥 Error getting credit statistics:', error);
            return {};
        }
    }

    /**
     * Check if user can use a specific premium feature
     */
    async canUseFeature(userId, featureType) {
        try {
            const feature = this.creditFeatures[featureType];
            
            if (!feature) {
                return { canUse: false, reason: 'unknown_feature' };
            }
            
            const credits = await this.getUserCredits(userId);
            
            if (credits >= feature.credits) {
                return { 
                    canUse: true, 
                    creditsRequired: feature.credits,
                    creditsAvailable: credits
                };
            }
            
            return { 
                canUse: false, 
                reason: 'insufficient_credits',
                creditsRequired: feature.credits,
                creditsAvailable: credits,
                creditsNeeded: feature.credits - credits
            };
            
        } catch (error) {
            console.error('💥 Error checking feature availability:', error);
            return { canUse: false, reason: 'error', error: error.message };
        }
    }

    /**
     * Get all available credit features
     */
    getCreditFeatures() {
        return this.creditFeatures;
    }

    /**
     * Use credits for WOD refresh
     */
    async useWodRefresh(userId, metadata = {}) {
        return await this.deductCredits(userId, 'wod_refresh', 'anthropic', 'claude-3-sonnet', metadata);
    }

    /**
     * Use credits for custom WOD generation
     */
    async useCustomWod(userId, metadata = {}) {
        return await this.deductCredits(userId, 'custom_wod', 'anthropic', 'claude-3-sonnet', metadata);
    }

    /**
     * Use credits for form analysis
     */
    async useFormAnalysis(userId, metadata = {}) {
        return await this.deductCredits(userId, 'form_analysis', 'anthropic', 'claude-3-sonnet', metadata);
    }

    /**
     * Use credits for nutrition plan
     */
    async useNutritionPlan(userId, metadata = {}) {
        return await this.deductCredits(userId, 'nutrition_plan', 'anthropic', 'claude-3-sonnet', metadata);
    }

    /**
     * Use credits for recovery session
     */
    async useRecoverySession(userId, metadata = {}) {
        return await this.deductCredits(userId, 'recovery_session', 'anthropic', 'claude-3-sonnet', metadata);
    }

    /**
     * Use credits for competition entry
     */
    async useCompetitionEntry(userId, metadata = {}) {
        return await this.deductCredits(userId, 'competition_entry', 'anthropic', 'claude-3-sonnet', metadata);
    }

    /**
     * Use credits for personal training session
     */
    async usePersonalTraining(userId, metadata = {}) {
        return await this.deductCredits(userId, 'personal_training', 'anthropic', 'claude-3-sonnet', metadata);
    }

    /**
     * Get feature usage statistics for a user
     */
    async getUserFeatureUsage(userId, days = 30) {
        try {
            const { default: supabaseService } = await import('./supabaseService.js');
            
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            
            const { data, error } = await supabaseService.supabase
                .from('enhanced_credit_transactions')
                .select('transaction_type, credits_used, created_at')
                .eq('user_id', userId)
                .gte('created_at', startDate.toISOString())
                .order('created_at', { ascending: false });
            
            if (error) {
                throw new Error(`Failed to get feature usage: ${error.message}`);
            }
            
            const usage = {};
            let totalCreditsUsed = 0;
            
            for (const transaction of data || []) {
                const featureType = transaction.transaction_type;
                
                if (!usage[featureType]) {
                    usage[featureType] = {
                        count: 0,
                        creditsUsed: 0,
                        lastUsed: null
                    };
                }
                
                usage[featureType].count++;
                usage[featureType].creditsUsed += transaction.credits_used;
                totalCreditsUsed += transaction.credits_used;
                
                if (!usage[featureType].lastUsed || 
                    new Date(transaction.created_at) > new Date(usage[featureType].lastUsed)) {
                    usage[featureType].lastUsed = transaction.created_at;
                }
            }
            
            return {
                period: `${days} days`,
                totalCreditsUsed,
                featureUsage: usage,
                totalTransactions: data?.length || 0
            };
            
        } catch (error) {
            console.error('💥 Error getting user feature usage:', error);
            return {
                period: `${days} days`,
                totalCreditsUsed: 0,
                featureUsage: {},
                totalTransactions: 0
            };
        }
    }
}

// Create singleton instance
const creditService = new CreditService();

export default creditService;