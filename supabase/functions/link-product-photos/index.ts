import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { photoBucket, photoPrefix = '', datasetName } = await req.json();

    if (!photoBucket || !datasetName) {
      throw new Error('Missing required parameters: photoBucket, datasetName');
    }

    // Get Google Cloud credentials
    const credentialsJson = Deno.env.get('GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY');
    if (!credentialsJson) {
      throw new Error('Google Cloud credentials not configured');
    }

    const credentials: GoogleCloudCredentials = JSON.parse(credentialsJson);
    const accessToken = await getAccessToken(credentials);

    // Get all photos from GCS bucket
    const photos = await listFiles(photoBucket, accessToken, photoPrefix);
    console.log(`Found ${photos.length} photos in bucket`);

    // Get products from the specified dataset
    const { data: products, error: productsError } = await supabase
      .from('cosmetics_products')
      .select('id, product_name, brand_id, brands(name)')
      .eq('dataset_name', datasetName);

    if (productsError) {
      throw new Error(`Failed to fetch products: ${productsError.message}`);
    }

    console.log(`Found ${products.length} products to process`);

    let photosLinked = 0;
    const errors: string[] = [];

    // Link photos to products
    for (const product of products) {
      try {
        const brandName = product.brands?.name?.toLowerCase().replace(/\s+/g, '-') || '';
        const productName = product.product_name?.toLowerCase().replace(/\s+/g, '-') || '';
        
        // Find matching photos
        const matchingPhotos = photos.filter(photo => {
          const fileName = photo.name.toLowerCase();
          
          // Multiple matching strategies
          return (
            // Exact brand-product match
            fileName.includes(`${brandName}_${productName}`) ||
            fileName.includes(`${brandName}-${productName}`) ||
            // Brand and product in filename
            (fileName.includes(brandName) && fileName.includes(productName)) ||
            // Product name match
            fileName.includes(productName) ||
            // Fuzzy matching for similar names
            (brandName.length > 3 && fileName.includes(brandName.substring(0, -1))) &&
            (productName.length > 3 && fileName.includes(productName.substring(0, -1)))
          );
        });

        if (matchingPhotos.length > 0) {
          // Use the first matching photo
          const photoFile = matchingPhotos[0];
          const imageUrl = `https://storage.googleapis.com/${photoBucket}/${photoFile.name}`;
          
          // Update the product with the image URL
          const { error: updateError } = await supabase
            .from('cosmetics_products')
            .update({ image_url: imageUrl })
            .eq('id', product.id);

          if (updateError) {
            errors.push(`Failed to update product ${product.product_name}: ${updateError.message}`);
          } else {
            photosLinked++;
            console.log(`Linked photo to ${product.product_name}: ${photoFile.name}`);
          }
        }
      } catch (error) {
        errors.push(`Error processing product ${product.product_name}: ${error.message}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        photosLinked,
        totalPhotos: photos.length,
        totalProducts: products.length,
        errors: errors.slice(0, 10) // Limit errors in response
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in link-product-photos function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

async function getAccessToken(credentials: GoogleCloudCredentials): Promise<string> {
  const jwtHeader = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const jwtPayload = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const jwtHeaderEncoded = btoa(JSON.stringify(jwtHeader)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const jwtPayloadEncoded = btoa(JSON.stringify(jwtPayload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const jwtData = `${jwtHeaderEncoded}.${jwtPayloadEncoded}`;
  
  // Import the private key
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    new TextEncoder().encode(credentials.private_key.replace(/\\n/g, '\n')),
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  );

  // Sign the JWT
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    new TextEncoder().encode(jwtData)
  );

  const jwtSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const jwt = `${jwtData}.${jwtSignature}`;

  // Exchange JWT for access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!tokenResponse.ok) {
    throw new Error(`Failed to get access token: ${tokenResponse.statusText}`);
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

async function listFiles(bucketName: string, token: string, prefix?: string): Promise<any[]> {
  const url = new URL(`https://storage.googleapis.com/storage/v1/b/${bucketName}/o`);
  if (prefix) {
    url.searchParams.append('prefix', prefix);
  }
  url.searchParams.append('maxResults', '1000');

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to list files: ${response.statusText}`);
  }

  const data = await response.json();
  return data.items || [];
}