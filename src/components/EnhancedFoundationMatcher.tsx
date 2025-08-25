import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import SkinToneSlider from './SkinToneSlider';
import FoundationPairResults from './FoundationPairResults';
import QuestionnaireFlow from './QuestionnaireFlow';
import FoundationSearchInput from './FoundationSearchInput';
import FulfillmentOptions from './FulfillmentOptions';
import FoundationBrandChart from './FoundationBrandChart';
import InclusiveShadeMatchingInterface from './InclusiveShadeMatchingInterface';
import { FoundationMatch } from '../types/foundation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Palette, Camera, Search, Sparkles } from 'lucide-react';
import { 
  findBestShadeMatches, 
  SkinToneAnalysis, 
  UserPreferences,
  ShadeMatch,
  generateShadeName,
  extractFinish,
  extractCoverage
} from '../lib/shadeMatching';

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

const EnhancedFoundationMatcher = () => {
  const [skinTone, setSkinTone] = useState<SkinToneData | null>(null);
  const [foundationPairs, setFoundationPairs] = useState<FoundationMatch[][]>([]);
  const [selectedMatch, setSelectedMatch] = useState<FoundationMatch | null>(null);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [userAnswers, setUserAnswers] = useState<UserQuestionnaireData | null>(null);
  const [searchResults, setSearchResults] = useState<FoundationMatch[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<FoundationMatch[]>([]);
  const [showFulfillment, setShowFulfillment] = useState(false);
  const [inclusiveAnalysis, setInclusiveAnalysis] = useState<any>(null);

  // Fetch cosmetics products from ALL datasets
  const { data: cosmeticsProducts } = useQuery({
    queryKey: ['cosmetics-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cosmetics_products')
        .select(`
          *,
          brand:brands(name, logo_url, brand_tier)
        `)
        .eq('product_type', 'foundation')
        .not('brand_id', 'is', null)
        .order('rating', { ascending: false })
        .limit(300); // Increased to get more variety
      
      if (error) throw error;
      console.log(`Loaded ${data?.length || 0} cosmetics products from GCS datasets`);
      return data;
    },
  });

  // Fetch foundation products and shades
  const { data: foundationProducts } = useQuery({
    queryKey: ['foundation-products-with-shades'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('foundation_products')
        .select(`
          *,
          brands!inner(name, logo_url),
          foundation_shades(*)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      console.log(`Loaded ${data?.length || 0} foundation products with shades`);
      return data;
    },
  });

  const handleSkinToneSelect = (toneData: SkinToneData) => {
    setSkinTone(toneData);
    generateFoundationPairs(toneData, userAnswers);
  };

  const handleQuestionnaireComplete = (answers: UserQuestionnaireData) => {
    setUserAnswers(answers);
    if (skinTone) {
      generateFoundationPairs(skinTone, answers);
    }
  };

  const handleInclusiveAnalysis = (analysis: any) => {
    setInclusiveAnalysis(analysis);
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
    // Generate pairs immediately, with or without questionnaire data
    generateFoundationPairs(skinToneData, userAnswers);
  };

  const generateFoundationPairs = async (toneData: SkinToneData, questionnaire?: UserQuestionnaireData | null) => {
    const allProducts = [
      ...(foundationProducts || []),
      ...(cosmeticsProducts || [])
    ];
    
    console.log(`Generating pairs from ${allProducts.length} total products (${foundationProducts?.length || 0} foundation + ${cosmeticsProducts?.length || 0} cosmetics)`);

    // Convert to SkinToneAnalysis format for the new matching system
    const skinToneAnalysis: SkinToneAnalysis = {
      hexColor: toneData.hexColor,
      depth: toneData.depth,
      undertone: toneData.undertone
    };

    // Convert questionnaire to UserPreferences format
    const userPreferences: UserPreferences = questionnaire ? {
      skinType: questionnaire.skinType,
      preferredCoverage: questionnaire.preferredCoverage,
      preferredFinish: questionnaire.preferredFinish,
      hairColor: questionnaire.hairColor,
      eyeColor: questionnaire.eyeColor
    } : {};

    // Use the new accurate shade matching system
    const bestMatches = findBestShadeMatches(
      allProducts, 
      skinToneAnalysis, 
      userPreferences, 
      20 // Get more matches to ensure brand diversity
    );

    // Group matches by brand for diversity
    const matchesByBrand = new Map<string, ShadeMatch[]>();
    for (const match of bestMatches) {
      const brandName = getBrandName(match.product);
      if (!matchesByBrand.has(brandName)) {
        matchesByBrand.set(brandName, []);
      }
      matchesByBrand.get(brandName)!.push(match);
    }

    // Create foundation pairs with diverse brands
    const pairs: FoundationMatch[][] = [];
    for (const [brandName, brandMatches] of matchesByBrand) {
      if (pairs.length >= 4) break;

      const bestMatch = brandMatches[0]; // Best match for this brand
      const primaryMatch = createAccurateFoundationMatch(
        bestMatch, 
        skinToneAnalysis, 
        'primary'
      );

      // Find contour shade using the local function with correct signature
      const contourShade = findContourShade(
        bestMatch.product, 
        skinToneAnalysis.depth + 1, 
        skinToneAnalysis.undertone
      );
      
      const contourMatch = createAccurateFoundationMatch(
        { ...bestMatch, shade: contourShade },
        skinToneAnalysis,
        'contour'
      );

      pairs.push([primaryMatch, contourMatch]);
    }
    
    // Limit to 4 pairs as requested
    setFoundationPairs(pairs.slice(0, 4));
  };

  // Helper functions
  const getBrandName = (product: any): string => {
    return product.brands?.name || product.brand?.name || 'Unknown Brand';
  };

  const findContourShade = (product: any, depth: number, undertone: string) => {
    if (product.foundation_shades?.length > 0) {
      return product.foundation_shades.find((shade: any) => 
        Math.abs((shade.depth_level || 5) - depth) <= 1 &&
        (shade.undertone === undertone || shade.undertone === 'neutral')
      ) || product.foundation_shades[Math.floor(product.foundation_shades.length * 0.7)];
    }
    
    return {
      id: 'generated-contour',
      shade_name: generateShadeName(depth, undertone),
      depth_level: depth,
      undertone: undertone
    };
  };

  // Create an accurate foundation match using the new shade matching results
  const createAccurateFoundationMatch = (
    shadeMatch: ShadeMatch, 
    skinToneAnalysis: SkinToneAnalysis, 
    type: 'primary' | 'contour'
  ): FoundationMatch => {
    // Get the actual hex color from the shade data if available
    const hexColor = shadeMatch.shade?.hex_color || 
                    (shadeMatch.shade as any)?.hexColor ||
                    skinToneAnalysis.hexColor;

    return {
      id: `${shadeMatch.product.id}-${shadeMatch.shade.id || 'generated'}-${type}`,
      brand: getBrandName(shadeMatch.product),
      product: shadeMatch.product.name || shadeMatch.product.product_name,
      shade: shadeMatch.shade.shade_name || generateShadeName(skinToneAnalysis.depth, skinToneAnalysis.undertone),
      price: shadeMatch.product.price || (30 + Math.random() * 40),
      rating: shadeMatch.product.rating || (4.0 + Math.random() * 0.8),
      reviewCount: shadeMatch.product.total_reviews || Math.floor(Math.random() * 300) + 50,
      availability: {
        online: true,
        inStore: Math.random() > 0.4,
        readyForPickup: Math.random() > 0.6,
        nearbyStores: Math.random() > 0.5 ? ['Sephora', 'Ulta Beauty'] : []
      },
      matchPercentage: Math.round(shadeMatch.matchPercentage), // Use accurate color science percentage
      undertone: skinToneAnalysis.undertone,
      coverage: shadeMatch.shade.coverage || extractCoverage(shadeMatch.product) || 'medium',
      finish: shadeMatch.shade.finish || extractFinish(shadeMatch.product) || 'natural',
      imageUrl: shadeMatch.product.image_url || '/placeholder.svg',
      hexColor: hexColor, // Add the actual hex color to the match
      primaryShade: type === 'primary' ? {
        name: shadeMatch.shade.shade_name || generateShadeName(skinToneAnalysis.depth, skinToneAnalysis.undertone),
        purpose: 'face_center' as const
      } : undefined,
      contourShade: type === 'contour' ? {
        name: shadeMatch.shade.shade_name || generateShadeName(skinToneAnalysis.depth + 1, skinToneAnalysis.undertone),
        purpose: 'face_sides' as const,
        mixable: true
      } : undefined
    };
  };

  const handleTryVirtual = (match: FoundationMatch) => {
    setSelectedMatch(match);
  };

  const handleSearchResults = (matches: FoundationMatch[]) => {
    setSearchResults(matches);
    setFoundationPairs([]); // Clear pairs when using search
  };

  const handleProductSelection = (products: FoundationMatch[]) => {
    setSelectedProducts(products);
    setShowFulfillment(true);
  };

  const handlePurchase = (fulfillmentMethod: string, products: FoundationMatch[]) => {
    console.log('Processing purchase:', { fulfillmentMethod, products });
    // Here you would integrate with your backend to:
    // 1. Apply affiliate codes
    // 2. Process the order through the selected fulfillment method
    // 3. Handle payment processing
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column - Camera & Upload */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4 text-center">Capture Your Shade</h2>
            <InclusiveShadeMatchingInterface
              onAnalysisComplete={handleInclusiveAnalysis}
              onUpgradeClick={() => window.open('/subscription-plans', '_blank')}
            />
          </Card>
        </div>

        {/* Right Column - Search & Recommendations */}
        <div className="lg:col-span-2 space-y-8">
          {/* Brand Search - Always Visible */}
          <FoundationSearchInput onMatchFound={handleSearchResults} />

          {/* Visual Shade Matching */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-6 text-center">Manual Shade Selection</h2>
            <div className="space-y-6">
              <SkinToneSlider onSkinToneSelect={handleSkinToneSelect} />
              
              {!skinTone && (
                <Card className="p-6 text-center">
                  <div className="space-y-4">
                    <Palette className="w-12 h-12 mx-auto text-muted-foreground" />
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Visual Shade Matching</h3>
                      <p className="text-muted-foreground">
                        Use the slider above to match your skin tone visually and get instant recommendations
                      </p>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </Card>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Search Results</h3>
              <div className="space-y-4">
                {searchResults.map((match) => (
                  <div key={match.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <img src={match.imageUrl} alt={match.product} className="w-12 h-12 rounded" />
                      <div>
                        <h4 className="font-medium">{match.brand} {match.product}</h4>
                        <p className="text-sm text-muted-foreground">Shade: {match.shade}</p>
                        <p className="text-sm font-medium">${match.price}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleTryVirtual(match)}>
                        Try Virtual
                      </Button>
                      <Button size="sm" onClick={() => handleProductSelection([match])}>
                        Purchase
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Foundation Pair Results */}
          {foundationPairs.length > 0 && (
            <FoundationPairResults
              pairs={foundationPairs}
              onTryVirtual={handleTryVirtual}
              onSelectPair={handleProductSelection}
            />
          )}

          {/* Fulfillment Options */}
          {showFulfillment && selectedProducts.length > 0 && (
            <FulfillmentOptions
              products={selectedProducts}
              onPurchase={handlePurchase}
            />
          )}
        </div>
      </div>

      {/* Foundation Brand Chart */}
      <div className="mt-12">
        <FoundationBrandChart />
      </div>

      {/* Questionnaire Modal */}
      {showQuestionnaire && (
        <QuestionnaireFlow
          onComplete={handleQuestionnaireComplete}
          onClose={() => setShowQuestionnaire(false)}
        />
      )}
    </div>
  );
};

export default EnhancedFoundationMatcher;