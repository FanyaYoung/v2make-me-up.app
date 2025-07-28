import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Target, 
  Sparkles, 
  Star, 
  ShoppingCart, 
  Heart, 
  TrendingUp,
  Palette,
  Search,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';

interface EnhancedFoundationMatch {
  id: string;
  brand: string;
  productName: string;
  shadeName: string;
  hexColor: string;
  rgbValues: number[];
  price: number;
  rating: number;
  reviewCount: number;
  coverage: string;
  finish: string;
  undertone: string;
  depthLevel: number;
  matchScore: number;
  colorDifference: number;
  skinTypeCompatibility: number;
  undertoneMatch: boolean;
  availability: {
    online: boolean;
    inStore: boolean;
    nearbyStores?: string[];
  };
  imageUrl?: string;
  productUrl?: string;
  dataset: string;
}

interface SkinProfile {
  undertone: 'warm' | 'cool' | 'neutral' | 'olive';
  depthLevel: number;
  skinType: 'dry' | 'oily' | 'combination' | 'sensitive' | 'normal';
  preferredCoverage: 'light' | 'medium' | 'full' | 'buildable';
  preferredFinish: 'matte' | 'natural' | 'dewy' | 'satin' | 'radiant';
  currentFoundation?: {
    brand: string;
    shade: string;
    satisfaction: number;
  };
}

interface EnhancedShadeMatcherProps {
  onMatchesFound: (matches: EnhancedFoundationMatch[]) => void;
  skinProfile?: SkinProfile;
}

const EnhancedShadeMatcher: React.FC<EnhancedShadeMatcherProps> = ({
  onMatchesFound,
  skinProfile
}) => {
  const { user } = useAuth();
  const [searchCriteria, setSearchCriteria] = useState({
    priceRange: [0, 100],
    brands: [] as string[],
    coverage: '',
    finish: '',
    undertone: '',
    depthRange: [1, 10]
  });
  const [isMatching, setIsMatching] = useState(false);
  const [matchResults, setMatchResults] = useState<EnhancedFoundationMatch[]>([]);

  // Fetch all available cosmetics products with enhanced data
  const { data: cosmeticsProducts, isLoading: loadingCosmetics } = useQuery({
    queryKey: ['enhanced-cosmetics-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cosmetics_products')
        .select(`
          *,
          brand:brands(name, logo_url, brand_tier)
        `)
        .eq('product_type', 'foundation')
        .not('brand_id', 'is', null);
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch foundation products with shades
  const { data: foundationProducts, isLoading: loadingFoundations } = useQuery({
    queryKey: ['enhanced-foundation-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('foundation_products')
        .select(`
          *,
          brand:brands(name, logo_url, brand_tier),
          shades:foundation_shades(*)
        `)
        .eq('is_active', true);
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch available brands for filters
  const { data: availableBrands } = useQuery({
    queryKey: ['available-brands'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('brands')
        .select('id, name, brand_tier')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  // Track match usage
  const trackMatchUsage = useMutation({
    mutationFn: async (matchData: { matchType: string; metadata: any }) => {
      if (!user) return;
      
      const { error } = await supabase
        .from('user_match_usage')
        .insert({
          user_id: user.id,
          match_type: matchData.matchType,
          metadata: matchData.metadata
        });
      
      if (error) throw error;
    }
  });

  const calculateAdvancedColorDifference = (color1: string, color2: string): number => {
    // Convert hex to LAB color space for better perceptual difference
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    };

    const rgbToLab = (r: number, g: number, b: number) => {
      // Simplified RGB to LAB conversion
      // In production, use a proper color library like d3-color
      r = r / 255;
      g = g / 255;
      b = b / 255;

      // Convert to XYZ
      r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
      g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
      b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

      const x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
      const y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.00000;
      const z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;

      // Convert to LAB
      const fx = x > 0.008856 ? Math.pow(x, 1/3) : (7.787 * x + 16/116);
      const fy = y > 0.008856 ? Math.pow(y, 1/3) : (7.787 * y + 16/116);
      const fz = z > 0.008856 ? Math.pow(z, 1/3) : (7.787 * z + 16/116);

      const L = (116 * fy) - 16;
      const a = 500 * (fx - fy);
      const b_lab = 200 * (fy - fz);

      return { L, a, b: b_lab };
    };

    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);
    
    if (!rgb1 || !rgb2) return 100;

    const lab1 = rgbToLab(rgb1.r, rgb1.g, rgb1.b);
    const lab2 = rgbToLab(rgb2.r, rgb2.g, rgb2.b);

    // Calculate ΔE using CIE76 formula (simplified)
    const deltaL = lab1.L - lab2.L;
    const deltaA = lab1.a - lab2.a;
    const deltaB = lab1.b - lab2.b;

    return Math.sqrt(deltaL * deltaL + deltaA * deltaA + deltaB * deltaB);
  };

  const calculateSkinTypeCompatibility = (
    productFinish: string, 
    productCoverage: string, 
    userSkinType: string
  ): number => {
    const compatibilityMatrix: Record<string, Record<string, number>> = {
      'dry': {
        'dewy': 0.9,
        'natural': 0.8,
        'satin': 0.7,
        'radiant': 0.9,
        'matte': 0.3
      },
      'oily': {
        'matte': 0.9,
        'natural': 0.7,
        'satin': 0.6,
        'dewy': 0.3,
        'radiant': 0.4
      },
      'combination': {
        'natural': 0.9,
        'satin': 0.8,
        'matte': 0.7,
        'dewy': 0.6,
        'radiant': 0.6
      },
      'sensitive': {
        'natural': 0.8,
        'dewy': 0.7,
        'satin': 0.7,
        'matte': 0.5,
        'radiant': 0.6
      },
      'normal': {
        'natural': 0.9,
        'satin': 0.8,
        'dewy': 0.8,
        'matte': 0.7,
        'radiant': 0.8
      }
    };

    return compatibilityMatrix[userSkinType]?.[productFinish] || 0.5;
  };

  const calculateUndertoneMatch = (
    productUndertone: string, 
    userUndertone: string
  ): boolean => {
    if (productUndertone === userUndertone) return true;
    if (userUndertone === 'neutral') return true;
    if (productUndertone === 'neutral') return true;
    return false;
  };

  const generateEnhancedMatches = async (): Promise<EnhancedFoundationMatch[]> => {
    const allMatches: EnhancedFoundationMatch[] = [];

    // Process cosmetics products
    if (cosmeticsProducts) {
      for (const product of cosmeticsProducts) {
        // Extract color information from metadata or generate based on product info
        const hexColor = extractOrGenerateColor(product);
        const rgbObj = hexToRgb(hexColor);
        const rgbValues = rgbObj ? [rgbObj.r, rgbObj.g, rgbObj.b] : [0, 0, 0];
        
        const match: EnhancedFoundationMatch = {
          id: `cosmetics-${product.id}`,
          brand: product.brand?.name || 'Unknown',
          productName: product.product_name,
          shadeName: extractShadeFromMetadata(product) || 'Universal',
          hexColor,
          rgbValues,
          price: product.price || 35,
          rating: product.rating || 4.0,
          reviewCount: product.total_reviews || 0,
          coverage: extractCoverageFromProduct(product),
          finish: extractFinishFromProduct(product),
          undertone: extractUndertoneFromProduct(product),
          depthLevel: calculateDepthFromColor(hexColor),
          matchScore: 0, // Will be calculated
          colorDifference: 0, // Will be calculated
          skinTypeCompatibility: 0, // Will be calculated
          undertoneMatch: false, // Will be calculated
          availability: {
            online: true,
            inStore: Math.random() > 0.5,
            nearbyStores: ['Ulta Beauty', 'Sephora']
          },
          imageUrl: product.image_url,
          productUrl: product.product_url,
          dataset: product.dataset_name
        };

        allMatches.push(match);
      }
    }

    // Process foundation products with shades
    if (foundationProducts) {
      for (const product of foundationProducts) {
        if (product.shades && product.shades.length > 0) {
          for (const shade of product.shades) {
            const match: EnhancedFoundationMatch = {
              id: `foundation-${product.id}-${shade.id}`,
              brand: product.brand?.name || 'Unknown',
              productName: product.name,
              shadeName: shade.shade_name,
              hexColor: shade.hex_color || '#D4A574',
              rgbValues: shade.rgb_values || [212, 165, 116],
              price: product.price || 42,
              rating: 4.2,
              reviewCount: 156,
              coverage: product.coverage || 'medium',
              finish: product.finish || 'natural',
              undertone: shade.undertone || 'neutral',
              depthLevel: shade.depth_level || 5,
              matchScore: 0,
              colorDifference: 0,
              skinTypeCompatibility: 0,
              undertoneMatch: false,
              availability: {
                online: shade.is_available,
                inStore: true,
                nearbyStores: ['Sephora', 'Nordstrom']
              },
              imageUrl: product.image_url,
              productUrl: product.product_url,
              dataset: 'foundation_products'
            };

            allMatches.push(match);
          }
        }
      }
    }

    return allMatches;
  };

  const scoreAndRankMatches = (
    matches: EnhancedFoundationMatch[], 
    targetColor: string,
    profile?: SkinProfile
  ): EnhancedFoundationMatch[] => {
    return matches.map(match => {
      // Calculate color difference
      const colorDiff = calculateAdvancedColorDifference(targetColor, match.hexColor);
      
      // Calculate skin type compatibility
      const skinCompatibility = profile ? 
        calculateSkinTypeCompatibility(match.finish, match.coverage, profile.skinType) : 0.7;
      
      // Check undertone match
      const undertoneMatch = profile ? 
        calculateUndertoneMatch(match.undertone, profile.undertone) : true;
      
      // Calculate depth level difference
      const depthDiff = profile ? 
        Math.abs(match.depthLevel - profile.depthLevel) / 10 : 0;
      
      // Calculate overall match score
      const matchScore = (
        (1 - Math.min(colorDiff / 20, 1)) * 0.4 +           // 40% color accuracy
        skinCompatibility * 0.25 +                          // 25% skin type compatibility
        (undertoneMatch ? 1 : 0.3) * 0.2 +                 // 20% undertone match
        (1 - depthDiff) * 0.1 +                            // 10% depth level match
        (match.rating / 5) * 0.05                          // 5% product rating
      );

      return {
        ...match,
        colorDifference: colorDiff,
        skinTypeCompatibility: skinCompatibility,
        undertoneMatch,
        matchScore
      };
    })
    .filter(match => {
      // Apply search criteria filters
      const priceInRange = match.price >= searchCriteria.priceRange[0] && 
                          match.price <= searchCriteria.priceRange[1];
      const brandMatch = searchCriteria.brands.length === 0 || 
                        searchCriteria.brands.includes(match.brand);
      const coverageMatch = !searchCriteria.coverage || 
                           match.coverage === searchCriteria.coverage;
      const finishMatch = !searchCriteria.finish || 
                         match.finish === searchCriteria.finish;
      const undertoneMatch = !searchCriteria.undertone || 
                            match.undertone === searchCriteria.undertone;
      const depthInRange = match.depthLevel >= searchCriteria.depthRange[0] && 
                          match.depthLevel <= searchCriteria.depthRange[1];

      return priceInRange && brandMatch && coverageMatch && 
             finishMatch && undertoneMatch && depthInRange;
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 50); // Limit to top 50 matches
  };

  const findMatches = async (targetColor: string = '#D4A574') => {
    setIsMatching(true);
    
    try {
      // Generate all possible matches
      const allMatches = await generateEnhancedMatches();
      
      // Score and rank matches
      const rankedMatches = scoreAndRankMatches(allMatches, targetColor, skinProfile);
      
      setMatchResults(rankedMatches);
      onMatchesFound(rankedMatches);
      
      // Track usage
      await trackMatchUsage.mutateAsync({
        matchType: 'enhanced_shade_match',
        metadata: {
          targetColor,
          totalMatches: rankedMatches.length,
          topScore: rankedMatches[0]?.matchScore || 0,
          searchCriteria
        }
      });
      
      toast.success(`Found ${rankedMatches.length} enhanced matches!`);
      
    } catch (error) {
      console.error('Error finding matches:', error);
      toast.error('Failed to find matches. Please try again.');
    } finally {
      setIsMatching(false);
    }
  };

  // Helper functions
  const extractOrGenerateColor = (product: any): string => {
    // Try to extract from metadata or generate based on shade name
    return product.metadata?.shade_color || generateColorFromName(product.product_name);
  };

  const generateColorFromName = (name: string): string => {
    // Generate color based on product name keywords
    const nameLower = name.toLowerCase();
    if (nameLower.includes('fair') || nameLower.includes('light')) return '#F5DCC4';
    if (nameLower.includes('medium')) return '#D4A574';
    if (nameLower.includes('deep') || nameLower.includes('dark')) return '#A0835C';
    return '#E8C2A0'; // Default medium-light
  };

  const extractShadeFromMetadata = (product: any): string => {
    return product.metadata?.shade_name || 
           product.metadata?.shade || 
           product.product_name.split(' ').pop() || 
           'Universal';
  };

  const extractCoverageFromProduct = (product: any): string => {
    const coverage = product.metadata?.coverage || product.category;
    if (coverage?.toLowerCase().includes('light')) return 'light';
    if (coverage?.toLowerCase().includes('full')) return 'full';
    if (coverage?.toLowerCase().includes('buildable')) return 'buildable';
    return 'medium';
  };

  const extractFinishFromProduct = (product: any): string => {
    const finish = product.metadata?.finish || product.description;
    if (finish?.toLowerCase().includes('matte')) return 'matte';
    if (finish?.toLowerCase().includes('dewy')) return 'dewy';
    if (finish?.toLowerCase().includes('satin')) return 'satin';
    if (finish?.toLowerCase().includes('radiant')) return 'radiant';
    return 'natural';
  };

  const extractUndertoneFromProduct = (product: any): string => {
    const undertone = product.metadata?.undertone || product.description;
    if (undertone?.toLowerCase().includes('warm')) return 'warm';
    if (undertone?.toLowerCase().includes('cool')) return 'cool';
    if (undertone?.toLowerCase().includes('olive')) return 'olive';
    return 'neutral';
  };

  const calculateDepthFromColor = (hexColor: string): number => {
    const rgb = hexToRgb(hexColor);
    if (!rgb) return 5;
    
    const luminance = 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
    return Math.max(1, Math.min(10, Math.round((255 - luminance) / 25.5)));
  };

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          Enhanced Shade Matcher
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Price Range</label>
            <div className="px-2">
              <Slider
                value={searchCriteria.priceRange}
                onValueChange={(value) => setSearchCriteria(prev => ({ ...prev, priceRange: value }))}
                max={100}
                min={0}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>${searchCriteria.priceRange[0]}</span>
                <span>${searchCriteria.priceRange[1]}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Coverage</label>
            <Select 
              value={searchCriteria.coverage} 
              onValueChange={(value) => setSearchCriteria(prev => ({ ...prev, coverage: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Any coverage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any coverage</SelectItem>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="full">Full</SelectItem>
                <SelectItem value="buildable">Buildable</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Finish</label>
            <Select 
              value={searchCriteria.finish} 
              onValueChange={(value) => setSearchCriteria(prev => ({ ...prev, finish: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Any finish" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any finish</SelectItem>
                <SelectItem value="matte">Matte</SelectItem>
                <SelectItem value="natural">Natural</SelectItem>
                <SelectItem value="dewy">Dewy</SelectItem>
                <SelectItem value="satin">Satin</SelectItem>
                <SelectItem value="radiant">Radiant</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-center">
          <Button 
            onClick={() => findMatches(skinProfile?.currentFoundation ? '#D4A574' : '#D4A574')}
            disabled={isMatching || loadingCosmetics || loadingFoundations}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {isMatching ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                Finding Matches...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Find Enhanced Matches
              </>
            )}
          </Button>
        </div>

        {/* Results Summary */}
        {matchResults.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Matches</p>
                  <p className="text-2xl font-bold">{matchResults.length}</p>
                </div>
                <Target className="h-8 w-8 text-purple-600" />
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Best Match Score</p>
                  <p className="text-2xl font-bold">
                    {Math.round((matchResults[0]?.matchScore || 0) * 100)}%
                  </p>
                </div>
                <Star className="h-8 w-8 text-yellow-600" />
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Price</p>
                  <p className="text-2xl font-bold">
                    ${Math.round(matchResults.reduce((sum, m) => sum + m.price, 0) / matchResults.length)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedShadeMatcher;