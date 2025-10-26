import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

// Base pigments from Terri Tomlinson's Flesh Tone Color Wheel
// These are the exact pigments used in traditional foundation mixing
const BASE_PIGMENTS = {
  TW: { hex: '#FFFFFF', rgb: [255, 255, 255], name: 'Titanium White' },
  CY: { hex: '#FFEC00', rgb: [255, 236, 0], name: 'Cadmium Yellow' },
  CR: { hex: '#E30022', rgb: [227, 0, 34], name: 'Cadmium Red' },
  UB: { hex: '#120A8F', rgb: [18, 10, 143], name: 'Ultramarine Blue' },
  BU: { hex: '#8A3324', rgb: [138, 51, 36], name: 'Burnt Umber' },
} as const;

interface PigmentRecipe {
  TW: number; // Titanium White percentage (0-100)
  CY: number; // Cadmium Yellow percentage (0-100)
  CR: number; // Cadmium Red percentage (0-100)
  UB: number; // Ultramarine Blue percentage (0-100)
  BU: number; // Burnt Umber percentage (0-100)
}

export const PigmentColorMixer: React.FC<{ targetColor?: string }> = ({ 
  targetColor = '#E5C19E' 
}) => {
  // Initialize with a sample recipe: Fair skin tone
  const [recipe, setRecipe] = useState<PigmentRecipe>({
    TW: 95,
    CR: 3,
    CY: 2,
    UB: 0,
    BU: 0,
  });

  // Calculate the resulting hex from the pigment recipe
  const calculateHexFromRecipe = (recipe: PigmentRecipe): string => {
    // Convert percentages to weights (0-1)
    const weights = {
      TW: recipe.TW / 100,
      CY: recipe.CY / 100,
      CR: recipe.CR / 100,
      UB: recipe.UB / 100,
      BU: recipe.BU / 100,
    };

    // Weighted sum for each RGB channel
    let finalR = 0, finalG = 0, finalB = 0;

    Object.entries(weights).forEach(([pigment, weight]) => {
      if (weight > 0) {
        const [r, g, b] = BASE_PIGMENTS[pigment as keyof typeof BASE_PIGMENTS].rgb;
        finalR += r * weight;
        finalG += g * weight;
        finalB += b * weight;
      }
    });

    // Round and clamp to 0-255
    const r = Math.max(0, Math.min(255, Math.round(finalR)));
    const g = Math.max(0, Math.min(255, Math.round(finalG)));
    const b = Math.max(0, Math.min(255, Math.round(finalB)));

    // Convert to hex
    return `#${r.toString(16).padStart(2, '0').toUpperCase()}${g.toString(16).padStart(2, '0').toUpperCase()}${b.toString(16).padStart(2, '0').toUpperCase()}`;
  };

  const resultHex = useMemo(() => calculateHexFromRecipe(recipe), [recipe]);
  const totalPercentage = Object.values(recipe).reduce((sum, val) => sum + val, 0);

  const updatePigment = (pigment: keyof PigmentRecipe, value: number) => {
    setRecipe(prev => ({
      ...prev,
      [pigment]: Math.max(0, Math.min(100, value))
    }));
  };

  // Preset recipes from the user's examples
  const loadPreset = (presetName: string) => {
    const presets: Record<string, PigmentRecipe> = {
      'Fair (Pink/Red)': { TW: 95, CR: 3, CY: 2, UB: 0, BU: 0 },
      'Light (Golden)': { TW: 90, CY: 7, CR: 3, UB: 0, BU: 0 },
      'Medium (Olive)': { TW: 30, CY: 40, CR: 5, UB: 25, BU: 0 },
      'Dark (Brown)': { TW: 0, CY: 10, CR: 15, UB: 5, BU: 70 },
    };
    
    if (presets[presetName]) {
      setRecipe(presets[presetName]);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Pigment-to-Hex Calculator</CardTitle>
          <p className="text-sm text-muted-foreground">
            Based on Terri Tomlinson's Flesh Tone Color Wheel - Calculate hex codes from pigment ratios
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Preset Recipes */}
          <div className="space-y-2">
            <Label>Load Preset Recipe</Label>
            <div className="flex flex-wrap gap-2">
              {['Fair (Pink/Red)', 'Light (Golden)', 'Medium (Olive)', 'Dark (Brown)'].map(preset => (
                <Button
                  key={preset}
                  variant="outline"
                  size="sm"
                  onClick={() => loadPreset(preset)}
                >
                  {preset}
                </Button>
              ))}
            </div>
          </div>

          {/* Pigment Sliders */}
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <Label>Pigment Ratios (Percentages)</Label>
              <span className={`text-sm font-mono ${totalPercentage === 100 ? 'text-green-600' : 'text-destructive'}`}>
                Total: {totalPercentage.toFixed(0)}%
              </span>
            </div>

            {(Object.keys(BASE_PIGMENTS) as Array<keyof typeof BASE_PIGMENTS>).map((pigmentKey) => {
              const pigment = BASE_PIGMENTS[pigmentKey];
              const value = recipe[pigmentKey];
              
              return (
                <div key={pigmentKey} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-8 h-8 rounded-md border-2 border-border shadow-sm"
                        style={{ backgroundColor: pigment.hex }}
                      />
                      <div>
                        <div className="font-medium text-sm">{pigment.name}</div>
                        <div className="text-xs text-muted-foreground font-mono">{pigmentKey}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={value}
                        onChange={(e) => updatePigment(pigmentKey, parseFloat(e.target.value) || 0)}
                        className="w-20 text-right font-mono"
                        min="0"
                        max="100"
                        step="1"
                      />
                      <span className="text-sm text-muted-foreground">%</span>
                    </div>
                  </div>
                  <Slider
                    value={[value]}
                    onValueChange={([val]) => updatePigment(pigmentKey, val)}
                    min={0}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>
              );
            })}
          </div>

          {/* Result Display */}
          <div className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border-2 border-primary/20">
            <div className="text-sm font-semibold text-muted-foreground mb-3">Calculated Hex Color:</div>
            <div className="flex items-center gap-6">
              <div 
                className="w-32 h-32 rounded-xl border-4 border-border shadow-xl"
                style={{ backgroundColor: resultHex }}
              />
              <div className="space-y-2">
                <div className="text-4xl font-bold font-mono">{resultHex}</div>
                <div className="text-sm text-muted-foreground">
                  RGB: {hexToRgb(resultHex)?.r}, {hexToRgb(resultHex)?.g}, {hexToRgb(resultHex)?.b}
                </div>
                <div className="text-xs text-muted-foreground mt-4">
                  {totalPercentage === 100 ? '✓ Recipe is balanced' : '⚠ Recipe should total 100%'}
                </div>
              </div>
            </div>
          </div>

          {/* Current Recipe Summary */}
          <div className="pt-6 border-t">
            <h3 className="font-semibold mb-3">Current Recipe</h3>
            <div className="grid grid-cols-5 gap-2 font-mono text-xs">
              {(Object.keys(BASE_PIGMENTS) as Array<keyof typeof BASE_PIGMENTS>).map((key) => (
                <div key={key} className="text-center p-2 bg-muted/50 rounded">
                  <div className="font-semibold">{key}</div>
                  <div className="text-muted-foreground">{recipe[key]}%</div>
                </div>
              ))}
            </div>
          </div>

          {/* Base Pigment Reference */}
          <div className="pt-6 border-t">
            <h3 className="font-semibold mb-3">Base Pigment Palette</h3>
            <div className="grid grid-cols-5 gap-3">
              {(Object.entries(BASE_PIGMENTS) as [keyof typeof BASE_PIGMENTS, typeof BASE_PIGMENTS[keyof typeof BASE_PIGMENTS]][]).map(([key, pigment]) => (
                <div key={key} className="text-center">
                  <div 
                    className="w-full aspect-square rounded-lg border-2 border-border shadow-sm mb-2"
                    style={{ backgroundColor: pigment.hex }}
                  />
                  <div className="text-xs font-semibold">{key}</div>
                  <div className="text-xs text-muted-foreground">{pigment.name}</div>
                  <div className="text-xs text-muted-foreground font-mono">{pigment.hex}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Methodology Info */}
          <div className="pt-6 border-t space-y-3 text-sm text-muted-foreground">
            <h4 className="font-semibold text-foreground mb-2">How It Works:</h4>
            <p>
              This calculator uses <strong>weighted linear interpolation</strong> to simulate subtractive pigment mixing.
              Each base pigment has a defined RGB value, and the final color is calculated using:
            </p>
            <div className="p-3 bg-muted rounded font-mono text-xs">
              Final_R = (TW.R × %TW) + (CY.R × %CY) + (CR.R × %CR) + (UB.R × %UB) + (BU.R × %BU)
            </div>
            <p className="text-xs">
              The same formula applies to Green and Blue channels. Percentages must total 100% for accurate results.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Helper function
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}
