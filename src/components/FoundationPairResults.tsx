
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Eye, ShoppingCart, Star, CheckCircle } from 'lucide-react';
import { FoundationMatch } from '../types/foundation';

interface FoundationPairResultsProps {
  pairs: FoundationMatch[][];
  onTryVirtual: (match: FoundationMatch) => void;
  onPurchase: (fulfillmentMethod: string, products: FoundationMatch[]) => void;
}

interface CartItem {
  id: string;
  match: FoundationMatch;
  selected: boolean;
}

const FoundationPairResults: React.FC<FoundationPairResultsProps> = ({
  pairs,
  onTryVirtual,
  onPurchase
}) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Initialize cart with all items selected by default
  useEffect(() => {
    const initialCart: CartItem[] = [];
    pairs.forEach((pair) => {
      pair.forEach((match) => {
        initialCart.push({
          id: match.id,
          match,
          selected: true
        });
      });
    });
    setCartItems(initialCart);
  }, [pairs]);

  const handleCheckboxChange = (itemId: string, checked: boolean) => {
    setCartItems(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, selected: checked } : item
      )
    );
  };

  const selectedItems = cartItems.filter(item => item.selected);
  const cartTotal = selectedItems.reduce((sum, item) => sum + (item.match.price || 0), 0);

  const handlePurchase = () => {
    const selectedMatches = selectedItems.map(item => item.match);
    onPurchase('shipping', selectedMatches);
  };

  const generateShadeColor = (shade: string, undertone: string) => {
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
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Perfect Foundation Pairs</CardTitle>
          <p className="text-center text-muted-foreground">
            Complete foundation and contour combinations for flawless coverage
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {pairs.map((pair, pairIndex) => (
              <div key={pairIndex} className="border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 text-center">
                  {pair[0]?.brand} Complete Set
                </h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  {pair.map((match, matchIndex) => {
                    const cartItem = cartItems.find(item => item.id === match.id);
                    const isSelected = cartItem?.selected || false;
                    
                    return (
                      <div 
                        key={match.id} 
                        className={`border rounded-lg p-4 transition-all ${
                          isSelected ? 'border-primary bg-primary/5' : 'border-border'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            id={match.id}
                            checked={isSelected}
                            onCheckedChange={(checked) => 
                              handleCheckboxChange(match.id, checked as boolean)
                            }
                            className="mt-1"
                          />
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <div
                                className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                                style={{ backgroundColor: generateShadeColor(match.shade, match.undertone) }}
                              />
                              <span className="font-medium">{match.shade}</span>
                              <Badge variant={match.primaryShade ? 'default' : 'secondary'}>
                                {match.primaryShade ? 'Foundation' : 'Contour'}
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-muted-foreground mb-2">{match.product}</p>
                            
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                <span className="text-sm">{match.rating.toFixed(1)}</span>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                ({match.reviewCount} reviews)
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <span className="font-semibold">${match.price?.toFixed(2)}</span>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => onTryVirtual(match)}
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                Try
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cart Summary */}
      {cartItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Cart Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {selectedItems.length > 0 ? (
                <>
                  <div className="space-y-2">
                    {selectedItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>{item.match.brand} - {item.match.shade}</span>
                        </div>
                        <span>${item.match.price?.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between font-semibold text-lg">
                    <span>Total ({selectedItems.length} items):</span>
                    <span>${cartTotal.toFixed(2)}</span>
                  </div>
                  
                  <Button 
                    onClick={handlePurchase}
                    className="w-full"
                    size="lg"
                    disabled={selectedItems.length === 0}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Purchase Selected Items - ${cartTotal.toFixed(2)}
                  </Button>
                </>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No items selected</p>
                  <p className="text-sm">Check the boxes above to add items to your cart</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FoundationPairResults;
