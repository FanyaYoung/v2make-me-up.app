import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Palette, Sun, Moon, AlertTriangle, CheckCircle, Sparkles, Lightbulb } from 'lucide-react';

interface SkinToneAnalysis {
  dominantTone: {
    undertone: string;
    depth: string;
    confidence: number;
  };
  secondaryTone?: {
    undertone: string;
    depth: string;
    confidence: number;
  };
}

interface SkinToneAnalysisDisplayProps {
  analysis: SkinToneAnalysis;
}

const SkinToneAnalysisDisplay = ({ analysis }: SkinToneAnalysisDisplayProps) => {
  const getUndertoneIcon = (undertone: string) => {
    switch (undertone.toLowerCase()) {
      case 'warm':
        return <Sun className="w-4 h-4 text-orange-500" />;
      case 'cool':
        return <Moon className="w-4 h-4 text-blue-500" />;
      case 'neutral':
        return <Palette className="w-4 h-4 text-purple-500" />;
      case 'olive':
        return <Sparkles className="w-4 h-4 text-green-500" />;
      default:
        return <Palette className="w-4 h-4 text-gray-500" />;
    }
  };

  const getUndertoneColor = (undertone: string) => {
    switch (undertone.toLowerCase()) {
      case 'warm':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'cool':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'neutral':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'olive':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAdviceForUndertone = (undertone: string) => {
    switch (undertone.toLowerCase()) {
      case 'warm':
        return {
          description: "Your skin has golden, yellow, or peachy undertones that give you a natural warmth.",
          complement: [
            "Look for foundations with golden, yellow, or honey undertones",
            "Warm-toned foundations will enhance your natural glow",
            "Consider foundations labeled as 'W' or 'Golden' shades"
          ],
          avoid: [
            "Avoid foundations with pink or rose undertones",
            "Stay away from foundations that look ashy or gray on your skin",
            "Be cautious with cool-toned or 'C' labeled foundations"
          ],
          tips: [
            "Test foundations on your jawline in natural light",
            "Golden hour lighting is most flattering for warm undertones",
            "Bronzers and warm blushes complement your undertone beautifully"
          ]
        };
      case 'cool':
        return {
          description: "Your skin has pink, red, or blue undertones that give you a fresh, rosy appearance.",
          complement: [
            "Choose foundations with pink, rose, or beige undertones",
            "Cool-toned foundations will complement your natural flush",
            "Look for foundations labeled as 'C' or 'Pink' shades"
          ],
          avoid: [
            "Avoid foundations with yellow or golden undertones",
            "Stay away from warm orange-based foundations",
            "Be careful with foundations that appear too yellow"
          ],
          tips: [
            "Natural daylight shows your undertones best",
            "Silver jewelry typically complements cool undertones",
            "Rose-toned blushes and cool lip colors work beautifully"
          ]
        };
      case 'neutral':
        return {
          description: "You have a balanced mix of warm and cool undertones, giving you versatility.",
          complement: [
            "You can wear both warm and cool-toned foundations",
            "Look for foundations labeled as 'N' or 'Neutral'",
            "Beige and true neutral shades work perfectly"
          ],
          avoid: [
            "Avoid foundations that are too extremely warm or cool",
            "Be cautious with foundations that pull too pink or too yellow",
            "Steer clear of foundations with obvious color bias"
          ],
          tips: [
            "You have the most flexibility in foundation choices",
            "Both gold and silver jewelry likely look good on you",
            "Focus on matching your exact depth rather than undertone"
          ]
        };
      case 'olive':
        return {
          description: "Your skin has green or gray undertones, often with golden highlights.",
          complement: [
            "Look for foundations with yellow-green or golden undertones",
            "Olive-specific foundation lines work best",
            "Consider foundations with a slight green or gray base"
          ],
          avoid: [
            "Avoid foundations that are too pink or orange",
            "Stay away from foundations that make you look gray",
            "Be cautious with standard cool or warm foundations"
          ],
          tips: [
            "Olive skin is often underrepresented - seek specialized brands",
            "Natural light is crucial for accurate color matching",
            "Earth-toned makeup complements olive undertones beautifully"
          ]
        };
      default:
        return {
          description: "Your skin tone analysis is still processing.",
          complement: ["General foundation matching advice will be provided"],
          avoid: ["Extreme color mismatches"],
          tips: ["Test foundations in natural light"]
        };
    }
  };

  const advice = getAdviceForUndertone(analysis.dominantTone.undertone);

  return (
    <div className="space-y-6">
      {/* Main Analysis Header */}
      <Card className="bg-gradient-to-br from-rose-50 to-purple-50 border-rose-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Palette className="w-6 h-6 text-rose-600" />
            Your Skin Tone Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Primary Undertone */}
          <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
            <div className="flex items-center gap-3">
              {getUndertoneIcon(analysis.dominantTone.undertone)}
              <div>
                <h3 className="font-semibold text-gray-800 capitalize">
                  {analysis.dominantTone.undertone} Undertone
                </h3>
                <p className="text-sm text-gray-600 capitalize">
                  {analysis.dominantTone.depth} depth
                </p>
              </div>
            </div>
            <Badge className={getUndertoneColor(analysis.dominantTone.undertone)}>
              {Math.round(analysis.dominantTone.confidence * 100)}% match
            </Badge>
          </div>

          {/* Secondary Undertone */}
          {analysis.secondaryTone && (
            <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-dashed">
              <div className="flex items-center gap-3">
                {getUndertoneIcon(analysis.secondaryTone.undertone)}
                <div>
                  <h4 className="font-medium text-gray-700 capitalize">
                    Secondary: {analysis.secondaryTone.undertone}
                  </h4>
                  <p className="text-xs text-gray-500">
                    {Math.round(analysis.secondaryTone.confidence * 100)}% confidence
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">{advice.description}</p>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Advice Sections */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* What Complements Your Skin */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-green-700">
              <CheckCircle className="w-5 h-5" />
              What Complements You
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {advice.complement.map((tip, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* What to Avoid */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-red-700">
              <AlertTriangle className="w-5 h-5" />
              What to Avoid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {advice.avoid.map((tip, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Shopping Tips */}
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-purple-700">
            <Lightbulb className="w-5 h-5" />
            Foundation Shopping Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {advice.tips.map((tip, index) => (
              <div key={index} className="flex items-start gap-2 p-3 bg-white rounded-lg border">
                <Lightbulb className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{tip}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Color Legend */}
      <div className="text-center">
        <p className="text-sm text-gray-500 mb-4">
          All shades shown have been color-matched using our advanced AI technology
        </p>
        <div className="flex justify-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-rose-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Your skin tone</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Perfect Matches</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkinToneAnalysisDisplay;