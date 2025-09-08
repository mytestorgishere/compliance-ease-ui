import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SalesContactRequest {
  contactType: 'demo' | 'sales';
  firstName?: string;
  lastName?: string;
  email: string;
  company?: string;
  phone?: string;
  preferredDate?: string;
  preferredTime?: string;
  requirements?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const contactData: SalesContactRequest = await req.json();
    console.log('Received contact request:', contactData);

    // Create Supabase client using service role key to bypass RLS
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Store the contact in the database
    const { data: contactRecord, error: dbError } = await supabaseClient
      .from('sales_contacts')
      .insert({
        contact_type: contactData.contactType,
        first_name: contactData.firstName,
        last_name: contactData.lastName,
        email: contactData.email,
        company: contactData.company,
        phone: contactData.phone,
        preferred_date: contactData.preferredDate,
        preferred_time: contactData.preferredTime,
        requirements: contactData.requirements,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error(`Failed to store contact: ${dbError.message}`);
    }

    console.log('Contact stored in database:', contactRecord);

    // Prepare email content based on contact type
    const isDemo = contactData.contactType === 'demo';
    const subject = isDemo ? 
      `🎯 Demo Request from ${contactData.firstName} ${contactData.lastName} at ${contactData.company}` :
      `💼 Sales Inquiry from ${contactData.firstName} ${contactData.lastName}`;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
          ${isDemo ? '🎯 New Demo Request' : '💼 New Sales Inquiry'}
        </h2>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #007bff; margin-top: 0;">Contact Information</h3>
          <p><strong>Name:</strong> ${contactData.firstName} ${contactData.lastName}</p>
          <p><strong>Email:</strong> <a href="mailto:${contactData.email}">${contactData.email}</a></p>
          <p><strong>Company:</strong> ${contactData.company || 'Not provided'}</p>
          ${contactData.phone ? `<p><strong>Phone:</strong> ${contactData.phone}</p>` : ''}
        </div>

        ${isDemo ? `
        <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1976d2; margin-top: 0;">Demo Details</h3>
          <p><strong>Preferred Date:</strong> ${contactData.preferredDate || 'Not specified'}</p>
          <p><strong>Preferred Time:</strong> ${contactData.preferredTime || 'Not specified'}</p>
          ${contactData.requirements ? `<p><strong>Requirements:</strong><br/>${contactData.requirements.replace(/\n/g, '<br/>')}</p>` : ''}
        </div>
        ` : ''}

        <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #856404; margin-top: 0;">⚡ Action Required</h3>
          <p>${isDemo ? 
            '📅 Please schedule a demo session and send calendar invite to the customer.' :
            '📧 Please respond to this sales inquiry within 24 hours.'
          }</p>
          <p>💾 This contact has been automatically saved to your CRM system.</p>
        </div>

        <div style="text-align: center; margin: 30px 0; padding: 20px; background: #f1f3f4; border-radius: 8px;">
          <p style="color: #666; margin: 0;">
            This notification was sent from Compliance Ease contact system.<br/>
            Contact ID: ${contactRecord.id}
          </p>
        </div>
      </div>
    `;

    // Send email notification to admin
    const emailResponse = await resend.emails.send({
      from: "Compliance Ease <notifications@resend.dev>",
      to: ["pramodayaaws@gmail.com"],
      subject: subject,
      html: emailHtml,
    });

    console.log("Admin notification email sent:", emailResponse);

    // Send confirmation email to customer
    const customerSubject = isDemo ? 
      "Demo Request Received - Compliance Ease" :
      "Thank you for contacting Compliance Ease";

    const customerHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0;">Compliance Ease</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">EU Compliance Made Simple</p>
        </div>
        
        <div style="padding: 30px; background: white; border-radius: 0 0 8px 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-top: 0;">
            ${isDemo ? '🎯 Demo Request Received!' : '💼 Thank you for contacting us!'}
          </h2>
          
          <p>Hi ${contactData.firstName},</p>
          
          <p>${isDemo ? 
            'Thank you for requesting a demo of Compliance Ease. We\'re excited to show you how our AI-powered platform can transform your compliance processes.' :
            'Thank you for your interest in Compliance Ease. We appreciate you reaching out to us.'
          }</p>

          ${isDemo ? `
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #007bff; margin-top: 0;">What's Next?</h3>
            <ul style="color: #666; line-height: 1.6;">
              <li>📧 Our team will review your request within 24 hours</li>
              <li>📅 We'll send you a calendar invite for your preferred time slot</li>
              <li>🎯 The demo will be customized to your specific compliance needs</li>
              <li>❓ You'll have opportunity to ask questions about implementation</li>
            </ul>
          </div>
          ` : `
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #007bff; margin-top: 0;">What's Next?</h3>
            <ul style="color: #666; line-height: 1.6;">
              <li>📧 Our sales team will respond within 24 hours</li>
              <li>💬 We'll discuss your specific compliance requirements</li>
              <li>📊 We'll provide a customized solution proposal</li>
              <li>🎯 We can arrange a personalized demo if needed</li>
            </ul>
          </div>
          `}

          <p>In the meantime, feel free to explore our <a href="https://your-app-url.com/free-trial" style="color: #007bff;">free trial</a> to get a taste of what Compliance Ease can do for your organization.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <p style="color: #666;">Have questions? Reply to this email or contact us at:</p>
            <p style="color: #007bff; font-weight: bold;">pramodayaaws@gmail.com</p>
          </div>

          <p>Best regards,<br/>
          <strong>The Compliance Ease Team</strong></p>
        </div>
      </div>
    `;

    const customerEmailResponse = await resend.emails.send({
      from: "Compliance Ease <notifications@resend.dev>",
      to: [contactData.email],
      subject: customerSubject,
      html: customerHtml,
    });

    console.log("Customer confirmation email sent:", customerEmailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Contact saved and notifications sent successfully',
      contactId: contactRecord.id
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-sales-email function:", error);
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