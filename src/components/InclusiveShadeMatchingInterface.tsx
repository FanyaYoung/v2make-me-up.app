import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Camera, Upload, Target, CheckCircle, Palette, RefreshCw, AlertCircle } from 'lucide-react';
import { inclusiveShadeAnalyzer, SkinToneData, SkinToneResult } from '@/lib/inclusiveShadeAnalyzer';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface InclusiveShadeMatchingInterfaceProps {
  onAnalysisComplete: (skinToneData: SkinToneData) => void;
  onUpgradeClick?: () => void;
}

export default function InclusiveShadeMatchingInterface({ 
  onAnalysisComplete, 
  onUpgradeClick 
}: InclusiveShadeMatchingInterfaceProps) {
  const [currentStep, setCurrentStep] = useState<'capture' | 'analyzing' | 'results'>('capture');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<SkinToneResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const { user } = useAuth();

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 }, 
          height: { ideal: 720 },
          facingMode: 'user'
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (err) {
      setError('Unable to access camera. Please ensure camera permissions are granted.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video && canvas) {
      const context = canvas.getContext('2d');
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(imageDataUrl);
        stopCamera();
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCapturedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!capturedImage) return;
    
    setCurrentStep('analyzing');
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setError(null);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setAnalysisProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 15;
        });
      }, 200);

      // Perform the actual analysis
      const result = await inclusiveShadeAnalyzer.analyzeInclusiveSkinTone(capturedImage);
      
      clearInterval(progressInterval);
      setAnalysisProgress(100);
      
      // Small delay to show 100% completion
      setTimeout(() => {
        setAnalysisResult(result);
        setCurrentStep('results');
        
        // Create skin tone data for foundation matching
        const skinToneData: SkinToneData = {
          hexColor: result.dominantTone.hex,
          depth: result.dominantTone.depth === 'fair' ? 2 :
                 result.dominantTone.depth === 'light' ? 4 :
                 result.dominantTone.depth === 'medium' ? 6 :
                 result.dominantTone.depth === 'deep' ? 8 : 10,
          undertone: result.dominantTone.undertone
        };
        
        onAnalysisComplete(skinToneData);
        
        // Log usage to analytics
        if (user) {
          supabase.from('user_match_usage').insert({
            user_id: user.id,
            match_type: 'inclusive_shade_analysis',
            metadata: {
              confidence: result.dominantTone.confidence,
              reference_system: result.dominantTone.referenceSystem,
              bias_correction: result.biasCorrection.adjustmentType !== 'none'
            }
          });
        }
      }, 500);
      
    } catch (err) {
      setError('Failed to analyze image. Please try again with a clearer photo.');
      setCurrentStep('capture');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    setCurrentStep('capture');
    setCapturedImage(null);
    setAnalysisResult(null);
    setAnalysisProgress(0);
    setError(null);
    stopCamera();
  };

  const renderCaptureInterface = () => {
    return (
      <Card className="bg-white/70 backdrop-blur-sm shadow-xl border-0 mb-8">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-800 mb-2">
            AI Skin Tone Analysis
          </CardTitle>
          <p className="text-gray-600">
            Capture or upload a photo for personalized shade matching using inclusive AI technology
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {!capturedImage ? (
            <div className="space-y-4">
              {/* Camera Section */}
              <div className="text-center">
                <video 
                  ref={videoRef}
                  autoPlay 
                  playsInline
                  className="w-full max-w-md mx-auto rounded-lg shadow-lg"
                  style={{ display: streamRef.current ? 'block' : 'none' }}
                />
                
                {!streamRef.current && (
                  <div className="w-full max-w-md mx-auto h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Camera preview will appear here</p>
                    </div>
                  </div>
                )}
                
                <div className="flex gap-4 justify-center mt-4">
                  {!streamRef.current ? (
                    <Button 
                      onClick={startCamera}
                      className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Start Camera
                    </Button>
                  ) : (
                    <Button 
                      onClick={capturePhoto}
                      className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Capture Photo
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center my-4">
                  <div className="flex-1 border-t border-gray-300"></div>
                  <span className="px-4 text-gray-500">or</span>
                  <div className="flex-1 border-t border-gray-300"></div>
                </div>
                
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="border-purple-200 hover:border-purple-400"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Photo
                </Button>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <img 
                src={capturedImage} 
                alt="Captured" 
                className="w-full max-w-md mx-auto rounded-lg shadow-lg"
              />
              
              <div className="flex gap-4 justify-center">
                <Button 
                  onClick={analyzeImage}
                  disabled={isAnalyzing}
                  className="bg-gradient-to-r from-rose-500 to-purple-500 hover:from-rose-600 hover:to-purple-600"
                >
                  <Target className="w-4 h-4 mr-2" />
                  Analyze Skin Tone
                </Button>
                
                <Button 
                  onClick={resetAnalysis}
                  variant="outline"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retake
                </Button>
              </div>
            </div>
          )}
          
          <canvas ref={canvasRef} className="hidden" />
        </CardContent>
      </Card>
    );
  };

  const renderAnalysisInterface = () => {
    return (
      <Card className="bg-white/70 backdrop-blur-sm shadow-xl border-0 mb-8">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-800 mb-2">
            Analyzing Your Skin Tone
          </CardTitle>
          <p className="text-gray-600">
            Our AI is processing your image for the most accurate shade match
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-rose-200 to-purple-200 rounded-full mx-auto mb-4 animate-pulse" />
            
            <Progress value={analysisProgress} className="w-full max-w-md mx-auto mb-4" />
            
            <p className="text-lg font-semibold text-gray-700">
              {analysisProgress < 30 ? 'Detecting skin regions...' :
               analysisProgress < 60 ? 'Analyzing skin tone...' :
               analysisProgress < 90 ? 'Applying bias correction...' :
               'Finalizing results...'}
            </p>
            
            <p className="text-sm text-gray-500 mt-2">
              {Math.round(analysisProgress)}% complete
            </p>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderResults = () => {
    if (!analysisResult) return null;

    const { dominantTone, biasCorrection, multipleReferences, qualityMetrics } = analysisResult;

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Your Inclusive Shade Profile</h2>
          <p className="text-muted-foreground">
            Analysis complete with {Math.round(dominantTone.confidence * 100)}% confidence
          </p>
        </div>

        {/* Main Result */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Your Perfect Shade
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-full border-2 border-border shadow-md"
                style={{ backgroundColor: dominantTone.hex }}
              />
              <div>
                <p className="font-semibold text-lg">{dominantTone.hex}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{dominantTone.undertone}</Badge>
                  <Badge variant="outline">{dominantTone.depth}</Badge>
                  <Badge className="bg-primary/10 text-primary">
                    {dominantTone.referenceSystem.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <p className="text-sm font-medium">Confidence</p>
                <p className="text-2xl font-bold text-primary">
                  {Math.round(dominantTone.confidence * 100)}%
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Quality Score</p>
                <p className="text-2xl font-bold text-primary">
                  {Math.round(qualityMetrics.overallConfidence * 100)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bias Correction */}
        {biasCorrection.adjustmentType !== 'none' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Bias Correction Applied
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex gap-2">
                  <div
                    className="w-8 h-8 rounded border"
                    style={{ backgroundColor: biasCorrection.originalHex }}
                    title="Original"
                  />
                  <span className="text-muted-foreground">→</span>
                  <div
                    className="w-8 h-8 rounded border"
                    style={{ backgroundColor: biasCorrection.correctedHex }}
                    title="Corrected"
                  />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {biasCorrection.adjustmentType === 'yellow-reduction'
                      ? 'Yellow Bias Reduced'
                      : 'Warmth Enhanced'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Confidence improved by {Math.round(biasCorrection.confidenceImprovement * 100)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Multiple Reference Systems */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Reference System Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">ITA° Angle</p>
                <p className="text-lg font-semibold">{Math.round(multipleReferences.itaAngle)}°</p>
              </div>
              <div>
                <p className="text-sm font-medium">Massey-Martin Scale</p>
                <p className="text-lg font-semibold">{multipleReferences.masseyMartinScale}/10</p>
              </div>
              <div>
                <p className="text-sm font-medium">CASCo Classification</p>
                <p className="text-lg font-semibold">{multipleReferences.cascoClassification}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Depth Level</p>
                <p className="text-lg font-semibold">{multipleReferences.customDepthLevel}/10</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center gap-4">
          <Button onClick={resetAnalysis} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Analyze Another Photo
          </Button>
        </div>
      </div>
    );
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {currentStep === 'capture' && renderCaptureInterface()}
      {currentStep === 'analyzing' && renderAnalysisInterface()}
      {currentStep === 'results' && renderResults()}
    </div>
  );
}