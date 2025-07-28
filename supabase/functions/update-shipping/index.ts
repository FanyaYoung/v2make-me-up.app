import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UpdateShippingRequest {
  order_id: string;
  tracking_number: string;
  shipping_carrier: string;
  tracking_url?: string;
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[UPDATE-SHIPPING] ${step}${detailsStr}`);
};

// Generate tracking URL based on carrier
const generateTrackingUrl = (carrier: string, trackingNumber: string): string => {
  const lowerCarrier = carrier.toLowerCase();
  
  if (lowerCarrier.includes('ups')) {
    return `https://www.ups.com/track?loc=en_US&tracknum=${trackingNumber}`;
  } else if (lowerCarrier.includes('fedex')) {
    return `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`;
  } else if (lowerCarrier.includes('usps')) {
    return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`;
  } else if (lowerCarrier.includes('dhl')) {
    return `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}`;
  }
  
  // Default fallback
  return `https://www.google.com/search?q=${carrier}+tracking+${trackingNumber}`;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Starting shipping update");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");

    // Check if user is admin
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('preferences')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.preferences?.role === 'admin' || profile?.preferences?.is_admin === 'true';
    if (!isAdmin) {
      throw new Error("Unauthorized: Admin access required");
    }

    const updateData: UpdateShippingRequest = await req.json();
    logStep("Update data received", { orderId: updateData.order_id });

    const tracking_url = updateData.tracking_url || 
      generateTrackingUrl(updateData.shipping_carrier, updateData.tracking_number);

    // Update order with shipping information
    const { data: order, error: updateError } = await supabaseClient
      .from('orders')
      .update({
        tracking_number: updateData.tracking_number,
        shipping_carrier: updateData.shipping_carrier,
        tracking_url: tracking_url,
        status: 'shipped',
        shipped_at: new Date().toISOString()
      })
      .eq('id', updateData.order_id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update order: ${updateError.message}`);
    }

    logStep("Order updated successfully", { orderId: order.id, trackingNumber: updateData.tracking_number });

    return new Response(JSON.stringify({
      success: true,
      order: {
        id: order.id,
        order_number: order.order_number,
        status: order.status,
        tracking_number: order.tracking_number,
        tracking_url: order.tracking_url,
        shipping_carrier: order.shipping_carrier
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in update-shipping", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});