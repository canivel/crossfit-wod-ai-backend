import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase client with service key for admin operations
const supabaseUrl = process.env.SUPABASE_URL || 'https://xgnqubokdxxqvuzwvdqy.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
}

// Admin client for server-side operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Public client for client-safe operations
export const supabasePublic = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  }
});

export class SupabaseService {
  constructor() {
    this.admin = supabaseAdmin;
    this.public = supabasePublic;
  }

  /**
   * Get user by ID
   */
  async getUserById(userId) {
    const { data, error } = await this.admin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get user's active subscription
   */
  async getUserSubscription(userId) {
    const { data, error } = await this.admin
      .from('user_subscriptions')
      .select(`
        *,
        subscription_plans (*)
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (error && error.code !== 'PGRST116') { // Not found error
      throw error;
    }

    // If no subscription, return free plan
    if (!data) {
      const { data: freePlan } = await this.admin
        .from('subscription_plans')
        .select('*')
        .eq('name', 'free')
        .single();
      
      return {
        plan: freePlan,
        status: 'active',
        is_free: true
      };
    }

    return data;
  }

  /**
   * Track API usage
   */
  async trackApiUsage(userId, endpoint, method, metadata = {}) {
    const { error } = await this.admin
      .from('api_usage')
      .insert({
        user_id: userId,
        endpoint,
        method,
        ...metadata,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Failed to track API usage:', error);
    }
  }

  /**
   * Get user's usage for current month
   */
  async getMonthlyUsage(userId) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data, error } = await this.admin
      .from('api_usage')
      .select('endpoint')
      .eq('user_id', userId)
      .gte('created_at', startOfMonth.toISOString());

    if (error) throw error;

    // Count by endpoint type
    const usage = {
      total: data.length,
      workouts: data.filter(r => r.endpoint.includes('/wod/generate')).length,
      coaching: data.filter(r => r.endpoint.includes('/wod/coaching-cues')).length,
      modifications: data.filter(r => r.endpoint.includes('/wod/modifications')).length
    };

    return usage;
  }

  /**
   * Check if user has exceeded their plan limits
   */
  async checkUsageLimits(userId, endpoint) {
    const subscription = await this.getUserSubscription(userId);
    const usage = await this.getMonthlyUsage(userId);
    
    const plan = subscription.subscription_plans || subscription.plan;
    const limits = plan.limits || {};
    
    // Check workout generation limit
    if (endpoint.includes('/wod/generate')) {
      const limit = limits.workouts_per_month;
      if (limit !== -1 && usage.workouts >= limit) {
        return {
          exceeded: true,
          limit,
          current: usage.workouts,
          type: 'workouts'
        };
      }
    }
    
    // Check coaching cues limit
    if (endpoint.includes('/wod/coaching-cues')) {
      if (!plan.has_coaching_cues && subscription.is_free) {
        return {
          exceeded: true,
          message: 'Coaching cues not available on free plan',
          upgrade_required: true
        };
      }
      const limit = limits.coaching_cues_per_month;
      if (limit !== -1 && usage.coaching >= limit) {
        return {
          exceeded: true,
          limit,
          current: usage.coaching,
          type: 'coaching_cues'
        };
      }
    }
    
    // Check modifications limit
    if (endpoint.includes('/wod/modifications')) {
      const limit = limits.modifications_per_month;
      if (limit !== -1 && usage.modifications >= limit) {
        return {
          exceeded: true,
          limit,
          current: usage.modifications,
          type: 'modifications'
        };
      }
    }
    
    return { exceeded: false };
  }

  /**
   * Create or update user profile
   */
  async upsertUserProfile(userId, profileData) {
    const { data, error } = await this.admin
      .from('users')
      .upsert({
        id: userId,
        ...profileData,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Create API token for user
   */
  async createApiToken(userId, name, description = '') {
    // Generate a secure random token
    const token = `wod_${crypto.randomBytes(32).toString('hex')}`;
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const { data, error } = await this.admin
      .from('api_tokens')
      .insert({
        user_id: userId,
        token_hash: tokenHash,
        name,
        description,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    
    // Return the unhashed token only once
    return {
      ...data,
      token // This will only be shown once to the user
    };
  }

  /**
   * Verify API token
   */
  async verifyApiToken(token) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    const { data, error } = await this.admin
      .from('api_tokens')
      .select('*, users(*)')
      .eq('token_hash', tokenHash)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return null;
    }

    // Check if token is expired
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return null;
    }

    // Update last used timestamp
    await this.admin
      .from('api_tokens')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', data.id);

    return data;
  }

  /**
   * List user's API tokens
   */
  async getUserApiTokens(userId) {
    const { data, error } = await this.admin
      .from('api_tokens')
      .select('id, name, description, last_used_at, created_at, is_active')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  /**
   * Revoke API token
   */
  async revokeApiToken(userId, tokenId) {
    const { error } = await this.admin
      .from('api_tokens')
      .update({ is_active: false })
      .eq('id', tokenId)
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  }

  /**
   * Log workout completion
   */
  async logWorkout(userId, workoutData) {
    const { data, error } = await this.admin
      .from('workout_logs')
      .insert({
        user_id: userId,
        ...workoutData,
        completed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get user's workout history
   */
  async getWorkoutHistory(userId, limit = 20, offset = 0) {
    const { data, error, count } = await this.admin
      .from('workout_logs')
      .select('*, workouts(*)', { count: 'exact' })
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return { data, total: count };
  }

  /**
   * Get all subscription plans
   */
  async getSubscriptionPlans() {
    const { data, error } = await this.admin
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (error) throw error;
    return data;
  }

  /**
   * Update user subscription
   */
  async updateUserSubscription(userId, planId, subscriptionData = {}) {
    // First, cancel any existing active subscription
    await this.admin
      .from('user_subscriptions')
      .update({ 
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('status', 'active');

    // Create new subscription
    const { data, error } = await this.admin
      .from('user_subscriptions')
      .insert({
        user_id: userId,
        plan_id: planId,
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        ...subscriptionData
      })
      .select('*, subscription_plans(*)')
      .single();

    if (error) throw error;
    return data;
  }
}

// Export singleton instance
export default new SupabaseService();