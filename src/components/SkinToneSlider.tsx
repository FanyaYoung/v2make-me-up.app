import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Hand, Palette } from 'lucide-react';

interface SkinToneSliderProps {
  onSkinToneSelect: (toneData: { hexColor: string; depth: number; undertone: string }) => void;
}

const SkinToneSlider = ({ onSkinToneSelect }: SkinToneSliderProps) => {
  const [sliderValue, setSliderValue] = useState([50]);
  const [selectedUndertone, setSelectedUndertone] = useState<'cool' | 'warm' | 'neutral'>('neutral');

  // Real foundation colors from database with proper gold/red undertones
  const REFERENCE_COLORS = {
    cool: [
      '#FEFEFD', '#F5E5D8', '#ECC3A3', '#C19484', '#A67C6D', '#8B5E52',
      '#704738', '#543329', '#3D2A24', '#2F2828'
    ],
    warm: [
      '#FDDCB4', '#FFD6A4', '#EBAB7F', '#D6AE71', '#BD8966', '#A16E4B',
      '#926A2D', '#7C501A', '#542911', '#3C2004'
    ],
    neutral: [
      '#FDF5F0', '#F0D5BE', '#E5C19E', '#D2A784', '#C18F6A', '#A87553',
      '#8E5D42', '#724832', '#563425', '#3A2115'
    ]
  };

  // Generate realistic skin tone by interpolating between reference colors
  const generateSkinTone = (depth: number, undertone: string) => {
    const normalizedDepth = Math.max(0, Math.min(100, depth)) / 100;
    const colors = REFERENCE_COLORS[undertone as keyof typeof REFERENCE_COLORS];
    
    // Map depth (0-100) to color index (0-9)
    const colorIndex = normalizedDepth * (colors.length - 1);
    const lowerIndex = Math.floor(colorIndex);
    const upperIndex = Math.min(Math.ceil(colorIndex), colors.length - 1);
    const fraction = colorIndex - lowerIndex;
    
    // Interpolate between two reference colors
    const lowerColor = hexToRgb(colors[lowerIndex]);
    const upperColor = hexToRgb(colors[upperIndex]);
    
    if (!lowerColor || !upperColor) {
      return getDefaultTone(depth, undertone);
    }
    
    // Add gold/red bias for warm tones
    let r = lowerColor.r + (upperColor.r - lowerColor.r) * fraction;
    let g = lowerColor.g + (upperColor.g - lowerColor.g) * fraction;
    let b = lowerColor.b + (upperColor.b - lowerColor.b) * fraction;
    
    // Enhance warm undertones with more red/gold
    if (undertone === 'warm') {
      r = Math.min(255, r * 1.05); // Add 5% more red
      g = Math.min(255, g * 1.02); // Add 2% more yellow/gold
      b = Math.max(0, b * 0.95);   // Reduce blue slightly
    }
    
    const hex = rgbToHex(r, g, b);
    const hsl = rgbToHsl(r, g, b);
    
    return {
      hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
      hex,
      depth: Math.round(depth),
      undertone
    };
  };

  const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const getDefaultTone = (depth: number, undertone: string) => {
    return {
      hsl: `hsl(30, 35%, ${85 - (depth * 0.6)}%)`,
      hex: '#E5C19E',
      depth: Math.round(depth),
      undertone
    };
  };

  const rgbToHex = (r: number, g: number, b: number): string => {
    return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
  };

  const rgbToHsl = (r: number, g: number, b: number) => {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  };


  const currentTone = generateSkinTone(sliderValue[0], selectedUndertone);

  const handleConfirm = () => {
    onSkinToneSelect({
      hexColor: currentTone.hex,
      depth: currentTone.depth,
      undertone: selectedUndertone
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Hand className="w-5 h-5" />
          Find Your Skin Tone
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Hold the back of your hand next to the color swatch below and adjust the slider until it matches your skin tone
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Undertone Selection */}
        <div>
          <label className="text-sm font-medium mb-3 block">First, select your undertone:</label>
          <div className="flex gap-2">
            {(['cool', 'neutral', 'warm'] as const).map((tone) => (
              <Button
                key={tone}
                variant={selectedUndertone === tone ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedUndertone(tone)}
                className="capitalize"
              >
                {tone}
              </Button>
            ))}
          </div>
        </div>

        {/* Color Swatch */}
        <div className="flex items-center gap-6">
          <div className="flex-1">
            <label className="text-sm font-medium mb-3 block">
              Adjust until this color matches your skin:
            </label>
            <div 
              className="w-full h-40 rounded-lg border-2 shadow-inner"
              style={{ backgroundColor: currentTone.hsl }}
            />
          </div>
          
          <div className="flex-1 space-y-3">
            <div className="text-center">
              <Hand className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-xs text-muted-foreground">
                Hold your hand here<br />for comparison
              </p>
            </div>
          </div>
        </div>

        {/* Slider */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Lighter</span>
            <span>Deeper</span>
          </div>
          <Slider
            value={sliderValue}
            onValueChange={setSliderValue}
            max={100}
            min={0}
            step={1}
            className="w-full"
          />
          <div className="text-center text-sm text-muted-foreground">
            Depth Level: {Math.round(sliderValue[0])}
          </div>
        </div>

        {/* Sample Colors for Reference */}
        <div>
          <label className="text-sm font-medium mb-3 block">Reference tones ({selectedUndertone}):</label>
          <div className="flex gap-2">
            {[20, 35, 50, 65, 80].map((depth) => {
              const refTone = generateSkinTone(depth, selectedUndertone);
              return (
                <button
                  key={depth}
                  className="w-8 h-8 rounded-full border-2 hover:scale-110 transition-transform"
                  style={{ backgroundColor: refTone.hsl }}
                  onClick={() => setSliderValue([depth])}
                  title={`Depth ${depth}`}
                />
              );
            })}
          </div>
        </div>

        <Button onClick={handleConfirm} className="w-full">
          <Palette className="w-4 h-4 mr-2" />
          Use This Skin Tone
        </Button>
      </CardContent>
    </Card>
  );
};

export default SkinToneSlider;