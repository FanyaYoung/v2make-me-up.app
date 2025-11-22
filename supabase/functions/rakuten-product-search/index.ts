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
    const { keywords, brand, productName, limit = 20 } = await req.json();
    
    const rakutenToken = Deno.env.get('RAKUTEN_ADVERTISING_TOKEN');
    if (!rakutenToken) {
      throw new Error('Rakuten API token not configured');
    }

    // Build search keyword
    let searchKeyword = keywords || `${brand} ${productName} foundation makeup`;
    searchKeyword = encodeURIComponent(searchKeyword);

    // Call Rakuten Product Search API with correct URL format
    const rakutenUrl = `https://api.linksynergy.com/productsearch/1.0?keyword=${searchKeyword}&max=${limit}&pagenumber=1&sort=productname&sorttype=asc&token=${rakutenToken}`;
    
    console.log('Calling Rakuten API:', rakutenUrl.replace(rakutenToken, 'REDACTED'));

    const response = await fetch(rakutenUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Rakuten API error:', response.status, errorText);
      throw new Error(`Rakuten API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    // Get Rakuten API token for deep link creation
    const rakutenToken = Deno.env.get('RAKUTEN_ADVERTISING_TOKEN');
    
    // Parse and format the response with deep links
    const products = await Promise.all(data.item?.map(async (item: any) => {
      const merchantId = item.mid || '99999';
      const productUrl = item.linkurl || item.link;
      
      // Create proper deep link via Rakuten API if token is available
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
            affiliateUrl = deepLinkData.deep_link || deepLinkData.url || productUrl;
          }
        } catch (deepLinkError) {
          console.error('Deep link creation failed, using direct URL:', deepLinkError);
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
        productUrl: affiliateUrl, // Deep link with affiliate tracking
        originalUrl: productUrl, // Keep original for reference
        category: item.category,
        inStock: item.isclearance !== 'Yes'
      };
    }) || []);

    console.log(`Found ${products.length} products from Rakuten with ${rakutenToken ? 'affiliate deep links' : 'direct URLs (add token for tracking)'}`);

    return new Response(
      JSON.stringify({ products, total: products.length }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error: any) {
    console.error('Error in rakuten-product-search:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        products: [],
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
