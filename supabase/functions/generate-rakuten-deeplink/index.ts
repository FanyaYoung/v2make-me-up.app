import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { productUrl, advertiserId, trackingParam } = await req.json();
    
    // Input validation
    if (!productUrl || typeof productUrl !== 'string' || productUrl.length > 2000) {
      return new Response(JSON.stringify({ error: 'Invalid or missing product URL' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    try {
      const parsed = new URL(productUrl);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error('Invalid protocol');
      }
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid product URL format' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (trackingParam && (typeof trackingParam !== 'string' || trackingParam.length > 100)) {
      return new Response(JSON.stringify({ error: 'Invalid tracking parameter' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const rakutenToken = Deno.env.get('RAKUTEN_ADVERTISING_TOKEN');
    if (!rakutenToken) {
      throw new Error('RAKUTEN_ADVERTISING_TOKEN not configured');
    }

    const deepLinkPayload = {
      url: productUrl,
      advertiser_id: advertiserId || 99999,
      u1: trackingParam || 'makeup-matcher'
    };

    console.log('Creating Rakuten deep link');

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
      console.error('Rakuten Deep Link API error:', response.status);
      throw new Error(`Failed to create deep link: ${response.status}`);
    }

    const data = await response.json();
    
    const deepLinkUrl = data.advertiser?.deep_link?.deep_link_url || data.deep_link_url || productUrl;
    const advertiserInfo = data.advertiser || {};

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
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error generating deep link:', error instanceof Error ? error.message : String(error));
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
