import express from 'express';
import Joi from 'joi';
import supabaseService from '../services/supabaseService.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { APIError } from '../middleware/errorHandler.js';
import { authenticateRequest, optionalAuth } from '../middleware/supabaseAuth.js';

const router = express.Router();

// Validation schemas
const upgradeSubscriptionSchema = Joi.object({
  planId: Joi.string().uuid().required(),
  billingPeriod: Joi.string().valid('monthly', 'yearly').default('monthly'),
  paymentMethodId: Joi.string().optional(), // Stripe payment method ID
  promoCode: Joi.string().optional()
});

/**
 * @swagger
 * /api/v2/subscription/plans:
 *   get:
 *     summary: Get all available subscription plans
 *     tags: [Subscription]
 *     responses:
 *       200:
 *         description: Available subscription plans
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SubscriptionPlan'
 */
router.get('/plans', optionalAuth, asyncHandler(async (req, res) => {
  console.log('💳 Fetching subscription plans...');

  try {
    const plans = await supabaseService.getSubscriptionPlans();

    // Add user's current plan info if authenticated
    let currentPlan = null;
    if (req.user && req.user.id !== 'legacy-api-user') {
      try {
        const subscription = await supabaseService.getUserSubscription(req.user.id);
        currentPlan = subscription.subscription_plans?.name || subscription.plan?.name || 'free';
      } catch (error) {
        console.warn('Failed to fetch current subscription:', error);
      }
    }

    res.json({
      success: true,
      data: plans.map(plan => ({
        ...plan,
        isCurrentPlan: currentPlan === plan.name,
        recommended: plan.name === 'pro' // Mark Pro as recommended
      }))
    });
  } catch (error) {
    console.error('❌ Failed to fetch plans:', error);
    throw new APIError('Failed to fetch subscription plans', 500, error.message);
  }
}));

/**
 * @swagger
 * /api/v2/subscription/current:
 *   get:
 *     summary: Get current user subscription
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current subscription details
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/current', authenticateRequest, asyncHandler(async (req, res) => {
  console.log('💳 Fetching current subscription...');

  try {
    const subscription = await supabaseService.getUserSubscription(req.user.id);
    const usage = await supabaseService.getMonthlyUsage(req.user.id);

    res.json({
      success: true,
      data: {
        subscription: {
          plan: subscription.subscription_plans || subscription.plan,
          status: subscription.status || 'active',
          currentPeriodStart: subscription.current_period_start,
          currentPeriodEnd: subscription.current_period_end,
          cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
          trialEnd: subscription.trial_end
        },
        usage: {
          current: usage,
          limits: subscription.subscription_plans?.limits || subscription.plan?.limits || {}
        },
        billing: {
          stripeCustomerId: subscription.stripe_customer_id,
          stripeSubscriptionId: subscription.stripe_subscription_id
        }
      }
    });
  } catch (error) {
    console.error('❌ Failed to fetch subscription:', error);
    throw new APIError('Failed to fetch subscription', 500, error.message);
  }
}));

/**
 * @swagger
 * /api/v2/subscription/upgrade:
 *   post:
 *     summary: Upgrade or change subscription plan
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - planId
 *             properties:
 *               planId:
 *                 type: string
 *                 format: uuid
 *               billingPeriod:
 *                 type: string
 *                 enum: [monthly, yearly]
 *               paymentMethodId:
 *                 type: string
 *                 description: Stripe payment method ID
 *     responses:
 *       200:
 *         description: Subscription upgraded successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/upgrade', authenticateRequest, asyncHandler(async (req, res) => {
  const { error, value } = upgradeSubscriptionSchema.validate(req.body);
  if (error) {
    throw new APIError('Validation failed', 400, error.details);
  }

  console.log('⬆️ Processing subscription upgrade...');

  try {
    // Get the target plan
    const { data: plan, error: planError } = await supabaseService.admin
      .from('subscription_plans')
      .select('*')
      .eq('id', value.planId)
      .single();

    if (planError || !plan) {
      throw new APIError('Invalid plan selected', 400, 'Plan not found');
    }

    // Check if it's actually an upgrade
    const currentSubscription = await supabaseService.getUserSubscription(req.user.id);
    const currentPlan = currentSubscription.subscription_plans || currentSubscription.plan;
    
    if (currentPlan.name === plan.name) {
      throw new APIError('Already subscribed to this plan', 400, 'You are already on this plan');
    }

    // For now, simulate the upgrade (in production, integrate with Stripe)
    const subscriptionData = {
      status: plan.name === 'free' ? 'active' : 'trialing', // Free trial for paid plans
      trial_start: plan.name !== 'free' ? new Date() : null,
      trial_end: plan.name !== 'free' ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : null, // 7 days trial
      metadata: {
        billing_period: value.billingPeriod,
        upgraded_from: currentPlan.name,
        upgrade_date: new Date().toISOString()
      }
    };

    // Update subscription
    const newSubscription = await supabaseService.updateUserSubscription(
      req.user.id,
      value.planId,
      subscriptionData
    );

    // In production, you would:
    // 1. Create Stripe customer if needed
    // 2. Create Stripe subscription
    // 3. Handle payment method
    // 4. Set up webhooks for subscription events

    res.json({
      success: true,
      message: `Successfully upgraded to ${plan.display_name}!`,
      data: {
        subscription: newSubscription,
        trial: plan.name !== 'free' ? {
          active: true,
          endsAt: subscriptionData.trial_end,
          daysRemaining: 7
        } : null,
        nextSteps: plan.name !== 'free' ? [
          'Enjoy your 7-day free trial',
          'You will be charged automatically after the trial ends',
          'Cancel anytime before the trial ends'
        ] : []
      }
    });
  } catch (error) {
    console.error('❌ Subscription upgrade failed:', error);
    if (error instanceof APIError) throw error;
    throw new APIError('Failed to upgrade subscription', 500, error.message);
  }
}));

/**
 * @swagger
 * /api/v2/subscription/cancel:
 *   post:
 *     summary: Cancel subscription (at period end)
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Cancellation reason (optional)
 *               feedback:
 *                 type: string
 *                 description: User feedback (optional)
 *     responses:
 *       200:
 *         description: Subscription cancelled successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/cancel', authenticateRequest, asyncHandler(async (req, res) => {
  console.log('❌ Processing subscription cancellation...');

  try {
    const currentSubscription = await supabaseService.getUserSubscription(req.user.id);
    
    if (!currentSubscription || currentSubscription.is_free) {
      throw new APIError('No active subscription to cancel', 400);
    }

    // Cancel at period end (don't immediately revoke access)
    const { error } = await supabaseService.admin
      .from('user_subscriptions')
      .update({
        cancel_at_period_end: true,
        cancelled_at: new Date().toISOString(),
        metadata: {
          ...currentSubscription.metadata,
          cancellation_reason: req.body.reason,
          cancellation_feedback: req.body.feedback,
          cancelled_by_user: true
        }
      })
      .eq('user_id', req.user.id)
      .eq('status', 'active');

    if (error) throw error;

    res.json({
      success: true,
      message: 'Subscription cancelled successfully',
      data: {
        message: 'Your subscription will remain active until the end of your current billing period',
        accessUntil: currentSubscription.current_period_end,
        canReactivate: true
      }
    });
  } catch (error) {
    console.error('❌ Subscription cancellation failed:', error);
    if (error instanceof APIError) throw error;
    throw new APIError('Failed to cancel subscription', 500, error.message);
  }
}));

/**
 * @swagger
 * /api/v2/subscription/reactivate:
 *   post:
 *     summary: Reactivate cancelled subscription
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription reactivated successfully
 *       400:
 *         description: Cannot reactivate subscription
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/reactivate', authenticateRequest, asyncHandler(async (req, res) => {
  console.log('🔄 Processing subscription reactivation...');

  try {
    const currentSubscription = await supabaseService.getUserSubscription(req.user.id);
    
    if (!currentSubscription || !currentSubscription.cancel_at_period_end) {
      throw new APIError('No cancelled subscription to reactivate', 400);
    }

    // Reactivate subscription
    const { error } = await supabaseService.admin
      .from('user_subscriptions')
      .update({
        cancel_at_period_end: false,
        cancelled_at: null,
        metadata: {
          ...currentSubscription.metadata,
          reactivated_at: new Date().toISOString()
        }
      })
      .eq('user_id', req.user.id)
      .eq('id', currentSubscription.id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Subscription reactivated successfully',
      data: {
        message: 'Your subscription will continue and renew as normal',
        nextBillingDate: currentSubscription.current_period_end
      }
    });
  } catch (error) {
    console.error('❌ Subscription reactivation failed:', error);
    if (error instanceof APIError) throw error;
    throw new APIError('Failed to reactivate subscription', 500, error.message);
  }
}));

/**
 * @swagger
 * /api/v2/subscription/usage:
 *   get:
 *     summary: Get detailed usage analytics
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [current, last30, last90]
 *         description: Usage period to analyze
 *     responses:
 *       200:
 *         description: Usage analytics retrieved
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/usage', authenticateRequest, asyncHandler(async (req, res) => {
  console.log('📊 Fetching usage analytics...');

  const period = req.query.period || 'current';

  try {
    let startDate;
    const endDate = new Date();

    switch (period) {
      case 'current':
        startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
        break;
      case 'last30':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'last90':
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
    }

    // Get detailed usage data
    const { data: usageData, error } = await supabaseService.admin
      .from('api_usage')
      .select('endpoint, created_at, status_code, response_time_ms, ai_provider')
      .eq('user_id', req.user.id)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Process usage statistics
    const stats = {
      total: usageData.length,
      successful: usageData.filter(r => r.status_code < 400).length,
      failed: usageData.filter(r => r.status_code >= 400).length,
      byEndpoint: {},
      byProvider: {},
      averageResponseTime: 0,
      dailyUsage: {}
    };

    // Group by endpoint
    usageData.forEach(record => {
      const endpoint = record.endpoint.split('/').pop(); // Get last part of endpoint
      stats.byEndpoint[endpoint] = (stats.byEndpoint[endpoint] || 0) + 1;

      // Group by AI provider
      if (record.ai_provider) {
        stats.byProvider[record.ai_provider] = (stats.byProvider[record.ai_provider] || 0) + 1;
      }

      // Daily usage
      const day = record.created_at.split('T')[0];
      stats.dailyUsage[day] = (stats.dailyUsage[day] || 0) + 1;
    });

    // Calculate average response time
    const responseTimes = usageData.filter(r => r.response_time_ms).map(r => r.response_time_ms);
    stats.averageResponseTime = responseTimes.length > 0 
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : 0;

    res.json({
      success: true,
      data: {
        period: {
          start: startDate,
          end: endDate,
          type: period
        },
        statistics: stats,
        recentActivity: usageData.slice(0, 10) // Last 10 requests
      }
    });
  } catch (error) {
    console.error('❌ Failed to fetch usage analytics:', error);
    throw new APIError('Failed to fetch usage analytics', 500, error.message);
  }
}));

export default router;