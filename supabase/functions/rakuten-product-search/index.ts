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
    if (!rakutenToken || rakutenToken.trim() === '') {
      console.log('Rakuten API token not configured - returning empty results');
      return new Response(
        JSON.stringify({ 
          products: [],
          total: 0,
          message: 'Rakuten integration not configured'
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    // Build search keyword
    let searchKeyword = keywords || `${brand} ${productName} foundation makeup`;
    searchKeyword = encodeURIComponent(searchKeyword);

    // Call Rakuten Product Search API with Bearer token
    const rakutenUrl = `https://api.linksynergy.com/productsearch/1.0?keyword=${searchKeyword}&max=${limit}&pagenumber=1&sort=productname&sorttype=asc&token=${rakutenToken}`;
    
    console.log('Calling Rakuten API with Bearer token');

    const response = await fetch(rakutenUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${rakutenToken}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Rakuten API error:', response.status, errorText);
      // Return empty results instead of throwing - let CSV images work
      const message = response.status === 401
        ? 'Rakuten token rejected - refresh RAKUTEN_ADVERTISING_TOKEN'
        : 'Rakuten API unavailable';
      console.log(`${message} - returning empty results to allow CSV fallback`);
      return new Response(
        JSON.stringify({
          products: [],
          total: 0,
          message
        }),
        {
          headers: {
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    const data = await response.json();
    
    // Parse and format the response with deep links
    const products = await Promise.all(data.item?.map(async (item: any) => {
      const merchantId = item.mid || '99999';
      const productUrl = item.linkurl || item.link;
      
      // Create proper deep link via Rakuten API if token is available
      let affiliateUrl = productUrl;
      
      if (rakutenToken && productUrl) {
        try {
          const deepLinkResponse = await fetch(`https://api.linksynergy.com/v1/deeplink?token=${rakutenToken}`, {
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
            // Parse correct response format
            affiliateUrl = deepLinkData.advertiser?.deep_link?.deep_link_url || 
                          deepLinkData.deep_link_url || 
                          productUrl;
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
    // Return success with empty products to allow CSV fallback
    return new Response(
      JSON.stringify({ 
        products: [],
        total: 0,
        message: 'Rakuten service temporarily unavailable'
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }
      }
    );
  }
});
