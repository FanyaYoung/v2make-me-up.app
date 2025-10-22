import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

// Base pigments used in foundation mixing (subtractive color model)
const BASE_PIGMENTS = {
  white: { hex: '#FFFFFF', name: 'White (Titanium Dioxide)' },
  yellow: { hex: '#FFD700', name: 'Yellow Ochre' },
  red: { hex: '#CD5C5C', name: 'Red Oxide' },
  brown: { hex: '#8B4513', name: 'Raw Sienna' },
  black: { hex: '#2C2C2C', name: 'Carbon Black' },
  blue: { hex: '#4682B4', name: 'Ultramarine Blue' },
  orange: { hex: '#FF8C00', name: 'Orange Oxide' },
} as const;

interface PigmentRatio {
  pigment: keyof typeof BASE_PIGMENTS;
  parts: number;
  drops?: number;
  grams?: number;
}

interface PigmentFormula {
  targetHex: string;
  ratios: PigmentRatio[];
  totalParts: number;
  undertone: 'warm' | 'neutral' | 'cool';
  depth: 'light' | 'medium' | 'deep';
}

export const PigmentColorMixer: React.FC<{ targetColor?: string }> = ({ 
  targetColor = '#E5C19E' 
}) => {
  const [userHex, setUserHex] = useState(targetColor);
  const [batchSize, setBatchSize] = useState<'drops' | 'grams' | 'parts'>('parts');
  const [customRatios, setCustomRatios] = useState<Record<string, number>>({});

  // Calculate pigment formula from hex color
  const calculatePigmentFormula = (hex: string): PigmentFormula => {
    const rgb = hexToRgb(hex);
    if (!rgb) return getDefaultFormula();

    const { r, g, b } = rgb;
    
    // Calculate relative brightness (0-1)
    const brightness = (r + g + b) / (255 * 3);
    
    // Calculate undertone from RGB ratios
    const redness = r / 255;
    const yellowness = g / 255;
    const blueness = b / 255;
    
    const ratios: PigmentRatio[] = [];
    
    // Base white for lightness
    const whiteParts = Math.round(brightness * 10);
    if (whiteParts > 0) {
      ratios.push({ 
        pigment: 'white', 
        parts: whiteParts,
        drops: whiteParts * 2,
        grams: whiteParts * 0.5
      });
    }
    
    // Yellow (dominant in most skin tones)
    const yellowParts = Math.round(yellowness * 8);
    if (yellowParts > 0) {
      ratios.push({ 
        pigment: 'yellow', 
        parts: yellowParts,
        drops: yellowParts * 2,
        grams: yellowParts * 0.5
      });
    }
    
    // Red for warmth
    const redParts = Math.round(redness * 5);
    if (redParts > 0) {
      ratios.push({ 
        pigment: 'red', 
        parts: redParts,
        drops: redParts * 2,
        grams: redParts * 0.5
      });
    }
    
    // Orange for warm undertones
    if (redness > blueness && yellowness > blueness) {
      const orangeParts = Math.round((redness + yellowness - blueness * 2) * 3);
      if (orangeParts > 0) {
        ratios.push({ 
          pigment: 'orange', 
          parts: Math.min(orangeParts, 3),
          drops: Math.min(orangeParts, 3) * 2,
          grams: Math.min(orangeParts, 3) * 0.5
        });
      }
    }
    
    // Brown for depth
    const brownParts = Math.round((1 - brightness) * 6);
    if (brownParts > 0) {
      ratios.push({ 
        pigment: 'brown', 
        parts: brownParts,
        drops: brownParts * 2,
        grams: brownParts * 0.5
      });
    }
    
    // Blue for cool undertones
    if (blueness > redness) {
      const blueParts = Math.round((blueness - redness) * 2);
      if (blueParts > 0) {
        ratios.push({ 
          pigment: 'blue', 
          parts: Math.min(blueParts, 2),
          drops: Math.min(blueParts, 2) * 2,
          grams: Math.min(blueParts, 2) * 0.5
        });
      }
    }
    
    // Black for very deep tones
    if (brightness < 0.3) {
      const blackParts = Math.round((0.3 - brightness) * 5);
      ratios.push({ 
        pigment: 'black', 
        parts: Math.min(blackParts, 2),
        drops: Math.min(blackParts, 2) * 2,
        grams: Math.min(blackParts, 2) * 0.5
      });
    }
    
    const totalParts = ratios.reduce((sum, r) => sum + r.parts, 0);
    
    // Determine undertone and depth
    const undertone = blueness > redness ? 'cool' : 
                     (redness > blueness + 0.1 ? 'warm' : 'neutral');
    const depth = brightness > 0.7 ? 'light' : 
                  brightness > 0.4 ? 'medium' : 'deep';
    
    return { targetHex: hex, ratios, totalParts, undertone, depth };
  };

  const formula = useMemo(() => calculatePigmentFormula(userHex), [userHex]);

  const handleMixCustom = () => {
    // Calculate resulting color from custom ratios
    const mixedColor = mixPigments(customRatios);
    setUserHex(mixedColor);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Foundation Pigment Mixer</CardTitle>
          <p className="text-sm text-muted-foreground">
            Mix like a makeup artist - see the exact pigment ratios to recreate any shade
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Target Color Input */}
          <div className="space-y-2">
            <Label htmlFor="target-hex">Target Skin Tone (Hex)</Label>
            <div className="flex gap-3 items-center">
              <Input
                id="target-hex"
                value={userHex}
                onChange={(e) => setUserHex(e.target.value)}
                placeholder="#E5C19E"
                className="font-mono"
              />
              <div 
                className="w-16 h-16 rounded-lg border-2 border-border shadow-sm"
                style={{ backgroundColor: userHex }}
              />
            </div>
          </div>

          {/* Unit Selection */}
          <div className="flex gap-2">
            <Button
              variant={batchSize === 'parts' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setBatchSize('parts')}
            >
              Parts (Ratio)
            </Button>
            <Button
              variant={batchSize === 'drops' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setBatchSize('drops')}
            >
              Drops
            </Button>
            <Button
              variant={batchSize === 'grams' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setBatchSize('grams')}
            >
              Grams
            </Button>
          </div>

          {/* Formula Display */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Pigment Formula</h3>
              <div className="text-sm space-x-4">
                <span className="text-muted-foreground">Undertone: <strong className="text-foreground">{formula.undertone}</strong></span>
                <span className="text-muted-foreground">Depth: <strong className="text-foreground">{formula.depth}</strong></span>
              </div>
            </div>

            <div className="grid gap-3">
              {formula.ratios.map((ratio, idx) => {
                const pigment = BASE_PIGMENTS[ratio.pigment];
                const amount = batchSize === 'parts' ? ratio.parts : 
                              batchSize === 'drops' ? ratio.drops : 
                              ratio.grams;
                
                return (
                  <div key={idx} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                    <div 
                      className="w-12 h-12 rounded-md border-2 border-border shadow-sm"
                      style={{ backgroundColor: pigment.hex }}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{pigment.name}</div>
                      <div className="text-sm text-muted-foreground">{pigment.hex}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{amount?.toFixed(1)}</div>
                      <div className="text-xs text-muted-foreground uppercase">{batchSize}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <div className="text-sm text-muted-foreground mb-2">Mixed Result Preview:</div>
              <div className="flex items-center gap-4">
                <div 
                  className="w-24 h-24 rounded-lg border-2 border-border shadow-md"
                  style={{ backgroundColor: userHex }}
                />
                <div className="space-y-1 text-sm">
                  <div><strong>Total:</strong> {batchSize === 'parts' ? formula.totalParts : 
                                                  batchSize === 'drops' ? formula.totalParts * 2 : 
                                                  (formula.totalParts * 0.5).toFixed(1)} {batchSize}</div>
                  <div className="text-muted-foreground">Mix thoroughly on a clean palette</div>
                  <div className="text-muted-foreground">Test on jawline for color match</div>
                </div>
              </div>
            </div>
          </div>

          {/* Color Wheel Reference */}
          <div className="pt-6 border-t">
            <h3 className="font-semibold mb-3">Base Pigment Palette</h3>
            <div className="grid grid-cols-7 gap-2">
              {Object.entries(BASE_PIGMENTS).map(([key, pigment]) => (
                <div key={key} className="text-center">
                  <div 
                    className="w-full aspect-square rounded-lg border-2 border-border shadow-sm mb-1"
                    style={{ backgroundColor: pigment.hex }}
                  />
                  <div className="text-xs font-medium">{key}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Mixing Tips */}
          <div className="pt-6 border-t space-y-2 text-sm text-muted-foreground">
            <h4 className="font-semibold text-foreground mb-2">Pro Mixing Tips:</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>Always mix on a clean, non-porous palette (glass or metal)</li>
              <li>Add pigments in order: white base → yellow → red → brown → modifiers</li>
              <li>Mix in small batches - pigments are highly concentrated</li>
              <li>1 part = 1 small drop or 0.5g for professional mixing</li>
              <li>Test shade on jawline in natural light before applying</li>
              <li>Adjust undertone: add blue for cooler, orange for warmer</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Helper functions
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function mixPigments(ratios: Record<string, number>): string {
  let r = 0, g = 0, b = 0, total = 0;
  
  Object.entries(ratios).forEach(([pigment, amount]) => {
    if (amount > 0 && pigment in BASE_PIGMENTS) {
      const rgb = hexToRgb(BASE_PIGMENTS[pigment as keyof typeof BASE_PIGMENTS].hex);
      if (rgb) {
        r += rgb.r * amount;
        g += rgb.g * amount;
        b += rgb.b * amount;
        total += amount;
      }
    }
  });
  
  if (total === 0) return '#E5C19E';
  
  r = Math.round(r / total);
  g = Math.round(g / total);
  b = Math.round(b / total);
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function getDefaultFormula(): PigmentFormula {
  return {
    targetHex: '#E5C19E',
    ratios: [
      { pigment: 'white', parts: 6, drops: 12, grams: 3 },
      { pigment: 'yellow', parts: 5, drops: 10, grams: 2.5 },
      { pigment: 'red', parts: 2, drops: 4, grams: 1 },
      { pigment: 'brown', parts: 1, drops: 2, grams: 0.5 },
    ],
    totalParts: 14,
    undertone: 'warm',
    depth: 'medium'
  };
}
