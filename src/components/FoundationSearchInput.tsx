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
import { generateRealisticFleshTone } from '../lib/fleshToneColorWheel';

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

  // Fetch products when brand is selected (search both tables)
  const { data: products } = useQuery({
    queryKey: ['brand-products', selectedBrand],
    queryFn: async () => {
      if (!selectedBrand) return [];
      
      // Search foundation_products table
      const { data: foundationProducts, error: foundationError } = await supabase
        .from('foundation_products')
        .select(`
          *,
          foundation_shades(*)
        `)
        .eq('brand_id', selectedBrand)
        .eq('is_active', true);
      
      if (foundationError) console.error('Foundation products error:', foundationError);
      
      // Search cosmetics_products table
      const { data: cosmeticsProducts, error: cosmeticsError } = await supabase
        .from('cosmetics_products')
        .select(`
          *,
          brand:brands(name, logo_url)
        `)
        .eq('brand_id', selectedBrand)
        .eq('product_type', 'foundation');
      
      if (cosmeticsError) console.error('Cosmetics products error:', cosmeticsError);
      
      // Combine both results
      const allProducts = [
        ...(foundationProducts || []),
        ...(cosmeticsProducts || [])
      ];
      
      console.log('Combined products for brand:', selectedBrand, allProducts);
      return allProducts;
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
        const matchingProduct = products.find(p => {
          const productNameField = (p as any).name || (p as any).product_name;
          return productNameField.toLowerCase().includes(productName.toLowerCase());
        });

        console.log('Matching product in brand:', matchingProduct);

        if (matchingProduct) {
          const brand = brands?.find(b => b.id === selectedBrand);
          const match = createFoundationMatch(matchingProduct, brand);
          console.log('Created brand-specific match:', match);
          onMatchFound([match]);
          return;
        }
      }

      // If no brand selected or no match found, search across all brands and both tables
      console.log('Searching across all brands for product name:', productName);
      
      // Search foundation_products table
      const { data: foundationProducts, error: foundationError } = await supabase
        .from('foundation_products')
        .select(`
          *,
          brands!inner(name, logo_url),
          foundation_shades(*)
        `)
        .ilike('name', `%${productName}%`)
        .eq('is_active', true)
        .limit(5);

      // Search cosmetics_products table  
      const { data: cosmeticsProducts, error: cosmeticsError } = await supabase
        .from('cosmetics_products')
        .select(`
          *,
          brand:brands!inner(name, logo_url)
        `)
        .ilike('product_name', `%${productName}%`)
        .eq('product_type', 'foundation')
        .limit(5);

      if (foundationError) {
        console.error('Error searching foundation products:', foundationError);
      }
      
      if (cosmeticsError) {
        console.error('Error searching cosmetics products:', cosmeticsError);
      }

      // Combine results from both tables
      const allProducts = [
        ...(foundationProducts || []),
        ...(cosmeticsProducts || [])
      ];

      console.log('Combined search results:', allProducts);

      if (allProducts && allProducts.length > 0) {
        const matches = allProducts.map(product => {
          console.log('Creating match for product:', product);
          const brandData = (product as any).brands || (product as any).brand;
          return createFoundationMatch(product, brandData);
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
    
    // Handle different shade data structures
    if (shadeName) {
      if (product.foundation_shades) {
        // Foundation products table structure
        matchingShade = product.foundation_shades.find((shade: any) =>
          shade.shade_name.toLowerCase().includes(shadeName.toLowerCase())
        );
      }
      // For cosmetics products, shade info might be in metadata
    }

    // Handle different product name fields
    const productNameField = (product as any).name || (product as any).product_name;
    
    // Handle different coverage/finish fields
    const coverage = (product as any).coverage || 
                    ((product as any).metadata?.coverage) || 
                    ((product as any).description?.toLowerCase().includes('full') ? 'full' : 
                     (product as any).description?.toLowerCase().includes('light') ? 'light' : 'medium');
                     
    const finish = (product as any).finish || 
                  ((product as any).metadata?.finish) ||
                  ((product as any).description?.toLowerCase().includes('matte') ? 'matte' :
                   (product as any).description?.toLowerCase().includes('dewy') ? 'dewy' : 'natural');

    // Get actual hex color if available, otherwise use professional flesh tone color wheel
    const hexColor = matchingShade?.hex_color || 
                    (matchingShade as any)?.hexColor ||
                    ((product as any).metadata?.hex_color) ||
                    generateRealisticFleshTone(matchingShade?.shade_name || shadeName || 'Medium', matchingShade?.undertone || 'neutral');

    const foundationMatch: FoundationMatch = {
      id: `search-${product.id}`,
      brand: brand?.name || 'Unknown',
      product: productNameField,
      shade: matchingShade?.shade_name || shadeName || 'Custom Shade',
      price: (product as any).price || 35,
      rating: (product as any).rating || 4.2,
      reviewCount: (product as any).total_reviews || 156,
      availability: {
        online: true,
        inStore: true,
        readyForPickup: true,
        nearbyStores: ['Sephora', 'Ulta Beauty', 'Target']
      },
      matchPercentage: 95,
      undertone: matchingShade?.undertone || 'neutral',
      coverage: coverage,
      finish: finish,
      imageUrl: (product as any).image_url || '/placeholder.svg',
      hexColor: hexColor // Add the actual hex color
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