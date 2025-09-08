-- Phase 1: Essential Database Security Constraints Only

-- 1. Make profiles.user_id NOT NULL (critical security fix)
-- First update any existing NULL values 
UPDATE public.profiles 
SET user_id = id 
WHERE user_id IS NULL AND id IS NOT NULL;

-- Make profiles.user_id NOT NULL
ALTER TABLE public.profiles 
ALTER COLUMN user_id SET NOT NULL;

-- 2. Add essential validation constraints that don't exist yet
-- Check constraint for subscription_tier values
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'subscribers_subscription_tier_check'
    ) THEN
        ALTER TABLE public.subscribers 
        ADD CONSTRAINT subscribers_subscription_tier_check 
        CHECK (subscription_tier IN ('Starter', 'Professional', 'Enterprise') OR subscription_tier IS NULL);
    END IF;
END $$;

-- Validation for automation_rules rule_type
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'automation_rules_rule_type_check'
    ) THEN
        ALTER TABLE public.automation_rules 
        ADD CONSTRAINT automation_rules_rule_type_check 
        CHECK (rule_type IN ('document_processing', 'compliance_check', 'data_extraction', 'notification'));
    END IF;
END $$;

-- Validation for batch_documents status
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'batch_documents_status_check'
    ) THEN
        ALTER TABLE public.batch_documents 
        ADD CONSTRAINT batch_documents_status_check 
        CHECK (status IN ('pending', 'processing', 'completed', 'failed'));
    END IF;
END $$;

-- Validation for compliance_alerts severity
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'compliance_alerts_severity_check'
    ) THEN
        ALTER TABLE public.compliance_alerts 
        ADD CONSTRAINT compliance_alerts_severity_check 
        CHECK (severity IN ('low', 'medium', 'high', 'critical'));
    END IF;
END $$;

-- Validation for compliance_alerts alert_type
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'compliance_alerts_alert_type_check'
    ) THEN
        ALTER TABLE public.compliance_alerts 
        ADD CONSTRAINT compliance_alerts_alert_type_check 
        CHECK (alert_type IN ('policy_violation', 'data_breach', 'compliance_gap', 'system_alert'));
    END IF;
END $$;