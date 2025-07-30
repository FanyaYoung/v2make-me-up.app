import { pipeline, env } from '@huggingface/transformers';
import { findClosestSkinTone, useSkinToneReferences } from '@/hooks/useSkinToneReferences';

// Configure transformers.js
env.allowLocalModels = false;
env.useBrowserCache = true;

export interface SkinToneAnalysis {
  dominantTone: {
    hex: string;
    undertone: 'warm' | 'cool' | 'neutral' | 'olive';
    depth: 'fair' | 'light' | 'medium' | 'deep' | 'very-deep';
    confidence: number;
  };
  secondaryTone?: {
    hex: string;
    undertone: 'warm' | 'cool' | 'neutral' | 'olive';
    depth: 'fair' | 'light' | 'medium' | 'deep' | 'very-deep';
    confidence: number;
  };
  regions: {
    forehead: string;
    cheeks: string;
    chin: string;
  };
}

class SkinToneAnalyzer {
  private segmentationModel: any = null;
  private skinToneReferences: any[] = [];

  setSkinToneReferences(references: any[]) {
    this.skinToneReferences = references;
  }
  
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
    await this.initializeModel();
    
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
    
    // Determine dominant and secondary tones
    const toneAnalysis = this.calculateDominantTones(regionTones);
    
    return {
      dominantTone: toneAnalysis.dominant,
      secondaryTone: toneAnalysis.secondary,
      regions: {
        forehead: regionTones.forehead.hex,
        cheeks: regionTones.cheeks.hex,
        chin: regionTones.chin.hex
      }
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

  private calculateDominantTones(regionTones: any) {
    const tones = [regionTones.forehead, regionTones.cheeks, regionTones.chin];
    
    // Analyze undertones and depth for each region using reference data
    const analyzedTones = tones.map(tone => {
      const closestRef = findClosestSkinTone(tone.hex, this.skinToneReferences);
      return {
        ...tone,
        undertone: closestRef.undertone,
        depth: closestRef.depth,
        confidence: 0.85, // Mock confidence score
        referenceName: closestRef.name
      };
    });

    // Find dominant tone (most common or average)
    const dominantTone = this.findDominantTone(analyzedTones);
    
    // Check if there's a significant secondary tone
    const secondaryTone = this.findSecondaryTone(analyzedTones, dominantTone);

    return {
      dominant: dominantTone,
      secondary: secondaryTone
    };
  }

  private determineUndertone(r: number, g: number, b: number): 'warm' | 'cool' | 'neutral' | 'olive' {
    // Simplified undertone detection based on RGB ratios
    const yellowRatio = r / b;
    const pinkRatio = (r + b) / (2 * g);
    
    if (yellowRatio > 1.15) return 'warm';
    if (pinkRatio > 1.1) return 'cool';
    if (g > r && g > b) return 'olive';
    return 'neutral';
  }

  private determineDepth(r: number, g: number, b: number): 'fair' | 'light' | 'medium' | 'deep' | 'very-deep' {
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    
    if (luminance > 200) return 'fair';
    if (luminance > 160) return 'light';
    if (luminance > 120) return 'medium';
    if (luminance > 80) return 'deep';
    return 'very-deep';
  }

  private findDominantTone(tones: any[]) {
    // For simplicity, use the cheek tone as dominant (most representative)
    return tones[1]; // cheeks
  }

  private findSecondaryTone(tones: any[], dominantTone: any) {
    // Check if there's significant variation between regions
    const variations = tones.filter(tone => 
      tone.depth !== dominantTone.depth || tone.undertone !== dominantTone.undertone
    );
    
    if (variations.length > 0) {
      return { ...variations[0], confidence: 0.7 };
    }
    
    return undefined;
  }
}

export const skinToneAnalyzer = new SkinToneAnalyzer();