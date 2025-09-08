-- Add file size limit column to subscription_tiers table
ALTER TABLE public.subscription_tiers 
ADD COLUMN file_size_limit_mb INTEGER NOT NULL DEFAULT 1;

-- Update existing tiers with correct file size limits
UPDATE public.subscription_tiers 
SET file_size_limit_mb = CASE 
  WHEN tier_name = 'starter' THEN 1
  WHEN tier_name = 'professional' THEN 2  
  WHEN tier_name = 'enterprise' THEN 3
  ELSE 1
END;