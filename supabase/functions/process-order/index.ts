import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderItem {
  product_id?: string;
  product_name: string;
  product_brand: string;
  shade_name?: string;
  quantity: number;
  unit_price: number;
}

interface CreateOrderRequest {
  items: OrderItem[];
  customer_email: string;
  customer_name: string;
  shipping_address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  billing_address?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  affiliate_id: string;
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PROCESS-ORDER] ${step}${detailsStr}`);
};

// Validation helpers
const isValidString = (val: unknown, maxLen: number): val is string =>
  typeof val === 'string' && val.trim().length > 0 && val.length <= maxLen;

const isValidEmail = (val: unknown): val is string =>
  typeof val === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) && val.length <= 255;

const isValidAddress = (addr: any): boolean =>
  addr &&
  isValidString(addr.line1, 200) &&
  (!addr.line2 || isValidString(addr.line2, 200)) &&
  isValidString(addr.city, 100) &&
  isValidString(addr.state, 100) &&
  isValidString(addr.postal_code, 20) &&
  isValidString(addr.country, 100);

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
    logStep("Starting order processing");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");

    const orderData: CreateOrderRequest = await req.json();

    // Input validation
    if (!isValidString(orderData.customer_name, 200)) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid customer name' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400,
      });
    }
    if (!isValidEmail(orderData.customer_email)) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid email address' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400,
      });
    }
    if (!isValidAddress(orderData.shipping_address)) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid shipping address' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400,
      });
    }
    if (orderData.billing_address && !isValidAddress(orderData.billing_address)) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid billing address' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400,
      });
    }
    if (!isValidString(orderData.affiliate_id, 100)) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid affiliate ID' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400,
      });
    }
    if (!Array.isArray(orderData.items) || orderData.items.length === 0 || orderData.items.length > 50) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid items' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400,
      });
    }
    for (const item of orderData.items) {
      if (!isValidString(item.product_name, 200) || !isValidString(item.product_brand, 200)) {
        return new Response(JSON.stringify({ success: false, error: 'Invalid item data' }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400,
        });
      }
      if (typeof item.quantity !== 'number' || item.quantity < 1 || item.quantity > 100 || !Number.isInteger(item.quantity)) {
        return new Response(JSON.stringify({ success: false, error: 'Invalid item quantity' }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400,
        });
      }
      if (typeof item.unit_price !== 'number' || item.unit_price < 0 || item.unit_price > 10000) {
        return new Response(JSON.stringify({ success: false, error: 'Invalid item price' }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400,
        });
      }
    }

    logStep("Order data validated", { itemCount: orderData.items.length });

    const total_amount = orderData.items.reduce((sum, item) => 
      sum + (item.unit_price * item.quantity), 0
    );

    const { data: orderNumberData, error: orderNumberError } = await supabaseClient
      .rpc('generate_order_number');
    
    if (orderNumberError) {
      throw new Error(`Failed to generate order number: ${orderNumberError.message}`);
    }

    const order_number = orderNumberData;
    logStep("Generated order number");

    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .insert({
        user_id: user.id,
        order_number,
        total_amount,
        customer_email: orderData.customer_email,
        customer_name: orderData.customer_name,
        shipping_address: orderData.shipping_address,
        billing_address: orderData.billing_address,
        affiliate_id: orderData.affiliate_id,
        status: 'pending'
      })
      .select()
      .single();

    if (orderError) {
      throw new Error(`Failed to create order: ${orderError.message}`);
    }

    logStep("Order created");

    const orderItems = orderData.items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.product_name,
      product_brand: item.product_brand,
      shade_name: item.shade_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.unit_price * item.quantity
    }));

    const { error: itemsError } = await supabaseClient
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      throw new Error(`Failed to create order items: ${itemsError.message}`);
    }

    logStep("Order items created", { itemCount: orderItems.length });

    return new Response(JSON.stringify({
      success: true,
      order: {
        id: order.id,
        order_number: order.order_number,
        total_amount: order.total_amount,
        status: order.status
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in process-order", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Internal server error' 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
