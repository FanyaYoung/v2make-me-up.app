import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, ShoppingCart, Eye, Palette, Blend } from 'lucide-react';
import { FoundationMatch } from '../types/foundation';

interface FoundationPairResultsProps {
  pairs: FoundationMatch[][];
  onTryVirtual: (match: FoundationMatch) => void;
}

const FoundationPairResults = ({ pairs, onTryVirtual }: FoundationPairResultsProps) => {
  const handlePurchase = (match: FoundationMatch) => {
    // Implementation for purchase logic
    console.log('Purchase:', match);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Your Perfect Foundation Pairs</h2>
        <p className="text-muted-foreground">
          Each pair includes a main shade for your face center and a contour shade for depth and dimension
        </p>
      </div>

      <div className="grid gap-6">
        {pairs.map((pair, pairIndex) => {
          const [primaryMatch, contourMatch] = pair;
          return (
            <Card key={pairIndex} className="overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-rose-500 to-purple-500 flex items-center justify-center text-white font-bold">
                      {pairIndex + 1}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{primaryMatch.brand}</CardTitle>
                      <p className="text-sm text-muted-foreground">{primaryMatch.product}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Blend className="w-3 h-3" />
                    Perfect Pair
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Primary Shade Card */}
                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">Main Shade</Badge>
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span>{primaryMatch.rating.toFixed(1)}</span>
                        <span className="text-muted-foreground">({primaryMatch.reviewCount})</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-semibold">{primaryMatch.shade}</h4>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-8 h-8 rounded-full border-2 border-gray-200"
                          style={{ backgroundColor: generateColorFromShade(primaryMatch.shade) }}
                        />
                        <div className="text-sm">
                          <p className="font-medium">{primaryMatch.undertone} undertone</p>
                          <p className="text-muted-foreground">{primaryMatch.coverage} coverage</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-lg">${primaryMatch.price.toFixed(2)}</span>
                      <Badge 
                        variant={primaryMatch.matchPercentage >= 90 ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {primaryMatch.matchPercentage.toFixed(0)}% match
                      </Badge>
                    </div>
                  </div>

                  {/* Contour Shade Card */}
                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">Contour Shade</Badge>
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span>{contourMatch.rating.toFixed(1)}</span>
                        <span className="text-muted-foreground">({contourMatch.reviewCount})</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-semibold">{contourMatch.shade}</h4>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-8 h-8 rounded-full border-2 border-gray-200"
                          style={{ backgroundColor: generateColorFromShade(contourMatch.shade) }}
                        />
                        <div className="text-sm">
                          <p className="font-medium">{contourMatch.undertone} undertone</p>
                          <p className="text-muted-foreground">Blends seamlessly</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-lg">${contourMatch.price.toFixed(2)}</span>
                      <Badge 
                        variant={contourMatch.matchPercentage >= 85 ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {contourMatch.matchPercentage.toFixed(0)}% match
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button 
                    onClick={() => onTryVirtual(primaryMatch)}
                    variant="outline" 
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Try Primary Shade
                  </Button>
                  <Button 
                    onClick={() => onTryVirtual(contourMatch)}
                    variant="outline" 
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Palette className="w-4 h-4" />
                    Try Contour Shade
                  </Button>
                  <Button 
                    onClick={() => handlePurchase(primaryMatch)}
                    size="sm"
                    className="flex items-center gap-2 ml-auto"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Buy Pair - ${(primaryMatch.price + contourMatch.price).toFixed(2)}
                  </Button>
                </div>

                {/* Availability Info */}
                {primaryMatch.availability.nearbyStores.length > 0 && (
                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    Available at: {primaryMatch.availability.nearbyStores.join(', ')}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

// Helper function to generate colors from shade names
const generateColorFromShade = (shadeName: string): string => {
  const nameLower = shadeName.toLowerCase();
  if (nameLower.includes('porcelain') || nameLower.includes('fair')) return '#F5DCC4';
  if (nameLower.includes('light')) return '#F0D0A6';
  if (nameLower.includes('medium light')) return '#E8C2A0';
  if (nameLower.includes('medium')) return '#D4A574';
  if (nameLower.includes('deep') || nameLower.includes('dark')) return '#A0835C';
  if (nameLower.includes('very deep')) return '#8B6F56';
  return '#D4A574'; // Default medium
};

export default FoundationPairResults;