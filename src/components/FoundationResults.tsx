import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Eye, MapPin } from 'lucide-react';
import { FoundationMatch } from '../types/foundation';
import EnhancedFoundationFeedback from './EnhancedFoundationFeedback';

interface FoundationResultsProps {
  matches: FoundationMatch[];
  currentFoundation?: { brand: string; shade: string };
  onTryVirtual?: (match: FoundationMatch) => void;
  onViewDetails?: (match: FoundationMatch) => void;
  onFeedback: (foundationId: string, feedback: {
    rating: 'positive' | 'negative';
    comment?: string;
    category?: string;
    feedbackType?: string;
  }) => void;
}

const FoundationResults = ({ 
  matches, 
  currentFoundation, 
  onTryVirtual, 
  onViewDetails,
  onFeedback 
}: FoundationResultsProps) => {
  if (matches.length === 0) return null;

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const stars = [];

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />);
    }
    
    if (hasHalfStar) {
      stars.push(<Star key="half" className="w-4 h-4 text-yellow-400" />);
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />);
    }

    return stars;
  };

  const getShadeColor = (shade: string, undertone: string) => {
    // Generate a realistic foundation color based on shade name and undertone
    const shadeLower = shade.toLowerCase();
    let baseColor = '#D4A574'; // Default medium tone
    
    if (shadeLower.includes('fair') || shadeLower.includes('light')) {
      baseColor = undertone === 'cool' ? '#F5DCC4' : undertone === 'warm' ? '#F0D0A6' : '#F2D3B3';
    } else if (shadeLower.includes('medium')) {
      baseColor = undertone === 'cool' ? '#E8C2A0' : undertone === 'warm' ? '#D4A574' : '#DEBA8A';
    } else if (shadeLower.includes('deep') || shadeLower.includes('dark')) {
      baseColor = undertone === 'cool' ? '#B5967A' : undertone === 'warm' ? '#A0835C' : '#AA8B6E';
    }
    
    return baseColor;
  };

  return (
    <div className="space-y-6 mt-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Perfect Matches Found</h2>
        {currentFoundation && (
          <p className="text-gray-600">
            Based on your {currentFoundation.brand} {currentFoundation.shade}, here are similar shades:
          </p>
        )}
      </div>

      {/* Results Grid */}
      <div className="space-y-4">
        {matches.map((match, index) => (
          <Card key={match.id} className="bg-white shadow-lg border-0 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex gap-4">
                {/* Foundation Swatch */}
                <div className="flex-shrink-0">
                  <div className="text-center">
                    <div 
                      className="w-20 h-20 rounded-lg border shadow-sm mb-2"
                      style={{ 
                        backgroundColor: getShadeColor(match.shade, match.undertone)
                      }}
                    />
                    <p className="text-xs text-gray-600 font-medium">{match.brand}</p>
                  </div>
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">{match.brand}</h3>
                      <p className="text-gray-600 mb-1">{match.product}</p>
                      
                      {/* Dual shade recommendations */}
                      <div className="space-y-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">Face center:</span>
                          <span className="text-red-600 font-semibold">
                            {match.primaryShade?.name || match.shade}
                          </span>
                          <div 
                            className="w-4 h-4 rounded-full border"
                            style={{ backgroundColor: getShadeColor(match.primaryShade?.name || match.shade, match.undertone) }}
                          />
                        </div>
                        
                        {match.contourShade && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Face sides:</span>
                            <span className="text-red-600 font-semibold">
                              {match.contourShade.name}
                            </span>
                            <div 
                              className="w-4 h-4 rounded-full border"
                              style={{ backgroundColor: getShadeColor(match.contourShade.name, match.undertone) }}
                            />
                            {match.contourShade.mixable && (
                              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                Mixable
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-800">${match.price}</p>
                      <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                        {match.matchPercentage}% Match
                      </Badge>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                      {match.undertone} undertone
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                      {match.coverage} coverage
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-teal-50 text-teal-700 border-teal-200">
                      {match.finish} finish
                    </Badge>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex">
                      {renderStars(match.rating)}
                    </div>
                    <span className="text-sm text-gray-600">
                      {parseFloat(match.rating.toString()).toFixed(1)} ({match.reviewCount.toLocaleString()} reviews)
                    </span>
                  </div>

                  {/* Availability */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {match.availability.online && (
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        Available Online
                      </Badge>
                    )}
                    {match.availability.inStore && (
                      <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                        In Store
                      </Badge>
                    )}
                    {match.availability.readyForPickup && (
                      <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                        Ready for Pickup
                      </Badge>
                    )}
                  </div>

                  {/* Store Locations */}
                  {match.availability.nearbyStores && match.availability.nearbyStores.length > 0 && (
                    <div className="flex items-center gap-1 text-sm text-gray-600 mb-4">
                      <MapPin className="w-4 h-4" />
                      <span>Available at: {match.availability.nearbyStores.join(', ')}</span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Button 
                      className="bg-gradient-to-r from-pink-500 to-purple-600 text-white"
                      onClick={() => onTryVirtual?.(match)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Virtual Try-On
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => onViewDetails?.(match)}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </div>

              {/* Feedback Section */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <EnhancedFoundationFeedback 
                  foundation={match}
                  onFeedback={onFeedback}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default FoundationResults;