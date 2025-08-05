import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ExternalLink, Star, ShoppingCart, Package } from 'lucide-react';

interface UltaProduct {
  id: string;
  name: string;
  brand: string;
  price: number;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  productUrl: string;
  inStock: boolean;
  shades?: Array<{
    name: string;
    hex: string;
    available: boolean;
  }>;
}

const UltaBeautyIntegration = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<UltaProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const searchUltaProducts = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Please enter a search term",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Call Ulta API through our edge function
      const { data, error } = await supabase.functions.invoke('ulta-product-search', {
        body: { query: searchQuery }
      });

      if (error) throw error;

      setProducts(data.products || []);
      toast({
        title: "Search completed",
        description: `Found ${data.products?.length || 0} products`
      });
    } catch (error) {
      console.error('Ulta search error:', error);
      toast({
        title: "Search failed",
        description: "Unable to search Ulta products",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-2 text-sm text-gray-600">{rating}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Ulta Beauty Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search Ulta Products</Label>
              <Input
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g., foundation, concealer, mascara"
                onKeyDown={(e) => e.key === 'Enter' && searchUltaProducts()}
              />
            </div>
            <Button 
              onClick={searchUltaProducts}
              disabled={isLoading}
              className="mt-6"
            >
              {isLoading ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Product Results */}
      {products.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="relative mb-4">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  {!product.inStock && (
                    <Badge className="absolute top-2 right-2 bg-red-500">
                      Out of Stock
                    </Badge>
                  )}
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg line-clamp-2">{product.name}</h3>
                  <p className="text-sm text-gray-600">{product.brand}</p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-purple-600">
                      ${product.price.toFixed(2)}
                    </span>
                    {renderStars(product.rating)}
                  </div>
                  
                  <p className="text-xs text-gray-500">
                    {product.reviewCount} reviews
                  </p>
                  
                  {product.shades && product.shades.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium mb-2">Available Shades:</p>
                      <div className="flex flex-wrap gap-1">
                        {product.shades.slice(0, 8).map((shade, index) => (
                          <div
                            key={index}
                            className="w-6 h-6 rounded-full border-2 border-gray-200"
                            style={{ backgroundColor: shade.hex }}
                            title={shade.name}
                          />
                        ))}
                        {product.shades.length > 8 && (
                          <span className="text-xs text-gray-500 ml-2">
                            +{product.shades.length - 8} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-2 mt-4">
                    <Button 
                      size="sm" 
                      className="flex-1"
                      disabled={!product.inStock}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Add to Cart
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => window.open(product.productUrl, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default UltaBeautyIntegration;