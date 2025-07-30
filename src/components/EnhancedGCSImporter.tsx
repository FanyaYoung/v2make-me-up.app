import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Upload, Database, Image, Loader2, CheckCircle, XCircle } from 'lucide-react';
import GCSProductPhotoBrowser from './GCSProductPhotoBrowser';

interface ImportStats {
  brandsCreated: number;
  brandsUpdated: number;
  productsCreated: number;
  productsUpdated: number;
  photosLinked: number;
  errors: string[];
}

const EnhancedGCSImporter = () => {
  const [bucketName, setBucketName] = useState('makeup-cosmetics-dataset');
  const [photoBucket, setPhotoBucket] = useState('makeup-product-photos');
  const [csvFilePath, setCsvFilePath] = useState('cosmetics_dataset.csv');
  const [datasetName, setDatasetName] = useState('GCS Import');
  const [linkPhotos, setLinkPhotos] = useState(true);
  const [photoPrefix, setPhotoPrefix] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importStats, setImportStats] = useState<ImportStats | null>(null);

  const handleImport = async () => {
    if (!bucketName || !csvFilePath || !datasetName) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsImporting(true);
    setImportProgress(0);
    setImportStats(null);

    try {
      // Step 1: Import CSV data
      setImportProgress(25);
      const { data: importData, error: importError } = await supabase.functions.invoke('import-gcs-dataset', {
        body: {
          bucketName,
          filePath: csvFilePath,
          datasetName
        }
      });

      if (importError) throw importError;

      setImportProgress(50);

      // Step 2: Link photos if enabled
      let photosLinked = 0;
      if (linkPhotos) {
        setImportProgress(75);
        const { data: linkData, error: linkError } = await supabase.functions.invoke('link-product-photos', {
          body: {
            photoBucket,
            photoPrefix,
            datasetName
          }
        });

        if (linkError) {
          console.warn('Photo linking failed:', linkError);
          toast.warning('Products imported but photo linking failed');
        } else {
          photosLinked = linkData?.photosLinked || 0;
        }
      }

      setImportProgress(100);

      const stats: ImportStats = {
        brandsCreated: importData?.brandsCreated || 0,
        brandsUpdated: importData?.brandsUpdated || 0,
        productsCreated: importData?.productsCreated || 0,
        productsUpdated: importData?.productsUpdated || 0,
        photosLinked,
        errors: importData?.errors || []
      };

      setImportStats(stats);
      toast.success(`Import completed! ${stats.productsCreated + stats.productsUpdated} products processed, ${photosLinked} photos linked`);
    } catch (error) {
      console.error('Import failed:', error);
      toast.error(`Import failed: ${error.message}`);
    } finally {
      setIsImporting(false);
      setImportProgress(0);
    }
  };

  const handleRefreshTypes = async () => {
    try {
      const { error } = await supabase.rpc('get_cosmetics_import_stats');
      if (error) throw error;
      toast.success('Database types refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh types');
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="import" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="import" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Import Data
          </TabsTrigger>
          <TabsTrigger value="photos" className="flex items-center gap-2">
            <Image className="w-4 h-4" />
            Browse Photos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Enhanced GCS Data Import
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bucketName">CSV Data Bucket Name *</Label>
                  <Input
                    id="bucketName"
                    value={bucketName}
                    onChange={(e) => setBucketName(e.target.value)}
                    placeholder="makeup-cosmetics-dataset"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="csvFilePath">CSV File Path *</Label>
                  <Input
                    id="csvFilePath"
                    value={csvFilePath}
                    onChange={(e) => setCsvFilePath(e.target.value)}
                    placeholder="cosmetics_dataset.csv"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="datasetName">Dataset Name *</Label>
                <Input
                  id="datasetName"
                  value={datasetName}
                  onChange={(e) => setDatasetName(e.target.value)}
                  placeholder="GCS Import"
                />
              </div>

              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">Link Product Photos</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically link photos from GCS to imported products
                    </p>
                  </div>
                  <Switch
                    checked={linkPhotos}
                    onCheckedChange={setLinkPhotos}
                  />
                </div>

                {linkPhotos && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                    <div className="space-y-2">
                      <Label htmlFor="photoBucket">Photo Bucket Name</Label>
                      <Input
                        id="photoBucket"
                        value={photoBucket}
                        onChange={(e) => setPhotoBucket(e.target.value)}
                        placeholder="makeup-product-photos"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="photoPrefix">Photo Prefix (Optional)</Label>
                      <Input
                        id="photoPrefix"
                        value={photoPrefix}
                        onChange={(e) => setPhotoPrefix(e.target.value)}
                        placeholder="foundations/"
                      />
                    </div>
                  </div>
                )}
              </div>

              {isImporting && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Import Progress</span>
                    <span>{importProgress}%</span>
                  </div>
                  <Progress value={importProgress} className="w-full" />
                </div>
              )}

              <div className="flex gap-4">
                <Button 
                  onClick={handleImport} 
                  disabled={isImporting}
                  className="flex-1"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Import Dataset
                    </>
                  )}
                </Button>
                <Button onClick={handleRefreshTypes} variant="outline">
                  Refresh Types
                </Button>
              </div>
            </CardContent>
          </Card>

          {importStats && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Import Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{importStats.brandsCreated}</div>
                    <div className="text-sm text-muted-foreground">Brands Created</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{importStats.brandsUpdated}</div>
                    <div className="text-sm text-muted-foreground">Brands Updated</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{importStats.productsCreated}</div>
                    <div className="text-sm text-muted-foreground">Products Created</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{importStats.productsUpdated}</div>
                    <div className="text-sm text-muted-foreground">Products Updated</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{importStats.photosLinked}</div>
                    <div className="text-sm text-muted-foreground">Photos Linked</div>
                  </div>
                </div>

                {importStats.errors.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h4 className="font-medium text-red-600 flex items-center gap-2">
                      <XCircle className="w-4 h-4" />
                      Errors ({importStats.errors.length})
                    </h4>
                    <div className="space-y-1">
                      {importStats.errors.slice(0, 5).map((error, index) => (
                        <Badge key={index} variant="destructive" className="block text-xs">
                          {error}
                        </Badge>
                      ))}
                      {importStats.errors.length > 5 && (
                        <Badge variant="outline">
                          +{importStats.errors.length - 5} more errors
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="photos" className="space-y-6">
          <GCSProductPhotoBrowser 
            bucketName={photoBucket}
            onPhotoSelect={(url, fileName) => {
              toast.success(`Selected photo: ${fileName}`);
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedGCSImporter;