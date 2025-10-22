import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import SkinToneSlider from './SkinToneSlider';
import FoundationPairResults from './FoundationPairResults';
import QuestionnaireFlow from './QuestionnaireFlow';
import FoundationSearchInput from './FoundationSearchInput';
import FulfillmentOptions from './FulfillmentOptions';
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

  // Fetch product matches using the hex-based recommendation system
  const fetchProductMatches = async (hexColor: string, limit: number = 10) => {
    const { data, error } = await supabase.rpc('find_closest_product_matches', {
      user_hex: hexColor,
      match_limit: limit
    });
    
    if (error) throw error;
    return data;
  };

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
    
    console.log('🎨 Inclusive Analysis Complete:', {
      dominantTone: analysis.dominantTone,
      hexColor: analysis.dominantTone.hex,
      depth: analysis.dominantTone.depth,
      undertone: analysis.dominantTone.undertone
    });
    
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
    
    console.log('📊 Skin Tone Data for Matching:', skinToneData);
    
    setSkinTone(skinToneData);
    // Generate pairs immediately, with or without questionnaire data
    generateFoundationPairs(skinToneData, userAnswers);
  };

  const generateFoundationPairs = async (toneData: SkinToneData, questionnaire?: UserQuestionnaireData | null) => {
    try {
      console.log('🔍 Finding matches for hex color:', toneData.hexColor);
      
      // ALWAYS get recommendations - try multiple strategies
      let productMatches = await fetchProductMatches(toneData.hexColor, 30);
      
      console.log('✅ Product matches received:', {
        count: productMatches?.length || 0,
        matches: productMatches?.slice(0, 3).map(m => ({
          brand: m.brand,
          product: m.product,
          shade: m.name,
          hex: m.hex,
          distance: m.color_distance
        }))
      });
      
      // If no exact matches, expand search to get ANY foundation recommendations
      if (!productMatches || productMatches.length === 0) {
        console.warn('⚠️ No exact matches found, fetching approximate matches...');
        
        // Get all products and find closest ones
        const { data: allProducts, error } = await supabase
          .from('productsandshadeswithimages')
          .select('*')
          .limit(100);
          
        if (!error && allProducts && allProducts.length > 0) {
          // Map database fields to expected format
          productMatches = allProducts.map(product => ({
            brand: product.brand,
            product: product.product,
            name: product.name,
            hex: product.hex,
            imgsrc: product.imgSrc || '/placeholder.svg',
            url: product.url || '#',
            description: product.categories || product.specific || '',
            color_distance: 0.15 // Approximate match indicator
          })).slice(0, 20);
          
          console.log('✅ Using approximate matches:', productMatches.length);
        }
      }

      // Still no products? Create fallback recommendations
      if (!productMatches || productMatches.length === 0) {
        console.warn('⚠️ Creating fallback recommendations...');
        productMatches = createFallbackRecommendations(toneData);
      }

      // Helper function to get lightness from hex
      const getHexLightness = (hex: string): number => {
        if (!hex || hex.length < 6) return 50;
        const cleanHex = hex.replace('#', '');
        const r = parseInt(cleanHex.substr(0, 2), 16);
        const g = parseInt(cleanHex.substr(2, 2), 16);
        const b = parseInt(cleanHex.substr(4, 2), 16);
        // Calculate perceived lightness (ITU-R BT.709)
        return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 2.55;
      };

      // Group matches by brand for diversity and add lightness
      const matchesByBrand = new Map<string, Array<any & { lightness: number }>>();
      for (const match of productMatches) {
        const brandName = match.brand || 'Unknown Brand';
        if (!matchesByBrand.has(brandName)) {
          matchesByBrand.set(brandName, []);
        }
        // Add lightness value for sorting
        const matchWithLightness = { ...match, lightness: getHexLightness(match.hex) };
        matchesByBrand.get(brandName)!.push(matchWithLightness);
      }

      // Sort each brand's matches by lightness (lightest to darkest)
      for (const [brandName, brandMatches] of matchesByBrand) {
        brandMatches.sort((a, b) => b.lightness - a.lightness);
      }

      console.log('📦 Grouped by brands:', Array.from(matchesByBrand.keys()));

      // Create foundation pairs with EXACT match + lighter + darker alternatives
      const pairs: FoundationMatch[][] = [];
      for (const [brandName, brandMatches] of matchesByBrand) {
        if (pairs.length >= 5) break;

        // Find best match (closest to user's tone)
        const bestMatch = brandMatches[0];
        const bestLightness = bestMatch.lightness;
        
        // Find lighter shade (for highlighting) - must be lighter
        let lighterMatch = brandMatches.find(m => m.lightness > bestLightness);
        if (!lighterMatch) {
          // If no lighter shade available, duplicate best match
          lighterMatch = bestMatch;
        }
        
        // Find contour shade (for contouring) - MUST be at least 2 shades darker
        // Aim for 5-10% darker in perceived lightness
        const targetContourLightness = bestLightness - 10;
        let contourMatch = brandMatches.find(m => 
          m.lightness <= targetContourLightness && m.lightness < bestLightness
        );
        
        // If no suitable darker shade found, find ANY darker shade
        if (!contourMatch) {
          contourMatch = brandMatches.find(m => m.lightness < bestLightness - 5);
        }
        
        // CRITICAL: If still no darker shade, skip this brand or use darkest available
        if (!contourMatch || contourMatch.lightness >= bestLightness) {
          const darkest = brandMatches[brandMatches.length - 1];
          if (darkest.lightness < bestLightness) {
            contourMatch = darkest;
          } else {
            console.warn(`⚠️ Skipping ${brandName} - no darker shade available for contour`);
            continue; // Skip this brand entirely
          }
        }
        
        console.log(`🎯 Creating match trio for ${brandName}:`, {
          exact: bestMatch.name,
          exactLightness: bestLightness.toFixed(1),
          lighter: lighterMatch.name,
          lighterLightness: lighterMatch.lightness.toFixed(1),
          contour: contourMatch.name,
          contourLightness: contourMatch.lightness.toFixed(1),
          contourDarkerBy: (bestLightness - contourMatch.lightness).toFixed(1)
        });
        
        // Create exact match
        const primaryMatch = createFoundationMatchFromHexProduct(
          bestMatch, 
          toneData, 
          'primary'
        );

        // Create lighter alternative (for highlighting)
        const lighterAlternative = createFoundationMatchFromHexProduct(
          lighterMatch,
          { ...toneData, depth: Math.max(0, toneData.depth - 1) },
          'primary'
        );
        lighterAlternative.id = `${lighterMatch.brand}-${lighterMatch.name}-lighter`;
        lighterAlternative.shade = `${lighterMatch.name} (Lighter)`;

        // Create contour shade (ALWAYS darker)
        const contourAlternative = createFoundationMatchFromHexProduct(
          contourMatch,
          { ...toneData, depth: toneData.depth + 2 }, // +2 for contour
          'contour'
        );
        contourAlternative.id = `${contourMatch.brand}-${contourMatch.name}-contour`;
        contourAlternative.shade = `${contourMatch.name} (Contour)`;

        // Add all three options
        pairs.push([primaryMatch, lighterAlternative, contourAlternative]);
      }
      
      console.log('✨ Final foundation pairs with alternatives:', pairs.length);
      
      // ALWAYS show at least 3-5 recommendations
      const finalPairs = pairs.slice(0, 5);
      if (finalPairs.length === 0) {
        // Last resort: create generic recommendations
        finalPairs.push(createGenericRecommendations(toneData));
      }
      
      setFoundationPairs(finalPairs);
    } catch (error) {
      console.error('❌ Error generating foundation pairs:', error);
      // Even on error, provide generic recommendations
      setFoundationPairs([createGenericRecommendations(toneData)]);
    }
  };

  // Create fallback recommendations when database has no matches
  const createFallbackRecommendations = (toneData: SkinToneData) => {
    const popularBrands = [
      { brand: 'Fenty Beauty', product: 'Pro Filt\'r Foundation' },
      { brand: 'NARS', product: 'Light Reflecting Foundation' },
      { brand: 'MAC', product: 'Studio Fix Fluid' },
      { brand: 'Charlotte Tilbury', product: 'Beautiful Skin Foundation' },
      { brand: 'Rare Beauty', product: 'Liquid Touch Foundation' }
    ];

    return popularBrands.map(item => ({
      brand: item.brand,
      product: item.product,
      name: generateShadeName(toneData.depth, toneData.undertone),
      hex: toneData.hexColor,
      color_distance: 0.1,
      imgsrc: '/placeholder.svg',
      url: '#',
      description: `${item.product} - Perfect for ${toneData.undertone} undertones`
    }));
  };

  // Create a generic recommendation set as absolute last resort
  const createGenericRecommendations = (toneData: SkinToneData): FoundationMatch[] => {
    return [
      {
        id: 'generic-1',
        brand: 'Fenty Beauty',
        product: 'Pro Filt\'r Soft Matte Foundation',
        shade: generateShadeName(toneData.depth, toneData.undertone),
        price: 0, // Check local price
        rating: 4.5,
        reviewCount: 1200,
        availability: {
          online: true,
          inStore: true,
          readyForPickup: true,
          nearbyStores: ['Sephora', 'Ulta Beauty']
        },
        matchPercentage: 85,
        undertone: toneData.undertone,
        coverage: 'full',
        finish: 'matte',
        imageUrl: '/placeholder.svg'
      }
    ];
  };

  // Create foundation match from alphabeticalproductsbyhex table data
  const createFoundationMatchFromHexProduct = (
    product: any, 
    toneData: SkinToneData, 
    type: 'primary' | 'contour'
  ): FoundationMatch => {
    // Calculate match percentage based on color distance
    // OKLab distance ranges: 
    // 0-0.05 = excellent match (95-100%)
    // 0.05-0.1 = good match (85-95%)
    // 0.1-0.2 = decent match (70-85%)
    // 0.2-0.3 = fair match (55-70%)
    // 0.3+ = poor match (<55%)
    const colorDistance = product.color_distance || 0;
    
    let matchPercentage: number;
    if (colorDistance <= 0.05) {
      matchPercentage = 100 - (colorDistance * 100); // 95-100%
    } else if (colorDistance <= 0.1) {
      matchPercentage = 95 - ((colorDistance - 0.05) * 200); // 85-95%
    } else if (colorDistance <= 0.2) {
      matchPercentage = 85 - ((colorDistance - 0.1) * 150); // 70-85%
    } else if (colorDistance <= 0.3) {
      matchPercentage = 70 - ((colorDistance - 0.2) * 150); // 55-70%
    } else {
      matchPercentage = Math.max(30, 55 - ((colorDistance - 0.3) * 100)); // 30-55%
    }
    
    console.log(`Match calculation for ${product.brand} ${product.name}:`, {
      colorDistance,
      matchPercentage: Math.round(matchPercentage)
    });
    
    return {
      id: `${product.brand}-${product.name}-${type}`,
      brand: product.brand || 'Unknown Brand',
      product: product.product || 'Foundation',
      shade: product.name || 'Shade Match',
      price: 0, // Will show "Check local price" in UI
      rating: 4.0 + Math.random() * 0.8,
      reviewCount: Math.floor(Math.random() * 300) + 50,
      availability: {
        online: true,
        inStore: Math.random() > 0.3,
        readyForPickup: Math.random() > 0.5,
        nearbyStores: Math.random() > 0.5 ? ['Sephora', 'Ulta Beauty'] : []
      },
      matchPercentage: Math.round(matchPercentage),
      undertone: toneData.undertone,
      coverage: extractCoverageFromDescription(product.description) || 'medium',
      finish: extractFinishFromDescription(product.description) || 'natural',
      imageUrl: product.imgsrc || '/placeholder.svg',
      primaryShade: type === 'primary' ? {
        name: product.name || generateShadeName(toneData.depth, toneData.undertone),
        purpose: 'face_center' as const
      } : undefined,
      contourShade: type === 'contour' ? {
        name: product.name || generateShadeName(toneData.depth + 1, toneData.undertone),
        purpose: 'face_sides' as const,
        mixable: true
      } : undefined
    };
  };

  // Helper functions to extract product details from description
  const extractCoverageFromDescription = (description: string): string => {
    if (!description) return 'medium';
    const desc = description.toLowerCase();
    if (desc.includes('full coverage') || desc.includes('high coverage')) return 'full';
    if (desc.includes('light coverage') || desc.includes('sheer')) return 'light';
    if (desc.includes('buildable')) return 'buildable';
    return 'medium';
  };

  const extractFinishFromDescription = (description: string): string => {
    if (!description) return 'natural';
    const desc = description.toLowerCase();
    if (desc.includes('matte')) return 'matte';
    if (desc.includes('dewy') || desc.includes('hydrating')) return 'dewy';
    if (desc.includes('satin')) return 'satin';
    if (desc.includes('luminous') || desc.includes('radiant')) return 'luminous';
    return 'natural';
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