import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Package, Palette } from 'lucide-react';
import { generateRealisticFleshTone } from '@/lib/fleshToneColorWheel';

interface FoundationShade {
  id: string;
  shade_name: string;
  shade_code?: string;
  hex_color?: string;
  depth_level?: number;
  undertone?: string;
}

interface FoundationProduct {
  id: string;
  name?: string;
  product_name?: string;
  price?: number;
  image_url?: string;
  coverage?: string;
  finish?: string;
  description?: string;
  metadata?: any;
  foundation_shades?: FoundationShade[];
}

interface BrandData {
  id: string;
  name: string;
  logo_url?: string;
  brand_tier?: string;
  foundation_products: FoundationProduct[];
  cosmetics_products: FoundationProduct[];
}

const FoundationBrandChart = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');

  // Fetch all brands with their foundation products and shades
  const { data: brandsData, isLoading } = useQuery({
    queryKey: ['foundation-brand-chart'],
    queryFn: async () => {
      // Get brands with foundation products
      const { data: foundationBrands, error: foundationError } = await supabase
        .from('brands')
        .select(`
          id,
          name,
          logo_url,
          brand_tier,
          foundation_products!inner(
            id,
            name,
            price,
            image_url,
            coverage,
            finish,
            description,
            foundation_shades(
              id,
              shade_name,
              shade_code,
              hex_color,
              depth_level,
              undertone
            )
          )
        `)
        .eq('foundation_products.is_active', true)
        .order('name');

      // Get brands with cosmetics products (foundations)
      const { data: cosmeticsBrands, error: cosmeticsError } = await supabase
        .from('brands')
        .select(`
          id,
          name,
          logo_url,
          brand_tier,
          cosmetics_products!inner(
            id,
            product_name,
            price,
            image_url,
            description,
            metadata
          )
        `)
        .eq('cosmetics_products.product_type', 'foundation')
        .order('name');

      if (foundationError) console.error('Foundation brands error:', foundationError);
      if (cosmeticsError) console.error('Cosmetics brands error:', cosmeticsError);

      // Merge and organize the data
      const brandMap = new Map<string, BrandData>();

      // Process foundation products
      foundationBrands?.forEach(brand => {
        if (!brandMap.has(brand.id)) {
          brandMap.set(brand.id, {
            id: brand.id,
            name: brand.name,
            logo_url: brand.logo_url,
            brand_tier: brand.brand_tier,
            foundation_products: [],
            cosmetics_products: []
          });
        }
        brandMap.get(brand.id)!.foundation_products = brand.foundation_products || [];
      });

      // Process cosmetics products
      cosmeticsBrands?.forEach(brand => {
        if (!brandMap.has(brand.id)) {
          brandMap.set(brand.id, {
            id: brand.id,
            name: brand.name,
            logo_url: brand.logo_url,
            brand_tier: brand.brand_tier,
            foundation_products: [],
            cosmetics_products: []
          });
        }
        brandMap.get(brand.id)!.cosmetics_products = brand.cosmetics_products || [];
      });

      return Array.from(brandMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    },
  });

  const filteredBrands = brandsData?.filter(brand => {
    const matchesSearch = brand.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBrandFilter = !selectedBrand || brand.id === selectedBrand;
    const hasProducts = brand.foundation_products.length > 0 || brand.cosmetics_products.length > 0;
    return matchesSearch && matchesBrandFilter && hasProducts;
  }) || [];

  const getShadeColor = (shade: FoundationShade, product: FoundationProduct): string => {
    // Use actual hex color if available
    if (shade.hex_color) return shade.hex_color;
    
    // Extract color from product metadata if available
    const metadata = (product as any).metadata;
    if (metadata?.hex_color) return metadata.hex_color;
    
    // Generate realistic color using professional flesh tone color wheel
    return generateRealisticFleshTone(
      shade.shade_name || 'Medium', 
      shade.undertone || 'neutral'
    );
  };

  const sortShadesByDepth = (shades: FoundationShade[]): FoundationShade[] => {
    return [...shades].sort((a, b) => {
      // First try to sort by depth_level
      if (a.depth_level && b.depth_level) {
        return a.depth_level - b.depth_level;
      }
      
      // If no depth_level, estimate from shade name
      const getDepthFromName = (name: string): number => {
        const lowerName = name.toLowerCase();
        if (lowerName.includes('porcelain') || lowerName.includes('ivory')) return 1;
        if (lowerName.includes('fair') || lowerName.includes('alabaster')) return 2;
        if (lowerName.includes('light')) return 3;
        if (lowerName.includes('medium light')) return 4;
        if (lowerName.includes('medium')) return 5;
        if (lowerName.includes('tan') || lowerName.includes('medium deep')) return 6;
        if (lowerName.includes('deep')) return 7;
        if (lowerName.includes('very deep')) return 8;
        if (lowerName.includes('darkest')) return 9;
        
        // Try to extract numbers
        const numbers = name.match(/\d+/g);
        if (numbers && numbers.length > 0) {
          const num = parseInt(numbers[0]);
          return Math.min(9, Math.max(1, Math.floor(num / 100) + 1));
        }
        
        return 5; // Default to medium
      };
      
      const depthA = a.depth_level || getDepthFromName(a.shade_name);
      const depthB = b.depth_level || getDepthFromName(b.shade_name);
      return depthA - depthB;
    });
  };

  const createSyntheticShades = (product: FoundationProduct): FoundationShade[] => {
    // For cosmetics products without explicit shades, create synthetic shade entries
    const metadata = (product as any).metadata || {};
    
    return [{
      id: `synthetic-${product.id}`,
      shade_name: metadata.shade_name || 'Universal',
      hex_color: metadata.hex_color || '',
      depth_level: metadata.depth_level || 5,
      undertone: metadata.undertone || 'neutral'
    }];
  };

  const extractCoverageFromProduct = (product: FoundationProduct): string => {
    const text = (product.description || product.name || product.product_name || '').toLowerCase();
    if (text.includes('full')) return 'full';
    if (text.includes('light') || text.includes('sheer')) return 'light';
    if (text.includes('buildable')) return 'buildable';
    return product.coverage || 'medium';
  };

  const extractFinishFromProduct = (product: FoundationProduct): string => {
    const text = (product.description || product.name || product.product_name || '').toLowerCase();
    if (text.includes('matte')) return 'matte';
    if (text.includes('dewy') || text.includes('hydrating')) return 'dewy';
    if (text.includes('satin')) return 'satin';
    if (text.includes('luminous') || text.includes('radiant')) return 'luminous';
    return product.finish || 'natural';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Palette className="w-8 h-8 mx-auto mb-2 animate-spin text-primary" />
          <p>Loading foundation brands and shades...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Foundation Shade Chart</h1>
        <p className="text-muted-foreground">
          Comprehensive alphabetical catalog of all foundation brands and their shades
        </p>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search brands..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant={selectedBrand ? "outline" : "default"}
              onClick={() => setSelectedBrand('')}
            >
              All Brands ({brandsData?.length || 0})
            </Button>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background"
            >
              <option value="">All Brands</option>
              {brandsData?.map(brand => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Brand Charts */}
      <div className="space-y-8">
        {filteredBrands.map(brand => {
          const allProducts = [
            ...brand.foundation_products,
            ...brand.cosmetics_products
          ];

          return (
            <Card key={brand.id} className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
                <CardTitle className="flex items-center gap-3">
                  {brand.logo_url && (
                    <img 
                      src={brand.logo_url} 
                      alt={brand.name}
                      className="w-8 h-8 object-contain rounded"
                    />
                  )}
                  <span className="text-2xl font-bold">{brand.name}</span>
                  <Badge variant="secondary">{brand.brand_tier || 'premium'}</Badge>
                  <span className="text-sm text-muted-foreground">
                    ({allProducts.length} product{allProducts.length !== 1 ? 's' : ''})
                  </span>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="p-6">
                <div className="space-y-6">
                  {allProducts.map(product => {
                    const productName = product.name || product.product_name || 'Unknown Product';
                    const shades = product.foundation_shades?.length > 0 
                      ? sortShadesByDepth(product.foundation_shades)
                      : createSyntheticShades(product);

                    return (
                      <div key={product.id} className="border rounded-lg p-4">
                        {/* Product Header */}
                        <div className="flex items-center gap-4 mb-4">
                          {product.image_url && (
                            <img 
                              src={product.image_url}
                              alt={productName}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                          )}
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold">{productName}</h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>ID: {product.id}</span>
                              {product.price && <span>• ${product.price}</span>}
                              <Badge variant="outline">{extractCoverageFromProduct(product)} coverage</Badge>
                              <Badge variant="outline">{extractFinishFromProduct(product)} finish</Badge>
                            </div>
                          </div>
                        </div>

                        {/* Shade Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                          {shades.map((shade, index) => (
                            <div 
                              key={shade.id || index} 
                              className="text-center space-y-2 p-2 border rounded-lg hover:shadow-md transition-shadow"
                            >
                              {/* Shade Color Swatch */}
                              <div 
                                className="w-full h-16 rounded-lg border-2 border-gray-200 shadow-inner relative overflow-hidden"
                                style={{ backgroundColor: getShadeColor(shade, product) }}
                                title={`${shade.shade_name} - ${shade.undertone || 'neutral'} undertone`}
                              >
                                {/* Depth indicator */}
                                <div className="absolute bottom-0 right-0 bg-black/20 text-white text-xs px-1 rounded-tl">
                                  {shade.depth_level || '?'}
                                </div>
                              </div>
                              
                              {/* Shade Info */}
                              <div className="space-y-1">
                                <h4 className="text-xs font-medium truncate" title={shade.shade_name}>
                                  {shade.shade_name}
                                </h4>
                                {shade.shade_code && (
                                  <p className="text-xs text-muted-foreground">{shade.shade_code}</p>
                                )}
                                 <div className="flex flex-wrap gap-1 justify-center">
                                   {shade.undertone && (
                                     <Badge variant="secondary" className="text-xs px-1 py-0">
                                       {shade.undertone}
                                     </Badge>
                                   )}
                                 </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {shades.length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            <Package className="w-8 h-8 mx-auto mb-2" />
                            <p>No shade information available for this product</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredBrands.length === 0 && (
        <Card className="p-8 text-center">
          <div className="space-y-4">
            <Search className="w-12 h-12 mx-auto text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold">No brands found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search terms or filters
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default FoundationBrandChart;