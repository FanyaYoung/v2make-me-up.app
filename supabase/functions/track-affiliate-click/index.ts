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

    const { provider, offerId, clickUrl, userId } = await req.json()

    if (!provider || !offerId || !clickUrl) {
      return new Response(
        JSON.stringify({ error: 'Provider, offerId, and clickUrl are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Track the affiliate click
    const clickData = {
      user_id: user?.id || userId,
      activity_type: 'affiliate_click',
      activity_data: {
        provider,
        offer_id: offerId,
        click_url: clickUrl,
        timestamp: new Date().toISOString(),
        user_agent: req.headers.get('user-agent'),
        referrer: req.headers.get('referer')
      },
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
      user_agent: req.headers.get('user-agent')
    }

    await supabaseClient
      .from('user_activity')
      .insert(clickData)

    // Also update analytics table for aggregated metrics
    const today = new Date().toISOString().split('T')[0]
    
    await supabaseClient
      .from('user_analytics')
      .upsert({
        user_id: user?.id || 'anonymous',
        date_recorded: today,
        metric_name: `affiliate_clicks_${provider}`,
        metric_value: 1,
        metric_data: { provider, offer_id: offerId }
      }, {
        onConflict: 'user_id,date_recorded,metric_name',
        ignoreDuplicates: false
      })

    return new Response(
      JSON.stringify({ success: true, message: 'Click tracked successfully' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in track-affiliate-click:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})