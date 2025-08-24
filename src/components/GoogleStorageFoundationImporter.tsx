import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, Download, Database, Cloud } from 'lucide-react';

interface ImportStats {
  brands_created: number;
  brands_updated: number;
  products_created: number;
  products_updated: number;
  errors: string[];
}

const GoogleStorageFoundationImporter = () => {
  const [isImporting, setIsImporting] = useState(false);
  const [bucketName, setBucketName] = useState('make-me-up-app');
  const [filePath, setFilePath] = useState('foundation_products.csv');
  const [datasetName, setDatasetName] = useState('foundation-gcs-import');
  const [importStats, setImportStats] = useState<ImportStats | null>(null);
  const { toast } = useToast();

  const handleImport = async () => {
    if (!bucketName || !filePath) {
      toast({
        title: "Missing Information",
        description: "Please provide both bucket name and file path",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    setImportStats(null);

    try {
      const { data, error } = await supabase.functions.invoke('import-gcs-dataset', {
        body: {
          bucketName,
          filePath,
          datasetName
        }
      });

      if (error) {
        throw error;
      }

      setImportStats(data);
      
      toast({
        title: "Import Completed",
        description: `Successfully imported ${data.products_created} new products and ${data.products_updated} updated products`,
      });

    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import foundation products",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleRefreshTypes = async () => {
    try {
      // Query to refresh the types
      await supabase.rpc('get_cosmetics_import_stats');
      
      toast({
        title: "Types Refreshed",
        description: "Database types have been refreshed successfully",
      });
    } catch (error) {
      console.error('Refresh error:', error);
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh database types",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="w-5 h-5" />
            Google Storage Foundation Importer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="bucket">GCS Bucket Name</Label>
              <Input
                id="bucket"
                value={bucketName}
                onChange={(e) => setBucketName(e.target.value)}
                placeholder="e.g., make-me-up-app"
              />
            </div>
            
            <div>
              <Label htmlFor="filepath">File Path</Label>
              <Input
                id="filepath"
                value={filePath}
                onChange={(e) => setFilePath(e.target.value)}
                placeholder="e.g., foundation_products.csv"
              />
            </div>
            
            <div>
              <Label htmlFor="dataset">Dataset Name</Label>
              <Input
                id="dataset"
                value={datasetName}
                onChange={(e) => setDatasetName(e.target.value)}
                placeholder="e.g., foundation-gcs-import"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <Button 
              onClick={handleImport}
              disabled={isImporting || !bucketName || !filePath}
              className="flex items-center gap-2"
            >
              {isImporting ? (
                <>
                  <Upload className="w-4 h-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Import Foundation Products
                </>
              )}
            </Button>

            <Button 
              variant="outline"
              onClick={handleRefreshTypes}
              className="flex items-center gap-2"
            >
              <Database className="w-4 h-4" />
              Refresh Types
            </Button>
          </div>

          {importStats && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Import Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {importStats.brands_created}
                    </div>
                    <div className="text-sm text-green-700">Brands Created</div>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {importStats.brands_updated}
                    </div>
                    <div className="text-sm text-blue-700">Brands Updated</div>
                  </div>
                  
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {importStats.products_created}
                    </div>
                    <div className="text-sm text-purple-700">Products Created</div>
                  </div>
                  
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {importStats.products_updated}
                    </div>
                    <div className="text-sm text-orange-700">Products Updated</div>
                  </div>
                </div>

                {importStats.errors && importStats.errors.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-red-700 mb-2">Import Errors:</h4>
                    <div className="bg-red-50 p-3 rounded-lg">
                      {importStats.errors.map((error, index) => (
                        <div key={index} className="text-sm text-red-600">
                          {error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-blue-800 mb-2">CSV Format Expected:</h4>
            <div className="text-sm text-blue-700">
              <p>Required columns: brand, product_name, price</p>
              <p>Optional columns: description, shade_name, hex_color, undertone, coverage, finish, image_url, product_url</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GoogleStorageFoundationImporter;