import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Premium test account email
const PREMIUM_TEST_EMAIL = "fanya.uxd@gmail.com";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get user info from request
    const { userEmail } = await req.json();
    
    // Check if this is the premium test account
    if (userEmail === PREMIUM_TEST_EMAIL) {
      console.log("Setting up premium account for:", userEmail);
      
      // First, get the user ID
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.listUsers();
      if (authError) throw authError;
      
      const user = authUser.users.find(u => u.email === PREMIUM_TEST_EMAIL);
      if (!user) {
        throw new Error("Premium test user not found");
      }
      
      // Upsert premium subscription record
      const { error: upsertError } = await supabaseAdmin
        .from('subscribers')
        .upsert({
          user_id: user.id,
          email: PREMIUM_TEST_EMAIL,
          stripe_customer_id: 'cus_premium_test_account',
          subscribed: true,
          subscription_tier: 'yearly',
          subscription_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'email'
        });
        
      if (upsertError) throw upsertError;
      
      console.log("Premium account setup complete for:", userEmail);
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Premium account activated",
        tier: "yearly"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    
    return new Response(JSON.stringify({ 
      success: false, 
      message: "Not a premium test account" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
    
  } catch (error) {
    console.error("Error in auto-upgrade:", error);
    return new Response(JSON.stringify({ 
      error: 'Unable to process upgrade request' 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});