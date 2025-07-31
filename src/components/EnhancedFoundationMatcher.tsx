import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import SkinToneSlider from './SkinToneSlider';
import NaturalSkinToneSelector from './NaturalSkinToneSelector';
import VirtualTryOn from './VirtualTryOn';
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
  const [shadeFinderRecommendations, setShadeFinderRecommendations] = useState<FoundationMatch[]>([]);

  // Fetch cosmetics products
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
        .limit(100);
      
      if (error) throw error;
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
        .eq('is_active', true);
      
      if (error) throw error;
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
    // Always generate foundation pairs after analysis, regardless of questionnaire status
    generateFoundationPairs(skinToneData, userAnswers);
  };

  const generateFoundationPairs = async (toneData: SkinToneData, questionnaire?: UserQuestionnaireData | null) => {
    try {
      // Query database for diverse brand recommendations
      const { data: foundationShades, error } = await supabase
        .from('foundation_shades')
        .select(`
          *,
          foundation_products!inner(
            *,
            brands!inner(name, logo_url)
          )
        `)
        .eq('undertone', toneData.undertone as 'warm' | 'cool' | 'neutral' | 'olive')
        .gte('depth_level', Math.max(1, toneData.depth - 2))
        .lte('depth_level', Math.min(10, toneData.depth + 2))
        .eq('is_available', true)
        .limit(50); // Get more results for better brand diversity

      if (error) {
        console.error('Error fetching foundation shades:', error);
        // Fall back to existing logic if database query fails
        const allProducts = [
          ...(foundationProducts || []),
          ...(cosmeticsProducts || [])
        ];
        const suitableProducts = filterProductsByToneAndPreferences(allProducts, toneData, questionnaire);
        const pairs = createFoundationPairs(suitableProducts, toneData);
        setFoundationPairs(pairs.slice(0, 4));
        return;
      }

      // Group shades by brand for diversity
      const shadesByBrand = new Map<string, any[]>();
      foundationShades?.forEach(shade => {
        const brandName = shade.foundation_products.brands.name;
        if (!shadesByBrand.has(brandName)) {
          shadesByBrand.set(brandName, []);
        }
        shadesByBrand.get(brandName)!.push(shade);
      });

      // Create diverse foundation pairs from different brands
      const pairs: FoundationMatch[][] = [];
      const recommendations: FoundationMatch[] = [];
      const maxPairsPerBrand = 1; // Ensure brand diversity
      
      for (const [brandName, shades] of shadesByBrand) {
        if (pairs.length >= 4) break; // Limit to 4 pairs as requested
        
        // Find best shade match for this brand
        const bestShade = shades.find(shade => 
          Math.abs((shade.depth_level || 5) - toneData.depth) <= 1
        ) || shades[0];
        
        if (bestShade) {
          const product = bestShade.foundation_products;
          
          // Create primary shade
          const primaryMatch: FoundationMatch = {
            id: `${product.id}-${bestShade.id}-primary`,
            brand: brandName,
            product: product.name,
            shade: bestShade.shade_name,
            price: product.price || 36,
            rating: 4.3 + (pairs.length * 0.1),
            reviewCount: 800 + (pairs.length * 100),
            availability: {
              online: true,
              inStore: pairs.length < 2,
              readyForPickup: pairs.length < 2,
              nearbyStores: pairs.length < 2 ? ['Sephora', 'Ulta Beauty'] : []
            },
            matchPercentage: 95 - (pairs.length * 2),
            undertone: bestShade.undertone,
            coverage: product.coverage || 'medium',
            finish: product.finish || 'natural',
            imageUrl: product.image_url || '/placeholder.svg',
            primaryShade: {
              name: bestShade.shade_name,
              purpose: 'face_center' as const
            }
          };

          // Find a slightly deeper shade for contouring (from same brand if available)
          const contourShade = shades.find(shade => 
            shade.depth_level === (bestShade.depth_level || 5) + 1
          ) || bestShade;

          const contourMatch: FoundationMatch = {
            id: `${product.id}-${contourShade.id}-contour`,
            brand: brandName,
            product: product.name,
            shade: contourShade.shade_name,
            price: product.price || 36,
            rating: 4.3 + (pairs.length * 0.1),
            reviewCount: 800 + (pairs.length * 100),
            availability: {
              online: true,
              inStore: pairs.length < 2,
              readyForPickup: pairs.length < 2,
              nearbyStores: pairs.length < 2 ? ['Sephora', 'Ulta Beauty'] : []
            },
            matchPercentage: 92 - (pairs.length * 2),
            undertone: contourShade.undertone,
            coverage: product.coverage || 'medium',
            finish: product.finish || 'natural',
            imageUrl: product.image_url || '/placeholder.svg',
            contourShade: {
              name: contourShade.shade_name,
              purpose: 'face_sides' as const,
              mixable: true
            }
          };

          pairs.push([primaryMatch, contourMatch]);
          recommendations.push(primaryMatch, contourMatch);
        }
      }
      
      setFoundationPairs(pairs);
      setShadeFinderRecommendations(recommendations);
    } catch (error) {
      console.error('Error generating foundation pairs:', error);
      // Fallback to existing logic
      const allProducts = [
        ...(foundationProducts || []),
        ...(cosmeticsProducts || [])
      ];
      const suitableProducts = filterProductsByToneAndPreferences(allProducts, toneData, questionnaire);
      const pairs = createFoundationPairs(suitableProducts, toneData);
      setFoundationPairs(pairs.slice(0, 4));
    }
  };

  const filterProductsByToneAndPreferences = (products: any[], toneData: SkinToneData, questionnaire?: UserQuestionnaireData | null) => {
    return products.filter(product => {
      // Filter by undertone compatibility
      const productUndertone = extractUndertone(product);
      if (productUndertone && !isUndertoneCompatible(toneData.undertone, productUndertone)) {
        return false;
      }

      // Filter by skin type preferences if questionnaire completed
      if (questionnaire) {
        const productFinish = extractFinish(product);
        if (questionnaire.skinType === 'oily' && productFinish !== 'matte') {
          return false;
        }
        if (questionnaire.skinType === 'dry' && !['dewy', 'hydrating', 'luminous'].includes(productFinish)) {
          return false;
        }
      }

      return true;
    });
  };

  const createFoundationPairs = (products: any[], toneData: SkinToneData): FoundationMatch[][] => {
    const pairs: FoundationMatch[][] = [];
    const processedBrands = new Set<string>();

    for (const product of products) {
      if (pairs.length >= 4) break;

      const brandName = getBrandName(product);
      if (processedBrands.has(brandName.toLowerCase())) continue;
      processedBrands.add(brandName.toLowerCase());

      const primaryShade = findBestShadeMatch(product, toneData.depth, toneData.undertone);
      const contourShade = findContourShade(product, toneData.depth + 1, toneData.undertone);

      if (primaryShade && contourShade) {
        const primaryMatch = createFoundationMatch(product, primaryShade, toneData, 'primary');
        const contourMatch = createFoundationMatch(product, contourShade, toneData, 'contour');
        
        pairs.push([primaryMatch, contourMatch]);
      }
    }

    return pairs;
  };

  const createFoundationMatch = (product: any, shade: any, toneData: SkinToneData, type: 'primary' | 'contour'): FoundationMatch => {
    return {
      id: `${product.id}-${shade.id || 'generated'}-${type}`,
      brand: getBrandName(product),
      product: product.name || product.product_name,
      shade: shade.shade_name || generateShadeName(toneData.depth, toneData.undertone),
      price: product.price || (30 + Math.random() * 40),
      rating: product.rating || (4.0 + Math.random() * 0.8),
      reviewCount: product.total_reviews || Math.floor(Math.random() * 300) + 50,
      availability: {
        online: true,
        inStore: Math.random() > 0.4,
        readyForPickup: Math.random() > 0.6,
        nearbyStores: Math.random() > 0.5 ? ['Sephora', 'Ulta Beauty'] : []
      },
      matchPercentage: type === 'primary' ? 92 + Math.random() * 6 : 88 + Math.random() * 4,
      undertone: toneData.undertone,
      coverage: shade.coverage || extractCoverage(product) || 'medium',
      finish: shade.finish || extractFinish(product) || 'natural',
      imageUrl: product.image_url || '/placeholder.svg',
      primaryShade: type === 'primary' ? {
        name: shade.shade_name || generateShadeName(toneData.depth, toneData.undertone),
        purpose: 'face_center' as const
      } : undefined,
      contourShade: type === 'contour' ? {
        name: shade.shade_name || generateShadeName(toneData.depth + 1, toneData.undertone),
        purpose: 'face_sides' as const,
        mixable: true
      } : undefined
    };
  };

  const handleTryVirtual = (match: FoundationMatch) => {
    setSelectedMatch(match);
  };

  const handleSearchResults = (matches: FoundationMatch[]) => {
    console.log('Search results received:', matches);
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

  // Helper functions
  const getBrandName = (product: any): string => {
    return product.brands?.name || product.brand?.name || 'Unknown Brand';
  };

  const extractUndertone = (product: any): string => {
    const text = (product.description || product.product_name || '').toLowerCase();
    if (text.includes('warm') || text.includes('golden') || text.includes('yellow')) return 'warm';
    if (text.includes('cool') || text.includes('pink') || text.includes('rose')) return 'cool';
    if (text.includes('neutral')) return 'neutral';
    return 'neutral';
  };

  const extractFinish = (product: any): string => {
    const text = (product.description || product.product_name || '').toLowerCase();
    if (text.includes('matte')) return 'matte';
    if (text.includes('dewy') || text.includes('hydrating')) return 'dewy';
    if (text.includes('satin')) return 'satin';
    return 'natural';
  };

  const extractCoverage = (product: any): string => {
    const text = (product.description || product.product_name || '').toLowerCase();
    if (text.includes('full')) return 'full';
    if (text.includes('light') || text.includes('sheer')) return 'light';
    return 'medium';
  };

  const isUndertoneCompatible = (userTone: string, productTone: string): boolean => {
    if (userTone === 'neutral' || productTone === 'neutral') return true;
    return userTone === productTone;
  };

  const findBestShadeMatch = (product: any, depth: number, undertone: string) => {
    if (product.foundation_shades?.length > 0) {
      return product.foundation_shades.find((shade: any) => 
        Math.abs((shade.depth_level || 5) - depth) <= 1 &&
        (shade.undertone === undertone || shade.undertone === 'neutral')
      ) || product.foundation_shades[Math.floor(product.foundation_shades.length / 2)];
    }
    
    return {
      id: 'generated',
      shade_name: generateShadeName(depth, undertone),
      depth_level: depth,
      undertone: undertone
    };
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

  const generateShadeName = (depth: number, undertone: string): string => {
    const depthNames = ['Porcelain', 'Fair', 'Light', 'Light Medium', 'Medium', 'Medium Deep', 'Deep', 'Very Deep'];
    const undertoneNames = { warm: 'Warm', cool: 'Cool', neutral: 'Neutral' };
    
    const depthIndex = Math.min(Math.max(Math.floor(depth / 12.5), 0), depthNames.length - 1);
    return `${depthNames[depthIndex]} ${undertoneNames[undertone as keyof typeof undertoneNames] || 'Neutral'}`;
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Brand Search - Always Visible */}
          <FoundationSearchInput onMatchFound={handleSearchResults} />

          {/* Find Your Skin Tone Methods */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-6 text-center">Find Your Skin Tone</h2>
            
            <Tabs defaultValue="slider" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="slider" className="flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Skin Tone Slider
                </TabsTrigger>
                <TabsTrigger value="ai" className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  AI Analysis
                </TabsTrigger>
                <TabsTrigger value="reference" className="flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Reference Guide
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="slider" className="mt-6">
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
              </TabsContent>
              
              <TabsContent value="ai" className="mt-6">
                <InclusiveShadeMatchingInterface
                  onAnalysisComplete={handleInclusiveAnalysis}
                  onUpgradeClick={() => window.open('/subscription-plans', '_blank')}
                />
              </TabsContent>
              
              <TabsContent value="reference" className="mt-6">
                <NaturalSkinToneSelector 
                  onSkinToneSelect={(toneData) => {
                    const depthMapping = { 'fair': 2, 'light': 3, 'medium': 5, 'dark': 7 };
                    const skinToneData: SkinToneData = {
                      hexColor: toneData.hexColor,
                      depth: depthMapping[toneData.depth as keyof typeof depthMapping] || 5,
                      undertone: toneData.undertone
                    };
                    handleSkinToneSelect(skinToneData);
                  }}
                />
              </TabsContent>
            </Tabs>
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

        {/* Virtual Try-On Section */}
        <div className="lg:col-span-1">
          <VirtualTryOn 
            selectedMatch={selectedMatch}
            skinTone={skinTone}
            availableRecommendations={shadeFinderRecommendations}
            onShadeRecommendations={(recommendations) => {
              console.log('New shade recommendations:', recommendations);
            }}
          />
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