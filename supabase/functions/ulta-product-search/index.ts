import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const { query } = await req.json()

    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Search query is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Ulta Beauty API integration would go here
    // For now, we'll return mock data
    const mockProducts = [
      {
        id: 'ulta-1',
        name: 'Fenty Beauty Pro Filt\'r Soft Matte Longwear Foundation',
        brand: 'Fenty Beauty',
        price: 40.00,
        rating: 4.3,
        reviewCount: 2847,
        imageUrl: '/placeholder-foundation.jpg',
        productUrl: 'https://www.ulta.com/p/pro-filtr-soft-matte-longwear-foundation',
        inStock: true,
        shades: [
          { name: '100', hex: '#F7E7CE', available: true },
          { name: '110', hex: '#F0D5A8', available: true },
          { name: '120', hex: '#E8C5A0', available: false },
        ]
      },
      {
        id: 'ulta-2',
        name: 'Rare Beauty Liquid Touch Weightless Foundation',
        brand: 'Rare Beauty',
        price: 29.00,
        rating: 4.5,
        reviewCount: 1923,
        imageUrl: '/placeholder-foundation.jpg',
        productUrl: 'https://www.ulta.com/p/liquid-touch-weightless-foundation',
        inStock: true,
        shades: [
          { name: '10N', hex: '#F5E6D3', available: true },
          { name: '12N', hex: '#EDD5B7', available: true },
          { name: '14N', hex: '#E3C59D', available: true },
        ]
      }
    ]

    // Filter products based on search query (mock implementation)
    const filteredProducts = mockProducts.filter(product => 
      product.name.toLowerCase().includes(query.toLowerCase()) ||
      product.brand.toLowerCase().includes(query.toLowerCase())
    )

    // Log the search for analytics
    if (user) {
      await supabaseClient
        .from('user_activity')
        .insert({
          user_id: user.id,
          activity_type: 'ulta_search',
          activity_data: { query, results_count: filteredProducts.length }
        })
    }

    return new Response(
      JSON.stringify({ products: filteredProducts }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in ulta-product-search:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})