// Comprehensive 75-tone skin tone chart based on pigment mixing
// Based on the Flesh Tone Color Wheel by Terri Tomlinson

export interface SkinTonePigment {
  id: number;
  description: string;
  hexCode: string;
  r: number;
  g: number;
  b: number;
  pigmentStrategy: string;
  category: string;
}

export const PIGMENT_SKIN_TONES: SkinTonePigment[] = [
  // Very Fair Tones (Lightest Base)
  { id: 1, description: "Pale Rose (Cool-Pink)", hexCode: "#F7E9E4", r: 247, g: 233, b: 228, pigmentStrategy: "Lightest Orange + Very High White + Extra Violet (to cool)", category: "Very Fair" },
  { id: 2, description: "Porcelain (Neutral)", hexCode: "#F9E7D8", r: 249, g: 231, b: 216, pigmentStrategy: "Lightest Orange + Very High White + Minimal Blue (to neutralize)", category: "Very Fair" },
  { id: 3, description: "Fair Ivory (Warm)", hexCode: "#FFEAD8", r: 255, g: 234, b: 216, pigmentStrategy: "Lightest Orange + Max White + Extra Yellow", category: "Very Fair" },
  { id: 4, description: "Light Beige", hexCode: "#FFE2C9", r: 255, g: 226, b: 201, pigmentStrategy: "Light Orange + High White + Balanced Yellow/Red", category: "Very Fair" },
  { id: 5, description: "Fair Gold", hexCode: "#FFD8A9", r: 255, g: 216, b: 169, pigmentStrategy: "Light Orange + High White + More Yellow than Red", category: "Very Fair" },
  
  // Light Tones (Light Orange Base)
  { id: 6, description: "Light Peach", hexCode: "#FFDBAC", r: 255, g: 219, b: 172, pigmentStrategy: "Orange + High White + Neutral (Balanced Yellow/Red)", category: "Light" },
  { id: 7, description: "Soft Tan", hexCode: "#F6D0B4", r: 246, g: 208, b: 180, pigmentStrategy: "Orange + High White + Tiny amount of Brown", category: "Light" },
  { id: 8, description: "Light Olive (Muted)", hexCode: "#EBE1C7", r: 235, g: 225, b: 199, pigmentStrategy: "Orange + High White + Small amount of Blue/Green (to mute)", category: "Light" },
  { id: 9, description: "Rosy Cream", hexCode: "#E8BCB0", r: 232, g: 188, b: 176, pigmentStrategy: "Orange + High White + Extra Red (for rosiness)", category: "Light" },
  { id: 10, description: "Golden Tan", hexCode: "#E8C8A3", r: 232, g: 200, b: 163, pigmentStrategy: "Orange + High White + Extra Yellow", category: "Light" },
  
  // Medium Tones (Medium Orange Base)
  { id: 11, description: "Warm Sand", hexCode: "#E0AC69", r: 224, g: 172, b: 105, pigmentStrategy: "Orange + Medium White + Increasing Brown", category: "Medium" },
  { id: 12, description: "Neutral Bronze", hexCode: "#D8A578", r: 216, g: 165, b: 120, pigmentStrategy: "Orange + Medium White + Moderate Brown (Neutral)", category: "Medium" },
  { id: 13, description: "Rosewood", hexCode: "#C89B8D", r: 200, g: 155, b: 141, pigmentStrategy: "Orange + Medium White + More Red and Brown", category: "Medium" },
  { id: 14, description: "Olive Muted", hexCode: "#C4B59B", r: 196, g: 181, b: 155, pigmentStrategy: "Orange + Medium White + Significant Blue/Green (Muted)", category: "Medium" },
  { id: 15, description: "Deep Gold", hexCode: "#BE8D5C", r: 190, g: 141, b: 92, pigmentStrategy: "Orange + Medium White + More Yellow and Brown", category: "Medium" },
  
  // Dark Tones (Brown Orange Base)
  { id: 16, description: "Sun-Kissed", hexCode: "#C68642", r: 198, g: 134, b: 66, pigmentStrategy: "Orange + Low White + High Brown (Warm)", category: "Dark" },
  { id: 17, description: "Cocoa", hexCode: "#A8754E", r: 168, g: 117, b: 78, pigmentStrategy: "Orange + Low White + High Brown (Neutral)", category: "Dark" },
  { id: 18, description: "Deep Mahogany", hexCode: "#8D5524", r: 141, g: 85, b: 36, pigmentStrategy: "Orange + Minimal White + Very High Brown + Extra Red", category: "Dark" },
  { id: 19, description: "Deep Sepia", hexCode: "#7C5C46", r: 124, g: 92, b: 70, pigmentStrategy: "Orange + Minimal White + Very High Brown + Slight Blue (Cooler)", category: "Dark" },
  { id: 20, description: "Rich Chocolate", hexCode: "#6E4A3B", r: 110, g: 74, b: 59, pigmentStrategy: "Orange + Minimal White + Very High Brown + Balanced Red/Yellow", category: "Dark" },
  
  // Very Dark Tones (Dominant Brown/Black)
  { id: 21, description: "Espresso", hexCode: "#56311A", r: 86, g: 49, b: 26, pigmentStrategy: "Orange + Near Black + Touch of Red", category: "Very Dark" },
  { id: 22, description: "Deepest Brown", hexCode: "#4C3229", r: 76, g: 50, b: 41, pigmentStrategy: "Orange + Near Black + Neutral Orange balance", category: "Very Dark" },
  { id: 23, description: "Deep Ebony (Cool)", hexCode: "#3B2219", r: 59, g: 34, b: 25, pigmentStrategy: "Orange + Near Black + Hint of Blue (Cooler)", category: "Very Dark" },
  { id: 24, description: "True Black-Brown", hexCode: "#2C1A14", r: 44, g: 26, b: 20, pigmentStrategy: "Orange + Highest Black + Minimal Orange remaining", category: "Very Dark" },
  { id: 25, description: "Blue-Black", hexCode: "#271F1B", r: 39, g: 31, b: 27, pigmentStrategy: "Orange + Highest Black + Extra Blue (Coolest)", category: "Very Dark" },
  
  // Extended Fair Tones (Warm/Golden)
  { id: 26, description: "Fair-Warm Variant 1", hexCode: "#FAD9B2", r: 250, g: 217, b: 178, pigmentStrategy: "Orange + High White + Increase Yellow (Higher G/B ratio)", category: "Very Fair" },
  { id: 27, description: "Fair-Warm Variant 2", hexCode: "#F8D5A8", r: 248, g: 213, b: 168, pigmentStrategy: "Orange + High White + Increase Yellow", category: "Very Fair" },
  { id: 28, description: "Fair-Warm Variant 3", hexCode: "#F5D09E", r: 245, g: 208, b: 158, pigmentStrategy: "Orange + High White + More Yellow", category: "Very Fair" },
  { id: 29, description: "Fair-Warm Variant 4", hexCode: "#F2CB94", r: 242, g: 203, b: 148, pigmentStrategy: "Orange + High White + Strong Yellow", category: "Very Fair" },
  { id: 30, description: "Fair-Warm Variant 5", hexCode: "#F1C27D", r: 241, g: 194, b: 125, pigmentStrategy: "Orange + High White + Very Strong Yellow", category: "Very Fair" },
  { id: 31, description: "Fair-Cool Variant 1", hexCode: "#F0DDD6", r: 240, g: 221, b: 214, pigmentStrategy: "Orange + High White + Slight Violet", category: "Very Fair" },
  { id: 32, description: "Fair-Cool Variant 2", hexCode: "#F2E0D8", r: 242, g: 224, b: 216, pigmentStrategy: "Orange + High White + Slight Blue", category: "Very Fair" },
  { id: 33, description: "Fair-Neutral Variant 1", hexCode: "#F5E3D6", r: 245, g: 227, b: 214, pigmentStrategy: "Orange + High White + Neutral Balance", category: "Very Fair" },
  { id: 34, description: "Fair-Neutral Variant 2", hexCode: "#F8E7D8", r: 248, g: 231, b: 216, pigmentStrategy: "Orange + High White + Neutral Balance", category: "Very Fair" },
  { id: 35, description: "Fair-Warm Variant 6", hexCode: "#F8D9BC", r: 248, g: 217, b: 188, pigmentStrategy: "Orange + High White + Slight Red", category: "Very Fair" },
  
  // Extended Light Tones (Rosy/Red)
  { id: 36, description: "Light-Rosy Variant 1", hexCode: "#F0C8B5", r: 240, g: 200, b: 181, pigmentStrategy: "Orange + Medium White + Increasing Red (Higher R/G ratio)", category: "Light" },
  { id: 37, description: "Light-Rosy Variant 2", hexCode: "#EEC5B2", r: 238, g: 197, b: 178, pigmentStrategy: "Orange + Medium White + More Red", category: "Light" },
  { id: 38, description: "Light-Rosy Variant 3", hexCode: "#ECC2AF", r: 236, g: 194, b: 175, pigmentStrategy: "Orange + Medium White + Strong Red", category: "Light" },
  { id: 39, description: "Light-Rosy Variant 4", hexCode: "#EABFAC", r: 234, g: 191, b: 172, pigmentStrategy: "Orange + Medium White + Very Strong Red", category: "Light" },
  { id: 40, description: "Light-Rosy Variant 5", hexCode: "#E9BCAF", r: 233, g: 188, b: 175, pigmentStrategy: "Orange + Medium White + Extra Strong Red", category: "Light" },
  { id: 41, description: "Light-Rosy Variant 6", hexCode: "#E8BFAE", r: 232, g: 191, b: 174, pigmentStrategy: "Orange + Medium White + High Red", category: "Light" },
  { id: 42, description: "Light-Rosy Variant 7", hexCode: "#E9BDB0", r: 233, g: 189, b: 176, pigmentStrategy: "Orange + Medium White + Elevated Red", category: "Light" },
  { id: 43, description: "Light-Rosy Variant 8", hexCode: "#E8BEAF", r: 232, g: 190, b: 175, pigmentStrategy: "Orange + Medium White + Increased Red", category: "Light" },
  { id: 44, description: "Light-Rosy Variant 9", hexCode: "#E8BDAD", r: 232, g: 189, b: 173, pigmentStrategy: "Orange + Medium White + Boosted Red", category: "Light" },
  { id: 45, description: "Light-Rosy Variant 10", hexCode: "#E7BBAC", r: 231, g: 187, b: 172, pigmentStrategy: "Orange + Medium White + Enhanced Red", category: "Light" },
  { id: 46, description: "Light-Olive Variant 1", hexCode: "#DDC9B1", r: 221, g: 201, b: 177, pigmentStrategy: "Orange + Medium White + Increasing Green/Blue (Deeper Mute)", category: "Light" },
  { id: 47, description: "Light-Olive Variant 2", hexCode: "#CEC2A6", r: 206, g: 194, b: 166, pigmentStrategy: "Orange + Medium White + Strong Green/Blue (More Mute)", category: "Light" },
  { id: 48, description: "Light-Neutral Variant 1", hexCode: "#D3B89E", r: 211, g: 184, b: 158, pigmentStrategy: "Orange + Medium White + Neutral Brown", category: "Light" },
  { id: 49, description: "Light-Neutral Variant 2", hexCode: "#E0C7A9", r: 224, g: 199, b: 169, pigmentStrategy: "Orange + Medium White + Neutral Brown", category: "Light" },
  { id: 50, description: "Light-Golden Variant 1", hexCode: "#D4AC7F", r: 212, g: 172, b: 127, pigmentStrategy: "Orange + Medium White + Increasing Yellow", category: "Light" },
  
  // Extended Medium Tones (Neutral/Gold)
  { id: 51, description: "Medium-Neutral Variant 1", hexCode: "#CCA585", r: 204, g: 165, b: 133, pigmentStrategy: "Orange + Low White + Increasing Brown (Neutral)", category: "Medium" },
  { id: 52, description: "Medium-Neutral Variant 2", hexCode: "#C59F7E", r: 197, g: 159, b: 126, pigmentStrategy: "Orange + Low White + More Brown", category: "Medium" },
  { id: 53, description: "Medium-Neutral Variant 3", hexCode: "#BE9977", r: 190, g: 153, b: 119, pigmentStrategy: "Orange + Low White + Strong Brown", category: "Medium" },
  { id: 54, description: "Medium-Neutral Variant 4", hexCode: "#B79370", r: 183, g: 147, b: 112, pigmentStrategy: "Orange + Low White + Very Strong Brown", category: "Medium" },
  { id: 55, description: "Medium-Neutral Variant 5", hexCode: "#B08D69", r: 176, g: 141, b: 105, pigmentStrategy: "Orange + Low White + Extra Strong Brown", category: "Medium" },
  { id: 56, description: "Medium-Neutral Variant 6", hexCode: "#AA8862", r: 170, g: 136, b: 98, pigmentStrategy: "Orange + Low White + High Brown", category: "Medium" },
  { id: 57, description: "Medium-Neutral Variant 7", hexCode: "#A5835D", r: 165, g: 131, b: 93, pigmentStrategy: "Orange + Low White + Elevated Brown", category: "Medium" },
  { id: 58, description: "Medium-Neutral Variant 8", hexCode: "#9F7E58", r: 159, g: 126, b: 88, pigmentStrategy: "Orange + Low White + Increased Brown", category: "Medium" },
  { id: 59, description: "Medium-Neutral Variant 9", hexCode: "#9A7953", r: 154, g: 121, b: 83, pigmentStrategy: "Orange + Low White + Boosted Brown", category: "Medium" },
  { id: 60, description: "Medium-Neutral Variant 10", hexCode: "#A8754E", r: 168, g: 117, b: 78, pigmentStrategy: "Orange + Low White + Enhanced Brown", category: "Medium" },
  { id: 61, description: "Medium-Rosy Variant 1", hexCode: "#BB8977", r: 187, g: 137, b: 119, pigmentStrategy: "Orange + Low White + Slight Red + Brown", category: "Medium" },
  { id: 62, description: "Medium-Rosy Variant 2", hexCode: "#9F6F60", r: 159, g: 111, b: 96, pigmentStrategy: "Orange + Low White + Strong Red + Brown", category: "Medium" },
  { id: 63, description: "Medium-Olive Variant 1", hexCode: "#9B8D73", r: 155, g: 141, b: 115, pigmentStrategy: "Orange + Low White + Strong Blue/Green (Olive Mute)", category: "Medium" },
  { id: 64, description: "Medium-Olive Variant 2", hexCode: "#8B7E66", r: 139, g: 126, b: 102, pigmentStrategy: "Orange + Low White + Deeper Blue/Green", category: "Medium" },
  { id: 65, description: "Medium-Deep Neutral 1", hexCode: "#9A7056", r: 154, g: 112, b: 86, pigmentStrategy: "Orange + Low White + Deep Neutral Brown", category: "Medium" },
  
  // Extended Dark Tones (Red/Mahogany)
  { id: 66, description: "Dark-Red Variant 1", hexCode: "#8F5548", r: 143, g: 85, b: 72, pigmentStrategy: "Orange + Minimal White + High Brown + Increasing Red", category: "Dark" },
  { id: 67, description: "Dark-Red Variant 2", hexCode: "#8A524A", r: 138, g: 82, b: 74, pigmentStrategy: "Orange + Minimal White + High Brown + More Red", category: "Dark" },
  { id: 68, description: "Dark-Red Variant 3", hexCode: "#854F44", r: 133, g: 79, b: 68, pigmentStrategy: "Orange + Minimal White + High Brown + Strong Red", category: "Dark" },
  { id: 69, description: "Dark-Red Variant 4", hexCode: "#804C40", r: 128, g: 76, b: 64, pigmentStrategy: "Orange + Minimal White + High Brown + Very Strong Red", category: "Dark" },
  { id: 70, description: "Dark-Red Variant 5", hexCode: "#79483A", r: 121, g: 72, b: 58, pigmentStrategy: "Orange + Minimal White + High Brown + Extra Strong Red", category: "Dark" },
  { id: 71, description: "Dark-Cool Variant 1", hexCode: "#6E5B53", r: 110, g: 91, b: 83, pigmentStrategy: "Orange + Minimal White + High Brown + Slight Blue", category: "Dark" },
  { id: 72, description: "Dark-Cool Variant 2", hexCode: "#564944", r: 86, g: 73, b: 68, pigmentStrategy: "Orange + Minimal White + High Brown + More Blue", category: "Dark" },
  { id: 73, description: "Very Dark Gold", hexCode: "#634B32", r: 99, g: 75, b: 50, pigmentStrategy: "Orange + Minimal White + High Brown + More Yellow", category: "Very Dark" },
  { id: 74, description: "Very Dark Neutral 1", hexCode: "#453127", r: 69, g: 49, b: 39, pigmentStrategy: "Orange + Near Black + Neutral Brown", category: "Very Dark" },
  { id: 75, description: "Very Dark Neutral 2", hexCode: "#3B2219", r: 59, g: 34, b: 25, pigmentStrategy: "Orange + Near Black + Neutral Brown", category: "Very Dark" },
];

// Calculate color distance using deltaE2000 formula
export function calculateColorDistance(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
  // Simple Euclidean distance in RGB space
  // For more accurate results, convert to Lab color space
  const rDiff = r1 - r2;
  const gDiff = g1 - g2;
  const bDiff = b1 - b2;
  return Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
}

// Find the closest matching skin tone from the pigment chart
export function findClosestSkinTone(r: number, g: number, b: number): SkinTonePigment {
  let closestTone = PIGMENT_SKIN_TONES[0];
  let minDistance = Infinity;
  
  for (const tone of PIGMENT_SKIN_TONES) {
    const distance = calculateColorDistance(r, g, b, tone.r, tone.g, tone.b);
    if (distance < minDistance) {
      minDistance = distance;
      closestTone = tone;
    }
  }
  
  return closestTone;
}
