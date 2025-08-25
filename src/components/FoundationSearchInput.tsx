import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Package } from 'lucide-react';
import { FoundationMatch } from '../types/foundation';

interface FoundationSearchInputProps {
  onMatchFound: (matches: FoundationMatch[]) => void;
}

const FoundationSearchInput: React.FC<FoundationSearchInputProps> = ({ onMatchFound }) => {
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [productName, setProductName] = useState<string>('');
  const [shadeName, setShadeName] = useState<string>('');

  // Fetch brands for dropdown
  const { data: brands } = useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('brands')
        .select('id, name, logo_url')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch products when brand is selected
  const { data: products } = useQuery({
    queryKey: ['brand-products', selectedBrand],
    queryFn: async () => {
      if (!selectedBrand) return [];
      
      const { data, error } = await supabase
        .from('foundation_products')
        .select(`
          *,
          foundation_shades(*)
        `)
        .eq('brand_id', selectedBrand)
        .eq('is_active', true);
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedBrand,
  });

  const handleSearch = async () => {
    if (!productName.trim()) {
      console.log('No product name entered');
      return;
    }

    console.log('Starting search for:', productName);
    console.log('Selected brand:', selectedBrand);
    console.log('Available brands:', brands?.length);
    console.log('Available products for selected brand:', products?.length);

    try {
      // If brand is selected, search within that brand's products
      if (selectedBrand && products) {
        console.log('Searching within selected brand products:', products);
        const matchingProduct = products.find(p => 
          p.name.toLowerCase().includes(productName.toLowerCase())
        );

        console.log('Matching product in brand:', matchingProduct);

        if (matchingProduct) {
          const brand = brands?.find(b => b.id === selectedBrand);
          const match = createFoundationMatch(matchingProduct, brand);
          console.log('Created brand-specific match:', match);
          onMatchFound([match]);
          return;
        }
      }

      // If no brand selected or no match found, search across all brands
      console.log('Searching across all brands for product name:', productName);
      const { data: allProducts, error } = await supabase
        .from('foundation_products')
        .select(`
          *,
          brands!inner(name, logo_url),
          foundation_shades(*)
        `)
        .ilike('name', `%${productName}%`)
        .eq('is_active', true)
        .limit(5);

      if (error) {
        console.error('Error searching products:', error);
        // Show error toast
        import('sonner').then(({ toast }) => {
          toast.error('Search failed. Please try again.');
        });
        return;
      }

      console.log('All products search results:', allProducts);

      if (allProducts && allProducts.length > 0) {
        const matches = allProducts.map(product => {
          console.log('Creating match for product:', product);
          return createFoundationMatch(product, product.brands);
        }).filter(Boolean);
        
        console.log('Final created matches:', matches);
        onMatchFound(matches);
      } else {
        console.log('No products found matching:', productName);
        // Show a toast message to the user
        import('sonner').then(({ toast }) => {
          toast.error('No foundation products found matching your search. Try a different product name.');
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      // Show error toast
      import('sonner').then(({ toast }) => {
        toast.error('Search failed. Please try again.');
      });
    }
  };

  const createFoundationMatch = (product: any, brand: any): FoundationMatch => {
    let matchingShade = null;
    if (shadeName && product.foundation_shades) {
      matchingShade = product.foundation_shades.find((shade: any) =>
        shade.shade_name.toLowerCase().includes(shadeName.toLowerCase())
      );
    }

    const foundationMatch: FoundationMatch = {
      id: `search-${product.id}`,
      brand: brand?.name || 'Unknown',
      product: product.name,
      shade: matchingShade?.shade_name || shadeName || 'Custom Shade',
      price: product.price || 35,
      rating: 4.2,
      reviewCount: 156,
      availability: {
        online: true,
        inStore: true,
        readyForPickup: true,
        nearbyStores: ['Sephora', 'Ulta Beauty', 'Target']
      },
      matchPercentage: 95,
      undertone: matchingShade?.undertone || 'neutral',
      coverage: product.coverage || 'medium',
      finish: product.finish || 'natural',
      imageUrl: product.image_url || '/placeholder.svg'
    };

    return foundationMatch;
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Search by Product Name</h3>
        </div>
        
        <p className="text-sm text-muted-foreground mb-4">
          Already know your perfect match? Search for it directly by brand and product name.
        </p>

        <div className="space-y-4">
          <div>
            <Label htmlFor="brand-select">Brand (Optional)</Label>
            <Select value={selectedBrand} onValueChange={setSelectedBrand}>
              <SelectTrigger>
                <SelectValue placeholder="Select a brand" />
              </SelectTrigger>
              <SelectContent>
                {brands?.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="product-name">Product Name</Label>
            <Input
              id="product-name"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g., Fenty Beauty Pro Filt'r"
            />
          </div>

          <div>
            <Label htmlFor="shade-name">Shade Name (Optional)</Label>
            <Input
              id="shade-name"
              value={shadeName}
              onChange={(e) => setShadeName(e.target.value)}
              placeholder="e.g., 350, Sand, Medium Beige"
            />
          </div>

          <Button 
            onClick={handleSearch}
            disabled={!productName.trim()}
            className="w-full"
          >
            <Package className="w-4 h-4 mr-2" />
            Find My Foundation
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default FoundationSearchInput;