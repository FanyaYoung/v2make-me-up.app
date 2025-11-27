import React, { useState } from 'react';
import { hexToRgb, rgbToXyz, xyzToLab, deltaE2000 } from '../lib/colorUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const ColorMatchingTest = () => {
  const [color1, setColor1] = useState('#F5C6A8'); // Light skin tone
  const [color2, setColor2] = useState('#D4A574'); // Medium skin tone
  const [results, setResults] = useState<any>(null);

  const testColorMatching = () => {
    // Test the complete CIELAB pipeline
    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);
    
    if (!rgb1 || !rgb2) {
      setResults({ error: 'Invalid hex colors' });
      return;
    }

    const xyz1 = rgbToXyz(rgb1);
    const xyz2 = rgbToXyz(rgb2);
    
    const lab1 = xyzToLab(xyz1);
    const lab2 = xyzToLab(xyz2);
    
    const deltaE = deltaE2000(lab1, lab2);
    const matchPercentage = Math.max(0, 100 - (deltaE * 2));

    setResults({
      color1: {
        hex: color1,
        rgb: rgb1,
        xyz: xyz1,
        lab: lab1
      },
      color2: {
        hex: color2,
        rgb: rgb2,
        xyz: xyz2,
        lab: lab2
      },
      deltaE: deltaE.toFixed(2),
      matchPercentage: matchPercentage.toFixed(1),
      interpretation: deltaE < 1 ? 'Excellent match' : 
                     deltaE < 3 ? 'Very good match' :
                     deltaE < 6 ? 'Good match' :
                     deltaE < 12 ? 'Fair match' : 'Poor match'
    });
  };

  // Test with some realistic foundation shade colors
  const testPresets = [
    { name: 'Fair vs Light', hex1: '#F5DCC4', hex2: '#F0D0A6' },
    { name: 'Light vs Medium', hex1: '#F0D0A6', hex2: '#E8C2A0' },
    { name: 'Medium vs Deep', hex1: '#D4A574', hex2: '#A0835C' },
    { name: 'Same Color', hex1: '#D4A574', hex2: '#D4A574' }
  ];

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          🎨 CIELAB Color Matching Test
        </CardTitle>
        <p className="text-center text-muted-foreground">
          Test the Delta E 2000 color difference algorithm used in foundation matching
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Color Input Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Color 1 (Hex)</label>
            <div className="flex gap-2">
              <Input
                value={color1}
                onChange={(e) => setColor1(e.target.value)}
                placeholder="#F5C6A8"
              />
              <div 
                className="w-12 h-10 rounded border-2 border-gray-300"
                style={{ backgroundColor: color1 }}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Color 2 (Hex)</label>
            <div className="flex gap-2">
              <Input
                value={color2}
                onChange={(e) => setColor2(e.target.value)}
                placeholder="#D4A574"
              />
              <div 
                className="w-12 h-10 rounded border-2 border-gray-300"
                style={{ backgroundColor: color2 }}
              />
            </div>
          </div>
        </div>

        {/* Preset Tests */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Quick Tests:</label>
          <div className="flex flex-wrap gap-2">
            {testPresets.map((preset) => (
              <Button
                key={preset.name}
                variant="outline"
                size="sm"
                onClick={() => {
                  setColor1(preset.hex1);
                  setColor2(preset.hex2);
                }}
              >
                {preset.name}
              </Button>
            ))}
          </div>
        </div>

        <Button onClick={testColorMatching} className="w-full">
          Calculate Color Difference (Delta E 2000)
        </Button>

        {/* Results Section */}
        {results && !results.error && (
          <div className="space-y-4 mt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">
                ΔE = {results.deltaE}
              </div>
              <div className="text-lg text-muted-foreground">
                {results.interpretation} ({results.matchPercentage}% match)
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Color 1 Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>RGB: ({results.color1.rgb.r}, {results.color1.rgb.g}, {results.color1.rgb.b})</div>
                  <div>XYZ: ({results.color1.xyz.x.toFixed(2)}, {results.color1.xyz.y.toFixed(2)}, {results.color1.xyz.z.toFixed(2)})</div>
                  <div>LAB: (L*={results.color1.lab.l.toFixed(2)}, a*={results.color1.lab.a.toFixed(2)}, b*={results.color1.lab.b.toFixed(2)})</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Color 2 Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>RGB: ({results.color2.rgb.r}, {results.color2.rgb.g}, {results.color2.rgb.b})</div>
                  <div>XYZ: ({results.color2.xyz.x.toFixed(2)}, {results.color2.xyz.y.toFixed(2)}, {results.color2.xyz.z.toFixed(2)})</div>
                  <div>LAB: (L*={results.color2.lab.l.toFixed(2)}, a*={results.color2.lab.a.toFixed(2)}, b*={results.color2.lab.b.toFixed(2)})</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Delta E 2000 Interpretation</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <div>• ΔE &lt; 1: Differences not perceptible by human eyes</div>
                <div>• ΔE 1-3: Differences perceptible through close observation</div>
                <div>• ΔE 3-6: Differences perceptible at a glance</div>
                <div>• ΔE 6-12: Colors are noticeably different</div>
                <div>• ΔE &gt; 12: Colors appear to be entirely different</div>
              </CardContent>
            </Card>
          </div>
        )}

        {results?.error && (
          <div className="text-red-500 text-center">
            Error: {results.error}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ColorMatchingTest;