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
  
  console.log(`Finding matches for ${products.length} products with skin tone:`, skinTone);
  
  for (const product of products) {
    const shades = product.foundation_shades || [];
    
    // Always try to create matches - prioritize actual shades but include synthetic matches
    if (shades.length === 0) {
      // For products without specific shades (most cosmetics_products), create a synthetic match
      const match = createSyntheticShadeMatch(product, skinTone, preferences);
      if (match) {
        console.log(`Created synthetic match for ${product.product_name || product.name}:`, match.matchPercentage);
        matches.push(match);
      }
      continue;
    }
    
    // Find the best shade(s) for this product
    let bestShadeForProduct = null;
    let bestScore = -1;
    
    for (const shade of shades) {
      // Be more inclusive - don't require hex_color or is_available to be set
      // Many products in GCS don't have these fields populated
      const shouldSkip = shade.is_available === false; // Only skip if explicitly set to false
      if (shouldSkip) continue;
      
      // Use hex_color if available, otherwise estimate from shade name and undertone
      const shadeHexColor = shade.hex_color || estimateColorFromShade(shade, skinTone);
      
      const colorDistance = shadeHexColor ? 
        calculateColorDistance(skinTone.hexColor, shadeHexColor) : 
        estimateColorDistanceFromProperties(skinTone, shade);
        
      const undertoneCompatibility = calculateUndertoneCompatibility(
        skinTone.undertone, 
        shade.undertone || extractUndertoneFromName(shade.shade_name) || 'neutral'
      );
      const depthCompatibility = calculateDepthCompatibility(
        skinTone.depth, 
        shade.depth_level || estimateDepthFromName(shade.shade_name) || 5
      );
      const preferenceScore = calculatePreferenceScore(product, preferences);
      
      // Calculate match percentage 
      const matchPercentage = shadeHexColor ? 
        Math.max(0, Math.min(100, 100 - (colorDistance * 5))) :
        Math.max(40, Math.min(95, undertoneCompatibility * depthCompatibility * 100));
      
      // Overall score combines all factors
      const overallScore = (
        (shadeHexColor ? (1 - (colorDistance / 50)) * 0.4 : undertoneCompatibility * 0.4) + // Color/undertone
        depthCompatibility * 0.3 +         // Depth (30% weight)
        undertoneCompatibility * 0.2 +     // Undertone (20% weight)  
        (preferenceScore - 1) * 0.1         // Preferences (10% weight)
      );
      
      const currentMatch = {
        shade,
        product,
        colorDistance,
        matchPercentage,
        undertoneCompatibility,
        depthCompatibility,
        overallScore: Math.max(0, Math.min(1, overallScore))
      };
      
      // Keep only the best shade per product
      if (overallScore > bestScore) {
        bestScore = overallScore;
        bestShadeForProduct = currentMatch;
      }
    }
    
    if (bestShadeForProduct) {
      console.log(`Best shade for ${product.product_name || product.name}: ${bestShadeForProduct.shade.shade_name} (${bestShadeForProduct.matchPercentage}%)`);
      matches.push(bestShadeForProduct);
    }
  }
  
  console.log(`Generated ${matches.length} total matches`);
  
  // Sort by overall score and return top matches, ensuring brand diversity
  const sortedMatches = matches.sort((a, b) => b.overallScore - a.overallScore);
  
  // Ensure brand diversity in results
  const diverseMatches: ShadeMatch[] = [];
  const usedBrands = new Set<string>();
  
  // First pass: get the best match from each brand
  for (const match of sortedMatches) {
    const brandName = getBrandName(match.product);
    if (!usedBrands.has(brandName) && diverseMatches.length < maxResults) {
      diverseMatches.push(match);
      usedBrands.add(brandName);
    }
  }
  
  // Second pass: fill remaining slots with next best matches
  for (const match of sortedMatches) {
    if (diverseMatches.length >= maxResults) break;
    if (!diverseMatches.includes(match)) {
      diverseMatches.push(match);
    }
  }
  
  console.log(`Returning ${diverseMatches.length} diverse matches from ${usedBrands.size} brands`);
  return diverseMatches.slice(0, maxResults);
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

// Additional helper functions for improved matching

const getBrandName = (product: any): string => {
  return product.brands?.name || product.brand?.name || 'Unknown Brand';
};

const estimateColorFromShade = (shade: any, skinTone: SkinToneAnalysis): string | null => {
  // Try to estimate color based on shade name and undertone
  if (!shade.shade_name) return null;
  
  const name = shade.shade_name.toLowerCase();
  const undertone = shade.undertone || extractUndertoneFromName(shade.shade_name);
  const depth = shade.depth_level || estimateDepthFromName(shade.shade_name);
  
  if (depth && undertone) {
    // Generate a realistic color based on depth and undertone
    const { generateRealisticFleshTone } = require('./fleshToneColorWheel');
    return generateRealisticFleshTone(shade.shade_name, undertone);
  }
  
  return null;
};

const estimateColorDistanceFromProperties = (skinTone: SkinToneAnalysis, shade: any): number => {
  // When no hex color is available, estimate distance based on undertone and depth
  const undertoneCompatibility = calculateUndertoneCompatibility(
    skinTone.undertone, 
    shade.undertone || extractUndertoneFromName(shade.shade_name) || 'neutral'
  );
  const depthCompatibility = calculateDepthCompatibility(
    skinTone.depth, 
    shade.depth_level || estimateDepthFromName(shade.shade_name) || 5
  );
  
  // Convert compatibility scores to estimated color distance
  return 50 * (1 - (undertoneCompatibility + depthCompatibility) / 2);
};

const extractUndertoneFromName = (shadeName: string): string => {
  if (!shadeName) return 'neutral';
  const name = shadeName.toLowerCase();
  
  if (name.includes('warm') || name.includes('golden') || name.includes('honey') || name.includes('caramel')) return 'warm';
  if (name.includes('cool') || name.includes('pink') || name.includes('rose') || name.includes('porcelain')) return 'cool';
  if (name.includes('olive') || name.includes('yellow')) return 'olive';
  if (name.includes('neutral') || name.includes('beige') || name.includes('sand')) return 'neutral';
  
  return 'neutral';
};

const estimateDepthFromName = (shadeName: string): number => {
  if (!shadeName) return 5;
  const name = shadeName.toLowerCase();
  
  if (name.includes('porcelain') || name.includes('ivory')) return 1;
  if (name.includes('fair') || name.includes('alabaster')) return 2;
  if (name.includes('light')) return 3;
  if (name.includes('medium light')) return 4;
  if (name.includes('medium')) return 5;
  if (name.includes('tan') || name.includes('medium deep')) return 6;
  if (name.includes('deep')) return 7;
  if (name.includes('very deep') || name.includes('espresso')) return 8;
  if (name.includes('darkest') || name.includes('ebony')) return 9;
  
  // Try to extract numbers from shade names like "350", "120", etc.
  const numbers = shadeName.match(/\d+/g);
  if (numbers && numbers.length > 0) {
    const num = parseInt(numbers[0]);
    if (num < 200) return Math.min(9, Math.floor(num / 50) + 1);
    if (num < 400) return Math.min(9, Math.floor((num - 100) / 50) + 3);
    return Math.min(9, Math.floor((num - 200) / 50) + 5);
  }
  
  return 5; // Default to medium
};