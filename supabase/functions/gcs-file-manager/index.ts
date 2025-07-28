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

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, bucketName, fileName, filePath, uploadData } = await req.json();
    
    // Get Google Cloud credentials from environment
    const gcpCredentials = Deno.env.get('GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY');
    if (!gcpCredentials) {
      throw new Error('Google Cloud credentials not found');
    }

    const credentials: GoogleCloudCredentials = JSON.parse(gcpCredentials);
    
    // Get OAuth token for Google Cloud Storage API
    const token = await getAccessToken(credentials);
    
    let result;
    
    switch (action) {
      case 'list':
        result = await listFiles(bucketName, token, filePath);
        break;
      case 'upload':
        result = await uploadFile(bucketName, fileName, uploadData, token);
        break;
      case 'download':
        result = await downloadFile(bucketName, fileName, token);
        break;
      case 'delete':
        result = await deleteFile(bucketName, fileName, token);
        break;
      default:
        throw new Error('Invalid action specified');
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in gcs-file-manager function:', error);
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

async function listFiles(bucketName: string, token: string, prefix?: string): Promise<any> {
  const url = `https://storage.googleapis.com/storage/v1/b/${bucketName}/o${prefix ? `?prefix=${prefix}` : ''}`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  return await response.json();
}

async function uploadFile(bucketName: string, fileName: string, data: string, token: string): Promise<any> {
  const url = `https://storage.googleapis.com/upload/storage/v1/b/${bucketName}/o?uploadType=media&name=${encodeURIComponent(fileName)}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/octet-stream',
    },
    body: data,
  });
  
  return await response.json();
}

async function downloadFile(bucketName: string, fileName: string, token: string): Promise<any> {
  const url = `https://storage.googleapis.com/storage/v1/b/${bucketName}/o/${encodeURIComponent(fileName)}?alt=media`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  const data = await response.arrayBuffer();
  return {
    fileName,
    data: Array.from(new Uint8Array(data)),
    contentType: response.headers.get('content-type')
  };
}

async function deleteFile(bucketName: string, fileName: string, token: string): Promise<any> {
  const url = `https://storage.googleapis.com/storage/v1/b/${bucketName}/o/${encodeURIComponent(fileName)}`;
  
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  return { success: response.ok, status: response.status };
}