import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Star, ShoppingCart, Eye } from 'lucide-react';

interface CosmeticsProduct {
  id: string;
  product_name: string;
  product_type?: string;
  category?: string;
  subcategory?: string;
  description?: string;
  price?: number;
  rating?: number;
  total_reviews?: number;
  image_url?: string;
  product_url?: string;
  brands?: {
    name: string;
    logo_url?: string;
  };
  metadata?: {
    shade_name?: string;
    hex_color?: string;
    undertone?: string;
  };
}

const CosmeticsBrowser = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');

  // Fetch cosmetics products
  const { data: products, isLoading } = useQuery({
    queryKey: ['cosmetics-products', searchTerm, categoryFilter, sortBy],
    queryFn: async () => {
      console.log('Fetching cosmetics products...');
      let query = supabase
        .from('cosmetics_products')
        .select(`
          *,
          brands!inner(name, logo_url)
        `);

      // Apply search filter
      if (searchTerm) {
        query = query.or(`product_name.ilike.%${searchTerm}%,product_type.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`);
      }

      // Apply category filter
      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter);
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
      
      if (error) {
        console.error('Error fetching cosmetics products:', error);
        throw error;
      }
      console.log('Cosmetics products fetched:', data);
      return data as CosmeticsProduct[];
    },
  });

  // Get unique categories for filter
  const { data: categories } = useQuery({
    queryKey: ['cosmetics-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cosmetics_products')
        .select('category')
        .not('category', 'is', null);
      
      if (error) throw error;
      
      const uniqueCategories = [...new Set(data.map(item => item.category))].filter(Boolean);
      return uniqueCategories;
    },
  });

  const generateShadeColor = (metadata?: any) => {
    if (metadata?.hex_color) {
      return metadata.hex_color;
    }
    
    // Generate color based on product type
    const colorMap: Record<string, string> = {
      'lipstick': '#DC2626',
      'eyeshadow': '#7C3AED',
      'blush': '#EC4899',
      'foundation': '#D97706',
      'concealer': '#F59E0B',
      'mascara': '#1F2937',
      'eyeliner': '#374151',
      'bronzer': '#92400E',
      'highlighter': '#FCD34D',
    };
    
    return colorMap['foundation'] || '#9CA3AF';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-lg text-gray-600">Loading cosmetics products...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header and Search */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Browse All Cosmetics</h2>
        <p className="text-gray-600">
          Discover thousands of makeup products from top brands worldwide
        </p>
      </div>

      {/* Filters and Search */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger>
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories?.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
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

        <div className="text-sm text-gray-600 flex items-center">
          Showing {products?.length || 0} products
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products?.map((product) => (
          <Card key={product.id} className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
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
              {/* Fallback color swatch */}
              <div 
                className={`absolute inset-0 ${product.image_url ? 'hidden' : 'flex'} items-center justify-center text-white font-medium text-sm`}
                style={{ backgroundColor: generateShadeColor(product.metadata) }}
              >
                {product.brands?.name}
              </div>
              
              {/* Product type badge */}
              {product.product_type && (
                <Badge className="absolute top-2 left-2 bg-white/90 text-gray-800">
                  {product.product_type}
                </Badge>
              )}
            </div>

            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="text-sm text-gray-600 font-medium">
                  {product.brands?.name}
                </div>
                <h3 className="font-semibold text-gray-800 line-clamp-2 min-h-[2.5rem]">
                  {product.product_name}
                </h3>
                
                {product.metadata?.shade_name && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Shade:</span>
                    <span className="text-sm font-medium text-rose-600">
                      {product.metadata.shade_name}
                    </span>
                    {product.metadata.hex_color && (
                      <div 
                        className="w-4 h-4 rounded-full border border-gray-300"
                        style={{ backgroundColor: product.metadata.hex_color }}
                        title={product.metadata.shade_name}
                      />
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    {product.price && (
                      <div className="text-lg font-bold text-gray-800">
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
                        <span className="text-xs text-gray-600">
                          {product.rating.toFixed(1)}
                          {product.total_reviews && ` (${product.total_reviews})`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button size="sm" className="flex-1" variant="outline">
                    <Eye className="w-3 h-3 mr-1" />
                    View
                  </Button>
                  {product.product_url && (
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => window.open(product.product_url, '_blank')}
                    >
                      <ShoppingCart className="w-3 h-3 mr-1" />
                      Shop
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
          <div className="text-lg text-gray-600 mb-2">No products found</div>
          <p className="text-gray-500">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
};

export default CosmeticsBrowser;