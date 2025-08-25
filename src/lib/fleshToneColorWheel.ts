/**
 * Professional Flesh Tone Color Wheel System
 * Based on makeup color theory for realistic foundation matching
 * Inspired by professional makeup artist color wheels
 */

export interface FleshToneColor {
  name: string;
  hex: string;
  depth: number; // 1-10 scale (1=lightest, 10=deepest)
  undertone: 'cool' | 'warm' | 'neutral' | 'olive' | 'golden' | 'pink' | 'red' | 'yellow';
  description: string;
}

/**
 * Professional flesh tone color wheel with realistic pigmented colors
 * Based on actual makeup foundation formulations
 */
export const FLESH_TONE_COLOR_WHEEL: FleshToneColor[] = [
  // Ultra Light Tones (Depth 1-2)
  { name: 'Porcelain', hex: '#FDF2E7', depth: 1, undertone: 'cool', description: 'Ultra light with pink undertones' },
  { name: 'Ivory', hex: '#FBF0E2', depth: 1, undertone: 'neutral', description: 'Ultra light neutral' },
  { name: 'Shell', hex: '#F9EDD9', depth: 1, undertone: 'warm', description: 'Ultra light with golden undertones' },
  { name: 'Alabaster', hex: '#FAF1E8', depth: 1, undertone: 'pink', description: 'Ultra light with soft pink undertones' },
  
  // Light Tones (Depth 2-3)
  { name: 'Fair Neutral', hex: '#F5E8D3', depth: 2, undertone: 'neutral', description: 'Light neutral beige' },
  { name: 'Fair Warm', hex: '#F3E4CC', depth: 2, undertone: 'warm', description: 'Light with golden undertones' },
  { name: 'Fair Cool', hex: '#F7EBD8', depth: 2, undertone: 'cool', description: 'Light with pink undertones' },
  { name: 'Light Peach', hex: '#F1DFC8', depth: 2, undertone: 'yellow', description: 'Light peachy tone' },
  { name: 'Light Rose', hex: '#F4E2D1', depth: 2, undertone: 'pink', description: 'Light with rosy undertones' },
  
  // Light-Medium Tones (Depth 3-4)
  { name: 'Light Medium Neutral', hex: '#ECDABE', depth: 3, undertone: 'neutral', description: 'Light medium neutral' },
  { name: 'Light Medium Warm', hex: '#E8D4B3', depth: 3, undertone: 'warm', description: 'Light medium with golden undertones' },
  { name: 'Light Medium Cool', hex: '#EFDDBE', depth: 3, undertone: 'cool', description: 'Light medium with pink undertones' },
  { name: 'Light Olive', hex: '#E6D2A8', depth: 3, undertone: 'olive', description: 'Light with olive undertones' },
  { name: 'Honey', hex: '#E3D0A5', depth: 3, undertone: 'golden', description: 'Light honey tone' },
  
  // Medium Tones (Depth 4-5)
  { name: 'Medium Neutral', hex: '#DCC5A0', depth: 4, undertone: 'neutral', description: 'Medium neutral beige' },
  { name: 'Medium Warm', hex: '#D7BE94', depth: 4, undertone: 'warm', description: 'Medium with golden undertones' },
  { name: 'Medium Cool', hex: '#DFCAA3', depth: 4, undertone: 'cool', description: 'Medium with pink undertones' },
  { name: 'Medium Olive', hex: '#D4BC8C', depth: 4, undertone: 'olive', description: 'Medium with olive undertones' },
  { name: 'Caramel', hex: '#D1B88A', depth: 4, undertone: 'golden', description: 'Medium caramel tone' },
  { name: 'Sand', hex: '#CFC199', depth: 4, undertone: 'yellow', description: 'Medium sandy tone' },
  
  // Medium-Deep Tones (Depth 5-6)
  { name: 'Medium Deep Neutral', hex: '#C8B088', depth: 5, undertone: 'neutral', description: 'Medium deep neutral' },
  { name: 'Medium Deep Warm', hex: '#C2A87B', depth: 5, undertone: 'warm', description: 'Medium deep with golden undertones' },
  { name: 'Medium Deep Cool', hex: '#CCB48D', depth: 5, undertone: 'cool', description: 'Medium deep with pink undertones' },
  { name: 'Bronze', hex: '#BFA273', depth: 5, undertone: 'golden', description: 'Medium deep bronze tone' },
  { name: 'Amber', hex: '#BB9E6F', depth: 5, undertone: 'warm', description: 'Medium deep amber tone' },
  { name: 'Sienna', hex: '#B89B6B', depth: 5, undertone: 'red', description: 'Medium deep with red undertones' },
  
  // Deep Tones (Depth 6-7)
  { name: 'Deep Neutral', hex: '#B0946C', depth: 6, undertone: 'neutral', description: 'Deep neutral brown' },
  { name: 'Deep Warm', hex: '#A98B5F', depth: 6, undertone: 'warm', description: 'Deep with golden undertones' },
  { name: 'Deep Cool', hex: '#B4986F', depth: 6, undertone: 'cool', description: 'Deep with pink undertones' },
  { name: 'Deep Olive', hex: '#A6895B', depth: 6, undertone: 'olive', description: 'Deep with olive undertones' },
  { name: 'Mahogany', hex: '#A18355', depth: 6, undertone: 'red', description: 'Deep mahogany tone' },
  { name: 'Chestnut', hex: '#9E8052', depth: 6, undertone: 'warm', description: 'Deep chestnut tone' },
  
  // Very Deep Tones (Depth 7-8)
  { name: 'Very Deep Neutral', hex: '#977D4F', depth: 7, undertone: 'neutral', description: 'Very deep neutral' },
  { name: 'Very Deep Warm', hex: '#8E7443', depth: 7, undertone: 'warm', description: 'Very deep with golden undertones' },
  { name: 'Very Deep Cool', hex: '#9B8152', depth: 7, undertone: 'cool', description: 'Very deep with pink undertones' },
  { name: 'Espresso', hex: '#8A6F3C', depth: 7, undertone: 'red', description: 'Very deep espresso tone' },
  { name: 'Cognac', hex: '#876C39', depth: 7, undertone: 'warm', description: 'Very deep cognac tone' },
  { name: 'Cocoa', hex: '#836835', depth: 7, undertone: 'neutral', description: 'Very deep cocoa tone' },
  
  // Ultra Deep Tones (Depth 8-10)
  { name: 'Ultra Deep Neutral', hex: '#7D6230', depth: 8, undertone: 'neutral', description: 'Ultra deep neutral' },
  { name: 'Ultra Deep Warm', hex: '#74592B', depth: 8, undertone: 'warm', description: 'Ultra deep with golden undertones' },
  { name: 'Ultra Deep Cool', hex: '#816633', depth: 8, undertone: 'cool', description: 'Ultra deep with pink undertones' },
  { name: 'Ebony', hex: '#6F5028', depth: 9, undertone: 'neutral', description: 'Ultra deep ebony tone' },
  { name: 'Rich Earth', hex: '#6A4B25', depth: 9, undertone: 'warm', description: 'Ultra deep earth tone' },
  { name: 'Deep Umber', hex: '#644722', depth: 10, undertone: 'red', description: 'Deepest umber tone' },
];

/**
 * Find the closest flesh tone match for a given depth and undertone
 */
export const findClosestFleshTone = (
  targetDepth: number, 
  targetUndertone: string
): FleshToneColor => {
  // Normalize undertone
  const normalizedUndertone = targetUndertone.toLowerCase();
  
  // First try exact undertone match
  let matches = FLESH_TONE_COLOR_WHEEL.filter(tone => 
    tone.undertone === normalizedUndertone
  );
  
  // If no exact match, try compatible undertones
  if (matches.length === 0) {
    const compatibleUndertones = getCompatibleUndertones(normalizedUndertone);
    matches = FLESH_TONE_COLOR_WHEEL.filter(tone =>
      compatibleUndertones.includes(tone.undertone)
    );
  }
  
  // If still no matches, use all tones
  if (matches.length === 0) {
    matches = FLESH_TONE_COLOR_WHEEL;
  }
  
  // Find closest depth match
  return matches.reduce((closest, current) => {
    const currentDepthDiff = Math.abs(current.depth - targetDepth);
    const closestDepthDiff = Math.abs(closest.depth - targetDepth);
    return currentDepthDiff < closestDepthDiff ? current : closest;
  });
};

/**
 * Get compatible undertones for mixing and matching
 */
export const getCompatibleUndertones = (undertone: string): string[] => {
  const undertoneMap: Record<string, string[]> = {
    'warm': ['warm', 'golden', 'yellow', 'neutral'],
    'cool': ['cool', 'pink', 'neutral'],
    'neutral': ['neutral', 'warm', 'cool'],
    'olive': ['olive', 'neutral', 'warm'],
    'golden': ['golden', 'warm', 'yellow'],
    'pink': ['pink', 'cool', 'neutral'],
    'red': ['red', 'warm', 'neutral'],
    'yellow': ['yellow', 'warm', 'golden']
  };
  
  return undertoneMap[undertone.toLowerCase()] || ['neutral'];
};

/**
 * Convert depth name to numeric value
 */
export const getDepthFromName = (shadeName: string): number => {
  const name = shadeName.toLowerCase();
  
  if (name.includes('ultra light') || name.includes('porcelain') || name.includes('ivory')) return 1;
  if (name.includes('fair') || name.includes('light')) return 2;
  if (name.includes('light medium')) return 3;
  if (name.includes('medium') && !name.includes('deep')) return 4;
  if (name.includes('medium deep')) return 5;
  if (name.includes('deep') && !name.includes('very')) return 6;
  if (name.includes('very deep')) return 7;
  if (name.includes('ultra deep') || name.includes('ebony')) return 8;
  if (name.includes('deepest') || name.includes('umber')) return 9;
  
  // Numeric shade matching (common in foundations)
  const numbers = shadeName.match(/\d+/);
  if (numbers) {
    const num = parseInt(numbers[0]);
    if (num <= 100) return 1;
    if (num <= 150) return 2;
    if (num <= 200) return 3;
    if (num <= 250) return 4;
    if (num <= 300) return 5;
    if (num <= 350) return 6;
    if (num <= 400) return 7;
    if (num <= 450) return 8;
    return 9;
  }
  
  return 4; // Default to medium
};

/**
 * Generate realistic flesh tone color for any shade
 */
export const generateRealisticFleshTone = (
  shadeName: string,
  undertone: string = 'neutral'
): string => {
  const depth = getDepthFromName(shadeName);
  const fleshTone = findClosestFleshTone(depth, undertone);
  return fleshTone.hex;
};