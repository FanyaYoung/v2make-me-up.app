import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import FoundationInput from './FoundationInput';
import VirtualTryOn from './VirtualTryOn';
import InclusiveShadeMatchingInterface from './InclusiveShadeMatchingInterface';
import ColorMatchingTest from './ColorMatchingTest';
import OptionalUserInfo from './OptionalUserInfo';
import FoundationResults from './FoundationResults';
import { FoundationMatch } from '../types/foundation';
import { hexToRgb, rgbToXyz, xyzToLab, deltaE2000 } from '../lib/colorUtils';

interface SkinToneData {
  hexColor: string;
  depth: number;
  undertone: string;
}

interface UserQuestionnaireData {
  hairColor: string;
  eyeColor: string;
  skinType: string;
  preferredCoverage: string;
  preferredFinish: string;
}

const FoundationMatcher = () => {
  const [currentFoundation, setCurrentFoundation] = useState<{brand: string, shade: string, userHexColor: string} | null>(null);
  const [matches, setMatches] = useState<FoundationMatch[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<FoundationMatch | null>(null);
  const [skinTone, setSkinTone] = useState<SkinToneData | null>(null);

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

  const handleInclusiveAnalysis = (analysis: { dominantTone: { hex: string; depth: string; undertone: string; }; }) => {
    // Convert inclusive analysis to skin tone data for compatibility
    const depthMap: Record<string, number> = {
      'fair': 2,
      'light': 3,
      'medium': 5,
      'tan': 7,
      'deep': 8,
      'very-deep': 9
    };

    const skinToneData: SkinToneData = {
      hexColor: analysis.dominantTone.hex,
      depth: depthMap[analysis.dominantTone.depth] || 5,
      undertone: analysis.dominantTone.undertone
    };
    setSkinTone(skinToneData);
    // Trigger foundation matching with the new skin tone data
    generateFoundationPairs(skinToneData);
  };

  const generateFoundationPairs = async (toneData: SkinToneData) => {
    try {
      // Fetch all foundation products with their shades
      const { data: foundationProductsData, error: productsError } = await supabase
        .from('foundation_products')
        .select(`
          *,
          brands!inner(name, logo_url),
          foundation_shades(*)
        `)
        .eq('is_active', true);

      if (productsError) {
        console.error('Error fetching foundation products:', productsError);
        return;
      }

      const allFoundationShades: any[] = [];
      foundationProductsData?.forEach(product => {
        product.foundation_shades.forEach((shade: any) => {
          allFoundationShades.push({
            ...shade,
            product_id: product.id,
            product_name: product.name,
            brand_name: product.brands.name,
            brand_logo_url: product.brands.logo_url,
            product_image_url: product.image_url,
            product_price: product.price,
            product_rating: 4.2, // Default rating since it's not in the schema
            product_reviewCount: 150, // Default review count since it's not in the schema
            product_coverage: product.coverage,
            product_finish: product.finish,
          });
        });
      });

      if (!allFoundationShades.length) {
        console.log('No foundation shades available for matching.');
        setMatches([]);
        return;
      }

      const userRgb = hexToRgb(toneData.hexColor);
      if (!userRgb) {
        console.error('Invalid user hex color:', toneData.hexColor);
        setMatches([]);
        return;
      }
      const userLab = xyzToLab(rgbToXyz(userRgb));

      const potentialMatches: { shade: any; deltaE: number }[] = [];

      for (const shade of allFoundationShades) {
        if (shade.hex_color) {
          const shadeRgb = hexToRgb(shade.hex_color);
          if (shadeRgb) {
            const shadeLab = xyzToLab(rgbToXyz(shadeRgb));
            const de = deltaE2000(userLab, shadeLab);
            potentialMatches.push({ shade, deltaE: de });
          }
        }
      }

      // Sort by Delta E (lower is better)
      potentialMatches.sort((a, b) => a.deltaE - b.deltaE);

      const realMatches: FoundationMatch[] = [];
      const processedBrands = new Set<string>();
      const maxMatches = 6; // Limit the number of matches

      for (const { shade, deltaE } of potentialMatches) {
        if (realMatches.length >= maxMatches) break;

        const brandName = shade.brand_name;
        if (processedBrands.has(brandName.toLowerCase())) continue; // Ensure brand diversity
        processedBrands.add(brandName.toLowerCase());

        let matchPercentage = 100 - (deltaE * 2); // Simple mapping from Delta E to percentage
        if (matchPercentage < 0) matchPercentage = 0;
        matchPercentage = Math.round(matchPercentage);

        const match: FoundationMatch = {
          id: `${shade.product_id}-${shade.id}`,
          brand: brandName,
          product: shade.product_name,
          shade: shade.shade_name,
          price: shade.product_price || 35 + Math.random() * 30,
          rating: shade.product_rating || 4.0 + Math.random() * 0.8,
          reviewCount: shade.product_reviewCount || Math.floor(Math.random() * 500) + 100,
          availability: {
            online: true,
            inStore: Math.random() > 0.3,
            readyForPickup: Math.random() > 0.5,
            nearbyStores: Math.random() > 0.5 ? ['Sephora', 'Ulta Beauty', 'Target'] : []
          },
          matchPercentage,
          undertone: shade.undertone || inferUndertoneFromShade(shade.shade_name),
          coverage: shade.coverage || shade.product_coverage || 'medium',
          finish: shade.finish || shade.product_finish || 'natural',
          imageUrl: shade.product_image_url || '/placeholder.svg',
          primaryShade: {
            name: shade.shade_name,
            purpose: 'face_center' as const
          },
          contourShade: undefined // For simplicity, not generating contour shades with CIELAB for now
        };
        realMatches.push(match);
      }

      setMatches(realMatches);
      console.log('Generated CIELAB matches:', realMatches);

    } catch (error) {
      console.error('Error generating foundation pairs with CIELAB:', error);
      setMatches([]);
    }
  };

  const handleFoundationSubmit = async (brand: string, shade: string, userHexColor: string) => {
    console.log('Foundation submitted:', { brand, shade, userHexColor });
    setCurrentFoundation({ brand, shade, userHexColor });

    let effectiveSkinTone: SkinToneData | null = skinTone; // Prioritize AI-detected skin tone

    if (!effectiveSkinTone && userHexColor) {
      // If no AI skin tone, try to infer from manual hex input
      const inferredDepth = getShadeDepth(shade); // Use existing helper to infer depth
      const inferredUndertone = inferUndertoneFromShade(shade); // Use existing helper to infer undertone

      effectiveSkinTone = {
        hexColor: userHexColor,
        depth: inferredDepth,
        undertone: inferredUndertone
      };
    }

    if (effectiveSkinTone) {
      generateFoundationPairs(effectiveSkinTone);
    } else {
      console.warn('No skin tone data available for matching. Please use AI analysis or provide a hex color.');
      setMatches([]); // Clear matches if no valid input
    }
  };

  // Helper functions
  const inferUndertoneFromShade = (shade: string): string => {
    const shadeLower = shade.toLowerCase();
    if (shadeLower.includes('warm') || shadeLower.includes('golden') || shadeLower.includes('yellow')) return 'warm';
    if (shadeLower.includes('cool') || shadeLower.includes('pink') || shadeLower.includes('rose')) return 'cool';
    if (shadeLower.includes('olive') || shadeLower.includes('green')) return 'olive';
    return 'neutral';
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
          
          {/* AI Skin Tone Analysis */}
          <InclusiveShadeMatchingInterface
            onAnalysisComplete={handleInclusiveAnalysis}
            onUpgradeClick={() => console.log('Upgrade clicked')} // Placeholder for actual upgrade logic
          />
          
          {/* CIELAB Color Matching Test */}
          <ColorMatchingTest />
          
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