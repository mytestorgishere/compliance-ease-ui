-- Create admin settings table to store configurable admin emails
CREATE TABLE public.admin_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_name TEXT NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (users need to see support email)
CREATE POLICY "Anyone can read admin settings" 
ON public.admin_settings 
FOR SELECT 
USING (true);

-- Only authenticated users can update (for future admin panel)
CREATE POLICY "Authenticated users can update admin settings" 
ON public.admin_settings 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- Insert initial admin email setting
INSERT INTO public.admin_settings (setting_name, setting_value, description) 
VALUES 
  ('support_email', 'pramodayaaws@gmail.com', 'Email address for receiving customer support requests and bug reports'),
  ('sales_email', 'pramodayaaws@gmail.com', 'Email address for receiving sales inquiries and demo requests');

-- Create bug reports table
CREATE TABLE public.bug_reports (
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
CREATE POLICY "Users can view their own bug reports" 
ON public.bug_reports 
FOR SELECT 
USING (user_id = auth.uid());

-- Users can create bug reports
CREATE POLICY "Users can create bug reports" 
ON public.bug_reports 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Add trigger for updated_at timestamps
CREATE TRIGGER update_admin_settings_updated_at
BEFORE UPDATE ON public.admin_settings
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_bug_reports_updated_at
BEFORE UPDATE ON public.bug_reports
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();