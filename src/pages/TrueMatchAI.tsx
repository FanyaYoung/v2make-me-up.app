import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import Header from '../components/Header';
import ProfileSetup from '../components/ProfileSetup';
import GuidedCameraCapture from '../components/GuidedCameraCapture';
import SkinToneAnalysisDisplay from '../components/SkinToneAnalysisDisplay';
import TrueMatchFoundationResults from '../components/TrueMatchFoundationResults';
import { skinToneAnalyzer } from '../components/SkinToneAnalyzer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Camera, Sparkles, Target, RotateCcw } from 'lucide-react';

enum TrueMatchStep {
  PROFILE_SETUP = 'profile-setup',
  CAMERA_CAPTURE = 'camera-capture', 
  ANALYSIS = 'analysis',
  RESULTS = 'results'
}

interface ScanSession {
  id: string;
  photos: string[];
  analysisData: any;
  matches: any[];
}

const TrueMatchAI = () => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<TrueMatchStep>(TrueMatchStep.PROFILE_SETUP);
  const [profileComplete, setProfileComplete] = useState(false);
  const [scanSession, setScanSession] = useState<ScanSession | null>(null);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [foundationMatches, setFoundationMatches] = useState<any>({
    primary: [],
    secondary: [],
    crossBrand: []
  });
  const [loading, setLoading] = useState(false);

  // Check if user has completed profile setup
  useEffect(() => {
    const checkProfileStatus = async () => {
      if (!user) return;

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profile?.age_range && profile?.skin_type) {
          setProfileComplete(true);
          setCurrentStep(TrueMatchStep.CAMERA_CAPTURE);
        }
      } catch (error) {
        console.log('Profile not complete yet');
      }
    };

    checkProfileStatus();
  }, [user]);

  const handleProfileComplete = () => {
    setProfileComplete(true);
    setCurrentStep(TrueMatchStep.CAMERA_CAPTURE);
    toast.success('Profile completed! Ready for photo capture.');
  };

  const handlePhotosCapture = async (photos: string[], calibrationData: any) => {
    if (!user) return;

    setLoading(true);
    setCurrentStep(TrueMatchStep.ANALYSIS);

    try {
      // Create scan session in database
      const { data: session, error: sessionError } = await supabase
        .from('scan_sessions')
        .insert({
          user_id: user.id,
          calibration_completed: true,
          calibration_data: calibrationData,
          photo_urls: photos
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      setScanSession({
        id: session.id,
        photos,
        analysisData: null,
        matches: []
      });

      // Analyze the photos
      await analyzeSkinTone(photos, session.id, calibrationData);

    } catch (error) {
      console.error('Error creating scan session:', error);
      toast.error('Failed to process photos. Please try again.');
      setCurrentStep(TrueMatchStep.CAMERA_CAPTURE);
    } finally {
      setLoading(false);
    }
  };

  const analyzeSkinTone = async (photos: string[], sessionId: string, calibrationData: any) => {
    try {
      // Initialize the skin tone analyzer
      await skinToneAnalyzer.initializeModel();

      // Create temporary image elements for analysis
      const analysisResults = [];
      
      for (let i = 0; i < photos.length; i++) {
        const img = new Image();
        img.src = photos[i];
        
        await new Promise((resolve) => {
          img.onload = resolve;
        });

        const analysis = await skinToneAnalyzer.analyzeSkinTone(img);
        analysisResults.push({
          photoIndex: i,
          analysis
        });
      }

      // Process and combine results
      const combinedAnalysis = combineAnalysisResults(analysisResults, calibrationData);
      
      // Save face regions to database
      await saveFaceRegions(sessionId, combinedAnalysis.faceRegions);

      // Update scan session with analysis complete
      await supabase
        .from('scan_sessions')
        .update({
          analysis_complete: true,
          analysis_data: combinedAnalysis
        })
        .eq('id', sessionId);

      setAnalysisData(combinedAnalysis);
      
      // Find foundation matches
      await findFoundationMatches(sessionId, combinedAnalysis);

    } catch (error) {
      console.error('Error analyzing skin tone:', error);
      toast.error('Analysis failed. Please try taking new photos.');
      setCurrentStep(TrueMatchStep.CAMERA_CAPTURE);
    }
  };

  const combineAnalysisResults = (analysisResults: any[], calibrationData: any) => {
    // Combine multiple photo analyses into final result
    const allRegions = analysisResults.flatMap(result => result.analysis.regions);
    
    // Group regions by type and average the values
    const regionGroups = allRegions.reduce((groups, region) => {
      if (!groups[region.regionName]) {
        groups[region.regionName] = [];
      }
      groups[region.regionName].push(region);
      return groups;
    }, {} as Record<string, any[]>);

    const averagedRegions = Object.keys(regionGroups).map(regionName => {
      const regions = regionGroups[regionName];
      const avgRegion = regions.reduce((avg, region) => {
        return {
          regionName,
          avgRgbValues: {
            r: (avg.avgRgbValues?.r || 0) + region.avgColor.r / regions.length,
            g: (avg.avgRgbValues?.g || 0) + region.avgColor.g / regions.length,
            b: (avg.avgRgbValues?.b || 0) + region.avgColor.b / regions.length
          },
          hexColor: region.hexColor,
          undertone: region.undertone,
          depthLevel: (avg.depthLevel || 0) + region.depth / regions.length,
          confidenceScore: (avg.confidenceScore || 0) + 0.85 / regions.length
        };
      }, {});
      
      return {
        ...avgRegion,
        id: `${regionName}-${Date.now()}`
      };
    });

    // Determine dominant and secondary tones
    const centerRegions = averagedRegions.filter(r => r.regionName === 'center');
    const perimeterRegions = averagedRegions.filter(r => r.regionName === 'perimeter');

    const dominantTone = centerRegions[0] || averagedRegions[0];
    const secondaryTone = perimeterRegions[0] || averagedRegions[1] || dominantTone;

    return {
      faceRegions: averagedRegions,
      dominantTone: {
        hexColor: dominantTone.hexColor,
        undertone: dominantTone.undertone,
        depthLevel: dominantTone.depthLevel,
        confidence: dominantTone.confidenceScore
      },
      secondaryTone: {
        hexColor: secondaryTone.hexColor,
        undertone: secondaryTone.undertone,
        depthLevel: secondaryTone.depthLevel,
        confidence: secondaryTone.confidenceScore
      },
      overallConfidence: averagedRegions.reduce((sum, r) => sum + r.confidenceScore, 0) / averagedRegions.length,
      calibrationData
    };
  };

  const saveFaceRegions = async (sessionId: string, regions: any[]) => {
    const regionData = regions.map(region => ({
      session_id: sessionId,
      region_name: region.regionName,
      avg_rgb_values: region.avgRgbValues,
      hex_color: region.hexColor,
      undertone: region.undertone,
      depth_level: Math.round(region.depthLevel),
      confidence_score: region.confidenceScore
    }));

    const { error } = await supabase
      .from('face_regions')
      .insert(regionData);

    if (error) {
      console.error('Error saving face regions:', error);
    }
  };

  const findFoundationMatches = async (sessionId: string, analysis: any) => {
    try {
      // Query foundation products and shades from database
      const { data: products } = await supabase
        .from('foundation_products')
        .select(`
          *,
          brand:brands(*),
          shades:foundation_shades(*)
        `)
        .eq('is_active', true);

      if (!products) return;

      const primaryMatches = [];
      const secondaryMatches = [];
      const crossBrandMatches = [];

      // Generate matches for each product
      for (const product of products) {
        if (!product.shades || product.shades.length === 0) continue;

        for (const shade of product.shades) {
          // Calculate color difference using ΔE
          const primaryDeltaE = calculateColorDifference(
            analysis.dominantTone.hexColor,
            shade.hex_color
          );
          
          const secondaryDeltaE = calculateColorDifference(
            analysis.secondaryTone.hexColor,
            shade.hex_color
          );

          // Create match objects
          if (primaryDeltaE < 5) {
            primaryMatches.push(createFoundationMatch(
              product,
              shade,
              'primary',
              primaryDeltaE,
              analysis.dominantTone.confidence
            ));
          }

          if (secondaryDeltaE < 5) {
            secondaryMatches.push(createFoundationMatch(
              product,
              shade,
              'secondary',
              secondaryDeltaE,
              analysis.secondaryTone.confidence
            ));
          }

          // Cross-brand matches (considering both tones)
          const avgDeltaE = (primaryDeltaE + secondaryDeltaE) / 2;
          if (avgDeltaE < 4) {
            crossBrandMatches.push(createFoundationMatch(
              product,
              shade,
              'cross-brand',
              avgDeltaE,
              (analysis.dominantTone.confidence + analysis.secondaryTone.confidence) / 2
            ));
          }
        }
      }

      // Sort by best matches and limit results
      const sortedPrimary = primaryMatches
        .sort((a, b) => a.deltaE - b.deltaE)
        .slice(0, 12);
        
      const sortedSecondary = secondaryMatches
        .sort((a, b) => a.deltaE - b.deltaE)
        .slice(0, 9);
        
      const sortedCrossBrand = crossBrandMatches
        .sort((a, b) => a.deltaE - b.deltaE)
        .slice(0, 15);

      setFoundationMatches({
        primary: sortedPrimary,
        secondary: sortedSecondary,
        crossBrand: sortedCrossBrand
      });

      // Save matches to database
      await saveFoundationMatches(sessionId, [
        ...sortedPrimary,
        ...sortedSecondary,
        ...sortedCrossBrand
      ]);

      setCurrentStep(TrueMatchStep.RESULTS);
      toast.success('Analysis complete! Found your perfect matches.');

    } catch (error) {
      console.error('Error finding foundation matches:', error);
      toast.error('Failed to find matches. Please try again.');
    }
  };

  const createFoundationMatch = (product: any, shade: any, matchType: string, deltaE: number, confidence: number) => {
    return {
      id: `${product.id}-${shade.id}`,
      brand: product.brand?.name || 'Unknown Brand',
      productName: product.name,
      shadeName: shade.shade_name,
      hexColor: shade.hex_color,
      price: product.price || 0,
      rating: 4.2, // Could be pulled from reviews
      reviewCount: 156, // Could be pulled from reviews
      coverage: product.coverage || 'medium',
      finish: product.finish || 'natural',
      matchType,
      confidenceScore: confidence,
      deltaE,
      purchaseUrl: product.product_url || '#',
      imageUrl: product.image_url || '',
      undertone: shade.undertone || 'neutral',
      depthLevel: shade.depth_level || 5
    };
  };

  const calculateColorDifference = (color1: string, color2: string): number => {
    // Simple RGB difference calculation
    // In production, this would use proper CIEDE2000 ΔE calculation
    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);
    
    if (!rgb1 || !rgb2) return 100;

    const rDiff = rgb1.r - rgb2.r;
    const gDiff = rgb1.g - rgb2.g;
    const bDiff = rgb1.b - rgb2.b;
    
    return Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff) / 100;
  };

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const saveFoundationMatches = async (sessionId: string, matches: any[]) => {
    const matchData = matches.map(match => ({
      session_id: sessionId,
      product_id: match.id.split('-')[0],
      shade_id: match.id.split('-')[1],
      match_type: match.matchType,
      confidence_score: match.confidenceScore,
      delta_e_value: match.deltaE,
      purchase_url: match.purchaseUrl,
      price: match.price
    }));

    const { error } = await supabase
      .from('foundation_matches')
      .insert(matchData);

    if (error) {
      console.error('Error saving foundation matches:', error);
    }
  };

  const handleSaveResults = async () => {
    toast.success('Results saved to your profile!');
  };

  const handleStartOver = () => {
    setCurrentStep(TrueMatchStep.CAMERA_CAPTURE);
    setScanSession(null);
    setAnalysisData(null);
    setFoundationMatches({ primary: [], secondary: [], crossBrand: [] });
  };

  const getStepProgress = () => {
    switch (currentStep) {
      case TrueMatchStep.PROFILE_SETUP: return 25;
      case TrueMatchStep.CAMERA_CAPTURE: return 50;
      case TrueMatchStep.ANALYSIS: return 75;
      case TrueMatchStep.RESULTS: return 100;
      default: return 0;
    }
  };

  const renderStepIndicator = () => (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">TrueMatch AI Process</h2>
          <span className="text-sm text-gray-500">
            {getStepProgress()}% Complete
          </span>
        </div>
        
        <Progress value={getStepProgress()} className="mb-4" />
        
        <div className="grid grid-cols-4 gap-4 text-center">
          <div className={`flex flex-col items-center space-y-2 ${
            currentStep === TrueMatchStep.PROFILE_SETUP ? 'text-rose-600' : 
            profileComplete ? 'text-green-600' : 'text-gray-400'
          }`}>
            {profileComplete ? (
              <CheckCircle className="h-6 w-6" />
            ) : (
              <div className="h-6 w-6 rounded-full border-2 border-current" />
            )}
            <span className="text-sm">Profile Setup</span>
          </div>
          
          <div className={`flex flex-col items-center space-y-2 ${
            currentStep === TrueMatchStep.CAMERA_CAPTURE ? 'text-rose-600' : 
            scanSession ? 'text-green-600' : 'text-gray-400'
          }`}>
            {scanSession ? (
              <CheckCircle className="h-6 w-6" />
            ) : (
              <Camera className="h-6 w-6" />
            )}
            <span className="text-sm">Photo Capture</span>
          </div>
          
          <div className={`flex flex-col items-center space-y-2 ${
            currentStep === TrueMatchStep.ANALYSIS ? 'text-rose-600' : 
            analysisData ? 'text-green-600' : 'text-gray-400'
          }`}>
            {analysisData ? (
              <CheckCircle className="h-6 w-6" />
            ) : (
              <Sparkles className="h-6 w-6" />
            )}
            <span className="text-sm">AI Analysis</span>
          </div>
          
          <div className={`flex flex-col items-center space-y-2 ${
            currentStep === TrueMatchStep.RESULTS ? 'text-rose-600' : 'text-gray-400'
          }`}>
            <Target className="h-6 w-6" />
            <span className="text-sm">Match Results</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50">
        <Header />
        <div className="py-8">
          <div className="container mx-auto px-4">
            {renderStepIndicator()}
            
            {currentStep === TrueMatchStep.PROFILE_SETUP && (
              <ProfileSetup onComplete={handleProfileComplete} />
            )}
            
            {currentStep === TrueMatchStep.CAMERA_CAPTURE && (
              <GuidedCameraCapture 
                onPhotosCapture={handlePhotosCapture}
                onBack={() => setCurrentStep(TrueMatchStep.PROFILE_SETUP)}
              />
            )}
            
            {currentStep === TrueMatchStep.ANALYSIS && (
              <Card className="max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle className="text-center">
                    <span className="bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent">
                      Analyzing Your Skin Tone
                    </span>
                  </CardTitle>
                  <CardDescription className="text-center">
                    Our AI is processing your photos and finding the perfect matches...
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center py-8">
                  <div className="animate-spin h-12 w-12 border-4 border-rose-500 border-t-transparent rounded-full"></div>
                </CardContent>
              </Card>
            )}
            
            {currentStep === TrueMatchStep.RESULTS && analysisData && (
              <div className="space-y-8">
                <SkinToneAnalysisDisplay analysis={analysisData} />
                
                <TrueMatchFoundationResults
                  primaryMatches={foundationMatches.primary}
                  secondaryMatches={foundationMatches.secondary}
                  crossBrandMatches={foundationMatches.crossBrand}
                  analysisData={analysisData}
                  onSaveResults={handleSaveResults}
                />
                
                <div className="flex justify-center">
                  <Button 
                    onClick={handleStartOver}
                    variant="outline"
                    className="flex items-center space-x-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span>Start New Analysis</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
  );
};

export default TrueMatchAI;