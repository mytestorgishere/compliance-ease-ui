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
    console.log('Processing document request...');
    
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
    
    // Authenticate user with anon key client
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

    // Check user profile and trial status, create if doesn't exist
    let { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('trial_used, subscription_status')
      .eq('user_id', user.id)
      .single();

    if (profileError && profileError.code === 'PGRST116') {
      // Profile doesn't exist, create it
      console.log('Profile not found, creating new profile for user:', user.email);
      const { data: newProfile, error: createError } = await supabaseClient
        .from('profiles')
        .insert({
          user_id: user.id,
          email: user.email,
          trial_used: false,
          subscription_status: 'free'
        })
        .select('trial_used, subscription_status')
        .single();
      
      if (createError) {
        console.error('Failed to create profile:', createError);
        throw new Error('Failed to create user profile');
      }
      
      profile = newProfile;
      console.log('Profile created successfully for user:', user.email);
    } else if (profileError) {
      console.error('Profile error:', profileError);
      throw new Error('Failed to check user profile');
    }

    // Check subscription and file upload limits
    const { data: subscriberData } = await supabaseClient
      .from("subscribers")
      .select("file_upload_limit, file_uploads_used, subscribed, subscription_tier")
      .eq("user_id", user.id)
      .single();

    // Check if user can use the service
    if (!profile.trial_used && profile.subscription_status === 'free') {
      // Free trial user - allow processing
      console.log('Processing document for free trial user');
    } else if (subscriberData?.subscribed) {
      // Check file upload limit for subscribers
      const uploadsUsed = subscriberData.file_uploads_used || 0;
      const uploadLimit = subscriberData.file_upload_limit || 0;
      
      if (uploadsUsed >= uploadLimit) {
        return new Response(JSON.stringify({ 
          error: `File upload limit reached. You have used ${uploadsUsed}/${uploadLimit} uploads for your ${subscriberData.subscription_tier} plan.` 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403,
        });
      }
      console.log(`Processing document for subscriber: ${uploadsUsed + 1}/${uploadLimit} uploads used`);
    } else {
      // No active subscription and trial already used
      return new Response(JSON.stringify({ 
        error: 'Trial already used. Please upgrade to a paid subscription to continue using the service.' 
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { document, filename, reportType = 'compliance' } = await req.json();
    
    if (!document || !filename) {
      throw new Error('Document and filename are required');
    }

    console.log('Processing document:', filename, 'Type:', reportType);

    // Create report record
    const { data: reportData, error: reportError } = await supabaseClient
      .from('reports')
      .insert({
        user_id: user.id,
        original_filename: filename,
        report_type: reportType,
        status: 'processing'
      })
      .select()
      .single();

    if (reportError) {
      console.error('Report creation error:', reportError);
      throw new Error('Failed to create report record');
    }

    console.log('Report created:', reportData.id);

    // Prepare prompt based on report type and document content
    const systemPrompt = `You are an expert compliance consultant specializing in EU regulations including GDPR, CSRD, ESG reporting, and sustainability compliance. 

Your task is to analyze the provided document and generate a comprehensive compliance report that helps companies meet their regulatory obligations.

Based on the document content, you should:

1. **Identify Compliance Areas**: Determine which EU regulations apply (GDPR, CSRD, ESG, NIS2, etc.)
2. **Risk Assessment**: Identify potential compliance gaps and risks
3. **Actionable Recommendations**: Provide specific steps to achieve compliance
4. **Report Structure**: Create a professional report with:
   - Executive Summary
   - Current Compliance Status
   - Risk Analysis
   - Regulatory Requirements
   - Implementation Roadmap
   - Monitoring & Reporting Guidelines

Focus on practical, actionable advice that businesses can implement. Include relevant deadlines, documentation requirements, and best practices.

The report should be comprehensive, professional, and directly applicable to the company's situation as described in the document.`;

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        messages: [
          { role: 'system', content: systemPrompt },
          { 
            role: 'user', 
            content: `Please analyze this document and generate a comprehensive EU compliance report:

Document Name: ${filename}
Document Content: ${document}

Generate a detailed compliance analysis and recommendations.` 
          }
        ],
        max_completion_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', response.status, errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedReport = data.choices[0].message.content;

    console.log('Report generated successfully');

    // Update report with processed content
    await supabaseClient
      .from('reports')
      .update({
        processed_content: generatedReport,
        status: 'completed'
      })
      .eq('id', reportData.id);

    // Mark trial as used for free users
    if (profile.subscription_status === 'free' && !profile.trial_used) {
      await supabaseClient
        .from('profiles')
        .update({ trial_used: true })
        .eq('user_id', user.id);
      
      console.log('Trial marked as used for user:', user.email);
    }

    // Increment file upload counter for subscribers
    if (subscriberData?.subscribed) {
      const currentUploads = subscriberData.file_uploads_used || 0;
      await supabaseClient
        .from('subscribers')
        .update({ file_uploads_used: currentUploads + 1 })
        .eq('user_id', user.id);
      
      console.log(`File upload counter incremented: ${currentUploads + 1}/${subscriberData.file_upload_limit}`);
    }

    return new Response(JSON.stringify({ 
      report: generatedReport,
      reportId: reportData.id,
      trialUsed: profile.subscription_status === 'free' && !profile.trial_used
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in process-document function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});