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

    const response = await fetch(`https://api.linksynergy.com/v1/deeplink?token=${rakutenToken}`, {
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
    
    // Parse Rakuten deep link response format
    const deepLinkUrl = data.advertiser?.deep_link?.deep_link_url || data.deep_link_url || productUrl;
    const advertiserInfo = data.advertiser || {};
    
    console.log('Deep link created successfully:', {
      deepLinkUrl,
      advertiserId: advertiserInfo.id,
      advertiserName: advertiserInfo.name
    });

    return new Response(
      JSON.stringify({ 
        deepLink: deepLinkUrl,
        originalUrl: productUrl,
        advertiser: {
          id: advertiserInfo.id,
          name: advertiserInfo.name,
          url: advertiserInfo.url,
          description: advertiserInfo.description
        },
        trackingParam: data.advertiser?.deep_link?.u1 || trackingParam
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