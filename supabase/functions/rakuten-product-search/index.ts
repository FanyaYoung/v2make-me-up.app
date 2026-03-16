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

    const { keywords, brand, productName, limit = 20 } = await req.json();

    // Input validation
    if (keywords && (typeof keywords !== 'string' || keywords.length > 200)) {
      return new Response(JSON.stringify({ error: 'Invalid keywords' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (brand && (typeof brand !== 'string' || brand.length > 100)) {
      return new Response(JSON.stringify({ error: 'Invalid brand' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (productName && (typeof productName !== 'string' || productName.length > 200)) {
      return new Response(JSON.stringify({ error: 'Invalid productName' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const sanitizedLimit = Math.min(Math.max(1, Number(limit) || 20), 50);

    let searchKeyword = keywords || `${brand || ''} ${productName || ''} foundation makeup`.trim();
    searchKeyword = encodeURIComponent(searchKeyword);

    const rakutenUrl = `https://api.linksynergy.com/productsearch/1.0?keyword=${searchKeyword}&max=${sanitizedLimit}&pagenumber=1&sort=productname&sorttype=asc&language=en_US&cat=beauty`;
    
    console.log('Calling Rakuten Product Search API');

    const response = await fetch(rakutenUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      console.error('Rakuten API error:', response.status);
      return new Response(
        JSON.stringify({ products: [], total: 0, message: 'Rakuten API unavailable' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    
    const rakutenToken = Deno.env.get('RAKUTEN_ADVERTISING_TOKEN');
    const products = await Promise.all(data.item?.map(async (item: any) => {
      const merchantId = item.mid || '99999';
      const productUrl = item.linkurl || item.link;
      
      let affiliateUrl = productUrl;
      
      if (rakutenToken && productUrl) {
        try {
          const deepLinkResponse = await fetch('https://api.linksynergy.com/v1/deeplink', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${rakutenToken}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({
              url: productUrl,
              advertiser_id: parseInt(merchantId),
              u1: 'makeup-matcher'
            })
          });
          
          if (deepLinkResponse.ok) {
            const deepLinkData = await deepLinkResponse.json();
            affiliateUrl = deepLinkData.advertiser?.deep_link?.deep_link_url || 
                          deepLinkData.deep_link_url || 
                          productUrl;
          }
        } catch (deepLinkError) {
          console.error('Deep link creation failed, using direct URL');
        }
      }
      
      return {
        id: merchantId,
        merchantId: merchantId,
        name: item.productname || item.title,
        brand: item.merchantname,
        description: item.description,
        price: parseFloat(item.price?.replace(/[^0-9.]/g, '') || '0'),
        salePrice: item.saleprice ? parseFloat(item.saleprice.replace(/[^0-9.]/g, '')) : null,
        imageUrl: item.imageurl || item.thumbnailimage,
        productUrl: affiliateUrl,
        originalUrl: productUrl,
        category: item.category,
        inStock: item.isclearance !== 'Yes'
      };
    }) || []);

    console.log(`Found ${products.length} products`);

    return new Response(
      JSON.stringify({ products, total: products.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in rakuten-product-search:', error instanceof Error ? error.message : String(error));
    return new Response(
      JSON.stringify({ products: [], total: 0, message: 'Service temporarily unavailable' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
