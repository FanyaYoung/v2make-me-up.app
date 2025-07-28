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

  const handleSearch = () => {
    if (!selectedBrand || !productName) return;

    const matchingProduct = products?.find(p => 
      p.name.toLowerCase().includes(productName.toLowerCase())
    );

    if (matchingProduct) {
      const brand = brands?.find(b => b.id === selectedBrand);
      
      let matchingShade = null;
      if (shadeName && matchingProduct.foundation_shades) {
        matchingShade = matchingProduct.foundation_shades.find((shade: any) =>
          shade.shade_name.toLowerCase().includes(shadeName.toLowerCase())
        );
      }

      const foundationMatch: FoundationMatch = {
        id: `search-${matchingProduct.id}`,
        brand: brand?.name || 'Unknown',
        product: matchingProduct.name,
        shade: matchingShade?.shade_name || shadeName || 'Custom Shade',
        price: matchingProduct.price || 35,
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
        coverage: matchingProduct.coverage || 'medium',
        finish: matchingProduct.finish || 'natural',
        imageUrl: matchingProduct.image_url || '/placeholder.svg'
      };

      onMatchFound([foundationMatch]);
    }
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
            <Label htmlFor="brand-select">Brand</Label>
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
            disabled={!selectedBrand || !productName}
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