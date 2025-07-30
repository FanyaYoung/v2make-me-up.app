import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, ShoppingCart, Palette, Plus } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { toast } from '@/hooks/use-toast';
import { FoundationMatch } from '../types/foundation';

interface ConcealerRecommendationsProps {
  foundationMatch: FoundationMatch;
  concealerMatches: FoundationMatch[];
  onAddToCart?: (foundation: FoundationMatch, concealer: FoundationMatch) => void;
}

const ConcealerRecommendations = ({ 
  foundationMatch, 
  concealerMatches, 
  onAddToCart 
}: ConcealerRecommendationsProps) => {
  const { addToCart } = useCart();

  const handleAddFoundation = () => {
    addToCart(foundationMatch, 'primary');
    toast({
      title: "Added to Cart",
      description: `${foundationMatch.brand} foundation has been added to your cart.`,
    });
  };

  const handleAddConcealer = (concealer: FoundationMatch) => {
    addToCart(concealer, 'contour');
    toast({
      title: "Added to Cart",
      description: `${concealer.brand} concealer has been added to your cart.`,
    });
  };

  const handleAddBoth = (concealer: FoundationMatch) => {
    addToCart(foundationMatch, 'primary');
    addToCart(concealer, 'contour');
    onAddToCart?.(foundationMatch, concealer);
    toast({
      title: "Complete Set Added",
      description: `Foundation and concealer have been added to your cart.`,
    });
  };

  const generateColorFromShade = (shadeName: string): string => {
    const nameLower = shadeName.toLowerCase();
    if (nameLower.includes('porcelain') || nameLower.includes('fair')) return '#F5DCC4';
    if (nameLower.includes('light')) return '#F0D0A6';
    if (nameLower.includes('medium light')) return '#E8C2A0';
    if (nameLower.includes('medium')) return '#D4A574';
    if (nameLower.includes('deep') || nameLower.includes('dark')) return '#A0835C';
    if (nameLower.includes('very deep')) return '#8B6F56';
    return '#D4A574';
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Foundation + Concealer Recommendation</h2>
        <p className="text-muted-foreground">
          Perfect primary foundation with matching concealer for seamless blending and contouring
        </p>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Your Perfect Match Set</CardTitle>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Palette className="w-3 h-3" />
              Complete Look
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Foundation Section */}
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-xs bg-rose-50 text-rose-700">Primary Foundation</Badge>
              <div className="flex items-center gap-1 text-sm">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span>{foundationMatch.rating.toFixed(1)}</span>
                <span className="text-muted-foreground">({foundationMatch.reviewCount})</span>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                {foundationMatch.imageUrl && foundationMatch.imageUrl !== '/placeholder.svg' ? (
                  <img 
                    src={foundationMatch.imageUrl} 
                    alt={foundationMatch.product}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                    <Palette className="h-6 w-6 text-gray-400" />
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{foundationMatch.brand}</h3>
                <p className="text-gray-600">{foundationMatch.product}</p>
                <p className="text-sm font-medium text-rose-600">{foundationMatch.shade}</p>
                
                <div className="flex items-center gap-2 mt-2">
                  <div 
                    className="w-6 h-6 rounded-full border-2 border-gray-200"
                    style={{ backgroundColor: generateColorFromShade(foundationMatch.shade) }}
                  />
                  <div className="text-sm">
                    <span className="font-medium">{foundationMatch.undertone} undertone</span>
                    <span className="text-muted-foreground ml-2">• {foundationMatch.coverage} coverage</span>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-xl font-bold">${foundationMatch.price.toFixed(2)}</div>
                <Badge variant="default" className="text-xs mt-1">
                  {foundationMatch.matchPercentage.toFixed(0)}% match
                </Badge>
              </div>
            </div>
            
            <Button 
              onClick={handleAddFoundation}
              variant="outline"
              size="sm"
              className="w-full border-rose-300 text-rose-600 hover:bg-rose-50"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Foundation Only
            </Button>
          </div>

          {/* Concealer Options */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Matching Concealer Options</h3>
            
            {concealerMatches.map((concealer) => (
              <div key={concealer.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700">Concealer for Contouring</Badge>
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span>{concealer.rating.toFixed(1)}</span>
                    <span className="text-muted-foreground">({concealer.reviewCount})</span>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                    {concealer.imageUrl && concealer.imageUrl !== '/placeholder.svg' ? (
                      <img 
                        src={concealer.imageUrl} 
                        alt={concealer.product}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                        <Palette className="h-4 w-4 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-semibold">{concealer.brand}</h4>
                    <p className="text-sm text-gray-600">{concealer.product}</p>
                    <p className="text-sm font-medium text-amber-600">{concealer.shade}</p>
                    
                    <div className="flex items-center gap-2 mt-1">
                      <div 
                        className="w-5 h-5 rounded-full border border-gray-200"
                        style={{ backgroundColor: generateColorFromShade(concealer.shade) }}
                      />
                      <span className="text-xs text-muted-foreground">{concealer.undertone} undertone</span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-lg font-semibold">${concealer.price.toFixed(2)}</div>
                    <Badge variant="secondary" className="text-xs">
                      {concealer.matchPercentage.toFixed(0)}% match
                    </Badge>
                  </div>
                </div>
                
                <div className="flex gap-2 pt-2">
                  <Button 
                    onClick={() => handleAddConcealer(concealer)}
                    variant="outline"
                    size="sm"
                    className="flex-1 border-amber-300 text-amber-600 hover:bg-amber-50"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Concealer Only
                  </Button>
                  
                  <Button 
                    onClick={() => handleAddBoth(concealer)}
                    size="sm"
                    className="flex-1 bg-gradient-to-r from-rose-500 to-purple-500 text-white"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Add Both - ${(foundationMatch.price + concealer.price).toFixed(2)}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Total Price Comparison */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">💰 Smart Shopping</h4>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-green-800">Foundation + Concealer:</span>
                <span className="font-semibold text-green-900">
                  ${(foundationMatch.price + (concealerMatches[0]?.price || 0)).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-green-700">
                <span>vs. Two Full Foundations:</span>
                <span className="line-through">~${(foundationMatch.price * 2).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-green-900 font-semibold pt-1 border-t border-green-200">
                <span>You Save:</span>
                <span>~${(foundationMatch.price - (concealerMatches[0]?.price || 0)).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConcealerRecommendations;