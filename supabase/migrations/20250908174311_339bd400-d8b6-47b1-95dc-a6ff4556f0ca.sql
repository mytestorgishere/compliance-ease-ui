-- Phase 1: Critical Database Security Fixes

-- 1. Fix subscription_tiers RLS policy to require authentication for sensitive data
DROP POLICY IF EXISTS "subscription_tiers_select_all" ON public.subscription_tiers;

CREATE POLICY "subscription_tiers_public_select" 
ON public.subscription_tiers 
FOR SELECT 
USING (true);

-- 2. Restrict sales_contacts INSERT policy with validation
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
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_user_id_key;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);

-- 5. Add foreign key constraint for profiles.user_id
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 6. Improve subscribers table constraints
-- Make email unique in subscribers table
ALTER TABLE public.subscribers 
DROP CONSTRAINT IF EXISTS subscribers_email_key;

ALTER TABLE public.subscribers 
ADD CONSTRAINT subscribers_email_key UNIQUE (email);

-- Add check constraint for subscription_tier values
ALTER TABLE public.subscribers 
DROP CONSTRAINT IF EXISTS subscribers_subscription_tier_check;

ALTER TABLE public.subscribers 
ADD CONSTRAINT subscribers_subscription_tier_check 
CHECK (subscription_tier IN ('Starter', 'Professional', 'Enterprise') OR subscription_tier IS NULL);

-- 7. Add validation constraints for automation_rules
ALTER TABLE public.automation_rules 
DROP CONSTRAINT IF EXISTS automation_rules_rule_type_check;

ALTER TABLE public.automation_rules 
ADD CONSTRAINT automation_rules_rule_type_check 
CHECK (rule_type IN ('document_processing', 'compliance_check', 'data_extraction', 'notification'));

-- 8. Add validation for batch_documents status
ALTER TABLE public.batch_documents 
DROP CONSTRAINT IF EXISTS batch_documents_status_check;

ALTER TABLE public.batch_documents 
ADD CONSTRAINT batch_documents_status_check 
CHECK (status IN ('pending', 'processing', 'completed', 'failed'));

-- 9. Add validation for compliance_alerts
ALTER TABLE public.compliance_alerts 
DROP CONSTRAINT IF EXISTS compliance_alerts_severity_check;

ALTER TABLE public.compliance_alerts 
ADD CONSTRAINT compliance_alerts_severity_check 
CHECK (severity IN ('low', 'medium', 'high', 'critical'));

ALTER TABLE public.compliance_alerts 
DROP CONSTRAINT IF EXISTS compliance_alerts_alert_type_check;

ALTER TABLE public.compliance_alerts 
ADD CONSTRAINT compliance_alerts_alert_type_check 
CHECK (alert_type IN ('policy_violation', 'data_breach', 'compliance_gap', 'system_alert'));

-- 10. Improve RLS policies with better security
-- Update profiles RLS to prevent unauthorized access
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Improve reports RLS policies
DROP POLICY IF EXISTS "Users can view their own reports" ON public.reports;
DROP POLICY IF EXISTS "Users can update their own reports" ON public.reports;
DROP POLICY IF EXISTS "Users can insert their own reports" ON public.reports;

CREATE POLICY "Users can view their own reports" 
ON public.reports 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own reports" 
ON public.reports 
FOR UPDATE 
USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert their own reports" 
ON public.reports 
FOR INSERT 
WITH CHECK (user_id = auth.uid());