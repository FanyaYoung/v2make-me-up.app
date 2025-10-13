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
        <div className="relative rounded-3xl overflow-hidden mb-8 h-[400px]">
          <img 
            src="/lovable-uploads/85b7b25a-dc58-4496-afbd-3d128c5bce59.png"
            alt="Cosmetics library model"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-end">
            <div className="p-8 text-white max-w-2xl">
              <Badge className="mb-4 bg-white/20 text-white border-0">
                Beauty Products
              </Badge>
              <h1 className="text-5xl font-bold mb-3">Browse Makeup</h1>
              <p className="text-xl text-gray-200">
                Ulta · Sephora · Macy's & more
              </p>
            </div>
          </div>
        </div>
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-rose-50 to-pink-50 border-0">
            <CardContent className="p-6">
              <Package className="h-8 w-8 text-rose-600 mb-2" />
              <div className="text-3xl font-bold text-gray-800">
                {totalStats ? (totalStats.total_cosmetics + totalStats.total_foundations).toLocaleString() : '0'}
              </div>
              <p className="text-sm text-gray-600">Products</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-0">
            <CardContent className="p-6">
              <TrendingUp className="h-8 w-8 text-purple-600 mb-2" />
              <div className="text-3xl font-bold text-gray-800">{totalStats?.total_brands || 0}</div>
              <p className="text-sm text-gray-600">Brands</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-pink-50 to-rose-50 border-0">
            <CardContent className="p-6">
              <Database className="h-8 w-8 text-pink-600 mb-2" />
              <div className="text-3xl font-bold text-gray-800">{importStats?.length || 0}</div>
              <p className="text-sm text-gray-600">Datasets</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-0">
            <CardContent className="p-6">
              <Download className="h-8 w-8 text-indigo-600 mb-2" />
              <div className="space-y-2">
                <Button 
                  onClick={handleImportFromKaggle}
                  disabled={isImporting}
                  className="w-full"
                  size="sm"
                  variant="outline"
                >
                  Import
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Import Statistics - Condensed */}
        {importStats && importStats.length > 0 && (
          <div className="mb-8 flex gap-3 overflow-x-auto pb-2">
            {importStats.map((stat: any, index: number) => (
              <div key={index} className="flex-shrink-0 bg-white rounded-lg p-4 border border-gray-200 min-w-[200px]">
                <Badge variant="outline" className="mb-2">{stat.dataset_name}</Badge>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="font-semibold">{stat.total_products}</span> items</div>
                  <div><span className="font-semibold">{stat.brands_count}</span> brands</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Cosmetics Browser */}
        <CosmeticsBrowser />
      </div>
      
      <Toaster />
    </div>
  );
};

export default CosmeticsLibrary;