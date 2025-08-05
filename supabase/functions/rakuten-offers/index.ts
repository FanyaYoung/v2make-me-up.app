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

    const { category, keywords, limit = 20 } = await req.json()

    // Rakuten Advertising API integration would go here
    // For now, we'll return mock data
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
      },
      {
        id: 'rak-3',
        name: 'Glossier Cloud Paint Gel Blush',
        description: 'Seamless, dewy gel blush that looks like it came from within',
        commissionRate: 15.0,
        salePrice: 20.00,
        imageUrl: '/placeholder-blush.jpg',
        clickUrl: 'https://click.linksynergy.com/deeplink?id=example&mid=2417&murl=https://www.glossier.com/cloud-paint',
        merchant: 'Glossier',
        category: 'Blush',
        inStock: true,
        rating: 4.2,
        reviewCount: 5670
      }
    ]

    // Filter offers based on category and keywords (mock implementation)
    let filteredOffers = mockOffers
    if (category) {
      filteredOffers = filteredOffers.filter(offer => 
        offer.category.toLowerCase().includes(category.toLowerCase())
      )
    }
    if (keywords) {
      const keywordList = keywords.split(',').map((k: string) => k.trim().toLowerCase())
      filteredOffers = filteredOffers.filter(offer =>
        keywordList.some(keyword => 
          offer.name.toLowerCase().includes(keyword) ||
          offer.description.toLowerCase().includes(keyword) ||
          offer.category.toLowerCase().includes(keyword)
        )
      )
    }

    // Limit results
    const limitedOffers = filteredOffers.slice(0, parseInt(limit))

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