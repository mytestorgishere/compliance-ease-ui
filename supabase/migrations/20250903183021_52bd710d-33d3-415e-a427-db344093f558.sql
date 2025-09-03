-- Create sales_contacts table to track demo bookings and sales inquiries
CREATE TABLE public.sales_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_type TEXT NOT NULL, -- 'demo' or 'sales'
  first_name TEXT,
  last_name TEXT,
  email TEXT NOT NULL,
  company TEXT,
  phone TEXT,
  preferred_date TEXT,
  preferred_time TEXT,
  requirements TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.sales_contacts ENABLE ROW LEVEL SECURITY;

-- Create policy to allow inserts (for contact forms)
CREATE POLICY "allow_insert_sales_contacts" ON public.sales_contacts
FOR INSERT
WITH CHECK (true);

-- Create policy to allow reading own contacts for logged in users
CREATE POLICY "allow_select_own_contacts" ON public.sales_contacts
FOR SELECT
USING (email = auth.email());

-- Add admin email as a constant for notifications
INSERT INTO public.sales_contacts (contact_type, first_name, last_name, email, company, requirements, created_at)
VALUES ('admin', 'Admin', 'Contact', 'pramodayajayalath@gmail.com', 'Compliance Ease', 'Admin notification email', now())
ON CONFLICT DO NOTHING;