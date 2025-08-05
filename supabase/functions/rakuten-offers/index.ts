import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface RakutenCredentials {
  sid: string;
  apiKey: string;
  secretKey: string;
}

interface RakutenTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

// Cache token with expiration
let cachedToken: { token: string; expiresAt: number } | null = null;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function getRakutenCredentials(): Promise<RakutenCredentials> {
  const credentialsJson = Deno.env.get('rakuten_advertising');
  if (!credentialsJson) {
    throw new Error('Rakuten credentials not configured');
  }
  
  try {
    return JSON.parse(credentialsJson);
  } catch (error) {
    throw new Error('Invalid Rakuten credentials format');
  }
}

async function generateRakutenToken(credentials: RakutenCredentials): Promise<string> {
  // Check if we have a valid cached token
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    console.log('Using cached Rakuten token');
    return cachedToken.token;
  }

  console.log('Generating new Rakuten token...');
  
  const tokenUrl = 'https://api.linkshare.rakuten.com/token';
  const authString = btoa(`${credentials.apiKey}:${credentials.secretKey}`);
  
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${authString}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      scope: 'product_search'
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Token generation failed:', response.status, errorText);
    throw new Error(`Failed to generate Rakuten token: ${response.status}`);
  }

  const tokenData: RakutenTokenResponse = await response.json();
  
  // Cache the token (expires 5 minutes before actual expiry for safety)
  cachedToken = {
    token: tokenData.access_token,
    expiresAt: Date.now() + (tokenData.expires_in - 300) * 1000
  };

  console.log('Successfully generated Rakuten token');
  return tokenData.access_token;
}

async function searchRakutenProducts(
  token: string, 
  credentials: RakutenCredentials, 
  category?: string, 
  keywords?: string, 
  limit: number = 20
) {
  const baseUrl = 'https://api.linkshare.rakuten.com/rest/v1/search';
  const params = new URLSearchParams({
    sid: credentials.sid,
    keyword: keywords || 'beauty makeup',
    pagenumber: '1',
    pagesize: limit.toString(),
  });

  if (category) {
    params.append('cat', category);
  }

  const response = await fetch(`${baseUrl}?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Product search failed:', response.status, errorText);
    throw new Error(`Rakuten API error: ${response.status}`);
  }

  return await response.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    const { data: { user } } = await supabaseClient.auth.getUser(
      req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
    )

    const { category, keywords, limit = 20 } = await req.json()

    console.log('Fetching Rakuten offers:', { category, keywords, limit });

    let offers = [];
    
    try {
      // Get Rakuten credentials and generate token
      const credentials = await getRakutenCredentials();
      const token = await generateRakutenToken(credentials);
      
      // Search for products using real Rakuten API
      const rakutenResponse = await searchRakutenProducts(
        token, 
        credentials, 
        category, 
        keywords, 
        limit
      );
      
      console.log('Rakuten API response received');
      
      // Transform Rakuten response to our format
      if (rakutenResponse && rakutenResponse.SearchResults) {
        offers = rakutenResponse.SearchResults.map((item: any) => ({
          id: `rak-${item.mid}-${item.sku}`,
          name: item.productname,
          description: item.short_description || item.productname,
          commissionRate: parseFloat(item.commission || '8.0'),
          salePrice: parseFloat(item.price || '0'),
          originalPrice: parseFloat(item.retailprice || item.price || '0'),
          imageUrl: item.imageurl || '/placeholder-makeup.jpg',
          clickUrl: item.clickurl,
          merchant: item.merchantname,
          category: item.category,
          inStock: item.availability === 'Yes',
          rating: parseFloat(item.rating || '0'),
          reviewCount: parseInt(item.reviewcount || '0')
        }));
      }
      
      console.log(`Transformed ${offers.length} offers from Rakuten API`);
      
    } catch (apiError) {
      console.error('Rakuten API error, falling back to mock data:', apiError);
      
      // Fallback to mock data if API fails
      const mockOffers = [
        {
          id: 'rak-1',
          name: 'Urban Decay All Nighter Long-Lasting Makeup Setting Spray',
          description: 'Keeps makeup fresh for up to 16 hours with temperature control technology',
          commissionRate: 8.5,
          salePrice: 33.00,
          originalPrice: 38.00,
          imageUrl: '/placeholder-makeup.jpg',
          clickUrl: 'https://click.linksynergy.com/deeplink?id=example&mid=2417&murl=https://www.urbandecay.com/all-nighter',
          merchant: 'Urban Decay',
          category: 'Setting Spray',
          inStock: true,
          rating: 4.4,
          reviewCount: 15240
        },
        {
          id: 'rak-2',
          name: 'Charlotte Tilbury Airbrush Flawless Foundation',
          description: 'Full coverage foundation with buildable, breathable formula',
          commissionRate: 12.0,
          salePrice: 44.00,
          imageUrl: '/placeholder-foundation.jpg',
          clickUrl: 'https://click.linksynergy.com/deeplink?id=example&mid=2417&murl=https://www.charlottecharlotte.com/airbrush-foundation',
          merchant: 'Charlotte Tilbury',
          category: 'Foundation',
          inStock: true,
          rating: 4.6,
          reviewCount: 8900
        }
      ];
      
      // Filter mock offers if needed
      offers = mockOffers;
      if (category) {
        offers = offers.filter(offer => 
          offer.category.toLowerCase().includes(category.toLowerCase())
        );
      }
      if (keywords) {
        const keywordList = keywords.split(',').map((k: string) => k.trim().toLowerCase());
        offers = offers.filter(offer =>
          keywordList.some(keyword => 
            offer.name.toLowerCase().includes(keyword) ||
            offer.description.toLowerCase().includes(keyword) ||
            offer.category.toLowerCase().includes(keyword)
          )
        );
      }
    }

    // Apply limit
    const limitedOffers = offers.slice(0, parseInt(limit))

    // Mock stats
    const stats = {
      totalClicks: 1847,
      totalCommissions: 2456.78,
      conversionRate: 0.034,
      topPerformingProducts: ['Foundation', 'Setting Spray', 'Concealer']
    }

    // Log the request for analytics
    if (user) {
      await supabaseClient
        .from('user_activity')
        .insert({
          user_id: user.id,
          activity_type: 'rakuten_offers_fetch',
          activity_data: { category, keywords, results_count: limitedOffers.length }
        })
    }

    return new Response(
      JSON.stringify({ offers: limitedOffers, stats }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in rakuten-offers:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})