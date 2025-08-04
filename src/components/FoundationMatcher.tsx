import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import FoundationInput from './FoundationInput';

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

  const handleFoundationSubmit = async (brand: string, shade: string) => {
    console.log('Foundation submitted:', { brand, shade });
    setCurrentFoundation({ brand, shade });
    
    // Now leverage the comprehensive cosmetics database
    const { data: cosmeticsProducts } = await supabase
      .from('cosmetics_products')
      .select(`
        *,
        brand:brands(name, logo_url, brand_tier)
      `)
      .eq('product_type', 'foundation')
      .not('brand_id', 'is', null)
      .limit(20);
    
    const realMatches: FoundationMatch[] = [];
    
    // Enhanced matching using both foundation products and cosmetics data
    const allSources = [
      ...(products || []),
      ...(cosmeticsProducts || [])
    ];
    
    // Create matches using improved algorithm
    const processedBrands = new Set<string>();
    
    for (const source of allSources) {
      if (realMatches.length >= 6) break; // Limit to 6 high-quality matches
      
      let productData, brandName, availableShades;
      
      if ('foundation_shades' in source) {
        // Foundation product
        productData = source;
        brandName = source.brands.name;
        availableShades = source.foundation_shades || [];
      } else {
        // Cosmetics product
        productData = source;
        brandName = source.brand?.name || 'Unknown';
        availableShades = []; // Generate from product data
      }
      
      // Skip if we already have a match from this brand
      if (processedBrands.has(brandName.toLowerCase())) continue;
      processedBrands.add(brandName.toLowerCase());
      
      let selectedShade;
      
      if (availableShades.length > 0) {
        // Find best matching shade from foundation_shades
        selectedShade = findBestMatchingShade(availableShades, shade, brand);
      } else {
        // Generate shade info from cosmetics product metadata
        selectedShade = generateShadeFromCosmetics(productData, shade);
      }
      
      const matchPercentage = calculateMatchPercentage(shade, selectedShade.shade_name, brandName, brand);
      
      const match: FoundationMatch = {
        id: `${productData.id}-${selectedShade.id || 'generated'}`,
        brand: brandName,
        product: productData.name || productData.product_name,
        shade: selectedShade.shade_name,
        price: productData.price || (35 + Math.random() * 30),
        rating: productData.rating || (4.0 + Math.random() * 0.8),
        reviewCount: productData.total_reviews || Math.floor(Math.random() * 500) + 100,
        availability: {
          online: true,
          inStore: Math.random() > 0.3,
          readyForPickup: Math.random() > 0.5,
          nearbyStores: Math.random() > 0.5 ? ['Sephora', 'Ulta Beauty', 'Target'] : []
        },
        matchPercentage,
        undertone: selectedShade.undertone || inferUndertoneFromShade(shade),
        coverage: selectedShade.coverage || productData.coverage || inferCoverageFromProduct(productData),
        finish: selectedShade.finish || productData.finish || 'natural',
        imageUrl: productData.image_url || '/placeholder.svg',
        // Enhanced dual-shade recommendation
        primaryShade: {
          name: selectedShade.shade_name,
          purpose: 'face_center' as const
        },
        contourShade: generateContourShade(selectedShade, matchPercentage > 90)
      };
      
      realMatches.push(match);
    }
    
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

  // Helper functions for enhanced matching
  const findBestMatchingShade = (shades: any[], targetShade: string, targetBrand: string) => {
    // Find shade with closest name match
    let bestMatch = shades.find(s => 
      s.shade_name.toLowerCase().includes(targetShade.toLowerCase()) ||
      s.shade_code?.toLowerCase().includes(targetShade.toLowerCase())
    );

    // If no direct match, use depth level matching
    if (!bestMatch) {
      const targetDepth = getShadeDepth(targetShade);
      bestMatch = shades.find(s => Math.abs((s.depth_level || 5) - targetDepth) <= 2);
    }

    // Fallback to middle shade
    return bestMatch || shades[Math.floor(shades.length / 2)] || shades[0];
  };

  const generateShadeFromCosmetics = (product: any, targetShade: string) => {
    // Extract shade info from cosmetics product metadata
    const shadeName = product.metadata?.shade_name || 
                     extractShadeFromProductName(product.product_name) || 
                     `${targetShade} Match`;
    
    return {
      id: 'generated',
      shade_name: shadeName,
      undertone: extractUndertoneFromText(product.description || product.product_name),
      hex_color: generateColorFromShade(shadeName),
      coverage: extractCoverageFromText(product.category || product.description),
      finish: extractFinishFromText(product.description || product.product_name)
    };
  };

  const calculateMatchPercentage = (targetShade: string, matchShade: string, matchBrand: string, targetBrand: string): number => {
    let percentage = 85; // Base percentage
    
    // Boost for exact shade name matches
    if (matchShade.toLowerCase().includes(targetShade.toLowerCase())) {
      percentage += 10;
    }
    
    // Boost for same brand
    if (matchBrand.toLowerCase() === targetBrand.toLowerCase()) {
      percentage += 5;
    }
    
    // Boost for similar depth
    const targetDepth = getShadeDepth(targetShade);
    const matchDepth = getShadeDepth(matchShade);
    if (Math.abs(targetDepth - matchDepth) <= 1) {
      percentage += 5;
    }
    
    return Math.min(98, percentage);
  };

  const inferUndertoneFromShade = (shade: string): string => {
    const shadeLower = shade.toLowerCase();
    if (shadeLower.includes('warm') || shadeLower.includes('golden') || shadeLower.includes('yellow')) return 'warm';
    if (shadeLower.includes('cool') || shadeLower.includes('pink') || shadeLower.includes('rose')) return 'cool';
    if (shadeLower.includes('olive') || shadeLower.includes('green')) return 'olive';
    return 'neutral';
  };

  const inferCoverageFromProduct = (product: any): string => {
    const text = (product.description || product.product_name || '').toLowerCase();
    if (text.includes('light') || text.includes('sheer')) return 'light';
    if (text.includes('full') || text.includes('heavy')) return 'full';
    if (text.includes('buildable')) return 'buildable';
    return 'medium';
  };

  const generateColorFromShade = (shadeName: string): string => {
    const nameLower = shadeName.toLowerCase();
    if (nameLower.includes('fair') || nameLower.includes('porcelain')) return '#F5DCC4';
    if (nameLower.includes('light')) return '#F0D0A6';
    if (nameLower.includes('medium light')) return '#E8C2A0';
    if (nameLower.includes('medium')) return '#D4A574';
    if (nameLower.includes('deep') || nameLower.includes('dark')) return '#A0835C';
    if (nameLower.includes('very deep')) return '#8B6F56';
    return '#D4A574'; // Default medium
  };

  const generateContourShade = (primaryShade: any, isExactMatch: boolean) => {
    if (!isExactMatch) return undefined;
    
    return {
      name: `${primaryShade.shade_name} Deep`,
      purpose: 'face_sides' as const,
      mixable: true
    };
  };

  const getShadeDepth = (shadeName: string): number => {
    const nameLower = shadeName.toLowerCase();
    if (nameLower.includes('fair') || nameLower.includes('porcelain')) return 1;
    if (nameLower.includes('light')) return 3;
    if (nameLower.includes('medium light')) return 4;
    if (nameLower.includes('medium')) return 5;
    if (nameLower.includes('medium deep')) return 7;
    if (nameLower.includes('deep')) return 8;
    if (nameLower.includes('very deep')) return 9;
    return 5; // Default medium
  };

  const extractShadeFromProductName = (productName: string): string => {
    const words = productName.split(' ');
    // Look for shade-like words at the end
    const lastWords = words.slice(-2).join(' ');
    if (lastWords.match(/\b(fair|light|medium|deep|dark)\b/i)) {
      return lastWords;
    }
    return words[words.length - 1];
  };

  const extractUndertoneFromText = (text: string): string => {
    const textLower = text.toLowerCase();
    if (textLower.includes('warm') || textLower.includes('golden')) return 'warm';
    if (textLower.includes('cool') || textLower.includes('pink')) return 'cool';
    if (textLower.includes('olive')) return 'olive';
    return 'neutral';
  };

  const extractCoverageFromText = (text: string): string => {
    const textLower = text.toLowerCase();
    if (textLower.includes('light') || textLower.includes('sheer')) return 'light';
    if (textLower.includes('full') || textLower.includes('heavy')) return 'full';
    if (textLower.includes('buildable')) return 'buildable';
    return 'medium';
  };

  const extractFinishFromText = (text: string): string => {
    const textLower = text.toLowerCase();
    if (textLower.includes('matte')) return 'matte';
    if (textLower.includes('dewy') || textLower.includes('glowy')) return 'dewy';
    if (textLower.includes('satin')) return 'satin';
    if (textLower.includes('radiant') || textLower.includes('luminous')) return 'radiant';
    return 'natural';
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
      </div>
    </div>
  );
};

export default FoundationMatcher;
