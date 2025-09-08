-- Add yearly file upload limit to subscription_tiers table
ALTER TABLE public.subscription_tiers 
ADD COLUMN yearly_file_upload_limit INTEGER NOT NULL DEFAULT 0;

-- Update the subscription_tiers with yearly limits (assuming yearly gets more uploads)
-- Starter: 1MB files, Monthly: 10 uploads, Yearly: 120 uploads (12 months)  
-- Professional: 2MB files, Monthly: 100 uploads, Yearly: 1200 uploads
-- Enterprise: 3MB files, Monthly: 1000 uploads, Yearly: 12000 uploads
UPDATE public.subscription_tiers 
SET yearly_file_upload_limit = CASE 
  WHEN tier_name = 'starter' THEN 120
  WHEN tier_name = 'professional' THEN 1200  
  WHEN tier_name = 'enterprise' THEN 12000
  ELSE 0
END;