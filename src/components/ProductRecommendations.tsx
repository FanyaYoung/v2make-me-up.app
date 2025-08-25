import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { FoundationMatch } from '../types/foundation';

interface ProductRecommendationsProps {
  matches: FoundationMatch[];
  onSelectMatch: (match: FoundationMatch) => void;
  currentFoundation: {brand: string, shade: string} | null;
}

const ProductRecommendations = ({ matches, onSelectMatch, currentFoundation }: ProductRecommendationsProps) => {
  // Function to generate a shade color swatch
  const generateShadeColor = (match: FoundationMatch) => {
    // Use actual hex color if available from database
    if (match.hexColor) {
      return match.hexColor;
    }
    
    // Fallback to generating based on shade and undertone
    const { shade, undertone } = match;
    
    // Base colors for different undertones
    const undertoneColors = {
      warm: { r: 210, g: 180, b: 140 },
      cool: { r: 240, g: 220, b: 200 },
      neutral: { r: 220, g: 190, b: 160 },
      yellow: { r: 200, g: 170, b: 120 },
      pink: { r: 230, g: 200, b: 180 },
      red: { r: 190, g: 150, b: 120 },
      olive: { r: 180, g: 160, b: 120 }
    };

    const baseColor = undertoneColors[undertone.toLowerCase() as keyof typeof undertoneColors] || undertoneColors.neutral;
    
    // Adjust darkness based on shade name
    const shadeLower = shade.toLowerCase();
    let multiplier = 1;
    
    if (shadeLower.includes('fair') || shadeLower.includes('light')) {
      multiplier = 1.1;
    } else if (shadeLower.includes('medium') || shadeLower.includes('med')) {
      multiplier = 0.85;
    } else if (shadeLower.includes('deep') || shadeLower.includes('dark') || shadeLower.includes('tan')) {
      multiplier = 0.6;
    } else if (shadeLower.includes('rich') || shadeLower.includes('espresso')) {
      multiplier = 0.4;
    }

    const adjustedColor = {
      r: Math.round(baseColor.r * multiplier),
      g: Math.round(baseColor.g * multiplier),
      b: Math.round(baseColor.b * multiplier)
    };

    return `rgb(${adjustedColor.r}, ${adjustedColor.g}, ${adjustedColor.b})`;
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Perfect Matches Found</h2>
        <p className="text-gray-600">
          Based on your {currentFoundation?.brand} {currentFoundation?.shade}, here are similar shades:
        </p>
      </div>
      
      <div className="grid gap-6">
        {matches.map((match, index) => (
          <Card key={match.id} className="bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 border-0 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-shrink-0">
                  <div className="w-32 h-32 rounded-lg shadow-md overflow-hidden bg-gray-100 relative">
                    {match.imageUrl && match.imageUrl !== '/placeholder.svg' ? (
                      <div className="w-full h-full flex flex-col">
                        {/* Product image */}
                        <div className="flex-1 relative">
                          <img 
                            src={match.imageUrl} 
                            alt={`${match.brand} ${match.product}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback to color swatch if image fails to load
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const fallback = target.nextElementSibling as HTMLDivElement;
                              if (fallback) fallback.style.display = 'block';
                            }}
                          />
                          {/* Fallback color swatch */}
                          <div 
                            className="absolute inset-0 hidden"
                            style={{ backgroundColor: generateShadeColor(match) }}
                            title={`${match.shade} shade`}
                          />
                        </div>
                        {/* Shade color indicator bar */}
                        <div 
                          className="h-4 border-t border-gray-200"
                          style={{ backgroundColor: generateShadeColor(match) }}
                          title={`${match.shade} color`}
                        />
                      </div>
                    ) : (
                      <div className="w-full h-full flex flex-col">
                        {/* Foundation shade color when no image */}
                        <div 
                          className="flex-1 border-b border-gray-200"
                          style={{ backgroundColor: generateShadeColor(match) }}
                          title={`${match.shade} shade`}
                        />
                        {/* Brand/product info overlay */}
                        <div className="h-8 bg-white/90 flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-700 truncate px-2">
                            {match.brand}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex-grow space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800">{match.brand}</h3>
                      <p className="text-gray-600 font-medium">{match.product}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-rose-600 font-semibold">{match.shade}</p>
                        <div 
                          className="w-4 h-4 rounded-full border border-gray-300"
                          style={{ backgroundColor: generateShadeColor(match) }}
                          title={`${match.shade} color preview`}
                        />
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-800">${match.price}</div>
                      <Badge variant="secondary" className="bg-gradient-to-r from-green-100 to-green-200 text-green-800">
                        {match.matchPercentage}% Match
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="border-rose-200 text-rose-700">
                      {match.undertone} undertone
                    </Badge>
                    <Badge variant="outline" className="border-purple-200 text-purple-700">
                      {match.coverage} coverage
                    </Badge>
                    <Badge variant="outline" className="border-blue-200 text-blue-700">
                      {match.finish} finish
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={`text-xs ${i < Math.floor(match.rating) ? 'text-yellow-400' : 'text-gray-300'}`}>
                            ★
                          </span>
                        ))}
                      </div>
                      <span>{match.rating.toFixed(1)} ({match.reviewCount} reviews)</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2 text-sm">
                      {match.availability.online && (
                        <Badge className="bg-green-100 text-green-800">Available Online</Badge>
                      )}
                      {match.availability.inStore && (
                        <Badge className="bg-blue-100 text-blue-800">In Store</Badge>
                      )}
                      {match.availability.readyForPickup && (
                        <Badge className="bg-purple-100 text-purple-800">Ready for Pickup</Badge>
                      )}
                    </div>
                    
                    {match.availability.nearbyStores.length > 0 && (
                      <p className="text-sm text-gray-600">
                        Available at: {match.availability.nearbyStores.join(', ')}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex gap-3 pt-2">
                    <Button 
                      onClick={() => onSelectMatch(match)}
                      className="bg-gradient-to-r from-rose-500 to-purple-500 hover:from-rose-600 hover:to-purple-600 text-white"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Virtual Try-On
                    </Button>
                    <Button variant="outline" className="border-rose-200 text-rose-700 hover:bg-rose-50">
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ProductRecommendations;
