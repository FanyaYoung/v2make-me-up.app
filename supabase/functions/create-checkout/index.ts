
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const { tier } = await req.json();
    if (!tier || !['weekly', 'monthly', 'yearly'].includes(tier)) {
      throw new Error("Invalid subscription tier");
    }

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");

    logStep("User authenticated", { userId: user.id, email: user.email, tier });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { 
      apiVersion: "2023-10-16" 
    });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    logStep("Customer lookup completed", { customerId, hasExistingCustomer: !!customerId });

    // Updated pricing - all tiers are $10 with different intervals
    const tierConfig = {
      weekly: { amount: 1000, mode: "subscription" as const, interval: "week" as const }, // $10.00/week
      monthly: { amount: 1000, mode: "subscription" as const, interval: "month" as const }, // $10.00/month  
      yearly: { amount: 1000, mode: "subscription" as const, interval: "year" as const } // $10.00/year
    };

    const config = tierConfig[tier as keyof typeof tierConfig];
    
    let sessionConfig: any = {
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      mode: config.mode,
      success_url: `${req.headers.get("origin")}/subscription-success?tier=${tier}`,
      cancel_url: `${req.headers.get("origin")}/subscription-canceled`,
    };

    // All plans are now subscriptions
    sessionConfig.line_items = [
      {
        price_data: {
          currency: "usd",
          product_data: { 
            name: `Make Me Up - ${tier.charAt(0).toUpperCase() + tier.slice(1)} Subscription` 
          },
          unit_amount: config.amount,
          recurring: { interval: config.interval },
        },
        quantity: 1,
      },
    ];

    const session = await stripe.checkout.sessions.create(sessionConfig);
    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: 'Unable to create checkout session. Please try again.' }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
