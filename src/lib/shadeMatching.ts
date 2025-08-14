import { hexToRgb, rgbToXyz, xyzToLab, deltaE2000, Lab, RGB } from './colorUtils';

export interface SkinToneAnalysis {
  hexColor: string;
  depth: number;
  undertone: string;
  lab?: Lab;
}

export interface ShadeMatch {
  shade: any;
  product: any;
  colorDistance: number;
  matchPercentage: number;
  undertoneCompatibility: number;
  depthCompatibility: number;
  overallScore: number;
}

export interface UserPreferences {
  skinType?: string;
  preferredCoverage?: string;
  preferredFinish?: string;
  hairColor?: string;
  eyeColor?: string;
}

/**
 * Convert hex color to Lab color space for accurate color matching
 */
export const hexToLab = (hex: string): Lab | null => {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  
  const xyz = rgbToXyz(rgb);
  return xyzToLab(xyz);
};

/**
 * Calculate accurate color distance between two colors using deltaE2000
 */
export const calculateColorDistance = (color1: string, color2: string): number => {
  const lab1 = hexToLab(color1);
  const lab2 = hexToLab(color2);
  
  if (!lab1 || !lab2) return 100; // Maximum distance if conversion fails
  
  return deltaE2000(lab1, lab2);
};

/**
 * Calculate undertone compatibility score (0-1)
 */
export const calculateUndertoneCompatibility = (
  userUndertone: string, 
  shadeUndertone: string
): number => {
  if (!userUndertone || !shadeUndertone) return 0.5;
  
  const undertoneMap: Record<string, number[]> = {
    'warm': [1, 0.8, 0.3, 0.6], // [warm, neutral, cool, olive]
    'cool': [0.3, 0.8, 1, 0.4],
    'neutral': [0.8, 1, 0.8, 0.9],
    'olive': [0.6, 0.9, 0.4, 1]
  };
  
  const undertoneOrder = ['warm', 'neutral', 'cool', 'olive'];
  const userIndex = undertoneOrder.indexOf(userUndertone.toLowerCase());
  const shadeIndex = undertoneOrder.indexOf(shadeUndertone.toLowerCase());
  
  if (userIndex === -1 || shadeIndex === -1) return 0.5;
  
  return undertoneMap[userUndertone.toLowerCase()][shadeIndex];
};

/**
 * Calculate depth compatibility score based on depth levels
 */
export const calculateDepthCompatibility = (
  userDepth: number, 
  shadeDepth: number
): number => {
  const depthDifference = Math.abs(userDepth - shadeDepth);
  
  // Perfect match (0 difference) = 1.0
  // 1 level difference = 0.9
  // 2 levels difference = 0.7
  // 3+ levels difference decreases rapidly
  if (depthDifference === 0) return 1.0;
  if (depthDifference === 1) return 0.9;
  if (depthDifference === 2) return 0.7;
  if (depthDifference === 3) return 0.5;
  
  return Math.max(0.1, 0.5 - (depthDifference - 3) * 0.1);
};

/**
 * Score shade based on user preferences (skin type, coverage, finish)
 */
export const calculatePreferenceScore = (
  product: any, 
  preferences: UserPreferences
): number => {
  let score = 1.0;
  
  if (preferences.skinType && preferences.preferredFinish) {
    const productFinish = extractFinish(product);
    
    // Skin type - finish compatibility
    if (preferences.skinType === 'oily') {
      if (productFinish === 'matte') score *= 1.2;
      else if (productFinish === 'dewy') score *= 0.6;
    } else if (preferences.skinType === 'dry') {
      if (['dewy', 'hydrating', 'luminous'].includes(productFinish)) score *= 1.2;
      else if (productFinish === 'matte') score *= 0.6;
    }
  }
  
  if (preferences.preferredCoverage) {
    const productCoverage = extractCoverage(product);
    if (productCoverage === preferences.preferredCoverage) {
      score *= 1.1;
    }
  }
  
  return Math.min(score, 1.5); // Cap the boost
};

/**
 * Find the best shade matches for a given skin tone analysis
 */
export const findBestShadeMatches = (
  products: any[],
  skinTone: SkinToneAnalysis,
  preferences: UserPreferences = {},
  maxResults: number = 10
): ShadeMatch[] => {
  const matches: ShadeMatch[] = [];
  
  for (const product of products) {
    const shades = product.foundation_shades || [];
    
    if (shades.length === 0) {
      // For products without specific shades, create a synthetic match
      const match = createSyntheticShadeMatch(product, skinTone, preferences);
      if (match) matches.push(match);
      continue;
    }
    
    // Find the best shade(s) for this product
    for (const shade of shades) {
      if (!shade.hex_color || !shade.is_available) continue;
      
      const colorDistance = calculateColorDistance(skinTone.hexColor, shade.hex_color);
      const undertoneCompatibility = calculateUndertoneCompatibility(
        skinTone.undertone, 
        shade.undertone || 'neutral'
      );
      const depthCompatibility = calculateDepthCompatibility(
        skinTone.depth, 
        shade.depth_level || 5
      );
      const preferenceScore = calculatePreferenceScore(product, preferences);
      
      // Calculate match percentage (deltaE < 5 is excellent, < 10 is good)
      const matchPercentage = Math.max(0, Math.min(100, 100 - (colorDistance * 5)));
      
      // Overall score combines all factors
      const overallScore = (
        (1 - (colorDistance / 50)) * 0.4 + // Color distance (40% weight)
        undertoneCompatibility * 0.25 +     // Undertone (25% weight)
        depthCompatibility * 0.25 +         // Depth (25% weight)
        (preferenceScore - 1) * 0.1         // Preferences (10% weight)
      );
      
      matches.push({
        shade,
        product,
        colorDistance,
        matchPercentage,
        undertoneCompatibility,
        depthCompatibility,
        overallScore: Math.max(0, Math.min(1, overallScore))
      });
    }
  }
  
  // Sort by overall score and return top matches
  return matches
    .sort((a, b) => b.overallScore - a.overallScore)
    .slice(0, maxResults);
};

/**
 * Create a synthetic shade match for products without specific shade data
 */
const createSyntheticShadeMatch = (
  product: any,
  skinTone: SkinToneAnalysis,
  preferences: UserPreferences
): ShadeMatch | null => {
  // Estimate shade properties from product description/name
  const estimatedUndertone = extractUndertone(product);
  const estimatedDepth = estimateDepthFromDescription(product) || skinTone.depth;
  
  const undertoneCompatibility = calculateUndertoneCompatibility(
    skinTone.undertone,
    estimatedUndertone
  );
  const depthCompatibility = calculateDepthCompatibility(
    skinTone.depth,
    estimatedDepth
  );
  const preferenceScore = calculatePreferenceScore(product, preferences);
  
  // Synthetic color distance based on undertone and depth compatibility
  const colorDistance = 50 * (1 - (undertoneCompatibility + depthCompatibility) / 2);
  const matchPercentage = Math.max(0, Math.min(100, 100 - (colorDistance * 2)));
  
  const overallScore = (
    (1 - (colorDistance / 50)) * 0.3 +
    undertoneCompatibility * 0.3 +
    depthCompatibility * 0.3 +
    (preferenceScore - 1) * 0.1
  );
  
  return {
    shade: {
      id: 'synthetic',
      shade_name: generateShadeName(estimatedDepth, estimatedUndertone),
      depth_level: estimatedDepth,
      undertone: estimatedUndertone,
      hex_color: skinTone.hexColor // Use user's color as approximation
    },
    product,
    colorDistance,
    matchPercentage,
    undertoneCompatibility,
    depthCompatibility,
    overallScore: Math.max(0, Math.min(1, overallScore))
  };
};

/**
 * Find best contour shade based on a primary shade
 */
export const findContourShade = (
  product: any,
  primaryShade: any,
  skinTone: SkinToneAnalysis
): any => {
  const shades = product.foundation_shades || [];
  
  if (shades.length === 0) {
    return {
      id: 'synthetic-contour',
      shade_name: generateShadeName(skinTone.depth + 1, skinTone.undertone),
      depth_level: skinTone.depth + 1,
      undertone: skinTone.undertone
    };
  }
  
  // Look for a shade 1-2 levels deeper with same undertone
  const targetDepth = (primaryShade.depth_level || skinTone.depth) + 1;
  const contourShade = shades.find((shade: any) => 
    shade.depth_level === targetDepth &&
    shade.undertone === primaryShade.undertone &&
    shade.is_available
  ) || shades.find((shade: any) =>
    shade.depth_level === targetDepth + 1 &&
    shade.is_available
  ) || shades.find((shade: any) =>
    (shade.depth_level || 5) > (primaryShade.depth_level || 5) &&
    shade.is_available
  );
  
  return contourShade || primaryShade;
};

// Helper functions (extracted from original component)
export const extractUndertone = (product: any): string => {
  const text = (product.description || product.product_name || '').toLowerCase();
  if (text.includes('warm') || text.includes('golden') || text.includes('yellow')) return 'warm';
  if (text.includes('cool') || text.includes('pink') || text.includes('rose')) return 'cool';
  if (text.includes('olive')) return 'olive';
  if (text.includes('neutral')) return 'neutral';
  return 'neutral';
};

export const extractFinish = (product: any): string => {
  const text = (product.description || product.product_name || '').toLowerCase();
  if (text.includes('matte')) return 'matte';
  if (text.includes('dewy') || text.includes('hydrating')) return 'dewy';
  if (text.includes('satin')) return 'satin';
  if (text.includes('luminous') || text.includes('radiant')) return 'luminous';
  return 'natural';
};

export const extractCoverage = (product: any): string => {
  const text = (product.description || product.product_name || '').toLowerCase();
  if (text.includes('full')) return 'full';
  if (text.includes('light') || text.includes('sheer')) return 'light';
  if (text.includes('buildable')) return 'buildable';
  return 'medium';
};

const estimateDepthFromDescription = (product: any): number | null => {
  const text = (product.description || product.product_name || '').toLowerCase();
  if (text.includes('fair') || text.includes('porcelain')) return 2;
  if (text.includes('light')) return 3;
  if (text.includes('medium')) return 5;
  if (text.includes('tan') || text.includes('deep')) return 7;
  if (text.includes('very deep') || text.includes('darkest')) return 9;
  return null;
};

export const generateShadeName = (depth: number, undertone: string): string => {
  const depthNames = [
    'Porcelain', 'Fair', 'Light', 'Light Medium', 'Medium', 
    'Medium Deep', 'Deep', 'Very Deep', 'Darkest'
  ];
  const undertoneNames = { 
    warm: 'Warm', 
    cool: 'Cool', 
    neutral: 'Neutral',
    olive: 'Olive'
  };
  
  const depthIndex = Math.min(Math.max(Math.floor((depth - 1) * 8 / 9), 0), depthNames.length - 1);
  const undertoneName = undertoneNames[undertone as keyof typeof undertoneNames] || 'Neutral';
  
  return `${depthNames[depthIndex]} ${undertoneName}`;
};