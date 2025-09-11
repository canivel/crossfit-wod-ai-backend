-- Migration 012: Premium Subscription Plans (No Free Forever)
-- This migration creates the new 3-tier premium subscription model
-- with 30-day free trials and enhanced features

-- Remove old subscription plans
DELETE FROM subscription_plans WHERE 1=1;

-- Insert new premium subscription plans
INSERT INTO subscription_plans (
    id, name, description, price_monthly, price_yearly, 
    max_requests_per_month, features, is_active, created_at, updated_at
) VALUES
-- FITNESS Plan: Entry level with great value
(
    'fitness-2025', 
    'FITNESS', 
    'Daily WODs with multiple options - Perfect for consistent training',
    2.99,
    29.99,
    30,
    '["Daily WOD delivery at 7pm", "3 workout options per day", "All workout types (AMRAP, EMOM, For Time)", "Scaling options for all levels", "Workout history & progress", "5 monthly credits", "Mobile app access"]',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),

-- ATHLETE Plan: Unlimited with AI coaching
(
    'athlete-2025', 
    'ATHLETE', 
    'Unlimited WODs + Live AI Coaching - Take your training to the next level',
    5.99,
    59.99,
    -1,
    '["Unlimited WODs", "Live AI coaching during workouts", "Real-time form feedback", "Rep counting and motivation", "4/8/12-week progressive programs", "Competition mode & challenges", "Advanced analytics", "15 monthly credits", "Priority support"]',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),

-- PRO Plan: Everything + premium features
(
    'pro-2025', 
    'PRO', 
    'Complete AI Fitness Experience - Personal trainer, nutrition, and recovery coaching',
    9.99,
    99.99,
    -1,
    '["Everything in ATHLETE", "Personal AI trainer", "Custom program design", "Nutrition coaching & meal planning", "Recovery protocols & mobility", "Video form analysis", "API access", "30 monthly credits", "Early feature access", "Premium support"]',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Add new subscription metadata columns
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS trial_days INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS credits_included INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS workout_options_per_day INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS includes_live_coaching BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS includes_programs BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS includes_nutrition BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS includes_recovery BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS includes_form_analysis BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS includes_api_access BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS support_level VARCHAR(20) DEFAULT 'basic';

-- Update plans with metadata
UPDATE subscription_plans 
SET 
    trial_days = 30,
    credits_included = 5,
    workout_options_per_day = 3,
    includes_live_coaching = false,
    includes_programs = false,
    includes_nutrition = false,
    includes_recovery = false,
    includes_form_analysis = false,
    includes_api_access = false,
    support_level = 'standard'
WHERE id = 'fitness-2025';

UPDATE subscription_plans 
SET 
    trial_days = 30,
    credits_included = 15,
    workout_options_per_day = 5,
    includes_live_coaching = true,
    includes_programs = true,
    includes_nutrition = false,
    includes_recovery = false,
    includes_form_analysis = false,
    includes_api_access = false,
    support_level = 'priority'
WHERE id = 'athlete-2025';

UPDATE subscription_plans 
SET 
    trial_days = 30,
    credits_included = 30,
    workout_options_per_day = 10,
    includes_live_coaching = true,
    includes_programs = true,
    includes_nutrition = true,
    includes_recovery = true,
    includes_form_analysis = true,
    includes_api_access = true,
    support_level = 'premium'
WHERE id = 'pro-2025';

-- Create free trial tracking table
CREATE TABLE IF NOT EXISTS user_trials (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    plan_id VARCHAR(50) NOT NULL,
    trial_start_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    trial_end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    trial_used BOOLEAN DEFAULT true,
    converted_to_paid BOOLEAN DEFAULT false,
    conversion_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, plan_id),
    FOREIGN KEY (plan_id) REFERENCES subscription_plans(id)
);

-- Create indexes for trial tracking
CREATE INDEX IF NOT EXISTS idx_user_trials_user_id ON user_trials(user_id);
CREATE INDEX IF NOT EXISTS idx_user_trials_dates ON user_trials(trial_start_date, trial_end_date);
CREATE INDEX IF NOT EXISTS idx_user_trials_active ON user_trials(trial_end_date) WHERE converted_to_paid = false;

-- Create enhanced credit transactions table for new features
CREATE TABLE IF NOT EXISTS enhanced_credit_transactions (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    transaction_type VARCHAR(50) NOT NULL, -- 'wod_refresh', 'custom_wod', 'form_analysis', 'nutrition_plan', 'recovery_session'
    credits_used INTEGER NOT NULL,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    INDEX(user_id),
    INDEX(transaction_type),
    INDEX(created_at)
);

-- Create function to check if user is in trial period
CREATE OR REPLACE FUNCTION is_user_in_trial(p_user_id UUID, p_plan_id VARCHAR(50))
RETURNS BOOLEAN AS $$
DECLARE
    trial_record user_trials%ROWTYPE;
BEGIN
    SELECT * INTO trial_record 
    FROM user_trials 
    WHERE user_id = p_user_id 
      AND plan_id = p_plan_id 
      AND trial_end_date > CURRENT_TIMESTAMP
      AND converted_to_paid = false
    LIMIT 1;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Create function to start free trial
CREATE OR REPLACE FUNCTION start_free_trial(
    p_user_id UUID,
    p_plan_id VARCHAR(50),
    p_trial_days INTEGER DEFAULT 30
)
RETURNS TABLE(
    trial_id INTEGER,
    trial_end_date TIMESTAMP WITH TIME ZONE,
    success BOOLEAN
) AS $$
DECLARE
    v_trial_id INTEGER;
    v_end_date TIMESTAMP WITH TIME ZONE;
    existing_trial user_trials%ROWTYPE;
BEGIN
    -- Check if user already had a trial for this plan
    SELECT * INTO existing_trial
    FROM user_trials 
    WHERE user_id = p_user_id AND plan_id = p_plan_id;
    
    IF FOUND THEN
        -- User already used trial for this plan
        RETURN QUERY SELECT NULL::INTEGER, NULL::TIMESTAMP WITH TIME ZONE, false;
        RETURN;
    END IF;
    
    -- Calculate trial end date
    v_end_date := CURRENT_TIMESTAMP + (p_trial_days || ' days')::INTERVAL;
    
    -- Insert trial record
    INSERT INTO user_trials (user_id, plan_id, trial_end_date)
    VALUES (p_user_id, p_plan_id, v_end_date)
    RETURNING id INTO v_trial_id;
    
    RETURN QUERY SELECT v_trial_id, v_end_date, true;
END;
$$ LANGUAGE plpgsql;

-- Create function to convert trial to paid
CREATE OR REPLACE FUNCTION convert_trial_to_paid(
    p_user_id UUID,
    p_plan_id VARCHAR(50)
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE user_trials 
    SET 
        converted_to_paid = true,
        conversion_date = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE user_id = p_user_id 
      AND plan_id = p_plan_id 
      AND converted_to_paid = false;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Create function to get plan features for a user (considering trial status)
CREATE OR REPLACE FUNCTION get_user_plan_features(p_user_id UUID)
RETURNS TABLE(
    plan_id VARCHAR(50),
    plan_name VARCHAR(100),
    is_trial BOOLEAN,
    trial_days_left INTEGER,
    credits_included INTEGER,
    workout_options_per_day INTEGER,
    includes_live_coaching BOOLEAN,
    includes_programs BOOLEAN,
    includes_nutrition BOOLEAN,
    includes_recovery BOOLEAN,
    includes_form_analysis BOOLEAN,
    includes_api_access BOOLEAN,
    support_level VARCHAR(20)
) AS $$
DECLARE
    user_sub RECORD;
    trial_record user_trials%ROWTYPE;
BEGIN
    -- Get user's current subscription
    SELECT us.*, sp.* INTO user_sub
    FROM user_subscriptions us
    JOIN subscription_plans sp ON us.plan_id = sp.id
    WHERE us.user_id = p_user_id
      AND us.status = 'active'
    ORDER BY us.created_at DESC
    LIMIT 1;
    
    IF NOT FOUND THEN
        -- No active subscription, return empty
        RETURN;
    END IF;
    
    -- Check if user is in trial period
    SELECT * INTO trial_record
    FROM user_trials ut
    WHERE ut.user_id = p_user_id
      AND ut.plan_id = user_sub.plan_id
      AND ut.trial_end_date > CURRENT_TIMESTAMP
      AND ut.converted_to_paid = false;
    
    RETURN QUERY SELECT
        user_sub.id,
        user_sub.name,
        FOUND AS is_trial,
        CASE 
            WHEN FOUND THEN EXTRACT(DAYS FROM trial_record.trial_end_date - CURRENT_TIMESTAMP)::INTEGER
            ELSE 0
        END AS trial_days_left,
        user_sub.credits_included,
        user_sub.workout_options_per_day,
        user_sub.includes_live_coaching,
        user_sub.includes_programs,
        user_sub.includes_nutrition,
        user_sub.includes_recovery,
        user_sub.includes_form_analysis,
        user_sub.includes_api_access,
        user_sub.support_level;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE subscription_plans IS 'Premium subscription plans with 30-day free trials - no free forever plan';
COMMENT ON TABLE user_trials IS 'Tracks free trial usage and conversion to paid subscriptions';
COMMENT ON TABLE enhanced_credit_transactions IS 'Tracks usage of premium credit features';
COMMENT ON FUNCTION is_user_in_trial IS 'Check if user is currently in trial period for a plan';
COMMENT ON FUNCTION start_free_trial IS 'Start a 30-day free trial for a user';
COMMENT ON FUNCTION convert_trial_to_paid IS 'Convert free trial to paid subscription';
COMMENT ON FUNCTION get_user_plan_features IS 'Get complete feature set for user including trial status';

-- Test the new plan structure
SELECT 
    id,
    name,
    price_monthly,
    credits_included,
    workout_options_per_day,
    includes_live_coaching,
    includes_programs,
    support_level
FROM subscription_plans
WHERE is_active = true
ORDER BY price_monthly;