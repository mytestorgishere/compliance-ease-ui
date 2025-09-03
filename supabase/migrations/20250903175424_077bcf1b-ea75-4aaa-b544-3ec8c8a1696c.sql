-- Add file upload limits to subscribers table
ALTER TABLE public.subscribers 
ADD COLUMN file_upload_limit INTEGER DEFAULT 0,
ADD COLUMN file_uploads_used INTEGER DEFAULT 0;

-- Create subscription tiers configuration table
CREATE TABLE public.subscription_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_name TEXT NOT NULL UNIQUE,
  monthly_price INTEGER NOT NULL, -- in cents
  yearly_price INTEGER NOT NULL, -- in cents
  file_upload_limit INTEGER NOT NULL DEFAULT 0,
  features JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on subscription_tiers
ALTER TABLE public.subscription_tiers ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read subscription tiers (for pricing display)
CREATE POLICY "subscription_tiers_select_all" ON public.subscription_tiers
FOR SELECT
USING (true);

-- Insert default subscription tiers with file upload limits
INSERT INTO public.subscription_tiers (tier_name, monthly_price, yearly_price, file_upload_limit, features) VALUES
('starter', 19900, 214920, 100, '["Basic GDPR compliance monitoring", "Monthly compliance reports", "Email support", "Up to 100 data subjects", "Standard templates"]'::jsonb),
('professional', 39900, 430920, 10000, '["Full GDPR, CSRD & ESG compliance", "Real-time monitoring & alerts", "Custom report generation", "Priority support", "Up to 10,000 data subjects", "Advanced analytics", "API access"]'::jsonb),
('enterprise', 79900, 861720, 100000, '["Everything in Professional", "Multi-jurisdiction support", "Dedicated compliance manager", "Custom integrations", "Unlimited data subjects", "White-label options", "24/7 phone support", "Compliance consulting"]'::jsonb);

-- Update existing subscribers with file upload limits based on their tier
UPDATE public.subscribers 
SET file_upload_limit = CASE 
  WHEN subscription_tier = 'starter' THEN 100
  WHEN subscription_tier = 'professional' THEN 10000
  WHEN subscription_tier = 'enterprise' THEN 100000
  ELSE 0
END;