import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import SkinHexSwatches from '../components/SkinHexSwatches';
import HexDataImporter from '../components/HexDataImporter';
import DualPointSkinAnalyzer from '../components/DualPointSkinAnalyzer';
import PairedRecommendations from '../components/PairedRecommendations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Toaster } from '@/components/ui/toaster';
import { analyzeSkinHex, findClosestShades, getSkinToneReferences, type ShadeMatch, type SkinToneHex } from '@/lib/hexShadeMatching';
import { 
  findPairedShadeMatches, 
  generateRecommendationGroups, 
  type DualPointAnalysis,
  type RecommendationGroup 
} from '@/lib/dualPointShadeMatching';
import AuthGuard from '../components/AuthGuard';

// Quick shade selection from database
const QuickShadeSelector = ({ skinTones, onSelect }: { skinTones: SkinToneHex[], onSelect: (hex: string) => void }) => {
  if (skinTones.length === 0) return null;
  
  return (
    <div className="mt-4">
      <h4 className="text-sm font-medium mb-2">Quick Select from Database:</h4>
      <div className="grid grid-cols-8 gap-2">
        {skinTones.slice(0, 16).map((tone) => (
          <button
            key={tone.hex_color}
            onClick={() => onSelect(tone.hex_color)}
            className="w-10 h-10 rounded border border-gray-300 hover:scale-105 transition-transform"
            style={{ backgroundColor: tone.hex_color }}
            title={`${tone.hex_color} - ${tone.undertone} - ${tone.depth_category}`}
          />
        ))}
      </div>
    </div>
  );
};

const HexShadeMatcher = () => {
  // Single HEX analysis (legacy mode)
  const [userHex, setUserHex] = useState('#D4AA78');
  const [matches, setMatches] = useState<ShadeMatch[]>([]);
  const [analysis, setAnalysis] = useState<any>(null);
  
  // Dual-point analysis (new mode)
  const [dualPointAnalysis, setDualPointAnalysis] = useState<DualPointAnalysis | null>(null);
  const [recommendationGroups, setRecommendationGroups] = useState<RecommendationGroup[]>([]);
  
  // UI State
  const [showSwatches, setShowSwatches] = useState(false);
  const [skinTones, setSkinTones] = useState<SkinToneHex[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('dual-point');

  // Load skin tone references on component mount
  useEffect(() => {
    const loadSkinTones = async () => {
      setIsLoading(true);
      try {
        const tones = await getSkinToneReferences();
        setSkinTones(tones);
      } catch (error) {
        console.error('Error loading skin tones:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSkinTones();
  }, []);

  const handleAnalyze = async () => {
    if (!userHex.match(/^#[0-9A-Fa-f]{6}$/)) {
      alert('Please enter a valid HEX color (e.g., #D4AA78)');
      return;
    }

    setIsAnalyzing(true);
    try {
      const skinAnalysis = analyzeSkinHex(userHex);
      const shadeMatches = await findClosestShades(userHex, 10);
      
      setAnalysis(skinAnalysis);
      setMatches(shadeMatches);
    } catch (error) {
      console.error('Error analyzing shade:', error);
      alert('Error finding shade matches. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDualPointAnalysis = async (analysis: DualPointAnalysis) => {
    setDualPointAnalysis(analysis);
    setIsAnalyzing(true);
    
    try {
      // Find paired shade matches
      const pairedMatches = await findPairedShadeMatches(analysis, 30);
      
      // Generate recommendation groups (4 different brands)
      const groups = generateRecommendationGroups(pairedMatches);
      
      setRecommendationGroups(groups);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      alert('Error generating recommendations. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
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
                Professional Shade Matching
              </h1>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Advanced dual-point skin analysis identifies your primary and secondary tones for 
                the most accurate foundation matches across all lighting conditions.
              </p>
            </div>

            {/* Analysis Method Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="dual-point">Dual-Point Analysis (Recommended)</TabsTrigger>
                <TabsTrigger value="single-hex">Single HEX Analysis</TabsTrigger>
              </TabsList>
              
              <TabsContent value="dual-point" className="space-y-6">
                <DualPointSkinAnalyzer 
                  onAnalysisComplete={handleDualPointAnalysis}
                  disabled={isAnalyzing}
                />
              </TabsContent>
              
              <TabsContent value="single-hex" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Enter Your Skin HEX Color</CardTitle>
                    <CardDescription>
                      Input your skin tone as a HEX color code for basic analysis and matching
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
                      <Button onClick={handleAnalyze} size="lg" disabled={isAnalyzing}>
                        {isAnalyzing ? 'Analyzing...' : 'Analyze & Match'}
                      </Button>
                    </div>
                    
                     {!isLoading && (
                       <QuickShadeSelector 
                         skinTones={skinTones} 
                         onSelect={(hex) => {
                           setUserHex(hex);
                           handleAnalyze();
                         }} 
                       />
                     )}
                     
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
              </TabsContent>
            </Tabs>

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
            {matches.length > 0 ? (
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
                             style={{ backgroundColor: match.shade_hex }}
                           />
                           <p className="text-xs font-mono mt-1">{match.shade_hex}</p>
                         </div>
                         <div className="flex-1">
                           <h4 className="font-semibold">{match.brand}</h4>
                           <p className="text-sm text-gray-600">{match.product_name}</p>
                           <p className="font-medium">{match.shade_name}</p>
                         </div>
                         <div className="text-right">
                           {match.undertone_match && (
                             <Badge className="bg-green-100 text-green-800 mb-2">
                               Undertone Match
                             </Badge>
                           )}
                           <p className="text-xs">
                             ΔE: {match.delta_e_distance.toFixed(1)}<br/>
                             Score: {match.match_score.toFixed(0)}%
                           </p>
                         </div>
                       </div>
                     ))}
                  </div>
                </CardContent>
              </Card>
            ) : analysis && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>No Shade Matches Found</CardTitle>
                  <CardDescription>
                    The foundation database needs to be populated with shade matching data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <p className="text-yellow-800 text-sm">
                      <strong>Database Setup Required:</strong> The HEX shade matching system requires foundation shade data 
                      to provide recommendations. You'll need to import your CSV data (hex_groups_full.csv, shade_ladders_full.csv, 
                      recommendations_full.csv) into the Supabase tables.
                    </p>
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

            {/* Data Import Section - Show when no data available */}
            {skinTones.length === 0 && !isLoading && (
              <div className="mb-8">
                <HexDataImporter />
              </div>
            )}

            {/* How It Works */}
            <Card>
              <CardHeader>
                <CardTitle>How Our Advanced Matching Works</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2">1. Dual-Point Analysis</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Analyzes both your primary skin tone (front of face) and secondary tone (shadow areas) 
                      for comprehensive matching that works in all lighting.
                    </p>
                    
                    <h4 className="font-semibold mb-2">2. Paired Recommendations</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Matches products for both tones, prioritizing same-brand pairs for consistent 
                      formulation and finish.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">3. Cross-Brand Grouping</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Presents 4 recommendation groups from different brands, each with multiple 
                      shade pairs ranked by compatibility.
                    </p>
                    
                    <h4 className="font-semibold mb-2">4. Lab Color Precision</h4>
                    <p className="text-sm text-gray-600">
                      Uses Lab color space and ΔE76 calculations for scientifically accurate 
                      color matching across all skin tones.
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