import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface KaggleDataset {
  ref: string
  title: string
  size: number
  lastUpdated: string
  downloadCount: number
  isPrivate: boolean
  isFeatured: boolean
}

interface CosmeticsProduct {
  brand: string
  name: string
  price?: number
  category?: string
  description?: string
  ingredients?: string[]
  rating?: number
  product_type?: string
  shade_name?: string
  hex_color?: string
  undertone?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Starting Kaggle cosmetics data import...')
    
    // Get Kaggle credentials from secrets
    const kaggleUsername = Deno.env.get('KAGGLE_USERNAME')
    const kaggleKey = Deno.env.get('KAGGLE_KEY')
    
    if (!kaggleUsername || !kaggleKey) {
      throw new Error('Kaggle credentials not found in environment variables')
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('Searching for cosmetics datasets on Kaggle...')
    
    // Search for cosmetics datasets
    const searchResponse = await fetch('https://www.kaggle.com/api/v1/datasets/list?search=cosmetics&page=1&pageSize=10', {
      headers: {
        'Authorization': `Basic ${btoa(`${kaggleUsername}:${kaggleKey}`)}`,
        'Content-Type': 'application/json'
      }
    })

    if (!searchResponse.ok) {
      throw new Error(`Kaggle API error: ${searchResponse.status} ${searchResponse.statusText}`)
    }

    const datasets: KaggleDataset[] = await searchResponse.json()
    console.log(`Found ${datasets.length} cosmetics datasets`)

    let totalProcessed = 0
    let totalBrands = 0
    let totalProducts = 0
    let totalShades = 0

    // Process each dataset
    for (const dataset of datasets.slice(0, 3)) { // Limit to first 3 datasets to avoid timeout
      try {
        console.log(`Processing dataset: ${dataset.title}`)
        
        // Download dataset files list
        const filesResponse = await fetch(`https://www.kaggle.com/api/v1/datasets/list-files/${dataset.ref}`, {
          headers: {
            'Authorization': `Basic ${btoa(`${kaggleUsername}:${kaggleKey}`)}`,
            'Content-Type': 'application/json'
          }
        })

        if (!filesResponse.ok) {
          console.log(`Skipping dataset ${dataset.ref}: ${filesResponse.status}`)
          continue
        }

        const files = await filesResponse.json()
        
        // Look for CSV files that might contain cosmetics data
        const csvFiles = files.filter((file: any) => 
          file.name.toLowerCase().endsWith('.csv') && 
          file.size < 50000000 // Skip files larger than 50MB
        )

        for (const file of csvFiles.slice(0, 1)) { // Process first CSV file only
          try {
            console.log(`Downloading file: ${file.name}`)
            
            // Download the CSV file
            const downloadResponse = await fetch(`https://www.kaggle.com/api/v1/datasets/download-file/${dataset.ref}/${file.name}`, {
              headers: {
                'Authorization': `Basic ${btoa(`${kaggleUsername}:${kaggleKey}`)}`,
              }
            })

            if (!downloadResponse.ok) {
              console.log(`Failed to download ${file.name}: ${downloadResponse.status}`)
              continue
            }

            const csvContent = await downloadResponse.text()
            const products = parseCSVToProducts(csvContent)
            
            console.log(`Parsed ${products.length} products from ${file.name}`)
            
            // Import products to database
            const importResult = await importProductsToDatabase(supabase, products)
            totalBrands += importResult.brands
            totalProducts += importResult.products
            totalShades += importResult.shades
            totalProcessed++
            
          } catch (fileError) {
            console.error(`Error processing file ${file.name}:`, fileError)
          }
        }
        
      } catch (datasetError) {
        console.error(`Error processing dataset ${dataset.ref}:`, datasetError)
      }
    }

    const result = {
      success: true,
      message: `Successfully processed ${totalProcessed} datasets`,
      stats: {
        datasets_processed: totalProcessed,
        brands_imported: totalBrands,
        products_imported: totalProducts,
        shades_imported: totalShades
      }
    }

    console.log('Import completed:', result)

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
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
        status: 500 
      }
    )
  }
})

function parseCSVToProducts(csvContent: string): CosmeticsProduct[] {
  const lines = csvContent.split('\n')
  if (lines.length < 2) return []
  
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''))
  const products: CosmeticsProduct[] = []
  
  for (let i = 1; i < lines.length && i < 1000; i++) { // Limit to 1000 products per file
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
    if (values.length < headers.length) continue
    
    const product: CosmeticsProduct = {
      brand: '',
      name: ''
    }
    
    // Map common column names to our schema
    headers.forEach((header, index) => {
      const value = values[index]
      if (!value) return
      
      switch (header) {
        case 'brand':
        case 'brand_name':
        case 'company':
        case 'manufacturer':
          product.brand = value
          break
        case 'name':
        case 'product_name':
        case 'title':
          product.name = value
          break
        case 'price':
        case 'cost':
          const price = parseFloat(value.replace(/[^0-9.]/g, ''))
          if (!isNaN(price)) product.price = price
          break
        case 'category':
        case 'type':
        case 'product_type':
          product.category = value
          break
        case 'description':
        case 'details':
          product.description = value
          break
        case 'ingredients':
          product.ingredients = value.split(';').map(i => i.trim())
          break
        case 'rating':
        case 'score':
          const rating = parseFloat(value)
          if (!isNaN(rating)) product.rating = rating
          break
        case 'shade':
        case 'shade_name':
        case 'color':
          product.shade_name = value
          break
        case 'hex':
        case 'hex_color':
        case 'color_hex':
          if (value.match(/^#?[0-9a-fA-F]{6}$/)) {
            product.hex_color = value.startsWith('#') ? value : `#${value}`
          }
          break
        case 'undertone':
        case 'undertones':
          if (['cool', 'warm', 'neutral', 'olive'].includes(value.toLowerCase())) {
            product.undertone = value.toLowerCase()
          }
          break
      }
    })
    
    // Only add products with both brand and name
    if (product.brand && product.name) {
      products.push(product)
    }
  }
  
  return products
}

async function importProductsToDatabase(supabase: any, products: CosmeticsProduct[]) {
  let brandsImported = 0
  let productsImported = 0
  let shadesImported = 0
  
  // Group products by brand
  const brandGroups = products.reduce((acc, product) => {
    if (!acc[product.brand]) acc[product.brand] = []
    acc[product.brand].push(product)
    return acc
  }, {} as Record<string, CosmeticsProduct[]>)
  
  for (const [brandName, brandProducts] of Object.entries(brandGroups)) {
    try {
      // Check if brand exists
      let { data: existingBrand } = await supabase
        .from('brands')
        .select('id')
        .eq('name', brandName)
        .single()
      
      let brandId = existingBrand?.id
      
      // Create brand if it doesn't exist
      if (!brandId) {
        const { data: newBrand, error: brandError } = await supabase
          .from('brands')
          .insert({
            name: brandName,
            description: `Imported from Kaggle cosmetics dataset`,
            is_active: true
          })
          .select('id')
          .single()
        
        if (brandError) {
          console.error(`Error creating brand ${brandName}:`, brandError)
          continue
        }
        
        brandId = newBrand.id
        brandsImported++
      }
      
      // Process products for this brand
      for (const product of brandProducts.slice(0, 10)) { // Limit products per brand
        try {
          // Determine if this is a foundation product
          const isFoundation = product.category?.toLowerCase().includes('foundation') ||
                              product.name.toLowerCase().includes('foundation') ||
                              product.product_type?.toLowerCase().includes('foundation')
          
          if (isFoundation) {
            // Check if product exists
            let { data: existingProduct } = await supabase
              .from('foundation_products')
              .select('id')
              .eq('brand_id', brandId)
              .eq('name', product.name)
              .single()
            
            let productId = existingProduct?.id
            
            // Create foundation product if it doesn't exist
            if (!productId) {
              const { data: newProduct, error: productError } = await supabase
                .from('foundation_products')
                .insert({
                  brand_id: brandId,
                  name: product.name,
                  description: product.description,
                  price: product.price,
                  coverage: 'medium', // Default value
                  finish: 'natural', // Default value
                  ingredients: product.ingredients,
                  is_active: true
                })
                .select('id')
                .single()
              
              if (productError) {
                console.error(`Error creating product ${product.name}:`, productError)
                continue
              }
              
              productId = newProduct.id
              productsImported++
            }
            
            // Create shade if we have shade information
            if (product.shade_name && productId) {
              const { error: shadeError } = await supabase
                .from('foundation_shades')
                .insert({
                  product_id: productId,
                  shade_name: product.shade_name,
                  hex_color: product.hex_color,
                  undertone: product.undertone,
                  is_available: true
                })
              
              if (!shadeError) {
                shadesImported++
              }
            }
          }
          
        } catch (productError) {
          console.error(`Error processing product ${product.name}:`, productError)
        }
      }
      
    } catch (brandError) {
      console.error(`Error processing brand ${brandName}:`, brandError)
    }
  }
  
  return {
    brands: brandsImported,
    products: productsImported,
    shades: shadesImported
  }
}