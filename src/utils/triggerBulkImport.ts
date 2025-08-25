import { supabase } from '@/integrations/supabase/client';

export const triggerBulkGCSImport = async () => {
  try {
    console.log('Starting bulk GCS import...');
    
    const { data, error } = await supabase.functions.invoke('bulk-gcs-import', {
      body: {
        bucketName: 'make-me-up-app',
        importType: 'bulk',
        dataTypes: ['foundations', 'cosmetics', 'shades']
      }
    });

    if (error) {
      throw error;
    }

    console.log('Bulk import completed successfully:', data);
    return data;
  } catch (error) {
    console.error('Bulk import failed:', error);
    throw error;
  }
};

// Auto-trigger the import
triggerBulkGCSImport()
  .then((result) => {
    console.log('Import triggered successfully:', result);
  })
  .catch((error) => {
    console.error('Failed to trigger import:', error);
  });