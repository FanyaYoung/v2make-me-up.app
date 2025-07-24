import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import FoundationInput from './FoundationInput';
import VirtualTryOn from './VirtualTryOn';
import PhotoAnalysisDemo from './PhotoAnalysisDemo';

import OptionalUserInfo from './OptionalUserInfo';
import FoundationResults from './FoundationResults';
import { FoundationMatch } from '../types/foundation';

const FoundationMatcher = () => {
  const [currentFoundation, setCurrentFoundation] = useState<{brand: string, shade: string} | null>(null);
  const [matches, setMatches] = useState<FoundationMatch[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<FoundationMatch | null>(null);

  // Sample foundation shades data for visualization
  const foundationShades = [
    { name: 'Fair Light', color: '#F4D5B4', brand: 'Brand A' },
    { name: 'Light Medium', color: '#E8C2A0', brand: 'Brand B' },
    { name: 'Medium', color: '#D2AD86', brand: 'Brand C' },
    { name: 'Medium Deep', color: '#B5967A', brand: 'Brand D' },
    { name: 'Deep', color: '#8B6F56', brand: 'Brand E' },
    { name: 'Very Deep', color: '#6B4F3A', brand: 'Brand F' },
  ];

  // Fetch brands for the foundation input
  const { data: brands } = useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      console.log('Fetching brands...');
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) {
        console.error('Error fetching brands:', error);
        throw error;
      }
      console.log('Brands fetched:', data);
      return data;
    },
  });

  // Fetch foundation products with their shades and brands
  const { data: products } = useQuery({
    queryKey: ['foundation-products'],
    queryFn: async () => {
      console.log('Fetching foundation products...');
      const { data, error } = await supabase
        .from('foundation_products')
        .select(`
          *,
          brands!inner(name, logo_url),
          foundation_shades(*)
        `)
        .eq('is_active', true);
      
      if (error) {
        console.error('Error fetching products:', error);
        throw error;
      }
      console.log('Products fetched:', data);
      console.log('Foundation shades available:', data?.map(p => ({ 
        brand: p.brands.name, 
        product: p.name, 
        shades: p.foundation_shades?.length || 0 
      })));
      return data;
    },
  });

  const handleFoundationSubmit = (brand: string, shade: string) => {
    console.log('Foundation submitted:', { brand, shade });
    setCurrentFoundation({ brand, shade });
    
    if (!products || products.length === 0) {
      console.log('No products available for matching');
      return;
    }

    // Create realistic matches from available products with their actual shades
    const realMatches: FoundationMatch[] = [];
    
    // Get products from different brands (exclude the current brand for variety)
    const otherBrandProducts = products.filter(product => 
      product.brands.name.toLowerCase() !== brand.toLowerCase()
    );
    
    // Group by brand and limit to 1 product per brand, then take up to 3 brands
    const brandGroups: { [key: string]: typeof otherBrandProducts } = {};
    otherBrandProducts.forEach(product => {
      const brandName = product.brands.name;
      if (!brandGroups[brandName]) {
        brandGroups[brandName] = [];
      }
      brandGroups[brandName].push(product);
    });
    
    // Take first product from each brand, limit to 3 different brands
    const selectedProducts = Object.values(brandGroups)
      .slice(0, 3)
      .map(brandProducts => brandProducts[0]);
    
    // Generate matches using selected products (1 per brand max)
    selectedProducts.forEach((product, index) => {
      const availableShades = product.foundation_shades || [];
      
      // Find a shade that closely matches the input shade
      let selectedShade = availableShades.find(s => 
        s.shade_name.toLowerCase().includes(shade.toLowerCase()) ||
        s.shade_code?.toLowerCase().includes(shade.toLowerCase())
      );
      
      // If no direct match, pick a shade based on shade keywords
      if (!selectedShade && availableShades.length > 0) {
        const shadeLower = shade.toLowerCase();
        if (shadeLower.includes('fair') || shadeLower.includes('light')) {
          selectedShade = availableShades.find(s => s.depth_level && s.depth_level <= 3);
        } else if (shadeLower.includes('medium')) {
          selectedShade = availableShades.find(s => s.depth_level && s.depth_level >= 4 && s.depth_level <= 7);
        } else if (shadeLower.includes('deep') || shadeLower.includes('dark')) {
          selectedShade = availableShades.find(s => s.depth_level && s.depth_level >= 8);
        }
      }
      
      // Fallback to first available shade
      if (!selectedShade && availableShades.length > 0) {
        selectedShade = availableShades[Math.floor(availableShades.length / 2)]; // Pick middle shade
      }
      
      // Final fallback
      if (!selectedShade) {
        selectedShade = {
          id: 'fallback',
          shade_name: 'Universal Match',
          shade_code: 'UM',
          undertone: 'neutral' as const,
          hex_color: '#D4A574',
          rgb_values: [212, 165, 116],
          depth_level: 5,
          is_available: true,
          created_at: new Date().toISOString(),
          product_id: product.id
        };
      }
      
      const match: FoundationMatch = {
        id: `${product.id}-${selectedShade.id || 'default'}`,
        brand: product.brands.name,
        product: product.name,
        shade: selectedShade.shade_name,
        price: product.price || 42.00,
        rating: 4.2 + (index * 0.2),
        reviewCount: 800 + (index * 200),
        availability: {
          online: true,
          inStore: index < 2,
          readyForPickup: index < 2,
          nearbyStores: index < 2 ? ['Sephora - Downtown', 'Ulta - Mall Plaza'] : []
        },
        matchPercentage: 95 - (index * 3),
        undertone: selectedShade.undertone || 'neutral',
        coverage: product.coverage || 'medium',
        finish: product.finish || 'natural',
        imageUrl: product.image_url || '/placeholder.svg'
      };
      
      realMatches.push(match);
    });
    
    // If we don't have enough products, create some mock matches
    if (realMatches.length < 3) {
      const mockBrands = [
        { name: 'Fenty Beauty', product: 'Pro Filt\'r Soft Matte Foundation' },
        { name: 'Charlotte Tilbury', product: 'Airbrush Flawless Foundation' },
        { name: 'Rare Beauty', product: 'Liquid Touch Weightless Foundation' }
      ];
      
      mockBrands.slice(0, 3 - realMatches.length).forEach((mockBrand, index) => {
        const adjustedIndex = realMatches.length + index;
        const match: FoundationMatch = {
          id: `mock-${adjustedIndex}`,
          brand: mockBrand.name,
          product: mockBrand.product,
          shade: `Similar to ${shade}`,
          price: 35.00 + (adjustedIndex * 5),
          rating: 4.1 + (adjustedIndex * 0.1),
          reviewCount: 650 + (adjustedIndex * 150),
          availability: {
            online: true,
            inStore: adjustedIndex < 2,
            readyForPickup: adjustedIndex < 2,
            nearbyStores: adjustedIndex < 2 ? ['Sephora - Downtown', 'Ulta - Mall Plaza'] : []
          },
          matchPercentage: 92 - (adjustedIndex * 2),
          undertone: 'neutral',
          coverage: 'medium',
          finish: 'natural',
          imageUrl: '/placeholder.svg'
        };
        
        realMatches.push(match);
      });
    }
    
    console.log('Generated matches:', realMatches);
    setMatches(realMatches);
  };

  const handleFoundationFeedback = (foundationId: string, feedback: {
    rating: 'positive' | 'negative';
    comment?: string;
  }) => {
    console.log('Foundation feedback received:', { foundationId, feedback });
    // Here you would send the feedback to your backend
  };

  const handleTryVirtual = (match: FoundationMatch) => {
    setSelectedMatch(match);
    console.log('Setting virtual try-on for:', match);
  };

  const handleViewDetails = (match: FoundationMatch) => {
    console.log('View details for:', match);
    // Here you could open a modal or navigate to a details page
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <FoundationInput 
            onSubmit={handleFoundationSubmit} 
            brands={brands || []}
          />
          
          {/* Analysis Demo and User Info */}
          <PhotoAnalysisDemo />
          
          <OptionalUserInfo />

          {/* Foundation Results */}
          {matches.length > 0 && (
            <FoundationResults
              matches={matches}
              currentFoundation={currentFoundation}
              onTryVirtual={handleTryVirtual}
              onViewDetails={handleViewDetails}
              onFeedback={handleFoundationFeedback}
            />
          )}
        </div>
        <div className="lg:col-span-1">
          <VirtualTryOn 
            selectedMatch={selectedMatch} 
            onShadeRecommendations={(recommendations) => {
              console.log('New shade recommendations:', recommendations);
              // You can handle the recommendations here
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default FoundationMatcher;
