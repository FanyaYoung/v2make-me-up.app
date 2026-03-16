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

    const { category, advertiserId, limit = 10 } = await req.json();

    // Input validation
    if (category && (typeof category !== 'string' || category.length > 100)) {
      return new Response(JSON.stringify({ error: 'Invalid category' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (advertiserId && (typeof advertiserId !== 'string' || advertiserId.length > 50)) {
      return new Response(JSON.stringify({ error: 'Invalid advertiserId' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const sanitizedLimit = Math.min(Math.max(1, Number(limit) || 10), 50);
    
    const rakutenToken = Deno.env.get('RAKUTEN_ADVERTISING_TOKEN');
    if (!rakutenToken) {
      throw new Error('RAKUTEN_ADVERTISING_TOKEN not configured');
    }

    let apiUrl = `https://api.linksynergy.com/coupon/1.0`;
    const params = new URLSearchParams();
    
    if (category) params.append('category', category);
    if (advertiserId) params.append('mid', advertiserId);
    params.append('resultsperpage', sanitizedLimit.toString());
    
    if (params.toString()) apiUrl += `?${params.toString()}`;

    console.log('Fetching Rakuten coupons');

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${rakutenToken}`,
        'Accept': 'application/xml'
      }
    });

    if (!response.ok) {
      console.error('Rakuten Coupon API error:', response.status);
      throw new Error(`Coupon API returned ${response.status}`);
    }

    const xmlData = await response.text();
    
    const coupons: any[] = [];
    const linkMatches = xmlData.matchAll(/<link>(.*?)<\/link>/gs);
    
    for (const match of linkMatches) {
      const linkXml = match[1];
      
      const extractTag = (tag: string) => {
        const regex = new RegExp(`<${tag}>(.*?)<\/${tag}>`, 's');
        const match = linkXml.match(regex);
        return match ? match[1].trim() : null;
      };
      
      coupons.push({
        description: extractTag('offerdescription'),
        code: extractTag('couponcode'),
        restriction: extractTag('couponrestriction'),
        startDate: extractTag('offerstartdate'),
        endDate: extractTag('offerenddate'),
        clickUrl: extractTag('clickurl')?.replace(/&amp;/g, '&'),
        advertiserId: extractTag('advertiserid'),
        advertiserName: extractTag('advertisername')
      });
    }

    console.log(`Found ${coupons.length} coupons`);

    return new Response(
      JSON.stringify({ coupons, total: coupons.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error fetching coupons:', error instanceof Error ? error.message : String(error));
    return new Response(
      JSON.stringify({ error: 'Internal server error', coupons: [], total: 0 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
