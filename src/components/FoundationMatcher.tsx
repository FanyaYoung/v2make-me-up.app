
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import FoundationInput from './FoundationInput';
import ProductRecommendations from './ProductRecommendations';
import VirtualTryOn from './VirtualTryOn';
import { FoundationMatch } from '../types/foundation';

const FoundationMatcher = () => {
  const [currentFoundation, setCurrentFoundation] = useState<{brand: string, shade: string} | null>(null);
  const [matches, setMatches] = useState<FoundationMatch[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<FoundationMatch | null>(null);

  // Fetch brands for the foundation input
  const { data: brands } = useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch foundation products with their shades
  const { data: products } = useQuery({
    queryKey: ['foundation-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('foundation_products')
        .select(`
          *,
          brands!inner(name, logo_url),
          foundation_shades(*)
        `)
        .eq('is_active', true);
      
      if (error) throw error;
      return data;
    },
  });

  const handleFoundationSubmit = (brand: string, shade: string) => {
    setCurrentFoundation({ brand, shade });
    
    if (!products) return;

    // Create mock matches from available products
    const mockMatches: FoundationMatch[] = products.slice(0, 3).map((product, index) => ({
      id: product.id,
      brand: product.brands.name,
      product: product.name,
      shade: product.foundation_shades[0]?.shade_name || 'Universal',
      price: product.price || 0,
      rating: 4.2 + (index * 0.2),
      reviewCount: 800 + (index * 200),
      availability: {
        online: true,
        inStore: index < 2,
        readyForPickup: index < 2,
        nearbyStores: index < 2 ? ['Sephora - Downtown', 'Ulta - Mall Plaza'] : []
      },
      matchPercentage: 95 - (index * 3),
      undertone: 'neutral',
      coverage: product.coverage || 'medium',
      finish: product.finish || 'natural',
      imageUrl: product.image_url || '/placeholder.svg'
    }));
    
    setMatches(mockMatches);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <FoundationInput 
            onSubmit={handleFoundationSubmit} 
            brands={brands || []}
          />
          {matches.length > 0 && (
            <ProductRecommendations 
              matches={matches}
              onSelectMatch={setSelectedMatch}
              currentFoundation={currentFoundation}
            />
          )}
        </div>
        <div className="lg:col-span-1">
          <VirtualTryOn selectedMatch={selectedMatch} />
        </div>
      </div>
    </div>
  );
};

export default FoundationMatcher;
