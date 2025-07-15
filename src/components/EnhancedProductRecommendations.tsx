import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Eye, MapPin, Clock, ShoppingCart, ExternalLink } from 'lucide-react';
import { FoundationMatch } from '../types/foundation';

interface EnhancedProductRecommendationsProps {
  recommendations: {
    shade: FoundationMatch;
    confidence: number;
    targetTone: 'dominant' | 'secondary';
  }[];
  onVirtualTryOn?: (shade: FoundationMatch) => void;
}

const EnhancedProductRecommendations = ({ 
  recommendations, 
  onVirtualTryOn 
}: EnhancedProductRecommendationsProps) => {
  if (recommendations.length === 0) return null;

  const getShadeColor = (shade: FoundationMatch) => {
    const undertoneMap = {
      warm: '#D4A574',
      cool: '#F0D7C3',
      neutral: '#DCB99B',
      olive: '#B49B73'
    };
    return undertoneMap[shade.undertone as keyof typeof undertoneMap] || '#DCB99B';
  };

  const renderStars = (rating: number, reviewCount: number) => {
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-3 h-3 ${
              i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-xs text-gray-600 ml-1">
          {rating.toFixed(1)} ({reviewCount?.toLocaleString() || '0'} reviews)
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold text-gray-800">Perfect Matches Found</h3>
        <p className="text-gray-600">Based on your skin analysis, here are similar shades:</p>
      </div>

      <div className="space-y-6">
        {recommendations.map((rec, index) => {
          const { shade } = rec;
          return (
            <Card key={shade.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex gap-6">
                  {/* Product Image */}
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <div 
                        className="w-24 h-24 rounded-lg border-2 border-gray-200"
                        style={{ backgroundColor: getShadeColor(shade) }}
                      >
                        {shade.imageUrl && shade.imageUrl !== '/placeholder.svg' ? (
                          <img 
                            src={shade.imageUrl} 
                            alt={`${shade.brand} ${shade.product}`}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-xs text-gray-500 text-center px-2">
                              {shade.brand}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                        <span className="text-xs text-gray-600 bg-white px-2 py-1 rounded shadow">
                          {shade.brand}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-800">{shade.brand}</h4>
                        <p className="text-gray-600">{shade.product}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-semibold text-red-600">
                            {shade.shade}
                          </span>
                          <div 
                            className="w-4 h-4 rounded-full border border-gray-300"
                            style={{ backgroundColor: getShadeColor(shade) }}
                          />
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-800">${shade.price}</p>
                        <Badge 
                          variant="secondary" 
                          className="bg-green-100 text-green-800 hover:bg-green-100"
                        >
                          {shade.matchPercentage}% Match
                        </Badge>
                      </div>
                    </div>

                    {/* Product Tags */}
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-rose-600 border-rose-200">
                        {shade.undertone} undertone
                      </Badge>
                      <Badge variant="outline" className="text-purple-600 border-purple-200">
                        {shade.coverage} coverage
                      </Badge>
                      <Badge variant="outline" className="text-blue-600 border-blue-200">
                        {shade.finish} finish
                      </Badge>
                    </div>

                    {/* Rating */}
                    {renderStars(shade.rating, shade.reviewCount || 0)}

                    {/* Availability */}
                    <div className="flex flex-wrap gap-2">
                      {shade.availability?.online && (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                          <ShoppingCart className="w-3 h-3 mr-1" />
                          Available Online
                        </Badge>
                      )}
                      {shade.availability?.inStore && (
                        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                          <MapPin className="w-3 h-3 mr-1" />
                          In Store
                        </Badge>
                      )}
                      {shade.availability?.readyForPickup && (
                        <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
                          <Clock className="w-3 h-3 mr-1" />
                          Ready for Pickup
                        </Badge>
                      )}
                    </div>

                    {/* Store Locations */}
                    {shade.availability?.nearbyStores && shade.availability.nearbyStores.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-600">
                          Available at: {shade.availability.nearbyStores.join(', ')}
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                      <Button 
                        onClick={() => onVirtualTryOn?.(shade)}
                        className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white flex-1"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Virtual Try-On
                      </Button>
                      <Button 
                        variant="outline" 
                        className="border-gray-300 text-gray-700 hover:bg-gray-50 flex-1"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default EnhancedProductRecommendations;