import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MakeupProduct {
  id: number
  brand: string
  name: string
  price: string
  price_sign: string
  currency: string
  image_link: string
  product_link: string
  website_link: string
  description: string
  rating: number
  category: string
  product_type: string
  tag_list: string[]
  created_at: string
  updated_at: string
  product_api_url: string
  api_featured_image: string
  product_colors: Array<{
    hex_value: string
    colour_name: string
  }>
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch foundation products from makeup API
    const foundationResponse = await fetch('https://makeup-api.herokuapp.com/api/v1/products.json?product_type=foundation')
    const foundationData: MakeupProduct[] = await foundationResponse.json()

    console.log(`Fetched ${foundationData.length} foundation products from API`)

    // Process and insert products
    for (const product of foundationData) {
      // Check if brand exists, create if not
      const { data: existingBrand } = await supabaseClient
        .from('brands')
        .select('id')
        .eq('name', product.brand)
        .single()

      let brandId = existingBrand?.id

      if (!brandId) {
        const { data: newBrand, error: brandError } = await supabaseClient
          .from('brands')
          .insert({
            name: product.brand,
            description: `Brand imported from Makeup API`,
            is_active: true
          })
          .select('id')
          .single()

        if (brandError) {
          console.error('Error creating brand:', brandError)
          continue
        }
        brandId = newBrand.id
      }

      // Insert cosmetics product
      const { data: insertedProduct, error: productError } = await supabaseClient
        .from('cosmetics_products')
        .insert({
          product_name: product.name,
          brand_id: brandId,
          product_type: 'foundation',
          category: 'Foundation',
          description: product.description,
          price: product.price ? parseFloat(product.price) : null,
          rating: product.rating,
          image_url: product.image_link,
          product_url: product.product_link,
          dataset_name: 'makeup_api',
          metadata: {
            api_id: product.id,
            website_link: product.website_link,
            currency: product.currency,
            price_sign: product.price_sign,
            tag_list: product.tag_list,
            product_colors: product.product_colors,
            api_featured_image: product.api_featured_image
          }
        })
        .select('id')
        .single()

      if (productError) {
        console.error('Error inserting product:', productError)
        continue
      }

      // Insert shade attributes if product has colors
      if (product.product_colors && product.product_colors.length > 0) {
        for (const color of product.product_colors) {
          if (color.hex_value && color.colour_name) {
            await supabaseClient
              .from('cosmetics_product_attributes')
              .insert({
                product_id: insertedProduct.id,
                attribute_name: 'shade_color',
                attribute_value: color.hex_value
              })

            await supabaseClient
              .from('cosmetics_product_attributes')
              .insert({
                product_id: insertedProduct.id,
                attribute_name: 'shade_name',
                attribute_value: color.colour_name
              })
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully imported ${foundationData.length} foundation products`,
        processed_count: foundationData.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in fetch-makeup-api function:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})