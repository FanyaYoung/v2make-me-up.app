import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Header from '../components/Header';
import CosmeticsBrowser from '../components/CosmeticsBrowser';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, Database, TrendingUp, Package } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';

const CosmeticsLibrary = () => {
  const [isImporting, setIsImporting] = useState(false);

  // Get import statistics
  const { data: importStats, refetch: refetchStats } = useQuery({
    queryKey: ['cosmetics-import-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_cosmetics_import_stats');
      if (error) throw error;
      return data;
    },
  });

  // Get total products count
  const { data: totalStats } = useQuery({
    queryKey: ['cosmetics-total-stats'],
    queryFn: async () => {
      const [
        { count: cosmeticsCount },
        { count: foundationCount },
        { count: brandsCount }
      ] = await Promise.all([
        supabase.from('cosmetics_products').select('*', { count: 'exact', head: true }),
        supabase.from('foundation_products').select('*', { count: 'exact', head: true }),
        supabase.from('brands').select('*', { count: 'exact', head: true })
      ]);

      return {
        total_cosmetics: cosmeticsCount || 0,
        total_foundations: foundationCount || 0,
        total_brands: brandsCount || 0
      };
    },
  });

  const handleImportFromKaggle = async () => {
    setIsImporting(true);
    try {
      toast({
        title: "Import Started",
        description: "Importing cosmetics datasets from Kaggle. This may take a few minutes...",
      });

      const { data, error } = await supabase.functions.invoke('import-kaggle-cosmetics', {
        body: { source: 'manual_trigger' }
      });

      if (error) throw error;

      toast({
        title: "Import Successful",
        description: `Imported ${data.stats?.products_imported || 0} products from ${data.stats?.datasets_processed || 0} datasets`,
      });

      // Refetch statistics
      refetchStats();
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import data from Kaggle",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportFromGigasheet = async () => {
    setIsImporting(true);
    try {
      toast({
        title: "Import Started",
        description: "Importing cosmetics data from Gigasheet dataset...",
      });

      const { data, error } = await supabase.functions.invoke('import-gigasheet-cosmetics');

      if (error) throw error;

      toast({
        title: "Import Successful",
        description: `Imported ${data.imported_products || 0} products from Gigasheet dataset`,
      });

      // Refetch statistics
      refetchStats();
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import data from Gigasheet",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Hero Image Section */}
        <div className="relative rounded-lg overflow-hidden mb-8 max-w-4xl mx-auto">
          <img 
            src="/lovable-uploads/85b7b25a-dc58-4496-afbd-3d128c5bce59.png"
            alt="Cosmetics library model"
            className="w-full h-64 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
            <div className="p-6 text-white">
              <h1 className="text-4xl font-bold mb-2">Cosmetics Library</h1>
              <p className="text-lg text-gray-200">
                Explore thousands of beauty products from top brands
              </p>
            </div>
          </div>
        </div>
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalStats ? (totalStats.total_cosmetics + totalStats.total_foundations).toLocaleString() : '0'}
              </div>
              <p className="text-xs text-muted-foreground">
                {totalStats?.total_cosmetics} cosmetics + {totalStats?.total_foundations} foundations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Brands</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStats?.total_brands || 0}</div>
              <p className="text-xs text-muted-foreground">Active brands</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Datasets</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {importStats?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground">Imported from Kaggle</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Import Data</CardTitle>
              <Download className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                onClick={handleImportFromKaggle}
                disabled={isImporting}
                className="w-full"
                size="sm"
              >
                {isImporting ? 'Importing...' : 'Import from Kaggle'}
              </Button>
              <Button 
                onClick={handleImportFromGigasheet}
                disabled={isImporting}
                className="w-full"
                size="sm"
                variant="outline"
              >
                {isImporting ? 'Importing...' : 'Import from Gigasheet'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Import Statistics */}
        {importStats && importStats.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Dataset Import Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {importStats.map((stat: any, index: number) => (
                  <div key={index} className="space-y-2 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{stat.dataset_name}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Products: <span className="font-semibold">{stat.total_products}</span></div>
                      <div>Brands: <span className="font-semibold">{stat.brands_count}</span></div>
                      <div>Avg Price: <span className="font-semibold">${stat.avg_price?.toFixed(2) || 'N/A'}</span></div>
                      <div>Avg Rating: <span className="font-semibold">{stat.avg_rating?.toFixed(1) || 'N/A'}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Alert */}
        <Alert className="mb-8">
          <Database className="h-4 w-4" />
          <AlertDescription>
            This cosmetics library contains products imported from multiple Kaggle datasets, including foundations, lipsticks, eyeshadows, and more makeup products from major beauty brands worldwide.
          </AlertDescription>
        </Alert>

        {/* Cosmetics Browser */}
        <CosmeticsBrowser />
      </div>
      
      <Toaster />
    </div>
  );
};

export default CosmeticsLibrary;