import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GigasheetProduct {
  api_featured_image?: string;
  brand?: string;
  category?: string;
  created_at?: string;
  currency?: string;
  description?: string;
  id?: string;
  image_link?: string;
  name?: string;
  price?: string;
  price_sign?: string;
}

interface CosmeticsProduct {
  product_name: string;
  product_type?: string;
  category?: string;
  description?: string;
  price?: number;
  image_url?: string;
  brand_id?: string;
  dataset_name: string;
  metadata: any;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('Starting Gigasheet cosmetics import...')

    // The Gigasheet dataset URL - this would need to be a direct CSV export URL
    // For now, we'll simulate the data structure since we can't directly access the Gigasheet API
    const gigasheetData = await fetchGigasheetData()

    if (!gigasheetData || gigasheetData.length === 0) {
      throw new Error('No data received from Gigasheet')
    }

    console.log(`Processing ${gigasheetData.length} products from Gigasheet`)

    // Convert to our format
    const cosmeticsProducts: CosmeticsProduct[] = gigasheetData.map(item => ({
      product_name: item.name || 'Unknown Product',
      product_type: determineProductType(item.category, item.name),
      category: item.category,
      description: item.description,
      price: parsePrice(item.price, item.price_sign),
      image_url: item.image_link || item.api_featured_image,
      dataset_name: 'gigasheet-cosmetics',
      metadata: {
        original_id: item.id,
        currency: item.currency,
        price_sign: item.price_sign,
        source: 'gigasheet',
        imported_at: new Date().toISOString()
      }
    }))

    // Import to database
    const importResult = await importProductsToDatabase(supabase, cosmeticsProducts)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Gigasheet cosmetics data imported successfully',
        ...importResult
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Import error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

async function fetchGigasheetData(): Promise<GigasheetProduct[]> {
  // Since we can't directly access the Gigasheet API without authentication,
  // this function would need to be adapted based on how you can export the data
  // For now, returning sample data structure
  
  // In a real implementation, you might:
  // 1. Export the Gigasheet data as CSV and upload to a public URL
  // 2. Use Gigasheet's API if they provide one
  // 3. Have users manually export and upload the CSV
  
  console.log('Note: This is a template - you need to provide actual data access')
  
  // Sample data structure for testing
  return [
    {
      name: "Sample Foundation",
      brand: "Sample Brand",
      category: "Face",
      description: "Sample description",
      price: "25.99",
      currency: "USD",
      price_sign: "$",
      image_link: "https://example.com/image.jpg"
    }
  ]
}

function determineProductType(category?: string, name?: string): string {
  const categoryLower = (category || '').toLowerCase()
  const nameLower = (name || '').toLowerCase()
  
  if (categoryLower.includes('face') || nameLower.includes('foundation') || nameLower.includes('concealer')) {
    return 'foundation'
  }
  if (categoryLower.includes('lips') || nameLower.includes('lipstick') || nameLower.includes('lip')) {
    return 'lipstick'
  }
  if (categoryLower.includes('eyes') || nameLower.includes('mascara') || nameLower.includes('eyeshadow')) {
    return 'eye makeup'
  }
  if (categoryLower.includes('cheek') || nameLower.includes('blush') || nameLower.includes('bronzer')) {
    return 'cheek'
  }
  
  return category || 'cosmetics'
}

function parsePrice(price?: string, priceSign?: string): number | undefined {
  if (!price) return undefined
  
  // Remove currency symbols and parse
  const cleanPrice = price.replace(/[^\d.,]/g, '')
  const parsed = parseFloat(cleanPrice)
  
  return isNaN(parsed) ? undefined : parsed
}

async function importProductsToDatabase(supabase: any, products: CosmeticsProduct[]) {
  let importedCount = 0
  let errorCount = 0
  const brandCache = new Map<string, string>()

  // Group products by brand for efficient processing
  const productsByBrand = new Map<string, CosmeticsProduct[]>()
  
  for (const product of products) {
    const brandName = extractBrandFromMetadata(product)
    if (!productsByBrand.has(brandName)) {
      productsByBrand.set(brandName, [])
    }
    productsByBrand.get(brandName)!.push(product)
  }

  for (const [brandName, brandProducts] of productsByBrand) {
    try {
      // Get or create brand
      let brandId = brandCache.get(brandName)
      
      if (!brandId) {
        // Check if brand exists
        const { data: existingBrand } = await supabase
          .from('brands')
          .select('id')
          .ilike('name', brandName)
          .single()

        if (existingBrand) {
          brandId = existingBrand.id
        } else {
          // Create new brand
          const { data: newBrand, error: brandError } = await supabase
            .from('brands')
            .insert({ name: brandName })
            .select('id')
            .single()

          if (brandError) {
            console.error(`Error creating brand ${brandName}:`, brandError)
            continue
          }
          brandId = newBrand.id
        }
        
        brandCache.set(brandName, brandId)
      }

      // Update products with brand_id
      const productsWithBrand = brandProducts.map(product => ({
        ...product,
        brand_id: brandId
      }))

      // Insert products in batches
      const batchSize = 100
      for (let i = 0; i < productsWithBrand.length; i += batchSize) {
        const batch = productsWithBrand.slice(i, i + batchSize)
        
        const { error: insertError } = await supabase
          .from('cosmetics_products')
          .insert(batch)

        if (insertError) {
          console.error('Error inserting products batch:', insertError)
          errorCount += batch.length
        } else {
          importedCount += batch.length
        }
      }

    } catch (error) {
      console.error(`Error processing brand ${brandName}:`, error)
      errorCount += brandProducts.length
    }
  }

  return {
    imported_products: importedCount,
    errors: errorCount,
    total_processed: products.length,
    brands_processed: productsByBrand.size
  }
}

function extractBrandFromMetadata(product: CosmeticsProduct): string {
  // Try to extract brand from metadata or product name
  if (product.metadata?.brand) {
    return product.metadata.brand
  }
  
  // Extract from product name (first word often brand)
  const nameParts = product.product_name.split(' ')
  return nameParts[0] || 'Unknown Brand'
}