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

  // Generate realistic skin tone colors using pigment-based mixing
  const generateSkinTone = (depth: number, undertone: string) => {
    const normalizedDepth = Math.max(0, Math.min(100, depth)) / 100;
    
    // Base pigment ratios for realistic skin tones
    let r: number, g: number, b: number;
    
    switch (undertone) {
      case 'cool':
        // Cool undertones: more pink/blue, less yellow
        if (normalizedDepth < 0.33) { // Light cool
          r = Math.round(255 - (normalizedDepth * 55));
          g = Math.round(220 - (normalizedDepth * 90));
          b = Math.round(210 - (normalizedDepth * 80));
        } else if (normalizedDepth < 0.66) { // Medium cool
          r = Math.round(220 - (normalizedDepth * 100));
          g = Math.round(180 - (normalizedDepth * 90));
          b = Math.round(170 - (normalizedDepth * 85));
        } else { // Deep cool
          r = Math.round(180 - (normalizedDepth * 120));
          g = Math.round(135 - (normalizedDepth * 90));
          b = Math.round(115 - (normalizedDepth * 80));
        }
        break;
        
      case 'warm':
        // Warm undertones: more yellow/golden, peachy
        if (normalizedDepth < 0.33) { // Light warm
          r = Math.round(255 - (normalizedDepth * 45));
          g = Math.round(230 - (normalizedDepth * 85));
          b = Math.round(195 - (normalizedDepth * 95));
        } else if (normalizedDepth < 0.66) { // Medium warm
          r = Math.round(225 - (normalizedDepth * 85));
          g = Math.round(190 - (normalizedDepth * 85));
          b = Math.round(150 - (normalizedDepth * 90));
        } else { // Deep warm
          r = Math.round(185 - (normalizedDepth * 110));
          g = Math.round(145 - (normalizedDepth * 95));
          b = Math.round(95 - (normalizedDepth * 70));
        }
        break;
        
      default: // neutral
        // Neutral undertones: balanced
        if (normalizedDepth < 0.33) { // Light neutral
          r = Math.round(255 - (normalizedDepth * 50));
          g = Math.round(225 - (normalizedDepth * 85));
          b = Math.round(200 - (normalizedDepth * 90));
        } else if (normalizedDepth < 0.66) { // Medium neutral
          r = Math.round(220 - (normalizedDepth * 95));
          g = Math.round(185 - (normalizedDepth * 90));
          b = Math.round(160 - (normalizedDepth * 90));
        } else { // Deep neutral
          r = Math.round(180 - (normalizedDepth * 115));
          g = Math.round(140 - (normalizedDepth * 95));
          b = Math.round(105 - (normalizedDepth * 75));
        }
        break;
    }
    
    // Clamp values
    r = Math.max(25, Math.min(255, r));
    g = Math.max(20, Math.min(255, g));
    b = Math.max(15, Math.min(255, b));
    
    const hex = rgbToHex(r, g, b);
    const hsl = rgbToHsl(r, g, b);
    
    return {
      hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
      hex,
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