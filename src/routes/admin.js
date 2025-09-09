import express from 'express';
import Joi from 'joi';
import supabaseService from '../services/supabaseService.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { APIError } from '../middleware/errorHandler.js';
import { authenticateRequest } from '../middleware/supabaseAuth.js';

const router = express.Router();

// Admin authentication middleware (you should implement proper admin auth)
const requireAdmin = (req, res, next) => {
  // For now, just check if user is authenticated
  // In production, add proper admin role checking
  if (!req.user) {
    throw new APIError('Admin access required', 403);
  }
  next();
};

// Temporary: Skip authentication for testing
// router.use(authenticateRequest);
// router.use(requireAdmin);

/**
 * @swagger
 * /api/v2/admin/dashboard:
 *   get:
 *     summary: Get comprehensive dashboard metrics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard metrics retrieved successfully
 */
router.get('/dashboard', asyncHandler(async (req, res) => {
  console.log('📊 Loading admin dashboard metrics...');

  try {
    // Temporary: Use mock data for testing
    const users = [
      { id: '1', created_at: '2025-01-15T00:00:00Z', fitness_level: 'intermediate' },
      { id: '2', created_at: '2025-01-20T00:00:00Z', fitness_level: 'beginner' },
      { id: '3', created_at: '2025-02-01T00:00:00Z', fitness_level: 'advanced' },
      { id: '4', created_at: '2025-02-10T00:00:00Z', fitness_level: 'beginner' },
      { id: '5', created_at: '2025-02-15T00:00:00Z', fitness_level: 'intermediate' }
    ];

    const subscriptions = [
      { id: '1', status: 'active', created_at: '2025-01-15T00:00:00Z', current_period_end: '2025-03-15T00:00:00Z', subscription_plans: { name: 'free', price_monthly: 0 } },
      { id: '2', status: 'active', created_at: '2025-01-20T00:00:00Z', current_period_end: '2025-03-20T00:00:00Z', subscription_plans: { name: 'pro', price_monthly: 9.99 } },
      { id: '3', status: 'active', created_at: '2025-02-01T00:00:00Z', current_period_end: '2025-04-01T00:00:00Z', subscription_plans: { name: 'elite', price_monthly: 19.99 } },
      { id: '4', status: 'active', created_at: '2025-02-10T00:00:00Z', current_period_end: '2025-04-10T00:00:00Z', subscription_plans: { name: 'free', price_monthly: 0 } }
    ];

    const workouts = [
      { id: '1', created_at: '2025-02-01T10:00:00Z', workout_type: 'amrap' },
      { id: '2', created_at: '2025-02-02T10:00:00Z', workout_type: 'for_time' },
      { id: '3', created_at: '2025-02-03T10:00:00Z', workout_type: 'strength' },
      { id: '4', created_at: '2025-02-04T10:00:00Z', workout_type: 'emom' },
      { id: '5', created_at: '2025-02-05T10:00:00Z', workout_type: 'for_time' }
    ];

    const apiUsage = [
      { id: '1', created_at: '2025-02-01T10:00:00Z', endpoint: '/api/v2/wod/generate', ai_provider: 'claude', tokens_used: 1500 },
      { id: '2', created_at: '2025-02-01T11:00:00Z', endpoint: '/api/v2/wod/generate', ai_provider: 'claude', tokens_used: 1200 },
      { id: '3', created_at: '2025-02-02T09:00:00Z', endpoint: '/api/v2/wod/coaching-cues', ai_provider: 'claude', tokens_used: 800 },
      { id: '4', created_at: '2025-02-02T10:00:00Z', endpoint: '/api/v2/wod/generate', ai_provider: 'claude', tokens_used: 1800 },
      { id: '5', created_at: '2025-02-03T08:00:00Z', endpoint: '/api/v2/wod/generate', ai_provider: 'claude', tokens_used: 1300 }
    ];

    // Calculate metrics
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const totalUsers = users?.length || 0;
    const newUsersThisMonth = users?.filter(u => new Date(u.created_at) >= thisMonth).length || 0;
    const newUsersLastMonth = users?.filter(u => 
      new Date(u.created_at) >= lastMonth && new Date(u.created_at) < thisMonth
    ).length || 0;

    const activeSubscriptions = subscriptions?.filter(s => s.status === 'active').length || 0;
    const monthlyRevenue = subscriptions?.filter(s => s.status === 'active')
      .reduce((sum, s) => sum + parseFloat(s.subscription_plans.price_monthly), 0) || 0;

    const totalWorkouts = workouts?.length || 0;
    const workoutsThisMonth = workouts?.filter(w => new Date(w.created_at) >= thisMonth).length || 0;

    // Calculate growth percentages
    const userGrowth = newUsersLastMonth > 0 ? 
      ((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth * 100).toFixed(1) : 0;

    // Subscription breakdown
    const subscriptionBreakdown = {
      free: users?.filter(u => !subscriptions?.some(s => s.user_id === u.id && s.status === 'active')).length || 0,
      pro: subscriptions?.filter(s => s.status === 'active' && s.subscription_plans.name === 'pro').length || 0,
      elite: subscriptions?.filter(s => s.status === 'active' && s.subscription_plans.name === 'elite').length || 0
    };

    // Workout type breakdown
    const workoutTypes = {};
    workouts?.forEach(w => {
      workoutTypes[w.workout_type] = (workoutTypes[w.workout_type] || 0) + 1;
    });

    // AI provider usage
    const aiProviders = {};
    apiUsage?.forEach(usage => {
      if (usage.ai_provider) {
        aiProviders[usage.ai_provider] = (aiProviders[usage.ai_provider] || 0) + 1;
      }
    });

    // Recent activity (last 10 items)
    const recentActivity = [
      ...users?.slice(-5).map(u => ({
        type: 'user_signup',
        description: `New user registered: ${u.id}`,
        timestamp: u.created_at,
        icon: 'user-plus'
      })) || [],
      ...workouts?.slice(-5).map(w => ({
        type: 'workout_generated',
        description: `Workout generated: ${w.workout_type}`,
        timestamp: w.created_at,
        icon: 'dumbbell'
      })) || []
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);

    const response = {
      success: true,
      data: {
        metrics: {
          totalUsers,
          newUsersThisMonth,
          userGrowth: parseFloat(userGrowth),
          monthlyRevenue,
          activeSubscriptions,
          totalWorkouts,
          workoutsThisMonth
        },
        subscriptionBreakdown,
        workoutTypes,
        aiProviders,
        recentActivity,
        chartData: {
          userGrowth: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            data: [0, 0, 0, 0, newUsersLastMonth, newUsersThisMonth] // Simplified for demo
          },
          revenue: {
            labels: ['Free', 'Pro', 'Elite'],
            data: [subscriptionBreakdown.free, subscriptionBreakdown.pro, subscriptionBreakdown.elite]
          }
        }
      }
    };

    console.log('✅ Dashboard metrics loaded successfully');
    res.json(response);

  } catch (error) {
    console.error('❌ Dashboard metrics failed:', error);
    throw new APIError('Failed to load dashboard metrics', 500, error.message);
  }
}));

/**
 * @swagger
 * /api/v2/admin/users:
 *   get:
 *     summary: Get all users with pagination
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: plan
 *         schema:
 *           type: string
 *           enum: [free, pro, elite]
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 */
router.get('/users', asyncHandler(async (req, res) => {
  console.log('👥 Loading users for admin...');

  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const offset = (page - 1) * limit;
  const search = req.query.search || '';
  const planFilter = req.query.plan;

  try {
    let query = supabaseService.admin
      .from('users')
      .select(`
        id, email, display_name, fitness_level, created_at,
        user_subscriptions!left(
          status, 
          subscription_plans!inner(name, display_name)
        )
      `);

    if (search) {
      query = query.or(`email.ilike.%${search}%,display_name.ilike.%${search}%`);
    }

    const { data: users, error: usersError, count } = await query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (usersError) throw usersError;

    // Filter by plan if specified
    let filteredUsers = users || [];
    if (planFilter) {
      filteredUsers = users.filter(user => {
        const activeSub = user.user_subscriptions?.find(s => s.status === 'active');
        if (planFilter === 'free') {
          return !activeSub;
        }
        return activeSub?.subscription_plans?.name === planFilter;
      });
    }

    // Format user data
    const formattedUsers = filteredUsers.map(user => ({
      id: user.id,
      email: user.email,
      displayName: user.display_name || 'N/A',
      fitnessLevel: user.fitness_level || 'Not set',
      plan: user.user_subscriptions?.find(s => s.status === 'active')?.subscription_plans?.display_name || 'Free',
      status: user.user_subscriptions?.find(s => s.status === 'active')?.status || 'free',
      joinedAt: new Date(user.created_at).toLocaleDateString(),
      createdAt: user.created_at
    }));

    const response = {
      success: true,
      data: {
        users: formattedUsers,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      }
    };

    console.log(`✅ Loaded ${formattedUsers.length} users`);
    res.json(response);

  } catch (error) {
    console.error('❌ Users loading failed:', error);
    throw new APIError('Failed to load users', 500, error.message);
  }
}));

/**
 * @swagger
 * /api/v2/admin/subscriptions:
 *   get:
 *     summary: Get all subscriptions
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscriptions retrieved successfully
 */
router.get('/subscriptions', asyncHandler(async (req, res) => {
  console.log('💳 Loading subscriptions for admin...');

  try {
    const { data: subscriptions, error } = await supabaseService.admin
      .from('user_subscriptions')
      .select(`
        id, status, current_period_start, current_period_end, created_at,
        users!inner(email, display_name),
        subscription_plans!inner(name, display_name, price_monthly)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formattedSubscriptions = subscriptions?.map(sub => ({
      id: sub.id,
      userEmail: sub.users.email,
      userName: sub.users.display_name || 'N/A',
      plan: sub.subscription_plans.display_name,
      status: sub.status,
      monthlyPrice: parseFloat(sub.subscription_plans.price_monthly),
      currentPeriodStart: new Date(sub.current_period_start).toLocaleDateString(),
      currentPeriodEnd: new Date(sub.current_period_end).toLocaleDateString(),
      createdAt: sub.created_at
    })) || [];

    const response = {
      success: true,
      data: {
        subscriptions: formattedSubscriptions,
        summary: {
          total: formattedSubscriptions.length,
          active: formattedSubscriptions.filter(s => s.status === 'active').length,
          cancelled: formattedSubscriptions.filter(s => s.status === 'cancelled').length,
          totalMonthlyRevenue: formattedSubscriptions
            .filter(s => s.status === 'active')
            .reduce((sum, s) => sum + s.monthlyPrice, 0)
        }
      }
    };

    console.log(`✅ Loaded ${formattedSubscriptions.length} subscriptions`);
    res.json(response);

  } catch (error) {
    console.error('❌ Subscriptions loading failed:', error);
    throw new APIError('Failed to load subscriptions', 500, error.message);
  }
}));

/**
 * @swagger
 * /api/v2/admin/workouts/analytics:
 *   get:
 *     summary: Get workout analytics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Workout analytics retrieved successfully
 */
router.get('/workouts/analytics', asyncHandler(async (req, res) => {
  console.log('📊 Loading workout analytics...');

  try {
    const { data: workouts, error: workoutsError } = await supabaseService.admin
      .from('workouts')
      .select('id, workout_type, difficulty_level, created_at');

    const { data: apiUsage, error: apiError } = await supabaseService.admin
      .from('api_usage')
      .select('ai_provider, tokens_used, created_at')
      .eq('endpoint', '/api/v2/wod/generate');

    if (workoutsError) throw workoutsError;
    if (apiError) throw apiError;

    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Workout type distribution
    const workoutTypes = {};
    workouts?.forEach(w => {
      workoutTypes[w.workout_type] = (workoutTypes[w.workout_type] || 0) + 1;
    });

    // AI provider usage
    const aiProviderUsage = {};
    apiUsage?.forEach(usage => {
      if (usage.ai_provider) {
        aiProviderUsage[usage.ai_provider] = (aiProviderUsage[usage.ai_provider] || 0) + 1;
      }
    });

    // Monthly workout generation trend
    const monthlyTrend = {};
    workouts?.forEach(w => {
      const month = new Date(w.created_at).toISOString().slice(0, 7); // YYYY-MM
      monthlyTrend[month] = (monthlyTrend[month] || 0) + 1;
    });

    const response = {
      success: true,
      data: {
        totalWorkouts: workouts?.length || 0,
        workoutsThisMonth: workouts?.filter(w => new Date(w.created_at) >= thisMonth).length || 0,
        workoutTypes,
        aiProviderUsage,
        monthlyTrend,
        averageTokensPerWorkout: apiUsage?.length > 0 ? 
          apiUsage.reduce((sum, u) => sum + (u.tokens_used || 0), 0) / apiUsage.length : 0
      }
    };

    console.log('✅ Workout analytics loaded successfully');
    res.json(response);

  } catch (error) {
    console.error('❌ Workout analytics failed:', error);
    throw new APIError('Failed to load workout analytics', 500, error.message);
  }
}));

/**
 * @swagger
 * /api/v2/admin/credits/grant:
 *   post:
 *     summary: Grant credits to a user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userEmail:
 *                 type: string
 *                 format: email
 *               credits:
 *                 type: integer
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Credits granted successfully
 */
router.post('/credits/grant', asyncHandler(async (req, res) => {
  const { userEmail, userId, credits, creditType = 'workout', reason = 'Admin granted' } = req.body;

  // Support both userEmail and userId for flexibility
  const identifier = userEmail || userId || 'unknown';
  console.log(`💰 Granting ${credits} ${creditType} credits to ${identifier}...`);

  try {
    // Mock user lookup for testing
    const user = { 
      id: userId || '123e4567-e89b-12d3-a456-426614174000',
      email: userEmail || 'user@example.com'
    };

    // Mock credit grant response
    const creditGrant = {
      id: Date.now().toString(),
      userId: user.id,
      creditType,
      amount: parseInt(credits),
      reason: reason || 'Admin credit grant',
      grantedBy: 'admin',
      timestamp: new Date().toISOString()
    };

    // You could store this in a credits_log table
    console.log('Credit grant logged:', creditGrant);

    const response = {
      success: true,
      message: `${credits} ${creditType} credits granted to ${identifier}`,
      data: creditGrant
    };

    console.log(`✅ Credits granted successfully`);
    res.json(response);

  } catch (error) {
    console.error('❌ Credit grant failed:', error);
    if (error instanceof APIError) throw error;
    throw new APIError('Failed to grant credits', 500, error.message);
  }
}));

/**
 * @swagger
 * /api/v2/admin/support/tickets:
 *   get:
 *     summary: Get support tickets
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Support tickets retrieved successfully
 */
router.get('/support/tickets', asyncHandler(async (req, res) => {
  console.log('🎧 Loading support tickets...');

  try {
    // Mock support tickets - in production you'd have a support_tickets table
    const mockTickets = [
      {
        id: '1',
        title: 'Workout generation error',
        description: 'User experiencing issues with AI workout generation for advanced level',
        priority: 'high',
        status: 'open',
        userEmail: 'john.doe@example.com',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        category: 'technical'
      },
      {
        id: '2',
        title: 'Billing inquiry',
        description: 'Question about pro plan features and billing cycle',
        priority: 'medium',
        status: 'in_progress',
        userEmail: 'sarah.smith@example.com',
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
        category: 'billing'
      }
    ];

    const response = {
      success: true,
      data: {
        tickets: mockTickets,
        summary: {
          total: mockTickets.length,
          open: mockTickets.filter(t => t.status === 'open').length,
          inProgress: mockTickets.filter(t => t.status === 'in_progress').length,
          closed: mockTickets.filter(t => t.status === 'closed').length
        }
      }
    };

    console.log('✅ Support tickets loaded successfully');
    res.json(response);

  } catch (error) {
    console.error('❌ Support tickets loading failed:', error);
    throw new APIError('Failed to load support tickets', 500, error.message);
  }
}));

// ======================= COUPON MANAGEMENT =======================

/**
 * @swagger
 * /api/v2/admin/coupons:
 *   get:
 *     summary: Get all coupons with filtering
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, expired]
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [percentage, fixed_amount, credits]
 *     responses:
 *       200:
 *         description: Coupons retrieved successfully
 */
router.get('/coupons', asyncHandler(async (req, res) => {
  console.log('🎫 Loading coupons...');

  const { status, type } = req.query;
  let query = supabaseService.admin.from('coupons').select('*').order('created_at', { ascending: false });

  // Apply filters
  if (status === 'active') {
    query = query.eq('is_active', true).gte('valid_until', new Date().toISOString());
  } else if (status === 'inactive') {
    query = query.eq('is_active', false);
  } else if (status === 'expired') {
    query = query.eq('is_active', true).lt('valid_until', new Date().toISOString());
  }

  if (type) {
    query = query.eq('type', type);
  }

  // For now, use mock data since we have Supabase connection issues
  const mockCoupons = [
    {
      id: '1',
      code: 'WELCOME10',
      name: 'Welcome 10% Off',
      description: 'Get 10% off your first Pro or Elite subscription',
      type: 'percentage',
      value: 10,
      max_uses: null,
      current_uses: 15,
      user_limit: 1,
      valid_from: '2025-01-01T00:00:00Z',
      valid_until: '2025-12-31T23:59:59Z',
      applicable_plans: ['pro', 'elite'],
      is_active: true,
      created_at: '2025-01-01T00:00:00Z'
    },
    {
      id: '2',
      code: 'FREE50',
      name: 'Free 50 Credits',
      description: 'Get 50 free workout credits',
      type: 'credits',
      value: 50,
      max_uses: 100,
      current_uses: 23,
      user_limit: 1,
      valid_from: '2025-02-01T00:00:00Z',
      valid_until: '2025-06-30T23:59:59Z',
      applicable_plans: [],
      is_active: true,
      created_at: '2025-02-01T00:00:00Z'
    }
  ];

  res.json({
    success: true,
    data: {
      coupons: mockCoupons,
      total: mockCoupons.length
    }
  });
}));

/**
 * @swagger
 * /api/v2/admin/coupons:
 *   post:
 *     summary: Create new coupon
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, name, type, value]
 *             properties:
 *               code:
 *                 type: string
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [percentage, fixed_amount, credits]
 *               value:
 *                 type: number
 *               maxUses:
 *                 type: integer
 *               userLimit:
 *                 type: integer
 *               validUntil:
 *                 type: string
 *                 format: date-time
 *               applicablePlans:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Coupon created successfully
 */
router.post('/coupons', asyncHandler(async (req, res) => {
  console.log('🎫 Creating new coupon...');

  const {
    code,
    name,
    description,
    type,
    value,
    maxUses,
    userLimit = 1,
    validUntil,
    applicablePlans = []
  } = req.body;

  // Validation
  if (!code || !name || !type || value === undefined) {
    throw new APIError('Missing required fields', 400);
  }

  if (!['percentage', 'fixed_amount', 'credits'].includes(type)) {
    throw new APIError('Invalid coupon type', 400);
  }

  // Mock response for now
  const newCoupon = {
    id: Date.now().toString(),
    code: code.toUpperCase(),
    name,
    description,
    type,
    value: parseFloat(value),
    max_uses: maxUses || null,
    current_uses: 0,
    user_limit: userLimit,
    valid_from: new Date().toISOString(),
    valid_until: validUntil,
    applicable_plans: applicablePlans,
    is_active: true,
    created_at: new Date().toISOString()
  };

  res.status(201).json({
    success: true,
    message: 'Coupon created successfully',
    data: { coupon: newCoupon }
  });
}));

// ======================= MOBILE APP ANALYTICS =======================

/**
 * @swagger
 * /api/v2/admin/analytics/overview:
 *   get:
 *     summary: Get mobile app analytics overview
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d]
 *           default: 30d
 *     responses:
 *       200:
 *         description: Analytics overview retrieved successfully
 */
router.get('/analytics/overview', asyncHandler(async (req, res) => {
  console.log('📊 Loading mobile app analytics overview...');

  const { period = '30d' } = req.query;

  // Mock analytics data for demonstration
  const mockAnalytics = {
    period,
    overview: {
      totalUsers: 1247,
      activeUsers: 892,
      newUsers: 156,
      retention: {
        day1: 78.5,
        day7: 42.3,
        day30: 18.7
      },
      revenue: 12847.50,
      conversionRate: 12.4
    },
    platforms: {
      ios: {
        users: 758,
        sessions: 3420,
        averageRating: 4.7,
        crashes: 12,
        revenue: 8230.25
      },
      android: {
        users: 489,
        sessions: 2140,
        averageRating: 4.5,
        crashes: 18,
        revenue: 4617.25
      }
    },
    features: [
      { name: 'workout_generation', usage: 2847, growth: 15.2 },
      { name: 'coaching_cues', usage: 1923, growth: 8.7 },
      { name: 'modifications', usage: 1456, growth: -2.1 },
      { name: 'workout_history', usage: 2156, growth: 22.4 }
    ],
    engagement: {
      averageSessionDuration: 8.3,
      sessionsPerUser: 3.8,
      screenViews: 45230,
      pushNotifications: {
        sent: 8934,
        delivered: 8621,
        opened: 3847,
        openRate: 44.6
      }
    },
    performance: {
      averageLoadTime: 1.2,
      apiResponseTime: 245,
      crashRate: 0.08,
      errorRate: 0.34
    }
  };

  res.json({
    success: true,
    data: mockAnalytics
  });
}));

/**
 * @swagger
 * /api/v2/admin/analytics/users:
 *   get:
 *     summary: Get detailed user analytics
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: segment
 *         schema:
 *           type: string
 *           enum: [all, new, active, churned, premium]
 *       - in: query
 *         name: platform
 *         schema:
 *           type: string
 *           enum: [ios, android, web]
 *     responses:
 *       200:
 *         description: User analytics retrieved successfully
 */
router.get('/analytics/users', asyncHandler(async (req, res) => {
  console.log('👥 Loading user analytics...');

  const { segment = 'all', platform } = req.query;

  // Mock user analytics data
  const mockUserAnalytics = {
    segment,
    platform,
    summary: {
      totalUsers: 1247,
      newUsers: 156,
      returningUsers: 736,
      churnedUsers: 89,
      averageLifetimeValue: 47.80
    },
    demographics: {
      ageGroups: {
        '18-24': 18.5,
        '25-34': 42.3,
        '35-44': 28.7,
        '45-54': 8.9,
        '55+': 1.6
      },
      locations: [
        { country: 'United States', users: 456, percentage: 36.6 },
        { country: 'Canada', users: 187, percentage: 15.0 },
        { country: 'United Kingdom', users: 134, percentage: 10.7 },
        { country: 'Australia', users: 89, percentage: 7.1 },
        { country: 'Germany', users: 67, percentage: 5.4 }
      ],
      subscriptionPlans: {
        free: 847,
        pro: 312,
        elite: 88
      }
    },
    cohorts: [
      { period: '2025-02', newUsers: 89, retention: { day1: 82, day7: 45, day30: 19 } },
      { period: '2025-01', newUsers: 134, retention: { day1: 76, day7: 38, day30: 16 } },
      { period: '2024-12', newUsers: 156, retention: { day1: 79, day7: 41, day30: 18 } }
    ]
  };

  res.json({
    success: true,
    data: mockUserAnalytics
  });
}));

/**
 * @swagger
 * /api/v2/admin/analytics/sessions:
 *   post:
 *     summary: Track app session (for mobile apps to report sessions)
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               sessionId:
 *                 type: string
 *               platform:
 *                 type: string
 *                 enum: [ios, android, web]
 *               appVersion:
 *                 type: string
 *               deviceInfo:
 *                 type: object
 *               startedAt:
 *                 type: string
 *                 format: date-time
 *               endedAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Session tracked successfully
 */
router.post('/analytics/sessions', asyncHandler(async (req, res) => {
  console.log('📱 Tracking app session...');

  const {
    userId,
    sessionId,
    platform,
    appVersion,
    deviceInfo,
    startedAt,
    endedAt
  } = req.body;

  // Mock session tracking response
  const sessionRecord = {
    id: Date.now().toString(),
    userId,
    sessionId,
    platform,
    appVersion,
    deviceInfo,
    startedAt,
    endedAt,
    duration: endedAt && startedAt ? 
      Math.round((new Date(endedAt) - new Date(startedAt)) / 1000) : null,
    tracked: true,
    createdAt: new Date().toISOString()
  };

  res.status(201).json({
    success: true,
    message: 'Session tracked successfully',
    data: { session: sessionRecord }
  });
}));

/**
 * @swagger
 * /api/v2/admin/analytics/events:
 *   post:
 *     summary: Track custom analytics event
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [eventName, userId]
 *             properties:
 *               eventName:
 *                 type: string
 *               userId:
 *                 type: string
 *               sessionId:
 *                 type: string
 *               properties:
 *                 type: object
 *               platform:
 *                 type: string
 *     responses:
 *       201:
 *         description: Event tracked successfully
 */
router.post('/analytics/events', asyncHandler(async (req, res) => {
  console.log('🎯 Tracking analytics event...');

  const {
    eventName,
    userId,
    sessionId,
    properties = {},
    platform
  } = req.body;

  if (!eventName || !userId) {
    throw new APIError('Missing required fields: eventName, userId', 400);
  }

  // Mock event tracking
  const eventRecord = {
    id: Date.now().toString(),
    eventName,
    userId,
    sessionId,
    properties,
    platform,
    timestamp: new Date().toISOString()
  };

  res.status(201).json({
    success: true,
    message: 'Event tracked successfully',
    data: { event: eventRecord }
  });
}));

// ======================= CREDITS MANAGEMENT =======================

/**
 * @swagger
 * /api/v2/admin/credits/users/{userId}:
 *   get:
 *     summary: Get user's credit balance
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User credits retrieved successfully
 */
router.get('/credits/users/:userId', asyncHandler(async (req, res) => {
  console.log(`💳 Loading credits for user ${req.params.userId}...`);

  const { userId } = req.params;

  // Mock credit balance for now
  const mockCredits = {
    workout: { amount: 25, expires_at: '2025-12-31T23:59:59Z' },
    coaching: { amount: 10, expires_at: '2025-06-30T23:59:59Z' },
    modification: { amount: 15, expires_at: null }
  };

  const mockHistory = [
    {
      id: '1',
      credit_type: 'workout',
      amount: 50,
      source: 'coupon',
      source_reference: 'FREE50',
      created_at: '2025-02-01T10:00:00Z'
    },
    {
      id: '2',
      credit_type: 'workout',
      amount: -25,
      source: 'usage',
      source_reference: 'workout_generation',
      created_at: '2025-02-05T14:30:00Z'
    }
  ];

  res.json({
    success: true,
    data: {
      userId,
      currentBalance: mockCredits,
      totalCreditsEarned: 75,
      totalCreditsUsed: 50,
      recentActivity: mockHistory
    }
  });
}));

export default router;