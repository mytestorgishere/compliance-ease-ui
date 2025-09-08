import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Use service role key to bypass RLS for upsert operations
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found, updating unsubscribed state");
      await supabaseClient.from("subscribers").upsert({
        email: user.email,
        user_id: user.id,
        stripe_customer_id: null,
        subscribed: false,
        subscription_tier: null,
        subscription_end: null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'email' });
      
      // Also update profiles table
      await supabaseClient.from("profiles").update({
        subscription_status: 'free'
      }).eq('user_id', user.id);

      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });
    const hasActiveSub = subscriptions.data.length > 0;
    let subscriptionTier = null;
    let subscriptionEnd = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      logStep("Active subscription found", { subscriptionId: subscription.id, endDate: subscriptionEnd });
      
      // Determine subscription tier from price
      const priceId = subscription.items.data[0].price.id;
      const price = await stripe.prices.retrieve(priceId);
      const amount = price.unit_amount || 0;
      
      // Map amounts to tiers (in cents)
      if (amount >= 79900 && amount <= 861720) {
        subscriptionTier = "Enterprise";
      } else if (amount >= 39900 && amount <= 430920) {
        subscriptionTier = "Professional";
      } else if (amount >= 19900 && amount <= 214920) {
        subscriptionTier = "Starter";
      } else {
        subscriptionTier = "Unknown";
      }
      
      logStep("Determined subscription tier", { priceId, amount, subscriptionTier });
    } else {
      logStep("No active subscription found");
    }

    // Update subscribers table
    // Get file upload limit from subscription tiers table and determine if yearly
    let fileUploadLimit = 0;
    let fileSizeLimitMB = 1; // Default to 1MB for free users
    let isYearlySubscription = false;
    
    if (hasActiveSub && subscriptionTier) {
      const subscription = subscriptions.data[0];
      const priceId = subscription.items.data[0].price.id;
      const price = await stripe.prices.retrieve(priceId);
      isYearlySubscription = price.recurring?.interval === 'year';
      
      const { data: tierData } = await supabaseClient
        .from("subscription_tiers")
        .select("file_upload_limit, file_size_limit_mb")
        .eq("tier_name", subscriptionTier.toLowerCase())
        .single();

      const monthlyLimit = tierData?.file_upload_limit || 0;
      fileUploadLimit = isYearlySubscription ? monthlyLimit * 12 : monthlyLimit;
      fileSizeLimitMB = tierData?.file_size_limit_mb || 1;
        
      logStep("File upload limit calculated", { 
        isYearly: isYearlySubscription, 
        monthlyLimit: monthlyLimit,
        calculatedLimit: fileUploadLimit,
        fileSizeLimit: fileSizeLimitMB
      });
    }

    // Check for existing subscription data to detect plan changes
    const { data: existingSubscriber } = await supabaseClient
      .from("subscribers")
      .select("subscription_tier, file_uploads_used")
      .eq("user_id", user.id)
      .maybeSingle();

    // Reset file uploads if subscription tier changed or it's a new subscription
    let fileUploadsUsed = 0;
    if (existingSubscriber && existingSubscriber.subscription_tier === subscriptionTier) {
      // Same tier, keep existing usage
      fileUploadsUsed = existingSubscriber.file_uploads_used || 0;
      logStep("Keeping existing file upload usage", { 
        tier: subscriptionTier, 
        usage: fileUploadsUsed 
      });
    } else {
      // New tier or new subscription, reset usage
      logStep("Resetting file upload usage due to subscription change", { 
        oldTier: existingSubscriber?.subscription_tier, 
        newTier: subscriptionTier 
      });
    }

    await supabaseClient.from("subscribers").upsert({
      email: user.email,
      user_id: user.id,
      stripe_customer_id: customerId,
      subscribed: hasActiveSub,
      subscription_tier: subscriptionTier,
      subscription_end: subscriptionEnd,
      file_upload_limit: fileUploadLimit,
      file_uploads_used: fileUploadsUsed,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'email' });

    // Update profiles table
    await supabaseClient.from("profiles").update({
      subscription_status: hasActiveSub ? 'active' : 'free'
    }).eq('user_id', user.id);

    logStep("Updated database with subscription info", { subscribed: hasActiveSub, subscriptionTier });
    
    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      subscription_tier: subscriptionTier,
      subscription_end: subscriptionEnd,
      file_size_limit_mb: fileSizeLimitMB
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});