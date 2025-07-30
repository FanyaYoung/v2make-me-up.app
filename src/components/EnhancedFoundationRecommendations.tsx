import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { FoundationMatch } from '../types/foundation';
import FaceOverlay from './FaceOverlay';
import ConcealerRecommendations from './ConcealerRecommendations';
import FoundationPairResults from './FoundationPairResults';

interface EnhancedFoundationRecommendationsProps {
  foundationMatch: FoundationMatch;
  concealerMatches: FoundationMatch[];
  traditionalPairs?: FoundationMatch[][];
  onTryVirtual: (match: FoundationMatch) => void;
  onAddToCart?: (foundation: FoundationMatch, concealer: FoundationMatch) => void;
}

const EnhancedFoundationRecommendations = ({
  foundationMatch,
  concealerMatches,
  traditionalPairs = [],
  onTryVirtual,
  onAddToCart
}: EnhancedFoundationRecommendationsProps) => {
  const [showFaceGuide, setShowFaceGuide] = useState(true);
  
  // Generate primary and contour colors from the matches
  const primaryColor = '#E8C2A0'; // Based on foundation shade
  const contourColor = '#D4A574'; // Based on concealer shade

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Your Perfect Foundation Match</h1>
        <p className="text-muted-foreground">
          Smart recommendations combining foundation and concealer for natural, seamless coverage
        </p>
      </div>

      {/* Face Guide and Recommendations Layout */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Face Application Guide */}
        <div className="lg:col-span-1">
          <FaceOverlay
            showOverlay={showFaceGuide}
            onToggleOverlay={setShowFaceGuide}
            primaryColor={primaryColor}
            contourColor={contourColor}
          />
        </div>

        {/* Main Recommendations */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="concealer" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="concealer" className="flex items-center gap-2">
                <span>Foundation + Concealer</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Recommended
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="traditional" className="flex items-center gap-2">
                <span>Traditional Pairs</span>
                {traditionalPairs.length > 0 && (
                  <Badge variant="outline">{traditionalPairs.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="concealer" className="mt-6">
              <ConcealerRecommendations
                foundationMatch={foundationMatch}
                concealerMatches={concealerMatches}
                onAddToCart={onAddToCart}
              />
            </TabsContent>

            <TabsContent value="traditional" className="mt-6">
              {traditionalPairs.length > 0 ? (
                <FoundationPairResults
                  pairs={traditionalPairs}
                  onTryVirtual={onTryVirtual}
                />
              ) : (
                <Card>
                  <CardContent className="flex items-center justify-center p-8">
                    <div className="text-center">
                      <p className="text-muted-foreground mb-2">
                        No traditional foundation pairs available
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Try our Foundation + Concealer recommendation for better value
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Benefits Section */}
      <Card className="bg-gradient-to-r from-rose-50 to-purple-50">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-center">
            Why Foundation + Concealer Works Better
          </h3>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                <span className="text-green-600 font-bold text-lg">💰</span>
              </div>
              <h4 className="font-medium mb-2">More Affordable</h4>
              <p className="text-sm text-muted-foreground">
                Concealer costs 40-60% less than a second full foundation
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold text-lg">🎨</span>
              </div>
              <h4 className="font-medium mb-2">Better Coverage</h4>
              <p className="text-sm text-muted-foreground">
                Concealer provides targeted coverage where you need it most
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-3">
                <span className="text-purple-600 font-bold text-lg">✨</span>
              </div>
              <h4 className="font-medium mb-2">Natural Finish</h4>
              <p className="text-sm text-muted-foreground">
                Seamless blending creates a more natural, skin-like appearance
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedFoundationRecommendations;