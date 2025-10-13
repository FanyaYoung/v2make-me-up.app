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
  const [retailerFilter, setRetailerFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');

  // Define approved retailers
  const retailers = [
    { value: 'all', label: 'All Retailers' },
    { value: 'ulta', label: 'Ulta Beauty' },
    { value: 'sephora', label: 'Sephora' },
    { value: 'macys', label: "Macy's" },
    { value: 'database', label: 'Other Stores' }
  ];

  // Fetch cosmetics products with proper image handling
  const { data: products, isLoading } = useQuery({
    queryKey: ['cosmetics-products', searchTerm, categoryFilter, retailerFilter, sortBy],
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

      // Apply retailer filter
      if (retailerFilter !== 'all') {
        const retailerPatterns: Record<string, string[]> = {
          ulta: ['ulta', 'Ulta'],
          sephora: ['sephora', 'Sephora'],
          macys: ['macys', "macy's", "Macy's"],
          database: []
        };
        
        const patterns = retailerPatterns[retailerFilter];
        if (patterns && patterns.length > 0) {
          const orConditions = patterns.map(pattern => 
            `dataset_name.ilike.%${pattern}%,product_url.ilike.%${pattern}%`
          ).join(',');
          query = query.or(orConditions);
        }
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
      {/* Filters and Search */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={retailerFilter} onValueChange={setRetailerFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Retailer" />
          </SelectTrigger>
          <SelectContent>
            {retailers.map((retailer) => (
              <SelectItem key={retailer.value} value={retailer.value}>
                {retailer.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Category" />
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
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name A-Z</SelectItem>
            <SelectItem value="price_low">Price: Low to High</SelectItem>
            <SelectItem value="price_high">Price: High to Low</SelectItem>
            <SelectItem value="rating">Highest Rated</SelectItem>
          </SelectContent>
        </Select>

        <Badge variant="outline" className="flex items-center justify-center">
          {products?.length || 0} items
        </Badge>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {products?.map((product) => {
          const displayImage = product.image_url || product.brands?.logo_url;
          
          return (
            <Card key={product.id} className="group bg-white shadow hover:shadow-xl transition-all duration-300 overflow-hidden border-0">
              <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                {displayImage ? (
                  <img
                    src={displayImage}
                    alt={product.product_name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div 
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ backgroundColor: generateShadeColor(product.metadata) }}
                  >
                    <div className="text-center p-4">
                      <div className="text-white font-bold text-xs mb-1">{product.brands?.name}</div>
                      <div className="text-white/80 text-[10px] leading-tight line-clamp-2">{product.product_type}</div>
                    </div>
                  </div>
                )}
                
                {product.product_type && (
                  <Badge className="absolute top-2 left-2 bg-white/90 text-gray-800 text-xs backdrop-blur-sm">
                    {product.product_type}
                  </Badge>
                )}
              </div>

              <CardContent className="p-3">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground font-medium truncate">
                    {product.brands?.name}
                  </div>
                  <h3 className="font-semibold text-sm line-clamp-2 min-h-[2.5rem]">
                    {product.product_name}
                  </h3>
                  
                  <div className="flex items-center justify-between pt-1">
                    {product.price && (
                      <div className="text-base font-bold">
                        ${product.price.toFixed(2)}
                      </div>
                    )}
                    {product.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-400 fill-current" />
                        <span className="text-xs text-muted-foreground">
                          {product.rating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>

                  <Button size="sm" className="w-full mt-2" variant="outline">
                    <ShoppingCart className="w-3 h-3 mr-1" />
                    Shop
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {products?.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-500">No products found</p>
        </div>
      )}
    </div>
  );
};

export default CosmeticsBrowser;