import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, ExternalLink, Palette, Crown, Star } from 'lucide-react';
import { type RecommendationGroup, type PairedShadeMatch } from '@/lib/dualPointShadeMatching';

interface PairedRecommendationsProps {
  recommendationGroups: RecommendationGroup[];
  onAddToCart?: (primaryMatch: any, secondaryMatch: any) => void;
  onVirtualTryOn?: (match: any) => void;
  enableCart?: boolean;
}

export default function PairedRecommendations({
  recommendationGroups,
  onAddToCart,
  onVirtualTryOn,
  enableCart = true
}: PairedRecommendationsProps) {
  const getCoverageColor = (coverage: string) => {
    switch (coverage) {
      case 'light': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-green-100 text-green-800';
      case 'full': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatPrice = (match: any) => {
    // Mock pricing - in real app this would come from the database
    return '$32.00';
  };

  const getMatchQuality = (score: number) => {
    if (score < 5) return { label: 'Excellent', color: 'text-green-600', stars: 5 };
    if (score < 10) return { label: 'Very Good', color: 'text-blue-600', stars: 4 };
    if (score < 15) return { label: 'Good', color: 'text-yellow-600', stars: 3 };
    return { label: 'Fair', color: 'text-gray-600', stars: 2 };
  };

  const renderStars = (count: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`w-4 h-4 ${i < count ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
      />
    ));
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold mb-2">Your Personalized Shade Pairs</h3>
        <p className="text-gray-600">
          Perfect matches for both your primary and secondary skin tones
        </p>
      </div>

      {recommendationGroups.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Palette className="w-8 h-8 text-gray-400" />
            </div>
            <h4 className="text-lg font-semibold mb-2">No Matches Found</h4>
            <p className="text-gray-600">
              Please complete the dual-point skin analysis to get personalized recommendations.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {recommendationGroups.map((group, groupIndex) => (
            <Card key={groupIndex} className="border-2 border-gray-200 hover:border-rose-300 transition-colors">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-lg font-bold">{group.brand}</span>
                      {group.pairedMatches[0]?.brandConsistency && (
                        <Badge className="bg-green-100 text-green-800">
                          <Crown className="w-3 h-3 mr-1" />
                          Brand Match
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <span>{group.productLine}</span>
                      <Badge className={getCoverageColor(group.coverageType)}>
                        {group.coverageType} coverage
                      </Badge>
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Group Score</div>
                    <div className="font-semibold">{group.groupScore.toFixed(1)}</div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  {group.pairedMatches.slice(0, 2).map((pairedMatch: PairedShadeMatch, pairIndex: number) => {
                    const quality = getMatchQuality(pairedMatch.overallScore);
                    
                    return (
                      <div key={pairIndex} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Shade Pair {pairIndex + 1}</span>
                            <div className="flex items-center gap-1">
                              {renderStars(quality.stars)}
                            </div>
                            <Badge variant="outline" className={quality.color}>
                              {quality.label}
                            </Badge>
                            {pairedMatch.productConsistency && (
                              <Badge className="bg-blue-100 text-blue-800 text-xs">
                                Same Product
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-600">
                            ΔE: {pairedMatch.overallScore.toFixed(1)}
                          </div>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-4">
                          {/* Primary Match */}
                          <div className="flex items-center gap-3 p-3 bg-white rounded border">
                            <div className="text-center">
                              <div 
                                className="w-12 h-12 rounded border-2 border-gray-300 mb-1"
                                style={{ backgroundColor: pairedMatch.primaryMatch.shade_hex }}
                              />
                              <div className="text-xs text-gray-600">Primary</div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="font-medium text-sm truncate">
                                {pairedMatch.primaryMatch.shade_name}
                              </h5>
                              <p className="text-xs text-gray-600 truncate">
                                {pairedMatch.primaryMatch.product_name}
                              </p>
                              <p className="text-xs font-mono">
                                {pairedMatch.primaryMatch.shade_hex}
                              </p>
                            </div>
                          </div>

                          {/* Secondary Match */}
                          <div className="flex items-center gap-3 p-3 bg-white rounded border">
                            <div className="text-center">
                              <div 
                                className="w-12 h-12 rounded border-2 border-gray-300 mb-1"
                                style={{ backgroundColor: pairedMatch.secondaryMatch.shade_hex }}
                              />
                              <div className="text-xs text-gray-600">Secondary</div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="font-medium text-sm truncate">
                                {pairedMatch.secondaryMatch.shade_name}
                              </h5>
                              <p className="text-xs text-gray-600 truncate">
                                {pairedMatch.secondaryMatch.product_name}
                              </p>
                              <p className="text-xs font-mono">
                                {pairedMatch.secondaryMatch.shade_hex}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 mt-4">
                          {onVirtualTryOn && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => onVirtualTryOn(pairedMatch.primaryMatch)}
                              className="flex-1"
                            >
                              <Palette className="w-4 h-4 mr-1" />
                              Try On
                            </Button>
                          )}
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="flex-1"
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            View Details
                          </Button>

                          {enableCart && onAddToCart && (
                            <Button 
                              size="sm"
                              onClick={() => onAddToCart(pairedMatch.primaryMatch, pairedMatch.secondaryMatch)}
                              className="flex-1"
                            >
                              <ShoppingCart className="w-4 h-4 mr-1" />
                              Add Pair ({formatPrice(pairedMatch.primaryMatch)} each)
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  
                  {group.pairedMatches.length > 2 && (
                    <div className="text-center pt-2">
                      <Button variant="ghost" size="sm">
                        View {group.pairedMatches.length - 2} more pairs from {group.brand}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* How It Works */}
      {recommendationGroups.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">Why Dual-Point Matching?</CardTitle>
          </CardHeader>
          <CardContent className="text-blue-800 text-sm space-y-2">
            <p>
              <strong>Primary Tone:</strong> Represents your main skin color for general matching and color correcting.
            </p>
            <p>
              <strong>Secondary Tone:</strong> Captures shadow areas and undertones for contouring and highlighting.
            </p>
            <p>
              This approach ensures your foundation looks natural in all lighting conditions and provides options for advanced techniques.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}