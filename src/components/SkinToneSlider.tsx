import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Hand, Palette } from 'lucide-react';
import { skinToneByUndertone, skinToneByCategory, findClosestSkinTone } from '@/data/skinToneReferences';

interface SkinToneSliderProps {
  onSkinToneSelect: (toneData: { hexColor: string; depth: number; undertone: string }) => void;
}

const SkinToneSlider = ({ onSkinToneSelect }: SkinToneSliderProps) => {
  const [sliderValue, setSliderValue] = useState([50]);
  const [selectedUndertone, setSelectedUndertone] = useState<'cool' | 'warm' | 'neutral' | 'olive'>('neutral');

  // Generate skin tone colors based on slider value and undertone
  const generateSkinTone = (depth: number, undertone: string) => {
    const baseDepth = Math.max(10, Math.min(90, depth));
    
    let hue: number;
    let saturation: number;
    
    switch (undertone) {
      case 'cool':
        hue = 25; // More pink/red undertones
        saturation = 15 + (baseDepth * 0.2);
        break;
      case 'warm':
        hue = 35; // More yellow/golden undertones
        saturation = 20 + (baseDepth * 0.3);
        break;
      case 'olive':
        hue = 45; // More green/yellow undertones
        saturation = 25 + (baseDepth * 0.2);
        break;
      default: // neutral
        hue = 30;
        saturation = 18 + (baseDepth * 0.25);
        break;
    }
    
    const lightness = 85 - (baseDepth * 0.6);
    
    return {
      hsl: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
      hex: hslToHex(hue, saturation, lightness),
      depth: baseDepth,
      undertone
    };
  };

  const hslToHex = (h: number, s: number, l: number) => {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
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
            {(['cool', 'neutral', 'warm', 'olive'] as const).map((tone) => (
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

        {/* Real Skin Tone References */}
        <div>
          <label className="text-sm font-medium mb-3 block">Real skin tone references ({selectedUndertone}):</label>
          <div className="grid grid-cols-8 gap-2">
            {skinToneByUndertone[selectedUndertone]?.slice(0, 16).map((tone, index) => (
              <button
                key={index}
                className="w-8 h-8 rounded-full border-2 hover:scale-110 transition-transform relative group"
                style={{ backgroundColor: tone.hex }}
                onClick={() => {
                  // Find closest matching depth for this reference
                  const closestRef = findClosestSkinTone(tone.hex);
                  const depthMapping = { 'fair': 20, 'light': 35, 'medium': 50, 'deep': 65, 'very-deep': 80 };
                  setSliderValue([depthMapping[closestRef.depth] || 50]);
                }}
                title={tone.name || tone.hex}
              >
                <span className="sr-only">{tone.name || tone.hex}</span>
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-black text-white rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                  {tone.name || tone.hex}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Generated Sample Colors for Fine-tuning */}
        <div>
          <label className="text-sm font-medium mb-3 block">Fine-tune with generated tones:</label>
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