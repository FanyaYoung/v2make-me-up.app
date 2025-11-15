import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PigmentColor } from '@/lib/pigmentMixing';

interface PigmentColorDisplayProps {
  label: string;
  color: PigmentColor;
  originalHex?: string;
}

export const PigmentColorDisplay: React.FC<PigmentColorDisplayProps> = ({ 
  label, 
  color,
  originalHex 
}) => {
  const { hex, rgb, pigmentMix } = color;
  
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4">
          {/* Recreated color */}
          <div className="flex-1">
            <p className="text-xs text-muted-foreground mb-2">Pigment-Based Color</p>
            <div 
              className="w-full h-24 rounded-lg border-2 border-border shadow-md"
              style={{ backgroundColor: hex }}
            />
            <p className="text-xs font-mono mt-2 text-foreground">{hex}</p>
            <p className="text-xs text-muted-foreground">
              RGB({rgb[0]}, {rgb[1]}, {rgb[2]})
            </p>
          </div>
          
          {/* Original color if provided */}
          {originalHex && (
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-2">Original Color</p>
              <div 
                className="w-full h-24 rounded-lg border-2 border-border shadow-md"
                style={{ backgroundColor: originalHex }}
              />
              <p className="text-xs font-mono mt-2 text-foreground">{originalHex}</p>
            </div>
          )}
        </div>
        
        {/* Pigment mix breakdown */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-foreground">Pigment Formula:</p>
          <div className="space-y-1">
            {pigmentMix.cadmiumRed > 0.01 && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#E30022' }} />
                <span className="text-xs text-muted-foreground">
                  Cadmium Red: {(pigmentMix.cadmiumRed * 100).toFixed(1)}%
                </span>
              </div>
            )}
            {pigmentMix.cadmiumYellow > 0.01 && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#FFF600' }} />
                <span className="text-xs text-muted-foreground">
                  Cadmium Yellow: {(pigmentMix.cadmiumYellow * 100).toFixed(1)}%
                </span>
              </div>
            )}
            {pigmentMix.ultramarineBlue > 0.01 && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#120A8F' }} />
                <span className="text-xs text-muted-foreground">
                  Ultramarine Blue: {(pigmentMix.ultramarineBlue * 100).toFixed(1)}%
                </span>
              </div>
            )}
            {pigmentMix.burntUmber > 0.01 && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#8A3324' }} />
                <span className="text-xs text-muted-foreground">
                  Burnt Umber: {(pigmentMix.burntUmber * 100).toFixed(1)}%
                </span>
              </div>
            )}
            {pigmentMix.aquamarine > 0.01 && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#7FFFD4' }} />
                <span className="text-xs text-muted-foreground">
                  Aquamarine: {(pigmentMix.aquamarine * 100).toFixed(1)}%
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 pt-1 border-t border-border">
              <div className="w-4 h-4 rounded border border-border" style={{ backgroundColor: '#FFFFFF' }} />
              <span className="text-xs font-semibold text-foreground">
                + White: {(pigmentMix.white * 100).toFixed(1)}% (added last)
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
