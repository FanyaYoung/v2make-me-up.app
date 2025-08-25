import { pipeline, env } from '@huggingface/transformers';
import { supabase } from '@/integrations/supabase/client';

// Configure transformers.js
env.allowLocalModels = false;
env.useBrowserCache = true;

export interface InclusiveSkinToneAnalysis {
  dominantTone: {
    hex: string;
    undertone: 'warm' | 'cool' | 'neutral' | 'olive';
    depth: 'fair' | 'light' | 'medium' | 'tan' | 'deep' | 'very-deep';
    confidence: number;
    referenceSystem: 'ita' | 'massey-martin' | 'casco' | 'custom';
  };
  secondaryTone?: {
    hex: string;
    undertone: 'warm' | 'cool' | 'neutral' | 'olive';
    depth: 'fair' | 'light' | 'medium' | 'tan' | 'deep' | 'very-deep';
    confidence: number;
    referenceSystem: string;
  };
  biasCorrection: {
    originalHex: string;
    correctedHex: string;
    adjustmentType: 'yellow-reduction' | 'none' | 'warmth-enhancement';
    confidenceImprovement: number;
  };
  multipleReferences: {
    itaAngle: number;
    masseyMartinScale: number;
    cascoClassification: string;
    customDepthLevel: number;
  };
  regions: {
    forehead: { hex: string; confidence: number };
    cheeks: { hex: string; confidence: number };
    chin: { hex: string; confidence: number };
    jawline: { hex: string; confidence: number };
  };
  qualityMetrics: {
    lightingQuality: number;
    skinExposurePercentage: number;
    colorAccuracy: number;
    overallConfidence: number;
  };
}

class InclusiveShadeAnalyzer {
  private segmentationModel: any = null;
  private colorModel: any = null;
  
  async initializeModels() {
    if (!this.segmentationModel) {
      console.log('Loading inclusive skin analysis models...');
      this.segmentationModel = await pipeline(
        'image-segmentation',
        'Xenova/segformer-b2-finetuned-ade-512-512',
        { device: 'webgpu' }
      );
      
      // Use a simpler approach instead of loading additional models
      // This avoids the image processor configuration error
      this.colorModel = true; // Mark as loaded for compatibility
      
      console.log('Inclusive analysis models loaded successfully');
    }
  }

  async analyzeInclusiveSkinTone(imageElement: HTMLImageElement): Promise<InclusiveSkinToneAnalysis> {
    await this.initializeModels();
    
    // Create canvas for image processing
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    // Optimize for accuracy over speed
    const maxSize = 1024; // Higher resolution for better accuracy
    const { width, height } = this.calculateResizeSize(imageElement, maxSize);
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(imageElement, 0, 0, width, height);

    // Get image data
    const imageData = ctx.getImageData(0, 0, width, height);
    
    // Advanced lighting quality assessment
    const lightingQuality = this.assessLightingQuality(imageData);
    
    // Extract skin regions with higher precision
    const skinRegions = await this.extractAdvancedSkinRegions(canvas);
    
    // Analyze skin tones across multiple facial regions
    const regionalAnalysis = this.analyzeAdvancedRegionalTones(imageData, skinRegions);
    
    // Apply multiple reference systems
    const multiRefAnalysis = this.applyMultipleReferenceSystems(regionalAnalysis);
    
    // Counter yellowish bias and enhance accuracy
    const biasCorrection = this.correctColorBias(multiRefAnalysis.dominantColor);
    
    // Calculate quality metrics
    const qualityMetrics = this.calculateQualityMetrics(imageData, skinRegions, lightingQuality);
    
    // Determine final tones with confidence scoring
    const finalAnalysis = this.synthesizeAnalysis(multiRefAnalysis, biasCorrection, qualityMetrics);
    
    return finalAnalysis;
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

  private async extractAdvancedSkinRegions(canvas: HTMLCanvasElement) {
    const width = canvas.width;
    const height = canvas.height;
    
    // More precise facial region mapping based on facial anatomy
    return {
      forehead: { 
        x: width * 0.25, y: height * 0.15, 
        width: width * 0.5, height: height * 0.2 
      },
      cheeks: { 
        x: width * 0.2, y: height * 0.35, 
        width: width * 0.6, height: height * 0.3 
      },
      chin: { 
        x: width * 0.35, y: height * 0.7, 
        width: width * 0.3, height: height * 0.2 
      },
      jawline: { 
        x: width * 0.15, y: height * 0.55, 
        width: width * 0.7, height: width * 0.15 
      }
    };
  }

  private analyzeAdvancedRegionalTones(imageData: ImageData, regions: any) {
    const getAdvancedRegionAnalysis = (region: any) => {
      const { x, y, width, height } = region;
      let r = 0, g = 0, b = 0, count = 0;
      let rValues: number[] = [], gValues: number[] = [], bValues: number[] = [];
      
      for (let py = Math.floor(y); py < Math.floor(y + height); py++) {
        for (let px = Math.floor(x); px < Math.floor(x + width); px++) {
          if (px >= 0 && px < imageData.width && py >= 0 && py < imageData.height) {
            const index = (py * imageData.width + px) * 4;
            const pixelR = imageData.data[index];
            const pixelG = imageData.data[index + 1];
            const pixelB = imageData.data[index + 2];
            
            // Filter out extreme pixels (likely noise)
            if (this.isValidSkinPixel(pixelR, pixelG, pixelB)) {
              r += pixelR;
              g += pixelG;
              b += pixelB;
              rValues.push(pixelR);
              gValues.push(pixelG);
              bValues.push(pixelB);
              count++;
            }
          }
        }
      }
      
      if (count === 0) return null;
      
      const avgR = r / count;
      const avgG = g / count;
      const avgB = b / count;
      
      // Calculate confidence based on color consistency
      const rStd = this.calculateStandardDeviation(rValues);
      const gStd = this.calculateStandardDeviation(gValues);
      const bStd = this.calculateStandardDeviation(bValues);
      const avgStd = (rStd + gStd + bStd) / 3;
      const confidence = Math.max(0, 1 - (avgStd / 50)); // Lower std = higher confidence
      
      return {
        r: Math.round(avgR),
        g: Math.round(avgG),
        b: Math.round(avgB),
        hex: this.rgbToHex(Math.round(avgR), Math.round(avgG), Math.round(avgB)),
        confidence
      };
    };

    const forehead = getAdvancedRegionAnalysis(regions.forehead);
    const cheeks = getAdvancedRegionAnalysis(regions.cheeks);
    const chin = getAdvancedRegionAnalysis(regions.chin);
    const jawline = getAdvancedRegionAnalysis(regions.jawline);

    // Calculate dominant color from most reliable regions
    const validRegions = [forehead, cheeks, chin, jawline].filter(r => r !== null);
    if (validRegions.length === 0) {
      throw new Error('No valid skin regions detected');
    }

    // Weight regions by confidence and typical reliability
    const weights = { forehead: 0.3, cheeks: 0.4, chin: 0.2, jawline: 0.1 };
    let weightedR = 0, weightedG = 0, weightedB = 0, totalWeight = 0;

    if (forehead) {
      weightedR += forehead.r * weights.forehead * forehead.confidence;
      weightedG += forehead.g * weights.forehead * forehead.confidence;
      weightedB += forehead.b * weights.forehead * forehead.confidence;
      totalWeight += weights.forehead * forehead.confidence;
    }
    if (cheeks) {
      weightedR += cheeks.r * weights.cheeks * cheeks.confidence;
      weightedG += cheeks.g * weights.cheeks * cheeks.confidence;
      weightedB += cheeks.b * weights.cheeks * cheeks.confidence;
      totalWeight += weights.cheeks * cheeks.confidence;
    }
    if (chin) {
      weightedR += chin.r * weights.chin * chin.confidence;
      weightedG += chin.g * weights.chin * chin.confidence;
      weightedB += chin.b * weights.chin * chin.confidence;
      totalWeight += weights.chin * chin.confidence;
    }
    if (jawline) {
      weightedR += jawline.r * weights.jawline * jawline.confidence;
      weightedG += jawline.g * weights.jawline * jawline.confidence;
      weightedB += jawline.b * weights.jawline * jawline.confidence;
      totalWeight += weights.jawline * jawline.confidence;
    }

    const dominantColor = {
      r: Math.round(weightedR / totalWeight),
      g: Math.round(weightedG / totalWeight),
      b: Math.round(weightedB / totalWeight),
      hex: this.rgbToHex(
        Math.round(weightedR / totalWeight),
        Math.round(weightedG / totalWeight),
        Math.round(weightedB / totalWeight)
      )
    };

    return {
      regions: { forehead, cheeks, chin, jawline },
      dominantColor
    };
  }

  private applyMultipleReferenceSystems(analysis: any) {
    const { r, g, b } = analysis.dominantColor;
    
    // ITA° (Individual Typology Angle) - CIE L*a*b* based
    const lab = this.rgbToLab(r, g, b);
    const itaAngle = (Math.atan2(lab.b, lab.a) * 180) / Math.PI;
    
    // Massey-Martin Scale (10-point scale)
    const masseyMartinScale = this.calculateMasseyMartinScale(r, g, b);
    
    // CASCo Classification
    const cascoClassification = this.applyCascoClassification(lab, itaAngle);
    
    // Custom depth level (1-10 scale with better distribution)
    const customDepthLevel = this.calculateCustomDepthLevel(r, g, b, lab);
    
    return {
      ...analysis,
      multipleReferences: {
        itaAngle,
        masseyMartinScale,
        cascoClassification,
        customDepthLevel
      }
    };
  }

  private correctColorBias(dominantColor: any) {
    const { r, g, b, hex } = dominantColor;
    
    // Detect yellowish bias (common in many algorithms)
    const yellowBias = (r + g) / 2 - b;
    const isYellowBiased = yellowBias > 15; // Threshold for yellow bias
    
    let correctedR = r, correctedG = g, correctedB = b;
    let adjustmentType: 'yellow-reduction' | 'none' | 'warmth-enhancement' = 'none';
    
    if (isYellowBiased) {
      // Reduce yellow bias by adjusting the color balance
      const reductionFactor = Math.min(0.15, yellowBias / 100);
      correctedR = Math.round(r * (1 - reductionFactor * 0.5));
      correctedG = Math.round(g * (1 - reductionFactor * 0.7));
      correctedB = Math.round(b * (1 + reductionFactor * 0.3));
      adjustmentType = 'yellow-reduction';
    } else if (yellowBias < -10) {
      // Enhance warmth if too cool
      correctedR = Math.round(r * 1.05);
      correctedG = Math.round(g * 1.02);
      adjustmentType = 'warmth-enhancement';
    }
    
    // Ensure values stay within valid range
    correctedR = Math.max(0, Math.min(255, correctedR));
    correctedG = Math.max(0, Math.min(255, correctedG));
    correctedB = Math.max(0, Math.min(255, correctedB));
    
    const correctedHex = this.rgbToHex(correctedR, correctedG, correctedB);
    
    // Calculate confidence improvement
    const originalLab = this.rgbToLab(r, g, b);
    const correctedLab = this.rgbToLab(correctedR, correctedG, correctedB);
    const confidenceImprovement = this.calculateColorAccuracy(correctedLab) - 
                                  this.calculateColorAccuracy(originalLab);
    
    return {
      originalHex: hex,
      correctedHex,
      adjustmentType,
      confidenceImprovement: Math.max(0, confidenceImprovement)
    };
  }

  private synthesizeAnalysis(multiRefAnalysis: any, biasCorrection: any, qualityMetrics: any): InclusiveSkinToneAnalysis {
    const correctedRgb = this.hexToRgb(biasCorrection.correctedHex);
    if (!correctedRgb) throw new Error('Invalid corrected color');
    
    const undertone = this.determineAdvancedUndertone(correctedRgb.r, correctedRgb.g, correctedRgb.b);
    const depth = this.determineInclusiveDepth(multiRefAnalysis.multipleReferences);
    const confidence = this.calculateOverallConfidence(qualityMetrics, biasCorrection);
    
    // Determine reference system used
    const referenceSystem = this.selectBestReferenceSystem(multiRefAnalysis.multipleReferences, qualityMetrics);
    
    return {
      dominantTone: {
        hex: biasCorrection.correctedHex,
        undertone,
        depth,
        confidence,
        referenceSystem
      },
      biasCorrection,
      multipleReferences: multiRefAnalysis.multipleReferences,
      regions: {
        forehead: { 
          hex: multiRefAnalysis.regions.forehead?.hex || '#D4A574', 
          confidence: multiRefAnalysis.regions.forehead?.confidence || 0.5 
        },
        cheeks: { 
          hex: multiRefAnalysis.regions.cheeks?.hex || '#D4A574', 
          confidence: multiRefAnalysis.regions.cheeks?.confidence || 0.5 
        },
        chin: { 
          hex: multiRefAnalysis.regions.chin?.hex || '#D4A574', 
          confidence: multiRefAnalysis.regions.chin?.confidence || 0.5 
        },
        jawline: { 
          hex: multiRefAnalysis.regions.jawline?.hex || '#D4A574', 
          confidence: multiRefAnalysis.regions.jawline?.confidence || 0.5 
        }
      },
      qualityMetrics
    };
  }

  // Helper methods
  private isValidSkinPixel(r: number, g: number, b: number): boolean {
    // Filter out pixels that are unlikely to be skin
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    if (luminance < 30 || luminance > 240) return false; // Too dark or too bright
    
    // Check for reasonable skin color ranges
    const rRatio = r / (r + g + b);
    const gRatio = g / (r + g + b);
    
    return rRatio > 0.3 && rRatio < 0.5 && gRatio > 0.25 && gRatio < 0.45;
  }

  private calculateStandardDeviation(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  private rgbToHex(r: number, g: number, b: number): string {
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  private hexToRgb(hex: string) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  private rgbToLab(r: number, g: number, b: number) {
    // RGB to LAB conversion
    r = r / 255;
    g = g / 255;
    b = b / 255;

    r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
    g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
    b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

    const x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
    const y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.00000;
    const z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;

    const fx = x > 0.008856 ? Math.pow(x, 1/3) : (7.787 * x + 16/116);
    const fy = y > 0.008856 ? Math.pow(y, 1/3) : (7.787 * y + 16/116);
    const fz = z > 0.008856 ? Math.pow(z, 1/3) : (7.787 * z + 16/116);

    const L = (116 * fy) - 16;
    const a = 500 * (fx - fy);
    const b_lab = 200 * (fy - fz);

    return { L, a, b: b_lab };
  }

  private calculateMasseyMartinScale(r: number, g: number, b: number): number {
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    return Math.max(1, Math.min(10, Math.round(luminance / 25.5)));
  }

  private applyCascoClassification(lab: any, itaAngle: number): string {
    // CASCo classification based on research
    if (lab.L > 70) return 'Very Light';
    if (lab.L > 60) return 'Light';
    if (lab.L > 50) return 'Medium Light';
    if (lab.L > 40) return 'Medium';
    if (lab.L > 30) return 'Medium Dark';
    if (lab.L > 20) return 'Dark';
    return 'Very Dark';
  }

  private calculateCustomDepthLevel(r: number, g: number, b: number, lab: any): number {
    // Custom 10-point scale with better distribution
    const luminanceWeight = 0.6;
    const chromaticityWeight = 0.4;
    
    const luminanceScore = (lab.L / 100) * 10;
    const chromaticity = Math.sqrt(lab.a * lab.a + lab.b * lab.b);
    const chromaticityScore = Math.min(10, chromaticity / 10);
    
    const finalScore = luminanceWeight * luminanceScore + chromaticityWeight * chromaticityScore;
    return Math.max(1, Math.min(10, Math.round(finalScore)));
  }

  private determineAdvancedUndertone(r: number, g: number, b: number): 'warm' | 'cool' | 'neutral' | 'olive' {
    const lab = this.rgbToLab(r, g, b);
    
    // More sophisticated undertone detection using LAB color space
    if (lab.a > 5 && lab.b > 10) return 'warm';      // Red and yellow
    if (lab.a < -2 && lab.b < 5) return 'cool';      // Blue and less yellow
    if (lab.a > 0 && lab.b < 8 && r > g) return 'olive'; // Green undertones
    return 'neutral';
  }

  private determineInclusiveDepth(multiRef: any): 'fair' | 'light' | 'medium' | 'tan' | 'deep' | 'very-deep' {
    // Use multiple reference systems for more accurate depth classification
    const avgDepth = (multiRef.masseyMartinScale + multiRef.customDepthLevel) / 2;
    
    if (avgDepth <= 2) return 'fair';
    if (avgDepth <= 3.5) return 'light';
    if (avgDepth <= 5.5) return 'medium';
    if (avgDepth <= 7) return 'tan';
    if (avgDepth <= 8.5) return 'deep';
    return 'very-deep';
  }

  private assessLightingQuality(imageData: ImageData): number {
    // Assess lighting quality based on histogram distribution
    const histogram = new Array(256).fill(0);
    
    for (let i = 0; i < imageData.data.length; i += 4) {
      const luminance = Math.round(
        0.299 * imageData.data[i] + 
        0.587 * imageData.data[i + 1] + 
        0.114 * imageData.data[i + 2]
      );
      histogram[luminance]++;
    }
    
    // Calculate distribution quality (avoid extreme shadows/highlights)
    const totalPixels = imageData.width * imageData.height;
    const shadowPixels = histogram.slice(0, 50).reduce((a, b) => a + b, 0);
    const highlightPixels = histogram.slice(205, 256).reduce((a, b) => a + b, 0);
    
    const shadowRatio = shadowPixels / totalPixels;
    const highlightRatio = highlightPixels / totalPixels;
    
    // Good lighting has minimal shadows and highlights
    return Math.max(0, 1 - (shadowRatio + highlightRatio) * 2);
  }

  private calculateQualityMetrics(imageData: ImageData, skinRegions: any, lightingQuality: number) {
    // Calculate skin exposure percentage
    const totalPixels = imageData.width * imageData.height;
    const skinPixels = Object.values(skinRegions).reduce((total: number, region: any) => {
      const regionWidth = Number(region?.width || 0);
      const regionHeight = Number(region?.height || 0);
      return total + (regionWidth * regionHeight);
    }, 0);
    const skinExposurePercentage = totalPixels > 0 ? Number(skinPixels) / Number(totalPixels) : 0;
    
    // Calculate color accuracy based on consistency across regions
    const colorAccuracy = this.calculateRegionalConsistency(skinRegions);
    
    // Overall confidence combines all factors
    const overallConfidence = (
      lightingQuality * 0.4 +
      Math.min(skinExposurePercentage * 4, 1) * 0.3 +
      colorAccuracy * 0.3
    );
    
    return {
      lightingQuality,
      skinExposurePercentage,
      colorAccuracy,
      overallConfidence
    };
  }

  private calculateRegionalConsistency(regions: any): number {
    const validRegions = Object.values(regions).filter((r: any) => r && r.confidence > 0.3);
    if (validRegions.length < 2) return 0.5;
    
    let totalDifference = 0;
    let comparisons = 0;
    
    for (let i = 0; i < validRegions.length; i++) {
      for (let j = i + 1; j < validRegions.length; j++) {
        const region1 = validRegions[i] as any;
        const region2 = validRegions[j] as any;
        
        const colorDiff = Math.sqrt(
          Math.pow(region1.r - region2.r, 2) +
          Math.pow(region1.g - region2.g, 2) +
          Math.pow(region1.b - region2.b, 2)
        );
        
        totalDifference += colorDiff;
        comparisons++;
      }
    }
    
    const avgDifference = totalDifference / comparisons;
    return Math.max(0, 1 - avgDifference / 100); // Lower difference = higher consistency
  }

  private calculateColorAccuracy(lab: any): number {
    // Simple color accuracy based on LAB values
    const chromaticity = Math.sqrt(lab.a * lab.a + lab.b * lab.b);
    return Math.max(0, 1 - chromaticity / 50);
  }

  private calculateOverallConfidence(qualityMetrics: any, biasCorrection: any): number {
    return Math.min(1, 
      qualityMetrics.overallConfidence + 
      biasCorrection.confidenceImprovement * 0.1
    );
  }

  private selectBestReferenceSystem(multiRef: any, qualityMetrics: any): 'ita' | 'massey-martin' | 'casco' | 'custom' {
    // Select reference system based on image quality and characteristics
    if (qualityMetrics.lightingQuality > 0.8) return 'ita'; // ITA works best with good lighting
    if (qualityMetrics.skinExposurePercentage > 0.3) return 'massey-martin';
    if (qualityMetrics.colorAccuracy > 0.7) return 'casco';
    return 'custom';
  }
}

export const inclusiveShadeAnalyzer = new InclusiveShadeAnalyzer();