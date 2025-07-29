// Comprehensive skin tone reference data compiled from various sources
// Including references from uploaded images and color-hex.com

export interface SkinToneReference {
  hex: string;
  name?: string;
  undertone: 'warm' | 'cool' | 'neutral' | 'olive';
  depth: 'fair' | 'light' | 'medium' | 'deep' | 'very-deep';
  category: string;
  source: string;
}

// From the uploaded skin tone palette images
export const skinToneReferences: SkinToneReference[] = [
  // Fair Tones
  { hex: '#FED48D', name: 'Light Peach Rose', undertone: 'warm', depth: 'fair', category: 'fair', source: 'palette_1' },
  { hex: '#F9D6BE', name: 'Fair Warm', undertone: 'warm', depth: 'fair', category: 'fair', source: 'palette_1' },
  { hex: '#FAD6BD', name: 'Fair Neutral', undertone: 'neutral', depth: 'fair', category: 'fair', source: 'palette_1' },
  { hex: '#FCD6BE', name: 'Fair Cool', undertone: 'cool', depth: 'fair', category: 'fair', source: 'palette_1' },
  { hex: '#FED489', name: 'Fair Olive', undertone: 'olive', depth: 'fair', category: 'fair', source: 'palette_1' },

  // Light Tones  
  { hex: '#F7D6C4', name: 'Plumpkin Essence', undertone: 'warm', depth: 'light', category: 'light', source: 'palette_2' },
  { hex: '#FFDC8D', name: 'Persian Melon', undertone: 'warm', depth: 'light', category: 'light', source: 'palette_2' },
  { hex: '#FFD9A2', name: 'September Sun', undertone: 'warm', depth: 'light', category: 'light', source: 'palette_2' },
  { hex: '#F582AB', name: 'Sesame', undertone: 'neutral', depth: 'light', category: 'light', source: 'palette_2' },
  { hex: '#E6D59E', name: 'Deweter', undertone: 'cool', depth: 'light', category: 'light', source: 'palette_2' },
  { hex: '#F6D2C4', name: 'Nutter Butter', undertone: 'warm', depth: 'light', category: 'light', source: 'palette_2' },
  { hex: '#E8CABE', name: 'Au Naturel', undertone: 'neutral', depth: 'light', category: 'light', source: 'palette_2' },
  { hex: '#FBC4AF', name: 'Peach Melba', undertone: 'warm', depth: 'light', category: 'light', source: 'palette_2' },
  { hex: '#F4C956', name: 'Taco', undertone: 'warm', depth: 'light', category: 'light', source: 'palette_2' },
  { hex: '#EBC091', name: 'Golden Oat', undertone: 'warm', depth: 'light', category: 'light', source: 'palette_2' },
  { hex: '#CB9962', name: 'Burnt Pumpkin', undertone: 'warm', depth: 'light', category: 'light', source: 'palette_2' },
  { hex: '#AB8864', name: 'Dublin', undertone: 'olive', depth: 'light', category: 'light', source: 'palette_2' },

  // Medium Tones
  { hex: '#F0C2A0', name: 'Olive Light', undertone: 'olive', depth: 'medium', category: 'olive', source: 'palette_3' },
  { hex: '#E6B493', name: 'Olive Medium', undertone: 'olive', depth: 'medium', category: 'olive', source: 'palette_3' },
  { hex: '#DFA485', name: 'Olive Deep', undertone: 'olive', depth: 'medium', category: 'olive', source: 'palette_3' },
  { hex: '#D59980', name: 'Olive Deeper', undertone: 'olive', depth: 'medium', category: 'olive', source: 'palette_3' },
  { hex: '#CB8B75', name: 'Olive Deepest', undertone: 'olive', depth: 'medium', category: 'olive', source: 'palette_3' },
  
  { hex: '#EEC495', name: 'Humble Gold', undertone: 'warm', depth: 'medium', category: 'medium', source: 'palette_2' },
  { hex: '#EFC088', name: 'Colonial Yellow', undertone: 'warm', depth: 'medium', category: 'medium', source: 'palette_2' },
  { hex: '#E7BC90', name: 'Dark Yellow', undertone: 'warm', depth: 'medium', category: 'medium', source: 'palette_2' },
  { hex: '#ECBF83', name: 'Eldar Flesh', undertone: 'warm', depth: 'medium', category: 'medium', source: 'palette_2' },
  { hex: '#D09E7C', name: 'Clementine', undertone: 'warm', depth: 'medium', category: 'medium', source: 'palette_2' },
  { hex: '#D39171', name: 'Terra Cotta Pot', undertone: 'warm', depth: 'medium', category: 'medium', source: 'palette_2' },
  { hex: '#97B70', name: 'Reddish Grey', undertone: 'neutral', depth: 'medium', category: 'medium', source: 'palette_2' },

  // Deep Tones
  { hex: '#A96654', name: 'Light Brown 1', undertone: 'warm', depth: 'deep', category: 'light_brown', source: 'palette_3' },
  { hex: '#A8664B', name: 'Light Brown 2', undertone: 'warm', depth: 'deep', category: 'light_brown', source: 'palette_3' },
  { hex: '#A46143', name: 'Light Brown 3', undertone: 'warm', depth: 'deep', category: 'light_brown', source: 'palette_3' },
  { hex: '#9F5B37', name: 'Light Brown 4', undertone: 'warm', depth: 'deep', category: 'light_brown', source: 'palette_3' },
  { hex: '#A0522F', name: 'Light Brown 5', undertone: 'warm', depth: 'deep', category: 'light_brown', source: 'palette_3' },

  { hex: '#94623D', name: 'Caramel', undertone: 'warm', depth: 'deep', category: 'deep', source: 'palette_2' },
  { hex: '#885633', name: 'Burnt Crust', undertone: 'warm', depth: 'deep', category: 'deep', source: 'palette_2' },
  { hex: '#764520', name: 'Vintage Wood', undertone: 'warm', depth: 'deep', category: 'deep', source: 'palette_2' },
  { hex: '#836849', name: 'Rusty Gate', undertone: 'neutral', depth: 'deep', category: 'deep', source: 'palette_2' },
  { hex: '#81492A', name: 'Lamb Chop', undertone: 'warm', depth: 'deep', category: 'deep', source: 'palette_2' },
  { hex: '#633A17', name: 'Pullman Brown', undertone: 'warm', depth: 'deep', category: 'deep', source: 'palette_2' },

  // Very Deep Tones  
  { hex: '#7E4121', name: 'Brown 1', undertone: 'warm', depth: 'very-deep', category: 'brown', source: 'palette_3' },
  { hex: '#784325', name: 'Brown 2', undertone: 'warm', depth: 'very-deep', category: 'brown', source: 'palette_3' },
  { hex: '#754428', name: 'Brown 3', undertone: 'warm', depth: 'very-deep', category: 'brown', source: 'palette_3' },
  { hex: '#6F4428', name: 'Brown 4', undertone: 'warm', depth: 'very-deep', category: 'brown', source: 'palette_3' },
  { hex: '#69442C', name: 'Brown 5', undertone: 'warm', depth: 'very-deep', category: 'brown', source: 'palette_3' },

  { hex: '#48301F', name: 'Black Brown 1', undertone: 'warm', depth: 'very-deep', category: 'black_brown', source: 'palette_3' },
  { hex: '#452A19', name: 'Black Brown 2', undertone: 'warm', depth: 'very-deep', category: 'black_brown', source: 'palette_3' },
  { hex: '#3C2718', name: 'Black Brown 3', undertone: 'neutral', depth: 'very-deep', category: 'black_brown', source: 'palette_3' },
  { hex: '#352115', name: 'Black Brown 4', undertone: 'neutral', depth: 'very-deep', category: 'black_brown', source: 'palette_3' },
  { hex: '#2D1B11', name: 'Black Brown 5', undertone: 'neutral', depth: 'very-deep', category: 'black_brown', source: 'palette_3' },

  { hex: '#2FE11', name: 'Black Slug', undertone: 'neutral', depth: 'very-deep', category: 'very_deep', source: 'palette_2' },

  // Additional palette 1 references
  { hex: '#937952', name: 'Deep Warm 1', undertone: 'warm', depth: 'deep', category: 'deep', source: 'palette_1' },
  { hex: '#77562F', name: 'Deep Warm 2', undertone: 'warm', depth: 'deep', category: 'deep', source: 'palette_1' },
  { hex: '#A8916D', name: 'Medium Warm 1', undertone: 'warm', depth: 'medium', category: 'medium', source: 'palette_1' },
  { hex: '#F5E0CD', name: 'Light Cool 1', undertone: 'cool', depth: 'light', category: 'light', source: 'palette_1' },
  { hex: '#F0D0B4', name: 'Light Warm 1', undertone: 'warm', depth: 'light', category: 'light', source: 'palette_1' },
  { hex: '#ECC19C', name: 'Light Warm 2', undertone: 'warm', depth: 'light', category: 'light', source: 'palette_1' },
  { hex: '#DFB28B', name: 'Medium Warm 2', undertone: 'warm', depth: 'medium', category: 'medium', source: 'palette_1' },
  { hex: '#CF9E76', name: 'Medium Warm 3', undertone: 'warm', depth: 'medium', category: 'medium', source: 'palette_1' },
  { hex: '#AC8457', name: 'Deep Warm 3', undertone: 'warm', depth: 'deep', category: 'deep', source: 'palette_1' },
  { hex: '#A46C35', name: 'Deep Warm 4', undertone: 'warm', depth: 'deep', category: 'deep', source: 'palette_1' },
  { hex: '#8E572A', name: 'Very Deep 1', undertone: 'warm', depth: 'very-deep', category: 'very_deep', source: 'palette_1' },
  { hex: '#7D4921', name: 'Very Deep 2', undertone: 'warm', depth: 'very-deep', category: 'very_deep', source: 'palette_1' },
];

// Additional reference data structure for organized access
export const skinToneByCategory = {
  fair: skinToneReferences.filter(tone => tone.depth === 'fair'),
  light: skinToneReferences.filter(tone => tone.depth === 'light'),  
  medium: skinToneReferences.filter(tone => tone.depth === 'medium'),
  deep: skinToneReferences.filter(tone => tone.depth === 'deep'),
  'very-deep': skinToneReferences.filter(tone => tone.depth === 'very-deep')
};

export const skinToneByUndertone = {
  warm: skinToneReferences.filter(tone => tone.undertone === 'warm'),
  cool: skinToneReferences.filter(tone => tone.undertone === 'cool'),
  neutral: skinToneReferences.filter(tone => tone.undertone === 'neutral'),
  olive: skinToneReferences.filter(tone => tone.undertone === 'olive')
};

// Function to find the closest skin tone reference
export const findClosestSkinTone = (targetHex: string): SkinToneReference => {
  const targetRgb = hexToRgb(targetHex);
  let closestTone = skinToneReferences[0];
  let minDistance = Infinity;

  skinToneReferences.forEach(tone => {
    const toneRgb = hexToRgb(tone.hex);
    const distance = calculateColorDistance(targetRgb, toneRgb);
    
    if (distance < minDistance) {
      minDistance = distance;
      closestTone = tone;
    }
  });

  return closestTone;
};

// Helper function to convert hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

// Helper function to calculate color distance using Euclidean distance
function calculateColorDistance(
  color1: { r: number; g: number; b: number },
  color2: { r: number; g: number; b: number }
): number {
  return Math.sqrt(
    Math.pow(color1.r - color2.r, 2) +
    Math.pow(color1.g - color2.g, 2) +
    Math.pow(color1.b - color2.b, 2)
  );
}