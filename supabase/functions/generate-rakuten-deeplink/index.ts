import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productUrl, advertiserId, trackingParam } = await req.json();
    
    if (!productUrl) {
      throw new Error('Product URL is required');
    }

    // Get Rakuten API token
    const rakutenToken = Deno.env.get('RAKUTEN_ADVERTISING_TOKEN');
    if (!rakutenToken) {
      throw new Error('RAKUTEN_ADVERTISING_TOKEN not configured');
    }

    // Create deep link using Rakuten Deep Link API
    const deepLinkPayload = {
      url: productUrl,
      advertiser_id: advertiserId || 99999, // Use provided or default advertiser ID
      u1: trackingParam || 'makeup-matcher' // Custom tracking parameter
    };

    console.log('Creating Rakuten deep link:', deepLinkPayload);

    const response = await fetch('https://api.linksynergy.com/v1/deeplink', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${rakutenToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(deepLinkPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Rakuten Deep Link API error:', response.status, errorText);
      throw new Error(`Failed to create deep link: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('Deep link created successfully:', data);

    return new Response(
      JSON.stringify({ 
        deepLink: data.deep_link || data.url,
        originalUrl: productUrl,
        advertiserId: advertiserId,
        trackingParam: trackingParam
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error: any) {
    console.error('Error generating deep link:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        fallbackUrl: req.body?.productUrl // Return original URL as fallback
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 500
      }
    );
  }
});