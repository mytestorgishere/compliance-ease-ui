import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Running automation scheduler...');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: { persistSession: false }
      }
    );

    // Get all active automation rules that are scheduled
    const { data: rules, error: rulesError } = await supabaseClient
      .from('automation_rules')
      .select('*')
      .eq('is_active', true)
      .not('schedule_cron', 'is', null);

    if (rulesError) {
      throw new Error('Failed to fetch automation rules');
    }

    console.log(`Found ${rules.length} scheduled automation rules`);

    const results = [];

    for (const rule of rules) {
      try {
        // Check if rule should run based on schedule
        if (await shouldRuleRun(supabaseClient, rule)) {
          console.log(`Executing rule: ${rule.name}`);

          // Call the compliance-automation function to run the rule
          const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/compliance-automation`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: 'run_automation_rule',
              data: { ruleId: rule.id }
            })
          });

          const result = await response.json();
          results.push({
            rule_id: rule.id,
            rule_name: rule.name,
            success: response.ok,
            result: result
          });

        } else {
          console.log(`Skipping rule: ${rule.name} (not scheduled to run)`);
        }
      } catch (error) {
        console.error(`Error executing rule ${rule.name}:`, error);
        results.push({
          rule_id: rule.id,
          rule_name: rule.name,
          success: false,
          error: error.message
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      executed_rules: results.length,
      results: results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in automation scheduler:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function shouldRuleRun(supabaseClient: any, rule: any): Promise<boolean> {
  // For now, we'll use a simple time-based check
  // In production, you'd want to implement proper cron parsing
  
  const now = new Date();
  const lastRun = await getLastRun(supabaseClient, rule.id);
  
  if (!lastRun) {
    return true; // Never run before
  }

  const timeSinceLastRun = now.getTime() - new Date(lastRun.created_at).getTime();
  const schedule = rule.schedule_cron;

  // Simple schedule interpretation
  if (schedule === '0 0 * * *') { // Daily
    return timeSinceLastRun > 24 * 60 * 60 * 1000;
  } else if (schedule === '0 0 * * 0') { // Weekly
    return timeSinceLastRun > 7 * 24 * 60 * 60 * 1000;
  } else if (schedule === '0 0 1 * *') { // Monthly
    return timeSinceLastRun > 30 * 24 * 60 * 60 * 1000;
  } else if (schedule === '0 * * * *') { // Hourly
    return timeSinceLastRun > 60 * 60 * 1000;
  }

  return false;
}

async function getLastRun(supabaseClient: any, ruleId: string) {
  const { data } = await supabaseClient
    .from('automation_runs')
    .select('*')
    .eq('automation_rule_id', ruleId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return data;
}