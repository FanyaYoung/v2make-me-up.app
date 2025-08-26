import React, { useState } from 'react';
import Header from '../components/Header';
import SkinHexSwatches from '../components/SkinHexSwatches';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Toaster } from '@/components/ui/toaster';
import { analyzeSkinHex, findHexShadeMatches, generateCrossBrandRecommendations, type HexShadeMatch } from '@/lib/hexShadeMatching';
import AuthGuard from '../components/AuthGuard';

// Sample shade database - in production this would come from your CSV data
const SAMPLE_SHADE_DATABASE = [
  { hex: '#F7C19B', brand: 'Fenty Beauty', product: 'Pro Filt\'r Foundation', shade: '110' },
  { hex: '#E1B571', brand: 'Fenty Beauty', product: 'Pro Filt\'r Foundation', shade: '150' },
  { hex: '#D2A469', brand: 'Fenty Beauty', product: 'Pro Filt\'r Foundation', shade: '200' },
  { hex: '#C68642', brand: 'Fenty Beauty', product: 'Pro Filt\'r Foundation', shade: '300' },
  { hex: '#9C7248', brand: 'Fenty Beauty', product: 'Pro Filt\'r Foundation', shade: '385' },
  { hex: '#6D3800', brand: 'Fenty Beauty', product: 'Pro Filt\'r Foundation', shade: '498' },
  { hex: '#FFDBAC', brand: 'Rare Beauty', product: 'Liquid Touch Foundation', shade: '12N' },
  { hex: '#ECC3A3', brand: 'Rare Beauty', product: 'Liquid Touch Foundation', shade: '16N' },
  { hex: '#D4AA78', brand: 'Rare Beauty', product: 'Liquid Touch Foundation', shade: '20N' },
  { hex: '#BD8966', brand: 'Rare Beauty', product: 'Liquid Touch Foundation', shade: '26N' },
  { hex: '#A16E4B', brand: 'Rare Beauty', product: 'Liquid Touch Foundation', shade: '32N' },
  { hex: '#4F2903', brand: 'Rare Beauty', product: 'Liquid Touch Foundation', shade: '42N' },
];

const HexShadeMatcher = () => {
  const [userHex, setUserHex] = useState('#D4AA78');
  const [matches, setMatches] = useState<HexShadeMatch[]>([]);
  const [analysis, setAnalysis] = useState<any>(null);
  const [showSwatches, setShowSwatches] = useState(false);

  const handleAnalyze = () => {
    if (!userHex.match(/^#[0-9A-Fa-f]{6}$/)) {
      alert('Please enter a valid HEX color (e.g., #D4AA78)');
      return;
    }

    const skinAnalysis = analyzeSkinHex(userHex);
    const shadeMatches = findHexShadeMatches(userHex, SAMPLE_SHADE_DATABASE, 10);
    
    setAnalysis(skinAnalysis);
    setMatches(shadeMatches);
  };

  const getUndertoneColor = (undertone: string) => {
    switch (undertone) {
      case 'Cool': return 'bg-blue-100 text-blue-800';
      case 'Warm': return 'bg-orange-100 text-orange-800';
      case 'Olive': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50">
        <Header />
        
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Advanced HEX Shade Matching
              </h1>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Revolutionary shade matching using HEX-based color analysis, Lab color space calculations, 
                and ΔE76 color difference algorithms for precise cross-brand recommendations.
              </p>
            </div>

            {/* HEX Input and Analysis */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Enter Your Skin HEX Color</CardTitle>
                <CardDescription>
                  Input your skin tone as a HEX color code for precise analysis and matching
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <Input
                      type="text"
                      placeholder="#D4AA78"
                      value={userHex}
                      onChange={(e) => setUserHex(e.target.value)}
                      className="font-mono text-lg"
                    />
                  </div>
                  <div 
                    className="w-16 h-10 rounded border-2 border-gray-300"
                    style={{ backgroundColor: userHex }}
                  />
                  <Button onClick={handleAnalyze} size="lg">
                    Analyze & Match
                  </Button>
                </div>
                
                <div className="mt-4 flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowSwatches(!showSwatches)}
                  >
                    {showSwatches ? 'Hide' : 'Show'} HEX Reference Swatches
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Analysis Results */}
            {analysis && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Skin Tone Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div 
                        className="w-20 h-20 rounded-full mx-auto mb-2 border-4 border-white shadow-lg"
                        style={{ backgroundColor: analysis.hex }}
                      />
                      <p className="font-mono text-sm">{analysis.hex}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Undertone</h4>
                      <Badge className={getUndertoneColor(analysis.undertone)}>
                        {analysis.undertone}
                      </Badge>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Depth (L*)</h4>
                      <p className="text-lg">{analysis.depth.toFixed(1)}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Lab Values</h4>
                      <p className="text-sm">
                        L*: {analysis.lab.l.toFixed(1)}<br/>
                        a*: {analysis.lab.a.toFixed(1)}<br/>
                        b*: {analysis.lab.b.toFixed(1)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Shade Matches */}
            {matches.length > 0 && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Best Shade Matches</CardTitle>
                  <CardDescription>
                    Ranked by ΔE76 color difference and undertone compatibility
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {matches.map((match, index) => (
                      <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                        <div className="text-center">
                          <div 
                            className="w-12 h-12 rounded border-2 border-gray-300"
                            style={{ backgroundColor: match.hex }}
                          />
                          <p className="text-xs font-mono mt-1">{match.hex}</p>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{match.brand}</h4>
                          <p className="text-sm text-gray-600">{match.product}</p>
                          <p className="font-medium">{match.shade}</p>
                        </div>
                        <div className="text-right">
                          <Badge className={getUndertoneColor(match.undertone)}>
                            {match.undertone}
                          </Badge>
                          <p className="text-xs mt-2">
                            ΔE76: {match.deltaE76.toFixed(1)}<br/>
                            Score: {match.adjustedScore.toFixed(1)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* HEX Swatches */}
            {showSwatches && (
              <div className="mb-8">
                <SkinHexSwatches />
              </div>
            )}

            {/* How It Works */}
            <Card>
              <CardHeader>
                <CardTitle>How The HEX Matching System Works</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2">1. HEX to Lab Conversion</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Your skin HEX is converted to Lab color space for perceptually uniform color analysis.
                    </p>
                    
                    <h4 className="font-semibold mb-2">2. Undertone Classification</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Based on a* and b* values: Cool (negative a*), Warm (positive a* + b*), 
                      Olive (negative a*, low b*), or Neutral.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">3. ΔE76 Color Distance</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Calculate precise color difference between your skin and foundation shades 
                      using the ΔE76 formula.
                    </p>
                    
                    <h4 className="font-semibold mb-2">4. Undertone Compatibility</h4>
                    <p className="text-sm text-gray-600">
                      Apply penalties for undertone mismatches to ensure natural-looking results 
                      across different brands and products.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <Toaster />
      </div>
    </AuthGuard>
  );
};

export default HexShadeMatcher;