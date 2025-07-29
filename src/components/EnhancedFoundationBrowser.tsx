import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Star, ShoppingCart, Eye, Palette } from 'lucide-react';

interface FoundationProduct {
  id: string;
  product_name: string;
  description?: string;
  price?: number;
  rating?: number;
  total_reviews?: number;
  image_url?: string;
  product_url?: string;
  metadata?: {
    shade_name?: string;
    hex_color?: string;
    undertone?: string;
    coverage?: string;
    finish?: string;
  };
  brands?: {
    name: string;
    logo_url?: string;
  };
}

const EnhancedFoundationBrowser = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [brandFilter, setBrandFilter] = useState('all');
  const [undertoneFilter, setUndertoneFilter] = useState('all');
  const [coverageFilter, setCoverageFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');

  // Fetch foundation products
  const { data: products, isLoading } = useQuery({
    queryKey: ['foundation-products', searchTerm, brandFilter, undertoneFilter, coverageFilter, sortBy],
    queryFn: async () => {
      let query = supabase
        .from('cosmetics_products')
        .select(`
          *,
          brands!inner(name, logo_url)
        `)
        .or('product_type.ilike.%foundation%,category.ilike.%foundation%');

      // Apply search filter
      if (searchTerm) {
        query = query.or(`product_name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      // Apply brand filter
      if (brandFilter !== 'all') {
        query = query.eq('brands.name', brandFilter);
      }

      // Apply filters based on metadata
      if (undertoneFilter !== 'all') {
        query = query.contains('metadata', { undertone: undertoneFilter });
      }

      if (coverageFilter !== 'all') {
        query = query.contains('metadata', { coverage: coverageFilter });
      }

      // Apply sorting
      switch (sortBy) {
        case 'price_low':
          query = query.order('price', { ascending: true, nullsFirst: false });
          break;
        case 'price_high':
          query = query.order('price', { ascending: false, nullsFirst: false });
          break;
        case 'rating':
          query = query.order('rating', { ascending: false, nullsFirst: false });
          break;
        case 'name':
        default:
          query = query.order('product_name', { ascending: true });
          break;
      }

      const { data, error } = await query.limit(50);
      
      if (error) throw error;
      return data as FoundationProduct[];
    },
  });

  // Get unique brands for filter
  const { data: brands } = useQuery({
    queryKey: ['foundation-brands'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cosmetics_products')
        .select(`
          brands!inner(name)
        `)
        .or('product_type.ilike.%foundation%,category.ilike.%foundation%');
      
      if (error) throw error;
      
      const uniqueBrands = [...new Set(data.map(item => item.brands?.name))].filter(Boolean);
      return uniqueBrands;
    },
  });

  const generateShadeColor = (metadata?: any) => {
    if (metadata?.hex_color) {
      return metadata.hex_color;
    }
    
    // Generate foundation color based on undertone
    const undertone = metadata?.undertone?.toLowerCase() || 'neutral';
    const undertoneColors: Record<string, string> = {
      warm: '#D2B48C',
      cool: '#F0DCC0',
      neutral: '#DEB887',
      yellow: '#F4E4BC',
      pink: '#F8E8E8',
      red: '#E8C5A0',
      olive: '#C8A882'
    };
    
    return undertoneColors[undertone] || undertoneColors.neutral;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-lg text-muted-foreground">Loading foundation products...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Foundation Collection</h2>
        <p className="text-muted-foreground">
          Discover foundation products from Google Storage integrated with our database
        </p>
      </div>

      {/* Enhanced Filters */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search foundations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={brandFilter} onValueChange={setBrandFilter}>
          <SelectTrigger>
            <SelectValue placeholder="All Brands" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Brands</SelectItem>
            {brands?.map((brand) => (
              <SelectItem key={brand} value={brand}>
                {brand}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={undertoneFilter} onValueChange={setUndertoneFilter}>
          <SelectTrigger>
            <SelectValue placeholder="All Undertones" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Undertones</SelectItem>
            <SelectItem value="warm">Warm</SelectItem>
            <SelectItem value="cool">Cool</SelectItem>
            <SelectItem value="neutral">Neutral</SelectItem>
            <SelectItem value="olive">Olive</SelectItem>
            <SelectItem value="yellow">Yellow</SelectItem>
            <SelectItem value="pink">Pink</SelectItem>
          </SelectContent>
        </Select>

        <Select value={coverageFilter} onValueChange={setCoverageFilter}>
          <SelectTrigger>
            <SelectValue placeholder="All Coverage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Coverage</SelectItem>
            <SelectItem value="light">Light</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="full">Full</SelectItem>
            <SelectItem value="buildable">Buildable</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger>
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name A-Z</SelectItem>
            <SelectItem value="price_low">Price: Low to High</SelectItem>
            <SelectItem value="price_high">Price: High to Low</SelectItem>
            <SelectItem value="rating">Highest Rated</SelectItem>
          </SelectContent>
        </Select>

        <div className="text-sm text-muted-foreground flex items-center">
          {products?.length || 0} products
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products?.map((product) => (
          <Card key={product.id} className="shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
            <div className="aspect-square relative overflow-hidden bg-gray-100">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.product_name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = target.nextElementSibling as HTMLDivElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              ) : null}
              
              {/* Fallback foundation swatch */}
              <div 
                className={`absolute inset-0 ${product.image_url ? 'hidden' : 'flex'} items-center justify-center text-white font-medium text-sm`}
                style={{ backgroundColor: generateShadeColor(product.metadata) }}
              >
                <Palette className="w-8 h-8 opacity-80" />
              </div>
              
              {/* Foundation badge */}
              <Badge className="absolute top-2 left-2 bg-orange-100 text-orange-800">
                Foundation
              </Badge>

              {/* Shade indicator if available */}
              {product.metadata?.shade_name && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-full border border-white"
                      style={{ backgroundColor: generateShadeColor(product.metadata) }}
                    />
                    <span className="text-xs font-medium truncate">
                      {product.metadata.shade_name}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground font-medium">
                  {product.brands?.name}
                </div>
                
                <h3 className="font-semibold line-clamp-2 min-h-[2.5rem]">
                  {product.product_name}
                </h3>
                
                {/* Product attributes */}
                <div className="flex flex-wrap gap-1">
                  {product.metadata?.undertone && (
                    <Badge variant="secondary" className="text-xs">
                      {product.metadata.undertone}
                    </Badge>
                  )}
                  {product.metadata?.coverage && (
                    <Badge variant="outline" className="text-xs">
                      {product.metadata.coverage} coverage
                    </Badge>
                  )}
                  {product.metadata?.finish && (
                    <Badge variant="outline" className="text-xs">
                      {product.metadata.finish} finish
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    {product.price && (
                      <div className="text-lg font-bold">
                        ${product.price.toFixed(2)}
                      </div>
                    )}
                    {product.rating && (
                      <div className="flex items-center gap-1">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-3 h-3 ${i < Math.floor(product.rating!) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                            />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {product.rating.toFixed(1)}
                          {product.total_reviews && ` (${product.total_reviews})`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Eye className="w-3 h-3 mr-1" />
                    Details
                  </Button>
                  {product.product_url && (
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => window.open(product.product_url, '_blank')}
                    >
                      <ShoppingCart className="w-3 h-3 mr-1" />
                      Buy
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {products?.length === 0 && (
        <div className="text-center py-12">
          <Palette className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <div className="text-lg text-muted-foreground mb-2">No foundation products found</div>
          <p className="text-muted-foreground">Try adjusting your search or filters, or import products from Google Storage</p>
        </div>
      )}
    </div>
  );
};

export default EnhancedFoundationBrowser;