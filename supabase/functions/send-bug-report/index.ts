import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BugReportRequest {
  user_id: string;
  email: string;
  subject: string;
  description: string;
  priority: string;
  browser_info?: any;
  url?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const bugReport: BugReportRequest = await req.json();
    console.log('Received bug report:', bugReport);

    // Create Supabase client to fetch admin email
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get support email from admin settings
    const { data: adminSettings, error: settingsError } = await supabaseClient
      .from('admin_settings')
      .select('setting_value')
      .eq('setting_name', 'support_email')
      .single();

    if (settingsError) {
      console.error('Failed to fetch admin email:', settingsError);
      throw new Error('Failed to fetch admin email configuration');
    }

    const adminEmail = adminSettings.setting_value || 'pramodayaaws@gmail.com';
    console.log('Using admin email:', adminEmail);

    // Get priority emoji and color
    const getPriorityInfo = (priority: string) => {
      switch (priority) {
        case 'critical': return { emoji: '🚨', color: '#dc2626' };
        case 'high': return { emoji: '⚠️', color: '#ea580c' };
        case 'medium': return { emoji: '📝', color: '#ca8a04' };
        case 'low': return { emoji: '💡', color: '#16a34a' };
        default: return { emoji: '📝', color: '#ca8a04' };
      }
    };

    const priorityInfo = getPriorityInfo(bugReport.priority);

    // Format browser info for display
    const formatBrowserInfo = (browserInfo: any) => {
      if (!browserInfo) return 'Not available';
      
      return `
        <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; font-family: monospace; font-size: 12px;">
          <strong>Browser:</strong> ${browserInfo.userAgent || 'Unknown'}<br/>
          <strong>Platform:</strong> ${browserInfo.platform || 'Unknown'}<br/>
          <strong>Language:</strong> ${browserInfo.language || 'Unknown'}<br/>
          <strong>Screen:</strong> ${browserInfo.screenResolution || 'Unknown'}<br/>
          <strong>Window:</strong> ${browserInfo.windowSize || 'Unknown'}<br/>
          <strong>Online:</strong> ${browserInfo.onLine ? 'Yes' : 'No'}<br/>
          <strong>Reported at:</strong> ${browserInfo.timestamp || 'Unknown'}
        </div>
      `;
    };

    // Prepare email content
    const subject = `${priorityInfo.emoji} Bug Report: ${bugReport.subject}`;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; display: flex; align-items: center; gap: 10px;">
            ${priorityInfo.emoji} Bug Report Received
          </h1>
        </div>
        
        <div style="padding: 30px; background: white; border-radius: 0 0 8px 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="background: ${priorityInfo.color}15; padding: 15px; border-radius: 6px; margin-bottom: 20px; border-left: 4px solid ${priorityInfo.color};">
            <h3 style="margin: 0 0 5px 0; color: ${priorityInfo.color};">
              Priority: ${bugReport.priority.toUpperCase()}
            </h3>
            <p style="margin: 0; font-weight: bold; font-size: 18px;">${bugReport.subject}</p>
          </div>

          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">User Information</h3>
            <p><strong>Email:</strong> <a href="mailto:${bugReport.email}">${bugReport.email}</a></p>
            <p><strong>User ID:</strong> ${bugReport.user_id}</p>
            ${bugReport.url ? `<p><strong>Page URL:</strong> <a href="${bugReport.url}">${bugReport.url}</a></p>` : ''}
          </div>

          <div style="background: #fff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Bug Description</h3>
            <div style="white-space: pre-wrap; line-height: 1.6; color: #374151;">
${bugReport.description}
            </div>
          </div>

          <div style="margin: 20px 0;">
            <h3 style="color: #333; margin-bottom: 10px;">Technical Information</h3>
            ${formatBrowserInfo(bugReport.browser_info)}
          </div>

          <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <h3 style="color: #92400e; margin-top: 0;">⚡ Action Required</h3>
            <p style="margin: 0;">Please investigate and respond to this bug report as soon as possible.</p>
            <p style="margin: 5px 0 0 0;">You can reply directly to this email to contact the user.</p>
          </div>

          <div style="text-align: center; margin: 30px 0; padding: 20px; background: #f1f3f4; border-radius: 8px;">
            <p style="color: #666; margin: 0;">
              This bug report was automatically submitted from Compliance Ease.<br/>
              User: ${bugReport.email} | Time: ${new Date().toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    `;

    // Send email notification to admin
    const emailResponse = await resend.emails.send({
      from: "Compliance Ease <notifications@resend.dev>",
      to: [adminEmail],
      replyTo: [bugReport.email],
      subject: subject,
      html: emailHtml,
    });

    console.log("Bug report email sent:", emailResponse);

    // Send confirmation email to user
    const userConfirmationHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0;">🐛 Bug Report Received</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Compliance Ease Support</p>
        </div>
        
        <div style="padding: 30px; background: white; border-radius: 0 0 8px 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-top: 0;">Thank you for the bug report!</h2>
          
          <p>Hi there,</p>
          
          <p>We've successfully received your bug report and our team will investigate the issue as soon as possible.</p>

          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #007bff; margin-top: 0;">Your Report Summary</h3>
            <p><strong>Subject:</strong> ${bugReport.subject}</p>
            <p><strong>Priority:</strong> ${bugReport.priority.charAt(0).toUpperCase() + bugReport.priority.slice(1)}</p>
            <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
          </div>

          <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1976d2; margin-top: 0;">What happens next?</h3>
            <ul style="color: #666; line-height: 1.6; margin: 0; padding-left: 20px;">
              <li>Our team will review your report within 24 hours</li>
              <li>We'll investigate and work on a fix based on priority</li>
              <li>You'll receive an email update when the issue is resolved</li>
              <li>Critical issues will be addressed immediately</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <p style="color: #666;">Need to add more details? Reply to this email.</p>
            <p style="color: #007bff; font-weight: bold;">${adminEmail}</p>
          </div>

          <p>Thank you for helping us improve Compliance Ease!</p>
          
          <p>Best regards,<br/>
          <strong>The Compliance Ease Team</strong></p>
        </div>
      </div>
    `;

    const userEmailResponse = await resend.emails.send({
      from: "Compliance Ease <notifications@resend.dev>",
      to: [bugReport.email],
      subject: "Bug Report Received - We're on it!",
      html: userConfirmationHtml,
    });

    console.log("User confirmation email sent:", userEmailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Bug report submitted successfully and notifications sent'
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