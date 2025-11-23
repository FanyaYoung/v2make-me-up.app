// Pigment-based color mixing system for accurate skin tone matching
// Uses 5 base pigments + white (added last as per requirement)

export interface PigmentMix {
  aquamarine: number;      // Cyan-green pigment
  burntUmber: number;      // Dark brown pigment
  cadmiumRed: number;      // Red pigment
  cadmiumYellow: number;   // Yellow pigment
  ultramarineBlue: number; // Blue pigment
  white: number;           // White (MUST be added last, never as base)
}

export interface PigmentColor {
  hex: string;
  rgb: [number, number, number];
  pigmentMix: PigmentMix;
  isRecreated: boolean;
}

// Base pigment colors in RGB
const PIGMENTS = {
  aquamarine: [127, 255, 212] as [number, number, number],
  burntUmber: [138, 51, 36] as [number, number, number],
  cadmiumRed: [227, 0, 34] as [number, number, number],
  cadmiumYellow: [255, 246, 0] as [number, number, number],
  ultramarineBlue: [18, 10, 143] as [number, number, number],
  white: [255, 255, 255] as [number, number, number]
};

/**
 * Convert RGB to hex
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Convert hex to RGB
 */
export function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [0, 0, 0];
  return [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ];
}

/**
 * Analyze a target color and determine the best pigment mix
 * CRITICAL: White is calculated separately and added AFTER base pigments
 */
export function analyzePigmentMix(targetHex: string): PigmentMix {
  const target = hexToRgb(targetHex);
  const [r, g, b] = target;
  
  // Calculate luminance to determine white amount
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Analyze undertone from RGB ratios
  const rRatio = r / 255;
  const gRatio = g / 255;
  const bRatio = b / 255;
  
  // Calculate base pigment amounts (before white)
  // CRITICAL: High amounts of Burnt Umber and Ultramarine Blue establish base depth
  let cadmiumRed = 0;
  let cadmiumYellow = 0;
  let ultramarineBlue = 0;
  let burntUmber = 0;
  let aquamarine = 0;
  
  // Burnt Umber (brown/depth) - HIGH amounts for base darkness
  burntUmber = (1 - luminance) * 0.8; // High coefficient for depth
  
  // Ultramarine Blue - HIGH amounts for undertone depth
  ultramarineBlue = bRatio * 0.7; // Strong blue presence
  
  // Red component
  if (rRatio > gRatio && rRatio > bRatio) {
    cadmiumRed = rRatio * 0.5;
    cadmiumYellow = gRatio * 0.3;
  }
  
  // Yellow/warm component
  if (gRatio > bRatio && rRatio > 0.5) {
    cadmiumYellow += (gRatio - bRatio) * 0.4;
  }
  
  // Green/olive component (when green is prominent)
  if (gRatio > rRatio * 0.9 && gRatio > bRatio * 1.1) {
    aquamarine = (gRatio - Math.max(rRatio, bRatio)) * 0.3;
  }
  
  // Normalize base pigments to sum to 1.0 (before white)
  const baseSum = cadmiumRed + cadmiumYellow + ultramarineBlue + burntUmber + aquamarine;
  if (baseSum > 0) {
    const baseFactor = 1.0 / baseSum;
    cadmiumRed *= baseFactor;
    cadmiumYellow *= baseFactor;
    ultramarineBlue *= baseFactor;
    burntUmber *= baseFactor;
    aquamarine *= baseFactor;
  }
  
  // Calculate white amount (added AFTER base mix)
  // White is ONLY for lightness adjustment, never dominates
  // Cap at 0.4 maximum to prevent washed-out colors
  const maxRgb = Math.max(r, g, b);
  const minRgb = Math.min(r, g, b);
  const saturation = maxRgb > 0 ? (maxRgb - minRgb) / maxRgb : 0;
  const white = Math.min(0.4, luminance * (1 - saturation * 0.6));
  
  return {
    aquamarine: Math.max(0, Math.min(1, aquamarine)),
    burntUmber: Math.max(0, Math.min(1, burntUmber)),
    cadmiumRed: Math.max(0, Math.min(1, cadmiumRed)),
    cadmiumYellow: Math.max(0, Math.min(1, cadmiumYellow)),
    ultramarineBlue: Math.max(0, Math.min(1, ultramarineBlue)),
    white: Math.max(0, Math.min(1, white))
  };
}

/**
 * Recreate a color from pigment mix
 * Process: Mix base pigments first, then add white
 */
export function recreateColorFromPigments(mix: PigmentMix): [number, number, number] {
  // Step 1: Mix base pigments (without white)
  let baseR = 0, baseG = 0, baseB = 0;
  let baseTotal = 0;
  
  if (mix.aquamarine > 0) {
    baseR += PIGMENTS.aquamarine[0] * mix.aquamarine;
    baseG += PIGMENTS.aquamarine[1] * mix.aquamarine;
    baseB += PIGMENTS.aquamarine[2] * mix.aquamarine;
    baseTotal += mix.aquamarine;
  }
  
  if (mix.burntUmber > 0) {
    baseR += PIGMENTS.burntUmber[0] * mix.burntUmber;
    baseG += PIGMENTS.burntUmber[1] * mix.burntUmber;
    baseB += PIGMENTS.burntUmber[2] * mix.burntUmber;
    baseTotal += mix.burntUmber;
  }
  
  if (mix.cadmiumRed > 0) {
    baseR += PIGMENTS.cadmiumRed[0] * mix.cadmiumRed;
    baseG += PIGMENTS.cadmiumRed[1] * mix.cadmiumRed;
    baseB += PIGMENTS.cadmiumRed[2] * mix.cadmiumRed;
    baseTotal += mix.cadmiumRed;
  }
  
  if (mix.cadmiumYellow > 0) {
    baseR += PIGMENTS.cadmiumYellow[0] * mix.cadmiumYellow;
    baseG += PIGMENTS.cadmiumYellow[1] * mix.cadmiumYellow;
    baseB += PIGMENTS.cadmiumYellow[2] * mix.cadmiumYellow;
    baseTotal += mix.cadmiumYellow;
  }
  
  if (mix.ultramarineBlue > 0) {
    baseR += PIGMENTS.ultramarineBlue[0] * mix.ultramarineBlue;
    baseG += PIGMENTS.ultramarineBlue[1] * mix.ultramarineBlue;
    baseB += PIGMENTS.ultramarineBlue[2] * mix.ultramarineBlue;
    baseTotal += mix.ultramarineBlue;
  }
  
  // Normalize base color
  if (baseTotal > 0) {
    baseR /= baseTotal;
    baseG /= baseTotal;
    baseB /= baseTotal;
  }
  
  // Step 2: Add white AFTER base mix (critical requirement)
  const whiteAmount = mix.white;
  const baseAmount = 1 - whiteAmount;
  
  const finalR = baseR * baseAmount + PIGMENTS.white[0] * whiteAmount;
  const finalG = baseG * baseAmount + PIGMENTS.white[1] * whiteAmount;
  const finalB = baseB * baseAmount + PIGMENTS.white[2] * whiteAmount;
  
  return [
    Math.round(Math.max(0, Math.min(255, finalR))),
    Math.round(Math.max(0, Math.min(255, finalG))),
    Math.round(Math.max(0, Math.min(255, finalB)))
  ];
}

/**
 * Create a pigment-based color from hex
 */
export function createPigmentColor(hex: string): PigmentColor {
  const mix = analyzePigmentMix(hex);
  const recreatedRgb = recreateColorFromPigments(mix);
  const recreatedHex = rgbToHex(...recreatedRgb);
  
  return {
    hex: recreatedHex,
    rgb: recreatedRgb,
    pigmentMix: mix,
    isRecreated: true
  };
}

/**
 * Calculate color difference between two pigment colors
 */
export function calculatePigmentColorDistance(color1: PigmentColor, color2: PigmentColor): number {
  const [r1, g1, b1] = color1.rgb;
  const [r2, g2, b2] = color2.rgb;
  
  // Use Euclidean distance in RGB space
  const distance = Math.sqrt(
    Math.pow(r1 - r2, 2) +
    Math.pow(g1 - g2, 2) +
    Math.pow(b1 - b2, 2)
  );
  
  // Normalize to 0-100 scale
  return (distance / 441.67) * 100;
}

/**
 * Calculate match percentage between two pigment colors
 */
export function calculatePigmentMatch(userSkinTone: PigmentColor, productShade: PigmentColor): number {
  const distance = calculatePigmentColorDistance(userSkinTone, productShade);
  // Convert distance to match percentage (closer = higher percentage)
  return Math.max(0, 100 - distance);
}
