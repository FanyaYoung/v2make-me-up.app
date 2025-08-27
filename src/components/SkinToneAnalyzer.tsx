import { pipeline, env } from '@huggingface/transformers';
import { supabase } from '@/integrations/supabase/client';

// Configure transformers.js
env.allowLocalModels = false;
env.useBrowserCache = true;

export interface SkinToneAnalysis {
  dominantTone: {
    hex: string;
    undertone: 'warm' | 'cool' | 'neutral' | 'olive';
    depth: 'fair' | 'light' | 'medium' | 'deep' | 'very-deep';
    confidence: number;
    category: string;
    traits: string;
  };
  secondaryTone?: {
    hex: string;
    undertone: 'warm' | 'cool' | 'neutral' | 'olive';
    depth: 'fair' | 'light' | 'medium' | 'deep' | 'very-deep';
    confidence: number;
    category: string;
    traits: string;
  };
  regions: {
    forehead: string;
    cheeks: string;
    chin: string;
  };
  matchedFromDatabase: boolean;
}

class SkinToneAnalyzer {
  private segmentationModel: any = null;
  
  async initializeModel() {
    if (!this.segmentationModel) {
      console.log('Loading skin segmentation model...');
      this.segmentationModel = await pipeline(
        'image-segmentation',
        'Xenova/segformer-b2-finetuned-ade-512-512',
        { device: 'webgpu' }
      );
      console.log('Model loaded successfully');
    }
  }

  async analyzeSkinTone(imageElement: HTMLImageElement): Promise<SkinToneAnalysis> {
    // Create canvas for image processing
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    // Resize image for faster processing
    const maxSize = 512;
    const { width, height } = this.calculateResizeSize(imageElement, maxSize);
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(imageElement, 0, 0, width, height);

    // Get image data
    const imageData = ctx.getImageData(0, 0, width, height);
    
    // Extract skin regions
    const skinRegions = await this.extractSkinRegions(canvas);
    
    // Analyze skin tones in different facial regions
    const regionTones = this.analyzeRegionalTones(imageData, skinRegions);
    
    // Find closest matches in Skintonehexwithswatches database
    const dominantMatch = await this.findClosestSkinToneMatch(regionTones.cheeks.hex);
    const secondaryMatch = await this.findClosestSkinToneMatch(regionTones.forehead.hex);
    
    return {
      dominantTone: {
        hex: dominantMatch.hex,
        undertone: this.mapUndertone(dominantMatch.undertones),
        depth: this.mapDepth(dominantMatch.category.toLowerCase()),
        confidence: dominantMatch.confidence,
        category: dominantMatch.category,
        traits: dominantMatch.traits
      },
      secondaryTone: secondaryMatch.confidence > 0.7 ? {
        hex: secondaryMatch.hex,
        undertone: this.mapUndertone(secondaryMatch.undertones),
        depth: this.mapDepth(secondaryMatch.category.toLowerCase()),
        confidence: secondaryMatch.confidence,
        category: secondaryMatch.category,
        traits: secondaryMatch.traits
      } : undefined,
      regions: {
        forehead: regionTones.forehead.hex,
        cheeks: regionTones.cheeks.hex,
        chin: regionTones.chin.hex
      },
      matchedFromDatabase: true
    };
  }

  private calculateResizeSize(image: HTMLImageElement, maxSize: number) {
    const { naturalWidth, naturalHeight } = image;
    if (naturalWidth <= maxSize && naturalHeight <= maxSize) {
      return { width: naturalWidth, height: naturalHeight };
    }
    
    const aspectRatio = naturalWidth / naturalHeight;
    if (aspectRatio > 1) {
      return { width: maxSize, height: maxSize / aspectRatio };
    } else {
      return { width: maxSize * aspectRatio, height: maxSize };
    }
  }

  private async extractSkinRegions(canvas: HTMLCanvasElement) {
    // For now, use predefined regions based on typical face proportions
    // In a production app, you'd use the segmentation model for precise skin detection
    const width = canvas.width;
    const height = canvas.height;
    
    return {
      forehead: { x: width * 0.3, y: height * 0.2, width: width * 0.4, height: height * 0.15 },
      cheeks: { x: width * 0.25, y: height * 0.4, width: width * 0.5, height: height * 0.25 },
      chin: { x: width * 0.35, y: height * 0.7, width: width * 0.3, height: height * 0.15 }
    };
  }

  private analyzeRegionalTones(imageData: ImageData, regions: any) {
    const getAverageColor = (region: any) => {
      const { x, y, width, height } = region;
      let r = 0, g = 0, b = 0, count = 0;
      
      for (let py = Math.floor(y); py < Math.floor(y + height); py++) {
        for (let px = Math.floor(x); px < Math.floor(x + width); px++) {
          if (px >= 0 && px < imageData.width && py >= 0 && py < imageData.height) {
            const index = (py * imageData.width + px) * 4;
            r += imageData.data[index];
            g += imageData.data[index + 1];
            b += imageData.data[index + 2];
            count++;
          }
        }
      }
      
      return {
        r: Math.round(r / count),
        g: Math.round(g / count),
        b: Math.round(b / count),
        hex: `#${Math.round(r / count).toString(16).padStart(2, '0')}${Math.round(g / count).toString(16).padStart(2, '0')}${Math.round(b / count).toString(16).padStart(2, '0')}`
      };
    };

    return {
      forehead: getAverageColor(regions.forehead),
      cheeks: getAverageColor(regions.cheeks),
      chin: getAverageColor(regions.chin)
    };
  }

  // Find closest skin tone match from Skintonehexwithswatches database
  private async findClosestSkinToneMatch(hexColor: string) {
    try {
      // First try to get skin tone data from Skintonehexwithswatches table
      const { data: skinTones, error: skinToneError } = await supabase
        .from('Skintonehexwithswatches')
        .select('*')
        .limit(10);
      
      if (skinToneError) {
        console.error('Error fetching skin tones:', skinToneError);
        return this.createFallbackMatch(hexColor);
      }

      if (!skinTones || skinTones.length === 0) {
        return this.createFallbackMatch(hexColor);
      }

      // Find closest match based on hex color distance
      const bestMatch = this.findClosestHexMatch(hexColor, skinTones);
      return {
        hex: bestMatch['Hex Number'] || hexColor,
        category: bestMatch.Category || 'Medium',
        undertones: bestMatch.Undertones || 'Neutral',
        traits: bestMatch.Traits || 'Analyzed from database',
        overtone: bestMatch.Overtone || 'Neutral',
        confidence: Math.max(0.7, 1 - (bestMatch.distance || 20) / 100)
      };
    } catch (error) {
      console.error('Error finding skin tone match:', error);
      return this.createFallbackMatch(hexColor);
    }
  }

  // Find closest match based on hex color distance
  private findClosestHexMatch(targetHex: string, skinTones: any[]) {
    let bestMatch = skinTones[0];
    let minDistance = this.colorDistance(targetHex, bestMatch['Hex Number']);
    
    for (const tone of skinTones) {
      const distance = this.colorDistance(targetHex, tone['Hex Number']);
      if (distance < minDistance) {
        minDistance = distance;
        bestMatch = tone;
      }
    }
    
    return { ...bestMatch, distance: minDistance };
  }

  // Calculate color distance between two hex colors
  private colorDistance(hex1: string, hex2: string): number {
    const rgb1 = this.hexToRgb(hex1);
    const rgb2 = this.hexToRgb(hex2);
    
    if (!rgb1 || !rgb2) return 100;
    
    return Math.sqrt(
      Math.pow(rgb1.r - rgb2.r, 2) +
      Math.pow(rgb1.g - rgb2.g, 2) +
      Math.pow(rgb1.b - rgb2.b, 2)
    );
  }

  // Convert hex to RGB
  private hexToRgb(hex: string) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  // Create fallback match when database is unavailable
  private createFallbackMatch(hexColor: string) {
    const rgb = this.hexToRgb(hexColor);
    if (!rgb) {
      return {
        hex: '#FFDBAC',
        category: 'Medium',
        undertones: 'Neutral',
        traits: 'Balanced skin tone',
        overtone: 'Neutral',
        confidence: 0.5
      };
    }

    return {
      hex: hexColor,
      category: this.determineDepth(rgb.r, rgb.g, rgb.b),
      undertones: this.determineUndertone(rgb.r, rgb.g, rgb.b),
      traits: 'Analyzed from photo',
      overtone: 'Neutral',
      confidence: 0.7
    };
  }

  // Map database undertones to our standard format
  private mapUndertone(dbUndertone: string): 'warm' | 'cool' | 'neutral' | 'olive' {
    const undertone = dbUndertone.toLowerCase();
    if (undertone.includes('warm') || undertone.includes('golden') || undertone.includes('yellow')) return 'warm';
    if (undertone.includes('cool') || undertone.includes('pink') || undertone.includes('red')) return 'cool';
    if (undertone.includes('olive')) return 'olive';
    return 'neutral';
  }

  // Map database categories to our depth system
  private mapDepth(category: string): 'fair' | 'light' | 'medium' | 'deep' | 'very-deep' {
    const cat = category.toLowerCase();
    if (cat.includes('fair')) return 'fair';
    if (cat.includes('light')) return 'light';
    if (cat.includes('medium')) return 'medium';
    if (cat.includes('deep') || cat.includes('dark')) return 'deep';
    if (cat.includes('very')) return 'very-deep';
    return 'medium';
  }

  private determineUndertone(r: number, g: number, b: number): string {
    // Simplified undertone detection based on RGB ratios
    const yellowRatio = r / b;
    const pinkRatio = (r + b) / (2 * g);
    
    if (yellowRatio > 1.15) return 'Warm';
    if (pinkRatio > 1.1) return 'Cool';
    if (g > r && g > b) return 'Olive';
    return 'Neutral';
  }

  private determineDepth(r: number, g: number, b: number): string {
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    
    if (luminance > 200) return 'Fair';
    if (luminance > 160) return 'Light';
    if (luminance > 120) return 'Medium';
    if (luminance > 80) return 'Deep';
    return 'Very Deep';
  }
}

export const skinToneAnalyzer = new SkinToneAnalyzer();