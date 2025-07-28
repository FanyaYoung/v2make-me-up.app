import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingCart, Package, Zap, Star } from 'lucide-react';
import { FoundationMatch } from '@/types/foundation';
import FulfillmentOptions from './FulfillmentOptions';

interface FlexiblePurchaseOptionsProps {
  recommendations: FoundationMatch[];
  onPurchase: (fulfillmentMethod: string, products: any[]) => void;
}

interface SelectedProduct {
  id: string;
  type: 'foundation' | 'contour';
  brand: string;
  product: string;
  shade: string;
  price: number;
  image?: string;
  availability?: string;
  matchPercentage?: number;
  originalPairId?: string;
}

const FlexiblePurchaseOptions: React.FC<FlexiblePurchaseOptionsProps> = ({ 
  recommendations, 
  onPurchase 
}) => {
  const [purchaseMode, setPurchaseMode] = useState<'pairs' | 'individual' | 'custom'>('pairs');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [showFulfillment, setShowFulfillment] = useState(false);

  // Convert recommendations to individual products
  const individualProducts = useMemo(() => {
    const products: SelectedProduct[] = [];
    
    recommendations.forEach((rec, index) => {
      // Primary foundation
      products.push({
        id: `foundation-${index}`,
        type: 'foundation',
        brand: rec.brand,
        product: rec.product,
        shade: rec.shade,
        price: rec.price || 0,
        image: rec.imageUrl,
        availability: rec.availability.online ? 'Available Online' : 'In Store Only',
        matchPercentage: rec.matchPercentage,
        originalPairId: `pair-${index}`
      });

      // Contour shade if available - create a synthetic product based on contour shade info
      if (rec.contourShade) {
        products.push({
          id: `contour-${index}`,
          type: 'contour',
          brand: rec.brand, // Use same brand as main product
          product: `${rec.product} - Contour`,
          shade: rec.contourShade.name,
          price: Math.round((rec.price || 0) * 0.8), // Estimated contour price
          image: rec.imageUrl,
          availability: rec.availability.online ? 'Available Online' : 'In Store Only',
          matchPercentage: rec.matchPercentage - 5, // Slightly lower match for contour
          originalPairId: `pair-${index}`
        });
      }
    });

    return products;
  }, [recommendations]);

  // Group products by pairs
  const productPairs = useMemo(() => {
    const pairs: { [key: string]: SelectedProduct[] } = {};
    
    individualProducts.forEach(product => {
      if (product.originalPairId) {
        if (!pairs[product.originalPairId]) {
          pairs[product.originalPairId] = [];
        }
        pairs[product.originalPairId].push(product);
      }
    });

    return pairs;
  }, [individualProducts]);

  const handleProductToggle = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handlePairToggle = (pairId: string) => {
    const pairProducts = productPairs[pairId] || [];
    const pairProductIds = pairProducts.map(p => p.id);
    const allSelected = pairProductIds.every(id => selectedProducts.includes(id));

    if (allSelected) {
      setSelectedProducts(prev => prev.filter(id => !pairProductIds.includes(id)));
    } else {
      setSelectedProducts(prev => [...new Set([...prev, ...pairProductIds])]);
    }
  };

  const getSelectedProductDetails = () => {
    return individualProducts.filter(product => selectedProducts.includes(product.id));
  };

  const getTotalPrice = () => {
    return getSelectedProductDetails().reduce((sum, product) => sum + product.price, 0);
  };

  const handleProceedToFulfillment = () => {
    if (selectedProducts.length > 0) {
      setShowFulfillment(true);
    }
  };

  const handleFulfillmentPurchase = (fulfillmentMethod: string, products: any[]) => {
    onPurchase(fulfillmentMethod, getSelectedProductDetails());
  };

  if (showFulfillment) {
    return (
      <div className="space-y-6">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Selected Products</h3>
            <Button 
              variant="ghost" 
              onClick={() => setShowFulfillment(false)}
            >
              ← Back to Selection
            </Button>
          </div>
          
          <div className="space-y-3">
            {getSelectedProductDetails().map((product) => (
              <div key={product.id} className="flex items-center justify-between p-3 bg-accent/20 rounded-lg">
                <div className="flex items-center gap-3">
                  {product.image && (
                    <img 
                      src={product.image} 
                      alt={product.shade}
                      className="w-12 h-12 rounded object-cover"
                    />
                  )}
                  <div>
                    <p className="font-medium">{product.brand} {product.product}</p>
                    <p className="text-sm text-muted-foreground">{product.shade}</p>
                    <Badge variant={product.type === 'foundation' ? 'default' : 'secondary'}>
                      {product.type}
                    </Badge>
                  </div>
                </div>
                <span className="font-medium">${product.price.toFixed(2)}</span>
              </div>
            ))}
            
            <Separator />
            
            <div className="flex justify-between items-center font-semibold">
              <span>Total: ${getTotalPrice().toFixed(2)}</span>
              <span>{getSelectedProductDetails().length} item(s)</span>
            </div>
          </div>
        </Card>

        <FulfillmentOptions 
          products={getSelectedProductDetails()}
          onPurchase={handleFulfillmentPurchase}
        />
      </div>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Purchase Options</h3>
          <p className="text-sm text-muted-foreground">
            Choose how you'd like to purchase your foundation matches
          </p>
        </div>

        <Tabs value={purchaseMode} onValueChange={(value) => setPurchaseMode(value as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pairs" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Complete Pairs
            </TabsTrigger>
            <TabsTrigger value="individual" className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Individual Items
            </TabsTrigger>
            <TabsTrigger value="custom" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Mix & Match
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pairs" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Purchase complete foundation pairs for the best color coordination
            </p>
            
            {Object.entries(productPairs).map(([pairId, products]) => {
              const foundationProduct = products.find(p => p.type === 'foundation');
              const contourProduct = products.find(p => p.type === 'contour');
              const pairProductIds = products.map(p => p.id);
              const isSelected = pairProductIds.every(id => selectedProducts.includes(id));
              const pairPrice = products.reduce((sum, p) => sum + p.price, 0);

              return (
                <div key={pairId} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Checkbox 
                        checked={isSelected}
                        onCheckedChange={() => handlePairToggle(pairId)}
                      />
                      <div>
                        <h4 className="font-medium">Foundation Pair</h4>
                        {foundationProduct?.matchPercentage && (
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs text-muted-foreground">
                              {foundationProduct.matchPercentage}% match
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${pairPrice.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">Complete pair</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {foundationProduct && (
                      <div className="flex items-center gap-3 p-3 bg-accent/10 rounded">
                        {foundationProduct.image && (
                          <img 
                            src={foundationProduct.image} 
                            alt={foundationProduct.shade}
                            className="w-10 h-10 rounded object-cover"
                          />
                        )}
                        <div>
                          <p className="text-sm font-medium">{foundationProduct.brand}</p>
                          <p className="text-xs text-muted-foreground">{foundationProduct.shade}</p>
                          <Badge variant="default" className="text-xs">Foundation</Badge>
                        </div>
                      </div>
                    )}

                    {contourProduct && (
                      <div className="flex items-center gap-3 p-3 bg-accent/10 rounded">
                        {contourProduct.image && (
                          <img 
                            src={contourProduct.image} 
                            alt={contourProduct.shade}
                            className="w-10 h-10 rounded object-cover"
                          />
                        )}
                        <div>
                          <p className="text-sm font-medium">{contourProduct.brand}</p>
                          <p className="text-xs text-muted-foreground">{contourProduct.shade}</p>
                          <Badge variant="secondary" className="text-xs">Contour</Badge>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </TabsContent>

          <TabsContent value="individual" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select individual foundation or contour shades
            </p>

            <div className="grid gap-3">
              {individualProducts.map((product) => {
                const isSelected = selectedProducts.includes(product.id);

                return (
                  <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Checkbox 
                        checked={isSelected}
                        onCheckedChange={() => handleProductToggle(product.id)}
                      />
                      
                      {product.image && (
                        <img 
                          src={product.image} 
                          alt={product.shade}
                          className="w-12 h-12 rounded object-cover"
                        />
                      )}

                      <div>
                        <p className="font-medium">{product.brand} {product.product}</p>
                        <p className="text-sm text-muted-foreground">{product.shade}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={product.type === 'foundation' ? 'default' : 'secondary'}>
                            {product.type}
                          </Badge>
                          {product.matchPercentage && (
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-xs text-muted-foreground">
                                {product.matchPercentage}% match
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-medium">${product.price.toFixed(2)}</p>
                      {product.availability && (
                        <p className="text-xs text-muted-foreground">{product.availability}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="custom" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Create your perfect combination by mixing products from different recommendations
            </p>

            <div className="grid gap-4">
              <div>
                <h4 className="font-medium mb-3">Foundation Options</h4>
                <div className="grid gap-2">
                  {individualProducts.filter(p => p.type === 'foundation').map((product) => {
                    const isSelected = selectedProducts.includes(product.id);

                    return (
                      <div key={product.id} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center gap-3">
                          <Checkbox 
                            checked={isSelected}
                            onCheckedChange={() => handleProductToggle(product.id)}
                          />
                          
                          {product.image && (
                            <img 
                              src={product.image} 
                              alt={product.shade}
                              className="w-10 h-10 rounded object-cover"
                            />
                          )}

                          <div>
                            <p className="text-sm font-medium">{product.brand}</p>
                            <p className="text-xs text-muted-foreground">{product.shade}</p>
                            {product.matchPercentage && (
                              <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                <span className="text-xs text-muted-foreground">
                                  {product.matchPercentage}% match
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <span className="text-sm font-medium">${product.price.toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-3">Contour Options</h4>
                <div className="grid gap-2">
                  {individualProducts.filter(p => p.type === 'contour').map((product) => {
                    const isSelected = selectedProducts.includes(product.id);

                    return (
                      <div key={product.id} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center gap-3">
                          <Checkbox 
                            checked={isSelected}
                            onCheckedChange={() => handleProductToggle(product.id)}
                          />
                          
                          {product.image && (
                            <img 
                              src={product.image} 
                              alt={product.shade}
                              className="w-10 h-10 rounded object-cover"
                            />
                          )}

                          <div>
                            <p className="text-sm font-medium">{product.brand}</p>
                            <p className="text-xs text-muted-foreground">{product.shade}</p>
                            {product.matchPercentage && (
                              <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                <span className="text-xs text-muted-foreground">
                                  {product.matchPercentage}% match
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <span className="text-sm font-medium">${product.price.toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Selection Summary */}
        {selectedProducts.length > 0 && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-medium">
                  {selectedProducts.length} item{selectedProducts.length !== 1 ? 's' : ''} selected
                </p>
                <p className="text-sm text-muted-foreground">
                  Total: ${getTotalPrice().toFixed(2)}
                </p>
              </div>
              
              <Button onClick={handleProceedToFulfillment} size="lg">
                Continue to Checkout
              </Button>
            </div>
          </div>
        )}

        {selectedProducts.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Select products to continue with your purchase</p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default FlexiblePurchaseOptions;