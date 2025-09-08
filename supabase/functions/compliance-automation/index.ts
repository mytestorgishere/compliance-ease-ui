import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Processing automation request...');
    
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: { persistSession: false }
      }
    );

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    
    // Authenticate user
    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );
    
    const { data: userData, error: userError } = await anonClient.auth.getUser(token);
    if (userError || !userData.user) {
      throw new Error('User not authenticated');
    }

    const user = userData.user;
    console.log('User authenticated:', user.email);

    const { action, data } = await req.json();
    console.log('Automation action:', action);

    switch (action) {
      case 'run_automation_rule':
        return await runAutomationRule(supabaseClient, user, data);
      case 'process_bulk_documents':
        return await processBulkDocuments(supabaseClient, user, data);
      case 'check_compliance_thresholds':
        return await checkComplianceThresholds(supabaseClient, user, data);
      case 'trigger_webhook':
        return await triggerWebhook(supabaseClient, user, data);
      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    console.error('Error in compliance-automation function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function runAutomationRule(supabaseClient: any, user: any, data: any) {
  const { ruleId } = data;

  // Get the automation rule
  const { data: rule, error: ruleError } = await supabaseClient
    .from('automation_rules')
    .select('*')
    .eq('id', ruleId)
    .eq('user_id', user.id)
    .single();

  if (ruleError) {
    throw new Error('Automation rule not found');
  }

  console.log('Running automation rule:', rule.name);

  // Create automation run record
  const { data: run, error: runError } = await supabaseClient
    .from('automation_runs')
    .insert({
      automation_rule_id: ruleId,
      user_id: user.id,
      status: 'running'
    })
    .select()
    .single();

  if (runError) {
    throw new Error('Failed to create automation run');
  }

  try {
    let results = {};

    switch (rule.rule_type) {
      case 'scheduled_scan':
        results = await performScheduledScan(supabaseClient, user, rule, run.id);
        break;
      case 'bulk_process':
        results = await processBulkDocuments(supabaseClient, user, { runId: run.id, ...rule.config });
        break;
      case 'threshold_alert':
        results = await checkComplianceThresholds(supabaseClient, user, { runId: run.id, ...rule.config });
        break;
      default:
        throw new Error(`Unknown rule type: ${rule.rule_type}`);
    }

    // Update run as completed
    await supabaseClient
      .from('automation_runs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        results: results
      })
      .eq('id', run.id);

    return new Response(JSON.stringify({
      success: true,
      runId: run.id,
      results: results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    // Update run as failed
    await supabaseClient
      .from('automation_runs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: error.message
      })
      .eq('id', run.id);

    throw error;
  }
}

async function performScheduledScan(supabaseClient: any, user: any, rule: any, runId: string) {
  console.log('Performing scheduled compliance scan...');

  // Get recent reports for compliance analysis
  const { data: reports } = await supabaseClient
    .from('reports')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10);

  // Analyze compliance trends
  const complianceScores = reports?.map(r => {
    const content = r.processed_content;
    const scoreMatch = content.match(/compliance.*?(\d+)%/i);
    return scoreMatch ? parseInt(scoreMatch[1]) : 75; // default score
  }) || [];

  const avgScore = complianceScores.length > 0 
    ? complianceScores.reduce((a, b) => a + b, 0) / complianceScores.length 
    : 0;

  // Check if compliance dropped below threshold
  const threshold = rule.config?.compliance_threshold || 80;
  if (avgScore < threshold) {
    await createAlert(supabaseClient, user.id, rule.id, {
      type: 'compliance_drop',
      severity: 'high',
      title: 'Compliance Score Below Threshold',
      message: `Average compliance score (${avgScore.toFixed(1)}%) is below the threshold of ${threshold}%`,
      data: { current_score: avgScore, threshold }
    });
  }

  return {
    reports_analyzed: reports?.length || 0,
    average_compliance_score: avgScore,
    threshold_alerts_created: avgScore < threshold ? 1 : 0
  };
}

async function processBulkDocuments(supabaseClient: any, user: any, data: any) {
  console.log('Processing bulk documents...');
  
  const { documents, batchName, runId } = data;

  // Create document batch
  const { data: batch, error: batchError } = await supabaseClient
    .from('document_batches')
    .insert({
      user_id: user.id,
      automation_run_id: runId,
      batch_name: batchName || 'Bulk Processing',
      total_documents: documents.length,
      status: 'processing'
    })
    .select()
    .single();

  if (batchError) {
    throw new Error('Failed to create document batch');
  }

  let processed = 0;
  let failed = 0;

  // Process each document
  for (const doc of documents) {
    try {
      // Create batch document record
      const { data: batchDoc } = await supabaseClient
        .from('batch_documents')
        .insert({
          batch_id: batch.id,
          filename: doc.filename,
          file_size: doc.size,
          status: 'processing'
        })
        .select()
        .single();

      // Process document with OpenAI
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { 
              role: 'system', 
              content: 'You are a compliance expert. Analyze this document for compliance issues and provide a brief summary.' 
            },
            { role: 'user', content: `Analyze this document: ${doc.content}` }
          ],
          max_tokens: 1000
        }),
      });

      const aiResult = await response.json();
      const analysis = aiResult.choices[0].message.content;

      // Create report
      const { data: report } = await supabaseClient
        .from('reports')
        .insert({
          user_id: user.id,
          original_filename: doc.filename,
          report_type: 'bulk_compliance',
          processed_content: analysis,
          status: 'completed'
        })
        .select()
        .single();

      // Update batch document
      await supabaseClient
        .from('batch_documents')
        .update({
          status: 'completed',
          report_id: report.id,
          processed_at: new Date().toISOString()
        })
        .eq('id', batchDoc.id);

      processed++;

    } catch (error) {
      console.error('Error processing document:', doc.filename, error);
      failed++;
      
      // Update batch document as failed
      await supabaseClient
        .from('batch_documents')
        .update({
          status: 'failed',
          error_message: error.message,
          processed_at: new Date().toISOString()
        })
        .eq('batch_id', batch.id)
        .eq('filename', doc.filename);
    }
  }

  // Update batch status
  await supabaseClient
    .from('document_batches')
    .update({
      processed_documents: processed,
      failed_documents: failed,
      status: failed === 0 ? 'completed' : 'partially_failed'
    })
    .eq('id', batch.id);

  return {
    batch_id: batch.id,
    total_documents: documents.length,
    processed_documents: processed,
    failed_documents: failed
  };
}

async function checkComplianceThresholds(supabaseClient: any, user: any, data: any) {
  console.log('Checking compliance thresholds...');

  const { thresholds, runId } = data;
  const alerts = [];

  // Get recent reports
  const { data: reports } = await supabaseClient
    .from('reports')
    .select('*')
    .eq('user_id', user.id)
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
    .order('created_at', { ascending: false });

  // Analyze reports for threshold violations
  for (const report of reports || []) {
    const content = report.processed_content.toLowerCase();
    
    // Check for critical issues
    const criticalKeywords = ['critical', 'severe', 'non-compliant', 'violation', 'breach'];
    const criticalCount = criticalKeywords.filter(keyword => content.includes(keyword)).length;
    
    if (criticalCount >= (thresholds?.critical_keywords || 2)) {
      alerts.push({
        type: 'new_risk',
        severity: 'critical',
        title: 'Critical Compliance Issues Detected',
        message: `Report "${report.original_filename}" contains ${criticalCount} critical compliance issues`,
        data: { report_id: report.id, critical_count: criticalCount }
      });
    }
  }

  // Create alerts
  for (const alert of alerts) {
    await createAlert(supabaseClient, user.id, null, alert);
  }

  return {
    reports_analyzed: reports?.length || 0,
    alerts_created: alerts.length,
    threshold_violations: alerts.length
  };
}

async function triggerWebhook(supabaseClient: any, user: any, data: any) {
  console.log('Triggering webhook...');

  const { webhookId, eventType, payload } = data;

  // Get webhook configuration
  const { data: webhook, error: webhookError } = await supabaseClient
    .from('webhook_integrations')
    .select('*')
    .eq('id', webhookId)
    .eq('user_id', user.id)
    .single();

  if (webhookError) {
    throw new Error('Webhook not found');
  }

  if (!webhook.is_active) {
    throw new Error('Webhook is not active');
  }

  // Check if webhook should trigger for this event type
  if (!webhook.event_types.includes(eventType)) {
    return { success: true, message: 'Event type not configured for this webhook' };
  }

  try {
    // Trigger webhook
    const response = await fetch(webhook.webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(webhook.secret_key && { 'Authorization': `Bearer ${webhook.secret_key}` })
      },
      body: JSON.stringify({
        event_type: eventType,
        timestamp: new Date().toISOString(),
        user_id: user.id,
        ...payload
      })
    });

    // Update last triggered timestamp
    await supabaseClient
      .from('webhook_integrations')
      .update({ last_triggered_at: new Date().toISOString() })
      .eq('id', webhookId);

    return {
      success: true,
      webhook_response_status: response.status,
      triggered_at: new Date().toISOString()
    };

  } catch (error) {
    console.error('Webhook trigger failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

async function createAlert(supabaseClient: any, userId: string, ruleId: string | null, alert: any) {
  await supabaseClient
    .from('compliance_alerts')
    .insert({
      user_id: userId,
      automation_rule_id: ruleId,
      alert_type: alert.type,
      severity: alert.severity,
      title: alert.title,
      message: alert.message,
      data: alert.data || {}
    });
}