-- Update Starter tier
UPDATE public.subscription_tiers 
SET 
  monthly_price = 19900,
  yearly_price = 214900,
  file_upload_limit = 40,
  updated_at = now()
WHERE tier_name = 'starter';

-- Update Professional tier  
UPDATE public.subscription_tiers 
SET 
  monthly_price = 44900,
  yearly_price = 485100,
  file_upload_limit = 80,
  updated_at = now()
WHERE tier_name = 'professional';

-- Update Enterprise tier
UPDATE public.subscription_tiers 
SET 
  monthly_price = 94900,
  yearly_price = 1024600,
  file_upload_limit = 150,
  updated_at = now()
WHERE tier_name = 'enterprise';