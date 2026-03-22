import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import CosmeticsBrowser from '../components/CosmeticsBrowser';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, Database, TrendingUp, Package } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';

const CosmeticsLibrary = () => {
  const [isImporting, setIsImporting] = useState(false);
  const [totalStats, setTotalStats] = useState({
    totalProducts: 0,
    totalBrands: 0,
    totalCategories: 0,
  });

  useEffect(() => {
    const parseCsvRow = (row: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < row.length; i++) {
        const ch = row[i];
        const next = row[i + 1];
        if (ch === '"' && inQuotes && next === '"') {
          current += '"';
          i++;
          continue;
        }
        if (ch === '"') {
          inQuotes = !inQuotes;
          continue;
        }
        if (ch === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
          continue;
        }
        current += ch;
      }
      result.push(current.trim());
      return result;
    };

    const loadStats = async () => {
      try {
        const response = await fetch('/data/output.csv');
        const csvText = await response.text();
        const lines = csvText.trim().split('\n');
        const headers = parseCsvRow(lines[0]).map(h => h.toLowerCase());
        const brandIdx = headers.indexOf('brand');
        const typeIdx = headers.indexOf('product_type');

        const brands = new Set<string>();
        const categories = new Set<string>();

        lines.slice(1).forEach(line => {
          const parts = parseCsvRow(line);
          const brand = (parts[brandIdx] || '').trim();
          const productType = (parts[typeIdx] || '').trim();
          if (brand) brands.add(brand);
          if (productType) categories.add(productType);
        });

        setTotalStats({
          totalProducts: Math.max(0, lines.length - 1),
          totalBrands: brands.size,
          totalCategories: categories.size,
        });
      } catch (error) {
        console.error('Failed to load browse stats', error);
      }
    };

    loadStats();
  }, []);

  const handleImport = async () => {
    setIsImporting(true);
    try {
      toast({
        title: "Dataset Ready",
        description: "Product data is loaded from local dataset and available now.",
      });
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import products",
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
                {totalStats.totalProducts.toLocaleString()}
              </div>
              <p className="text-sm text-gray-600">Products</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-0">
            <CardContent className="p-6">
              <TrendingUp className="h-8 w-8 text-purple-600 mb-2" />
              <div className="text-3xl font-bold text-gray-800">{totalStats.totalBrands}</div>
              <p className="text-sm text-gray-600">Brands</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-pink-50 to-rose-50 border-0">
            <CardContent className="p-6">
              <Database className="h-8 w-8 text-pink-600 mb-2" />
              <div className="text-3xl font-bold text-gray-800">{totalStats.totalCategories}</div>
              <p className="text-sm text-gray-600">Categories</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-0">
            <CardContent className="p-6">
              <Download className="h-8 w-8 text-indigo-600 mb-2" />
              <div className="space-y-2">
                <Button 
                  onClick={handleImport}
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

        {/* Cosmetics Browser */}
        <CosmeticsBrowser />
      </div>
      
      <Toaster />
    </div>
  );
};

export default CosmeticsLibrary;
