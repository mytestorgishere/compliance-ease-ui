-- Phase 1: Critical Database Security Fixes (Corrected)

-- 1. Keep subscription_tiers accessible but note this is acceptable for pricing display

-- 2. Enhance sales_contacts INSERT policy with validation
DROP POLICY IF EXISTS "allow_insert_sales_contacts" ON public.sales_contacts;

CREATE POLICY "allow_insert_sales_contacts" 
ON public.sales_contacts 
FOR INSERT 
WITH CHECK (
  email IS NOT NULL 
  AND length(email) > 5 
  AND email LIKE '%@%.%'
  AND contact_type IN ('demo', 'sales', 'support')
);

-- 3. Restrict subscribers table access - only allow edge functions and authenticated users
DROP POLICY IF EXISTS "insert_subscription" ON public.subscribers;

CREATE POLICY "insert_subscription_authenticated" 
ON public.subscribers 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL OR current_setting('role') = 'service_role');

-- 4. Make user_id columns NOT NULL where they should be required
-- First update any existing NULL values for profiles
UPDATE public.profiles 
SET user_id = id 
WHERE user_id IS NULL AND id IS NOT NULL;

-- Make profiles.user_id NOT NULL
ALTER TABLE public.profiles 
ALTER COLUMN user_id SET NOT NULL;

-- Add unique constraint on profiles.user_id if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'profiles_user_id_key' 
        AND table_name = 'profiles'
    ) THEN
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);
    END IF;
END $$;

-- 5. Add foreign key constraint for profiles.user_id
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'profiles_user_id_fkey' 
        AND table_name = 'profiles'
    ) THEN
        ALTER TABLE public.profiles 
        ADD CONSTRAINT profiles_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 6. Improve subscribers table constraints
-- Make email unique in subscribers table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'subscribers_email_key' 
        AND table_name = 'subscribers'
    ) THEN
        ALTER TABLE public.subscribers ADD CONSTRAINT subscribers_email_key UNIQUE (email);
    END IF;
END $$;

-- Add check constraint for subscription_tier values
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'subscribers_subscription_tier_check' 
        AND table_name = 'subscribers'
    ) THEN
        ALTER TABLE public.subscribers 
        ADD CONSTRAINT subscribers_subscription_tier_check 
        CHECK (subscription_tier IN ('Starter', 'Professional', 'Enterprise') OR subscription_tier IS NULL);
    END IF;
END $$;

-- 7. Add validation constraints for automation_rules
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'automation_rules_rule_type_check' 
        AND table_name = 'automation_rules'
    ) THEN
        ALTER TABLE public.automation_rules 
        ADD CONSTRAINT automation_rules_rule_type_check 
        CHECK (rule_type IN ('document_processing', 'compliance_check', 'data_extraction', 'notification'));
    END IF;
END $$;

-- 8. Add validation for batch_documents status
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'batch_documents_status_check' 
        AND table_name = 'batch_documents'
    ) THEN
        ALTER TABLE public.batch_documents 
        ADD CONSTRAINT batch_documents_status_check 
        CHECK (status IN ('pending', 'processing', 'completed', 'failed'));
    END IF;
END $$;

-- 9. Add validation for compliance_alerts
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'compliance_alerts_severity_check' 
        AND table_name = 'compliance_alerts'
    ) THEN
        ALTER TABLE public.compliance_alerts 
        ADD CONSTRAINT compliance_alerts_severity_check 
        CHECK (severity IN ('low', 'medium', 'high', 'critical'));
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'compliance_alerts_alert_type_check' 
        AND table_name = 'compliance_alerts'
    ) THEN
        ALTER TABLE public.compliance_alerts 
        ADD CONSTRAINT compliance_alerts_alert_type_check 
        CHECK (alert_type IN ('policy_violation', 'data_breach', 'compliance_gap', 'system_alert'));
    END IF;
END $$;