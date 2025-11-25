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
    const { category, advertiserId, limit = 10 } = await req.json();
    
    const rakutenToken = Deno.env.get('RAKUTEN_ADVERTISING_TOKEN');
    if (!rakutenToken) {
      throw new Error('RAKUTEN_ADVERTISING_TOKEN not configured');
    }

    // Build Coupon API URL with filters
    let apiUrl = `https://api.linksynergy.com/coupon/1.0`;
    const params = new URLSearchParams();
    
    if (category) {
      params.append('category', category);
    }
    
    if (advertiserId) {
      params.append('mid', advertiserId);
    }
    
    params.append('resultsperpage', limit.toString());
    
    if (params.toString()) {
      apiUrl += `?${params.toString()}`;
    }

    console.log('Fetching Rakuten coupons with Bearer token');

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${rakutenToken}`,
        'Accept': 'application/xml'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Rakuten Coupon API error:', response.status, errorText);
      throw new Error(`Coupon API returned ${response.status}`);
    }

    const xmlData = await response.text();
    
    // Parse XML to extract coupons (simplified - you may want to use a proper XML parser)
    const coupons = [];
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
      JSON.stringify({ 
        coupons,
        total: coupons.length
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error: any) {
    console.error('Error fetching coupons:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        coupons: [],
        total: 0
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