-- Create compliance automation tables

-- Automation rules table
CREATE TABLE public.automation_rules (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    rule_type TEXT NOT NULL, -- 'scheduled_scan', 'bulk_process', 'threshold_alert', 'workflow'
    schedule_cron TEXT, -- for scheduled rules
    is_active BOOLEAN NOT NULL DEFAULT true,
    config JSONB NOT NULL DEFAULT '{}', -- rule-specific configuration
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Automation runs table (track execution history)
CREATE TABLE public.automation_runs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    automation_rule_id UUID NOT NULL REFERENCES public.automation_rules(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    status TEXT NOT NULL DEFAULT 'running', -- 'running', 'completed', 'failed', 'cancelled'
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    results JSONB DEFAULT '{}',
    error_message TEXT,
    documents_processed INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Document batches for bulk processing
CREATE TABLE public.document_batches (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    automation_run_id UUID REFERENCES public.automation_runs(id) ON DELETE SET NULL,
    batch_name TEXT NOT NULL,
    total_documents INTEGER NOT NULL DEFAULT 0,
    processed_documents INTEGER NOT NULL DEFAULT 0,
    failed_documents INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Batch documents
CREATE TABLE public.batch_documents (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    batch_id UUID NOT NULL REFERENCES public.document_batches(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    file_size INTEGER,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    report_id UUID REFERENCES public.reports(id) ON DELETE SET NULL,
    error_message TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Compliance alerts
CREATE TABLE public.compliance_alerts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    automation_rule_id UUID REFERENCES public.automation_rules(id) ON DELETE SET NULL,
    alert_type TEXT NOT NULL, -- 'compliance_drop', 'new_risk', 'deadline_approaching', 'custom'
    severity TEXT NOT NULL, -- 'low', 'medium', 'high', 'critical'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN NOT NULL DEFAULT false,
    is_resolved BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Webhook integrations
CREATE TABLE public.webhook_integrations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    webhook_url TEXT NOT NULL,
    secret_key TEXT,
    event_types TEXT[] NOT NULL DEFAULT '{}', -- events to trigger webhook
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_triggered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_integrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for automation_rules
CREATE POLICY "Users can view their own automation rules" 
ON public.automation_rules 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own automation rules" 
ON public.automation_rules 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own automation rules" 
ON public.automation_rules 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own automation rules" 
ON public.automation_rules 
FOR DELETE 
USING (user_id = auth.uid());

-- RLS Policies for automation_runs
CREATE POLICY "Users can view their own automation runs" 
ON public.automation_runs 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own automation runs" 
ON public.automation_runs 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own automation runs" 
ON public.automation_runs 
FOR UPDATE 
USING (user_id = auth.uid());

-- RLS Policies for document_batches
CREATE POLICY "Users can view their own document batches" 
ON public.document_batches 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own document batches" 
ON public.document_batches 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own document batches" 
ON public.document_batches 
FOR UPDATE 
USING (user_id = auth.uid());

-- RLS Policies for batch_documents (inherited from batch)
CREATE POLICY "Users can view documents in their own batches" 
ON public.batch_documents 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.document_batches 
        WHERE id = batch_documents.batch_id 
        AND user_id = auth.uid()
    )
);

CREATE POLICY "Users can manage documents in their own batches" 
ON public.batch_documents 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.document_batches 
        WHERE id = batch_documents.batch_id 
        AND user_id = auth.uid()
    )
);

-- RLS Policies for compliance_alerts
CREATE POLICY "Users can view their own compliance alerts" 
ON public.compliance_alerts 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own compliance alerts" 
ON public.compliance_alerts 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own compliance alerts" 
ON public.compliance_alerts 
FOR UPDATE 
USING (user_id = auth.uid());

-- RLS Policies for webhook_integrations
CREATE POLICY "Users can view their own webhook integrations" 
ON public.webhook_integrations 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own webhook integrations" 
ON public.webhook_integrations 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own webhook integrations" 
ON public.webhook_integrations 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own webhook integrations" 
ON public.webhook_integrations 
FOR DELETE 
USING (user_id = auth.uid());

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_automation_rules_updated_at
    BEFORE UPDATE ON public.automation_rules
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_document_batches_updated_at
    BEFORE UPDATE ON public.document_batches
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_webhook_integrations_updated_at
    BEFORE UPDATE ON public.webhook_integrations
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();