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
    const { productUrl, merchantId } = await req.json();
    
    if (!productUrl) {
      throw new Error('Product URL is required');
    }

    // Get your Rakuten Site ID (SID) from environment
    const rakutenSID = Deno.env.get('RAKUTEN_SITE_ID');
    if (!rakutenSID) {
      throw new Error('RAKUTEN_SITE_ID not configured. Please add your Rakuten affiliate Site ID to secrets.');
    }

    // Generate Rakuten deep link with proper tracking
    const deepLink = `https://click.linksynergy.com/deeplink?id=${rakutenSID}&mid=${merchantId || '2417'}&murl=${encodeURIComponent(productUrl)}`;

    console.log('Generated deep link:', deepLink);

    return new Response(
      JSON.stringify({ 
        deepLink,
        originalUrl: productUrl,
        siteId: rakutenSID,
        merchantId: merchantId || '2417'
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
        error: error.message
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