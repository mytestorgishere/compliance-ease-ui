-- Create bug reports table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.bug_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  browser_info JSONB,
  url TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for bug reports
ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;

-- Users can view their own bug reports
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'bug_reports' 
    AND policyname = 'Users can view their own bug reports'
  ) THEN
    CREATE POLICY "Users can view their own bug reports" 
    ON public.bug_reports 
    FOR SELECT 
    USING (user_id = auth.uid());
  END IF;
END
$$;

-- Users can create bug reports
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'bug_reports' 
    AND policyname = 'Users can create bug reports'
  ) THEN
    CREATE POLICY "Users can create bug reports" 
    ON public.bug_reports 
    FOR INSERT 
    WITH CHECK (user_id = auth.uid());
  END IF;
END
$$;

-- Add trigger for updated_at timestamps
DROP TRIGGER IF EXISTS update_bug_reports_updated_at ON public.bug_reports;
CREATE TRIGGER update_bug_reports_updated_at
BEFORE UPDATE ON public.bug_reports
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Insert admin settings if they don't exist (assuming admin_settings table exists)
INSERT INTO public.admin_settings (setting_name, setting_value, description) 
VALUES 
  ('support_email', 'pramodayaaws@gmail.com', 'Email address for receiving customer support requests and bug reports'),
  ('sales_email', 'pramodayaaws@gmail.com', 'Email address for receiving sales inquiries and demo requests')
ON CONFLICT (setting_name) DO NOTHING;