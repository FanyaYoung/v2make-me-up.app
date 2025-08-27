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

interface BulkImportConfig {
  bucketName: string;
  filePatterns: string[];
  targetTables: {
    [filePattern: string]: {
      table: string;
      mapping: { [csvColumn: string]: string };
      requiredFields: string[];
    };
  };
  batchSize?: number;
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
    const { bucketName, importType, dataTypes } = await req.json();
    
    console.log(`Starting bulk GCS import from bucket: ${bucketName}`);
    console.log(`Import type: ${importType}, Data types: ${dataTypes}`);
    
    // Get Google Cloud credentials from environment
    const gcpCredentials = Deno.env.get('GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY');
    if (!gcpCredentials) {
      throw new Error('Google Cloud credentials not found');
    }

    const credentials: GoogleCloudCredentials = JSON.parse(gcpCredentials);
    const token = await getAccessToken(credentials);
    
    let importResults = [];
    
    // Define import configurations for different data types
    const importConfigs: { [key: string]: BulkImportConfig } = {
      foundations: {
        bucketName,
        filePatterns: ['*foundation*', '*base*', '*concealer*'],
        targetTables: {
          '*foundation*': {
            table: 'foundation_products',
            mapping: {
              'brand': 'brand_name',
              'product_name': 'name',
              'shade_name': 'shade',
              'hex_color': 'hex_color',
              'price': 'price',
              'description': 'description',
              'image_url': 'image_url',
              'product_url': 'product_url'
            },
            requiredFields: ['brand_name', 'name']
          }
        },
        batchSize: 100
      },
      cosmetics: {
        bucketName,
        filePatterns: ['*cosmetics*', '*makeup*', '*beauty*'],
        targetTables: {
          '*cosmetics*': {
            table: 'cosmetics_products',
            mapping: {
              'brand': 'brand_name',
              'product_name': 'product_name',
              'category': 'category',
              'price': 'price',
              'rating': 'rating',
              'description': 'description'
            },
            requiredFields: ['brand_name', 'product_name']
          }
        },
        batchSize: 200
      },
      shades: {
        bucketName,
        filePatterns: ['*shade*', '*color*', '*tone*'],
        targetTables: {
          '*shade*': {
            table: 'skin_tone_references',
            mapping: {
              'name': 'name',
              'hex_color': 'hex_color',
              'depth': 'depth',
              'undertone': 'undertone',
              'category': 'category',
              'source': 'source'
            },
            requiredFields: ['name', 'hex_color']
          }
        },
        batchSize: 500
      }
    };
    
    // Process each requested data type
    for (const dataType of dataTypes) {
      if (!importConfigs[dataType]) {
        console.warn(`Unknown data type: ${dataType}`);
        continue;
      }
      
      const config = importConfigs[dataType];
      const result = await processBulkImport(config, token);
      importResults.push({
        dataType,
        ...result
      });
    }
    
    // Create import summary
    const summary = {
      totalFiles: importResults.reduce((sum, r) => sum + r.filesProcessed, 0),
      totalRecords: importResults.reduce((sum, r) => sum + r.recordsImported, 0),
      totalErrors: importResults.reduce((sum, r) => sum + r.errors, 0),
      importResults
    };
    
    // Log the import activity
    await supabase
      .from('user_activity')
      .insert({
        user_id: null, // System activity
        activity_type: 'bulk_gcs_import',
        activity_data: {
          bucket: bucketName,
          import_type: importType,
          data_types: dataTypes,
          summary
        }
      });

    return new Response(JSON.stringify({
      success: true,
      message: `Bulk import completed from ${bucketName}`,
      summary,
      details: importResults
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in bulk-gcs-import function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function processBulkImport(config: BulkImportConfig, token: string): Promise<any> {
  let filesProcessed = 0;
  let recordsImported = 0;
  let errors = 0;
  const processedFiles: string[] = [];
  
  try {
    // List all files in the bucket
    const filesList = await listFiles(config.bucketName, token);
    
    if (!filesList.items) {
      return { filesProcessed: 0, recordsImported: 0, errors: 0, message: 'No files found' };
    }
    
    // Filter files based on patterns
    const relevantFiles = filesList.items.filter((file: any) => 
      config.filePatterns.some(pattern => 
        file.name.toLowerCase().includes(pattern.replace('*', ''))
      )
    );
    
    console.log(`Found ${relevantFiles.length} relevant files for import`);
    
    // Process each file
    for (const file of relevantFiles) {
      try {
        console.log(`Processing file: ${file.name}`);
        
        // Download file content
        const fileData = await downloadFile(config.bucketName, file.name, token);
        const csvContent = new TextDecoder().decode(new Uint8Array(fileData.data));
        
        // Determine which table configuration to use
        let tableConfig = null;
        for (const [pattern, tConfig] of Object.entries(config.targetTables)) {
          if (file.name.toLowerCase().includes(pattern.replace('*', ''))) {
            tableConfig = tConfig;
            break;
          }
        }
        
        if (!tableConfig) {
          console.warn(`No table configuration found for file: ${file.name}`);
          continue;
        }
        
        // Parse CSV and import data
        const records = parseCSVWithMapping(csvContent, tableConfig);
        if (records.length > 0) {
          const importResult = await importRecordsToBatch(records, tableConfig, config.batchSize || 100);
          recordsImported += importResult.imported;
          errors += importResult.errors;
        }
        
        filesProcessed++;
        processedFiles.push(file.name);
        
      } catch (fileError) {
        console.error(`Error processing file ${file.name}:`, fileError);
        errors++;
      }
    }
    
  } catch (error) {
    console.error('Error in bulk import process:', error);
    errors++;
  }
  
  return {
    filesProcessed,
    recordsImported,
    errors,
    processedFiles
  };
}

function parseCSVWithMapping(csvContent: string, tableConfig: any): any[] {
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, '').toLowerCase());
  const records: any[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    try {
      const values = parseCSVLine(lines[i]);
      if (values.length < headers.length) continue;
      
      const record: any = {};
      let hasRequiredFields = true;
      
      // Map CSV columns to target table columns
      headers.forEach((header, index) => {
        const value = values[index]?.trim().replace(/"/g, '');
        if (!value || value === '' || value === 'NULL') return;
        
        const targetField = tableConfig.mapping[header];
        if (targetField) {
          // Handle numeric fields
          if (['price', 'rating', 'total_reviews'].includes(targetField)) {
            const numValue = parseFloat(value.replace(/[$,]/g, ''));
            if (!isNaN(numValue)) record[targetField] = numValue;
          } else {
            record[targetField] = value;
          }
        }
      });
      
      // Check if all required fields are present
      for (const requiredField of tableConfig.requiredFields) {
        if (!record[requiredField]) {
          hasRequiredFields = false;
          break;
        }
      }
      
      if (hasRequiredFields) {
        // Add metadata
        record.created_at = new Date().toISOString();
        record.updated_at = new Date().toISOString();
        records.push(record);
      }
      
    } catch (error) {
      console.warn(`Error parsing line ${i}: ${error.message}`);
    }
  }
  
  return records;
}

async function importRecordsToBatch(records: any[], tableConfig: any, batchSize: number): Promise<any> {
  let imported = 0;
  let errors = 0;
  
  // Process records in batches
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    
    try {
      const { error } = await supabase
        .from(tableConfig.table)
        .upsert(batch, {
          onConflict: tableConfig.table === 'cosmetics_products' ? 'product_name,brand_id' : 
                     tableConfig.table === 'skin_tone_references' ? 'name,source' : 'name'
        });
      
      if (error) {
        console.error(`Batch import error for ${tableConfig.table}:`, error);
        errors += batch.length;
      } else {
        imported += batch.length;
        console.log(`Imported batch of ${batch.length} records to ${tableConfig.table}`);
      }
    } catch (error) {
      console.error(`Error importing batch to ${tableConfig.table}:`, error);
      errors += batch.length;
    }
  }
  
  return { imported, errors };
}

// Helper functions
async function getAccessToken(credentials: GoogleCloudCredentials): Promise<string> {
  const scope = 'https://www.googleapis.com/auth/cloud-platform';
  
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