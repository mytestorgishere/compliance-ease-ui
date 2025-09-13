import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BugReportRequest {
  userEmail: string;
  subject: string;
  description: string;
  priority: string;
  browserInfo: any;
  url: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const bugData: BugReportRequest = await req.json();
    console.log('Received bug report:', bugData);

    // Create Supabase client to get admin settings
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get support email from admin settings
    const { data: settings, error: settingsError } = await supabaseClient
      .from('admin_settings')
      .select('setting_value')
      .eq('setting_name', 'support_email')
      .single();

    if (settingsError) {
      console.error('Failed to fetch admin settings:', settingsError);
      throw new Error(`Failed to get support email: ${settingsError.message}`);
    }

    const supportEmail = settings.setting_value;
    console.log('Support email retrieved:', supportEmail);

    // Format priority with emoji
    const priorityEmojis: Record<string, string> = {
      low: "🟢",
      medium: "🟡", 
      high: "🟠",
      urgent: "🔴"
    };

    const priorityText = priorityEmojis[bugData.priority] || "⚪";
    const capitalizedPriority = bugData.priority.charAt(0).toUpperCase() + bugData.priority.slice(1);

    const subject = `${priorityText} Bug Report: ${bugData.subject}`;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626; border-bottom: 2px solid #dc2626; padding-bottom: 10px;">
          🐛 Bug Report - ${capitalizedPriority} Priority
        </h2>
        
        <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
          <h3 style="color: #dc2626; margin-top: 0;">Issue Details</h3>
          <p><strong>Subject:</strong> ${bugData.subject}</p>
          <p><strong>Priority:</strong> ${priorityText} ${capitalizedPriority}</p>
          <p><strong>Reported by:</strong> ${bugData.userEmail}</p>
          <p><strong>Page URL:</strong> <a href="${bugData.url}">${bugData.url}</a></p>
        </div>

        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #333; margin-top: 0;">Description</h3>
          <p style="white-space: pre-wrap; line-height: 1.5;">${bugData.description}</p>
        </div>

        <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #0369a1; margin-top: 0;">Browser & System Information</h3>
          <ul style="list-style: none; padding: 0; color: #666;">
            <li><strong>User Agent:</strong> ${bugData.browserInfo.userAgent || 'N/A'}</li>
            <li><strong>Platform:</strong> ${bugData.browserInfo.platform || 'N/A'}</li>
            <li><strong>Language:</strong> ${bugData.browserInfo.language || 'N/A'}</li>
            <li><strong>Screen Resolution:</strong> ${bugData.browserInfo.screen?.width || 'N/A'}x${bugData.browserInfo.screen?.height || 'N/A'}</li>
            <li><strong>Viewport:</strong> ${bugData.browserInfo.viewport?.width || 'N/A'}x${bugData.browserInfo.viewport?.height || 'N/A'}</li>
            <li><strong>Online:</strong> ${bugData.browserInfo.onLine ? 'Yes' : 'No'}</li>
          </ul>
        </div>

        <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #856404; margin-top: 0;">⚡ Action Required</h3>
          <p>🔍 Please investigate and fix this ${bugData.priority} priority issue.</p>
          <p>📧 Consider reaching out to the user if more information is needed.</p>
          <p>💾 This bug report has been automatically saved to the database.</p>
        </div>

        <div style="text-align: center; margin: 30px 0; padding: 20px; background: #f1f3f4; border-radius: 8px;">
          <p style="color: #666; margin: 0;">
            This bug report was sent from Compliance Ease bug reporting system.<br/>
            Timestamp: ${new Date().toISOString()}
          </p>
        </div>
      </div>
    `;

    // Send email notification to admin
    const emailResponse = await resend.emails.send({
      from: "Compliance Ease <notifications@resend.dev>",
      to: [supportEmail],
      subject: subject,
      html: emailHtml,
    });

    console.log("Bug report email sent:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Bug report sent successfully'
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-bug-report function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);