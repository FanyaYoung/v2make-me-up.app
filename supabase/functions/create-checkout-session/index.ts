import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CartItem {
  id: string;
  product: {
    id: string;
    brand: string;
    product: string;
    shade: string;
    price: number;
  };
  quantity: number;
  selectedShade?: 'primary' | 'contour';
  shadeName?: string;
}

interface CheckoutRequest {
  items: CartItem[];
  fulfillment_method?: string;
  fulfillment_price?: number;
  customer_email?: string;
  customer_name?: string;
  shipping_address?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT-SESSION] ${step}${detailsStr}`);
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
    logStep("Starting checkout session creation");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");

    const checkoutData: CheckoutRequest = await req.json();
    logStep("Checkout data received", { itemCount: checkoutData.items.length });

    if (!checkoutData.items || checkoutData.items.length === 0) {
      throw new Error("No items in cart");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check if customer exists
    const customers = await stripe.customers.list({ 
      email: user.email, 
      limit: 1 
    });

    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        name: checkoutData.customer_name || user.email.split('@')[0],
      });
      customerId = customer.id;
      logStep("Created new customer", { customerId });
    }

    // Create line items for Stripe
    const lineItems = checkoutData.items.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: `${item.product.brand} ${item.product.product}`,
          description: `Shade: ${item.shadeName || item.product.shade}${item.selectedShade ? ` (${item.selectedShade})` : ''}`,
          metadata: {
            product_id: item.product.id,
            shade_name: item.shadeName || item.product.shade,
            selected_shade: item.selectedShade || 'primary',
          },
        },
        unit_amount: Math.round(item.product.price * 100), // Convert to cents
      },
      quantity: item.quantity,
    }));

    // Add fulfillment fee if applicable
    if (checkoutData.fulfillment_price && checkoutData.fulfillment_price > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${checkoutData.fulfillment_method || 'Shipping'} Fee`,
            description: 'Fulfillment service fee',
          },
          unit_amount: Math.round(checkoutData.fulfillment_price * 100),
        },
        quantity: 1,
      });
    }

    logStep("Created line items", { lineItemsCount: lineItems.length });

    // Calculate total for order tracking
    const totalAmount = checkoutData.items.reduce((sum, item) => 
      sum + (item.product.price * item.quantity), 0
    );

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: lineItems,
      mode: 'payment',
      success_url: `${req.headers.get("origin")}/cart?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${req.headers.get("origin")}/cart?canceled=true`,
      automatic_tax: {
        enabled: true,
      },
      shipping_address_collection: {
        allowed_countries: ['US', 'CA'],
      },
      metadata: {
        user_id: user.id,
        total_amount: totalAmount.toString(),
        item_count: checkoutData.items.length.toString(),
        fulfillment_method: checkoutData.fulfillment_method || 'shipping',
      },
    });

    logStep("Checkout session created", { 
      sessionId: session.id, 
      url: session.url 
    });

    return new Response(JSON.stringify({
      success: true,
      checkout_url: session.url,
      session_id: session.id,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout-session", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});