import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Plus, Minus, Star } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProductPurchaseProps {
  product: {
    id: string;
    name: string;
    brand: string;
    shade?: string;
    price: number;
    image_url?: string;
    rating?: number;
    affiliate_url?: string;
  };
}

const ProductPurchase: React.FC<ProductPurchaseProps> = ({ product }) => {
  const [quantity, setQuantity] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handlePurchase = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to purchase products",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Create one-off payment for product purchase
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          items: [{
            product_id: product.id,
            product_name: product.name,
            brand: product.brand,
            shade: product.shade,
            price: product.price,
            quantity: quantity,
            image_url: product.image_url
          }],
          mode: 'payment', // One-off payment
          affiliate_url: product.affiliate_url
        }
      });

      if (error) {
        throw error;
      }

      // Open Stripe checkout in new tab
      if (data.url) {
        window.open(data.url, '_blank');
      }

    } catch (error) {
      console.error('Purchase error:', error);
      toast({
        title: "Purchase Failed",
        description: "Unable to process purchase. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const adjustQuantity = (delta: number) => {
    setQuantity(Math.max(1, quantity + delta));
  };

  const totalPrice = product.price * quantity;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5" />
          Purchase Product
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Product Image */}
        <div className="aspect-square w-full max-w-32 mx-auto overflow-hidden rounded-lg bg-gray-100">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={`${product.brand} ${product.name}`}
              className="w-full h-full object-cover transition-transform hover:scale-105"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallback = target.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
          ) : null}
          
          {/* Fallback placeholder */}
          <div 
            className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 ${
              product.image_url ? 'hidden' : 'flex'
            }`}
          >
            <div className="text-center text-gray-500">
              <ShoppingCart className="w-8 h-8 mx-auto mb-2" />
              <div className="text-xs font-medium">{product.brand}</div>
              <div className="text-xs">{product.name}</div>
            </div>
          </div>
        </div>

        {/* Product Info */}
        <div className="text-center space-y-2">
          <h3 className="font-semibold">{product.brand}</h3>
          <p className="text-sm text-muted-foreground">{product.name}</p>
          {product.shade && (
            <Badge variant="outline">Shade: {product.shade}</Badge>
          )}
          {product.rating && (
            <div className="flex items-center justify-center gap-1">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="text-sm">{product.rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Quantity Selector */}
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity</Label>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => adjustQuantity(-1)}
              disabled={quantity <= 1}
            >
              <Minus className="w-4 h-4" />
            </Button>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="text-center w-20"
              min="1"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => adjustQuantity(1)}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Price */}
        <div className="border-t pt-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Unit Price:</span>
            <span>${product.price.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center font-semibold">
            <span>Total:</span>
            <span>${totalPrice.toFixed(2)}</span>
          </div>
        </div>

        {/* Purchase Button */}
        <Button
          onClick={handlePurchase}
          disabled={isProcessing}
          className="w-full"
          size="lg"
        >
          {isProcessing ? 'Processing...' : `Purchase for $${totalPrice.toFixed(2)}`}
        </Button>

        {/* Affiliate Disclosure */}
        {product.affiliate_url && (
          <p className="text-xs text-muted-foreground text-center">
            This purchase supports our platform through affiliate partnerships
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductPurchase;