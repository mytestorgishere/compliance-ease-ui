-- Update subscription tiers with new pricing and limits
UPDATE public.subscription_tiers 
SET 
  monthly_price = 19900,
  yearly_price = 199000,
  file_upload_limit = 40,
  updated_at = now()
WHERE tier_name = 'Starter';

UPDATE public.subscription_tiers 
SET 
  monthly_price = 45000,
  yearly_price = 450000,
  file_upload_limit = 80,
  updated_at = now()
WHERE tier_name = 'Professional';

UPDATE public.subscription_tiers 
SET 
  monthly_price = 100000,
  yearly_price = 1000000,
  file_upload_limit = 150,
  updated_at = now()
WHERE tier_name = 'Enterprise';