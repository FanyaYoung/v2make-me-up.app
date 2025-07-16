import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Palette, Target, Zap, TrendingUp } from 'lucide-react';

interface FaceRegionData {
  id: string;
  regionName: string;
  avgRgbValues: { r: number; g: number; b: number };
  hexColor: string;
  undertone: string;
  depthLevel: number;
  confidenceScore: number;
}

interface SkinToneAnalysisDisplayProps {
  analysis: {
    faceRegions: FaceRegionData[];
    dominantTone: {
      hexColor: string;
      undertone: string;
      depthLevel: number;
      confidence: number;
    };
    secondaryTone: {
      hexColor: string;
      undertone: string;
      depthLevel: number;
      confidence: number;
    };
    overallConfidence: number;
  };
}

const SkinToneAnalysisDisplay: React.FC<SkinToneAnalysisDisplayProps> = ({ 
  analysis 
}) => {
  const getUndertoneColor = (undertone: string) => {
    switch (undertone) {
      case 'warm': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'cool': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'neutral': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'olive': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getDepthDescription = (depth: number) => {
    if (depth <= 2) return 'Very Fair';
    if (depth <= 4) return 'Fair';
    if (depth <= 6) return 'Light';
    if (depth <= 8) return 'Medium';
    if (depth <= 9) return 'Deep';
    return 'Very Deep';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Overall Analysis Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center">
            <span className="bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent">
              Your Skin Tone Analysis
            </span>
          </CardTitle>
          <CardDescription className="text-center">
            AI-powered analysis of your unique skin characteristics
          </CardDescription>
          
          <div className="flex justify-center mt-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <span className={`font-medium ${getConfidenceColor(analysis.overallConfidence)}`}>
                {Math.round(analysis.overallConfidence * 100)}% Confidence
              </span>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dominant Tone */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-rose-500" />
              <span>Primary Tone (Center Face)</span>
            </CardTitle>
            <CardDescription>
              Your main foundation shade should match this tone
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <div 
                className="w-16 h-16 rounded-full border-2 border-gray-200"
                style={{ backgroundColor: analysis.dominantTone.hexColor }}
              ></div>
              <div className="flex-1 space-y-2">
                <p className="font-medium text-lg">
                  {analysis.dominantTone.hexColor}
                </p>
                <div className="flex items-center space-x-2">
                  <Badge className={getUndertoneColor(analysis.dominantTone.undertone)}>
                    {analysis.dominantTone.undertone} undertone
                  </Badge>
                  <Badge variant="outline">
                    {getDepthDescription(analysis.dominantTone.depthLevel)}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Match Confidence</span>
                <span className={getConfidenceColor(analysis.dominantTone.confidence)}>
                  {Math.round(analysis.dominantTone.confidence * 100)}%
                </span>
              </div>
              <Progress value={analysis.dominantTone.confidence * 100} />
            </div>
          </CardContent>
        </Card>

        {/* Secondary Tone */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Palette className="h-5 w-5 text-purple-500" />
              <span>Secondary Tone (Perimeter)</span>
            </CardTitle>
            <CardDescription>
              For contouring or dual-zone application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <div 
                className="w-16 h-16 rounded-full border-2 border-gray-200"
                style={{ backgroundColor: analysis.secondaryTone.hexColor }}
              ></div>
              <div className="flex-1 space-y-2">
                <p className="font-medium text-lg">
                  {analysis.secondaryTone.hexColor}
                </p>
                <div className="flex items-center space-x-2">
                  <Badge className={getUndertoneColor(analysis.secondaryTone.undertone)}>
                    {analysis.secondaryTone.undertone} undertone
                  </Badge>
                  <Badge variant="outline">
                    {getDepthDescription(analysis.secondaryTone.depthLevel)}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Match Confidence</span>
                <span className={getConfidenceColor(analysis.secondaryTone.confidence)}>
                  {Math.round(analysis.secondaryTone.confidence * 100)}%
                </span>
              </div>
              <Progress value={analysis.secondaryTone.confidence * 100} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Regional Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-blue-500" />
            <span>Facial Zone Analysis</span>
          </CardTitle>
          <CardDescription>
            Detailed breakdown of color variations across your face
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analysis.faceRegions.map((region) => (
              <div key={region.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium capitalize">
                    {region.regionName.replace('-', ' ')}
                  </h4>
                  <div 
                    className="w-8 h-8 rounded-full border border-gray-300"
                    style={{ backgroundColor: region.hexColor }}
                  ></div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Color:</span>
                    <span className="font-mono text-xs">{region.hexColor}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>Undertone:</span>
                    <Badge 
                      className={getUndertoneColor(region.undertone)}
                    >
                      {region.undertone}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>Depth:</span>
                    <span>{getDepthDescription(region.depthLevel)}</span>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Confidence:</span>
                      <span className={getConfidenceColor(region.confidenceScore)}>
                        {Math.round(region.confidenceScore * 100)}%
                      </span>
                    </div>
                    <Progress value={region.confidenceScore * 100} className="h-1" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SkinToneAnalysisDisplay;