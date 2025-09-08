-- Remove the yearly_file_upload_limit column as we'll calculate it as monthly * 12
ALTER TABLE public.subscription_tiers 
DROP COLUMN yearly_file_upload_limit;