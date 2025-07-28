import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GoogleCloudCredentials {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

interface CosmeticsProduct {
  brand: string;
  product_name: string;
  category: string;
  subcategory?: string;
  price?: number;
  rating?: number;
  total_reviews?: number;
  description?: string;
  ingredients?: string;
  image_url?: string;
  product_url?: string;
  product_type?: string;
  metadata?: any;
  dataset_name: string;
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bucketName, filePath, datasetName } = await req.json();
    
    console.log(`Starting dataset import from GCS: ${bucketName}/${filePath}`);
    
    // Get Google Cloud credentials from environment
    const gcpCredentials = Deno.env.get('GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY');
    if (!gcpCredentials) {
      throw new Error('Google Cloud credentials not found');
    }

    const credentials: GoogleCloudCredentials = JSON.parse(gcpCredentials);
    
    // Get OAuth token for Google Cloud Storage API
    const token = await getAccessToken(credentials);
    
    // Download the dataset file from GCS
    const fileData = await downloadFile(bucketName, filePath, token);
    
    // Parse the CSV data
    const csvContent = new TextDecoder().decode(new Uint8Array(fileData.data));
    const products = parseCSVToProducts(csvContent, datasetName);
    
    console.log(`Parsed ${products.length} products from dataset`);
    
    // Import products to database
    const importStats = await importProductsToDatabase(products);
    
    return new Response(JSON.stringify({
      success: true,
      message: `Successfully imported dataset from ${bucketName}/${filePath}`,
      stats: importStats
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in import-gcs-dataset function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function getAccessToken(credentials: GoogleCloudCredentials): Promise<string> {
  const scope = 'https://www.googleapis.com/auth/cloud-platform';
  
  // Create JWT assertion
  const header = {
    alg: 'RS256',
    typ: 'JWT'
  };
  
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: credentials.client_email,
    scope: scope,
    aud: credentials.token_uri,
    exp: now + 3600,
    iat: now
  };
  
  // For production, you would properly sign the JWT with the private key
  // This is a simplified version for demonstration
  const assertion = btoa(JSON.stringify(header)) + '.' + btoa(JSON.stringify(payload));
  
  const response = await fetch(credentials.token_uri, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: assertion
    })
  });
  
  const tokenData = await response.json();
  return tokenData.access_token;
}

async function downloadFile(bucketName: string, fileName: string, token: string): Promise<any> {
  const url = `https://storage.googleapis.com/storage/v1/b/${bucketName}/o/${encodeURIComponent(fileName)}?alt=media`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.statusText}`);
  }
  
  const data = await response.arrayBuffer();
  return {
    fileName,
    data: Array.from(new Uint8Array(data)),
    contentType: response.headers.get('content-type')
  };
}

function parseCSVToProducts(csvContent: string, datasetName: string): CosmeticsProduct[] {
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const products: CosmeticsProduct[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    try {
      const values = parseCSVLine(lines[i]);
      if (values.length < headers.length) continue;
      
      const product: CosmeticsProduct = {
        brand: '',
        product_name: '',
        category: '',
        dataset_name: datasetName
      };
      
      // Map CSV columns to product fields
      headers.forEach((header, index) => {
        const value = values[index]?.trim().replace(/"/g, '');
        if (!value || value === '' || value === 'NULL') return;
        
        switch (header.toLowerCase()) {
          case 'brand':
          case 'brand_name':
            product.brand = value;
            break;
          case 'product_name':
          case 'name':
          case 'title':
            product.product_name = value;
            break;
          case 'category':
          case 'product_category':
            product.category = value;
            break;
          case 'subcategory':
          case 'sub_category':
            product.subcategory = value;
            break;
          case 'price':
            const priceNum = parseFloat(value.replace(/[$,]/g, ''));
            if (!isNaN(priceNum)) product.price = priceNum;
            break;
          case 'rating':
          case 'average_rating':
            const ratingNum = parseFloat(value);
            if (!isNaN(ratingNum)) product.rating = ratingNum;
            break;
          case 'total_reviews':
          case 'num_reviews':
          case 'review_count':
            const reviewsNum = parseInt(value);
            if (!isNaN(reviewsNum)) product.total_reviews = reviewsNum;
            break;
          case 'description':
            product.description = value;
            break;
          case 'ingredients':
            product.ingredients = value;
            break;
          case 'image_url':
          case 'image':
            product.image_url = value;
            break;
          case 'product_url':
          case 'url':
            product.product_url = value;
            break;
          case 'product_type':
          case 'type':
            product.product_type = value;
            break;
          default:
            // Store other fields in metadata
            if (!product.metadata) product.metadata = {};
            product.metadata[header] = value;
        }
      });
      
      // Only add products with required fields
      if (product.brand && product.product_name) {
        products.push(product);
      }
    } catch (error) {
      console.warn(`Error parsing line ${i}: ${error.message}`);
    }
  }
  
  return products;
}

function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  values.push(current);
  return values;
}

async function importProductsToDatabase(products: CosmeticsProduct[]): Promise<any> {
  let brandCreated = 0;
  let productsCreated = 0;
  let productsUpdated = 0;
  let errors = 0;
  
  // Group products by brand
  const brandGroups = new Map<string, CosmeticsProduct[]>();
  products.forEach(product => {
    const brandName = product.brand.toLowerCase();
    if (!brandGroups.has(brandName)) {
      brandGroups.set(brandName, []);
    }
    brandGroups.get(brandName)!.push(product);
  });
  
  // Process each brand
  for (const [brandName, brandProducts] of brandGroups) {
    try {
      // Check if brand exists
      const { data: existingBrand } = await supabase
        .from('brands')
        .select('id')
        .ilike('name', brandName)
        .single();
      
      let brandId = existingBrand?.id;
      
      // Create brand if it doesn't exist
      if (!brandId) {
        const { data: newBrand, error } = await supabase
          .from('brands')
          .insert([{
            name: brandProducts[0].brand,
            is_active: true
          }])
          .select('id')
          .single();
        
        if (error) {
          console.error(`Error creating brand ${brandName}:`, error);
          errors++;
          continue;
        }
        
        brandId = newBrand.id;
        brandCreated++;
      }
      
      // Import products for this brand
      for (const product of brandProducts) {
        try {
          const productData = {
            brand_id: brandId,
            product_name: product.product_name,
            category: product.category || 'cosmetics',
            subcategory: product.subcategory,
            price: product.price,
            rating: product.rating,
            total_reviews: product.total_reviews,
            description: product.description,
            ingredients: product.ingredients,
            image_url: product.image_url,
            product_url: product.product_url,
            product_type: product.product_type,
            metadata: product.metadata || {},
            dataset_name: product.dataset_name
          };
          
          // Check if product already exists
          const { data: existingProduct } = await supabase
            .from('cosmetics_products')
            .select('id')
            .eq('brand_id', brandId)
            .ilike('product_name', product.product_name)
            .single();
          
          if (existingProduct) {
            // Update existing product
            const { error } = await supabase
              .from('cosmetics_products')
              .update(productData)
              .eq('id', existingProduct.id);
            
            if (error) {
              console.error(`Error updating product ${product.product_name}:`, error);
              errors++;
            } else {
              productsUpdated++;
            }
          } else {
            // Create new product
            const { error } = await supabase
              .from('cosmetics_products')
              .insert([productData]);
            
            if (error) {
              console.error(`Error creating product ${product.product_name}:`, error);
              errors++;
            } else {
              productsCreated++;
            }
          }
        } catch (error) {
          console.error(`Error processing product ${product.product_name}:`, error);
          errors++;
        }
      }
    } catch (error) {
      console.error(`Error processing brand ${brandName}:`, error);
      errors++;
    }
  }
  
  return {
    brandCreated,
    productsCreated,
    productsUpdated,
    errors,
    totalProcessed: products.length
  };
}