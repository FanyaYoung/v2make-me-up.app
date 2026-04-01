import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft, ExternalLink } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import FulfillmentOptions from '@/components/FulfillmentOptions';
import { createPigmentColor } from '@/lib/pigmentMixing';
import { openExternalUrl } from '@/lib/externalNavigation';

const PRICE_STALE_HOURS = 24;

const Cart = () => {
  const { items, removeFromCart, updateQuantity, clearCart, getTotalPrice, getTotalItems } = useCart();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showFulfillment, setShowFulfillment] = useState(false);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [isProcessingAffiliate, setIsProcessingAffiliate] = useState(false);
  const sessionId = searchParams.get('session_id');
  const success = searchParams.get('success');
  const canceled = searchParams.get('canceled');
  const affiliateItems = items.filter((item) => item.purchaseModel === 'affiliate');
  const directItems = items.filter((item) => item.purchaseModel === 'direct');
  const directSubtotal = directItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const directTax = directSubtotal * 0.08;
  const directTotal = directSubtotal + directTax;
  const hasStalePrices = items.some((item) => {
    const checkedAt = new Date(item.priceCheckedAt).getTime();
    if (!Number.isFinite(checkedAt)) return true;
    return Date.now() - checkedAt > PRICE_STALE_HOURS * 60 * 60 * 1000;
  });

  useEffect(() => {
    if (success === 'true' && sessionId) {
      navigate(`/checkout-success?session_id=${encodeURIComponent(sessionId)}`, { replace: true });
    } else if (canceled === 'true') {
      toast({
        title: "Payment Canceled",
        description: "Your payment was canceled. Your items are still in your cart.",
        variant: "destructive",
      });
      // Clear URL params
      navigate('/cart', { replace: true });
    }
  }, [success, canceled, sessionId, clearCart, navigate]);

  const getShadeColor = (item: any) => {
    // Use pigment-based color recreation for accurate color display
    const hex = item.shadeHex || (item.product as any)?.hex || (item as any).hex;
    if (hex && hex.startsWith('#')) {
      const pigmentColor = createPigmentColor(hex);
      return pigmentColor.hex;
    }
    return '#D4A574';
  };

  const handleCheckout = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isProcessingCheckout) return;
    if (!directItems.length) {
      toast({
        title: "No direct checkout items",
        description: "This cart currently contains affiliate items only.",
      });
      return;
    }

    try {
      setIsProcessingCheckout(true);
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { items: directItems },
      });

      if (error) throw error;
      if (!data?.checkout_url) throw new Error('No checkout URL returned');

      await openExternalUrl(data.checkout_url, { preferSameTab: true });
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast({
        title: "Checkout Error",
        description: error?.message || "Unable to start checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  const handleAffiliateCheckout = async () => {
    if (isProcessingAffiliate) return;
    const links = affiliateItems
      .map((item) => ({
        item,
        url: item.affiliateUrl || item.retailerUrl,
      }))
      .filter((entry): entry is { item: typeof affiliateItems[number]; url: string } => Boolean(entry.url));

    if (!links.length) {
      toast({
        title: "No affiliate links found",
        description: "Please re-add items with retailer links to continue.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessingAffiliate(true);

      await Promise.all(
        links.map(({ item, url }) =>
          supabase.functions.invoke('track-affiliate-click', {
            body: {
              provider: item.affiliateProvider || 'other',
              offerId: item.product.id,
              clickUrl: url,
            },
          }).catch(() => null)
        )
      );

      await openExternalUrl(links[0].url);
      if (links.length > 1) {
        toast({
          title: "Affiliate checkout started",
          description: `Opened the first retailer link. ${links.length - 1} more item(s) remain in your cart.`,
        });
      }
    } catch (error) {
      console.error('Affiliate checkout error:', error);
      toast({
        title: "Unable to open retailer",
        description: "Please try again. If the problem continues, use the web version as a fallback.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingAffiliate(false);
    }
  };

  const handleManualPurchaseComplete = () => {
    clearCart();
    navigate('/checkout-success');
  };

  const handlePurchaseComplete = (fulfillmentMethod: string, products: any[]) => {
    toast({
      title: "Order Confirmed!",
      description: `Your order will be fulfilled via ${fulfillmentMethod}`,
    });
    clearCart();
    setShowFulfillment(false);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-purple-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="mb-8">
              <ShoppingBag className="w-24 h-24 mx-auto text-gray-300 mb-4" />
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Your Cart is Empty</h1>
              <p className="text-gray-600 mb-6">
                Discover your perfect foundation match and add items to your cart.
              </p>
              <Button 
                className="bg-gradient-to-r from-rose-500 to-purple-500 text-white"
                onClick={() => navigate('/shade-matcher')}
              >
                Start Shade Matching
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-purple-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate(-1)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Shopping Cart</h1>
                <p className="text-gray-600">{getTotalItems()} items in your cart</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={clearCart}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              Clear Cart
            </Button>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <Card key={item.id} className="bg-white shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      {/* Product Image/Swatch */}
                      <div className="flex-shrink-0">
                        <div 
                          className="w-16 h-16 rounded-lg border shadow-sm"
                          style={{ 
                            backgroundColor: getShadeColor(item)
                          }}
                        />
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold text-gray-800">{item.product.brand}</h3>
                            <p className="text-gray-600 text-sm">{item.product.product}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-sm font-medium text-rose-600">
                                {item.shadeName}
                              </span>
                              {item.selectedShade && (
                                <Badge variant="outline" className="text-xs">
                                  {item.selectedShade === 'contour' ? 'Contour Shade' : 'Main Shade'}
                                </Badge>
                              )}
                              <Badge variant={item.purchaseModel === 'affiliate' ? 'secondary' : 'outline'} className="text-xs">
                                {item.purchaseModel === 'affiliate' ? 'Affiliate' : 'Direct'}
                              </Badge>
                            </div>
                            {item.purchaseModel === 'affiliate' && (
                              <p className="text-xs text-gray-500 mt-1">
                                Final price is confirmed at retailer checkout.
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Quantity and Price */}
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="w-8 h-8 p-0"
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="w-8 text-center font-medium">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-8 h-8 p-0"
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">${(item.product.price * item.quantity).toFixed(2)}</p>
                            <p className="text-sm text-gray-500">${item.product.price.toFixed(2)} each</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order Summary / Fulfillment Options */}
            <div className="lg:col-span-1">
              {!showFulfillment ? (
                <Card className="bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle>Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal ({getTotalItems()} items)</span>
                      <span>${getTotalPrice().toFixed(2)}</span>
                    </div>
                    {directItems.length > 0 && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span>Direct checkout subtotal</span>
                          <span>${directSubtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Estimated tax</span>
                          <span>${directTax.toFixed(2)}</span>
                        </div>
                        <div className="border-t pt-4">
                          <div className="flex justify-between font-semibold text-lg">
                            <span>Direct checkout total</span>
                            <span>${directTotal.toFixed(2)}</span>
                          </div>
                        </div>
                      </>
                    )}
                    {hasStalePrices && (
                      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-2">
                        Some prices were checked over {PRICE_STALE_HOURS} hours ago. Final pricing is shown at checkout.
                      </p>
                    )}
                    {directItems.length > 0 && (
                      <button
                        onClick={handleCheckout}
                        disabled={isProcessingCheckout}
                        className="w-full text-white text-lg leading-[48px] h-[48px] bg-[#006aff] text-center rounded-md shadow-[0_0_0_1px_rgba(0,0,0,.1)_inset] hover:bg-[#0056d2] transition-colors"
                      >
                        {isProcessingCheckout ? 'Processing...' : 'Pay now'}
                      </button>
                    )}
                    {affiliateItems.length > 0 && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={handleAffiliateCheckout}
                        disabled={isProcessingAffiliate}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        {isProcessingAffiliate ? 'Opening...' : `Buy via Affiliate (${affiliateItems.length})`}
                      </Button>
                    )}
                    <div className="border-t pt-3 space-y-1">
                      {directItems.length > 0 && (
                        <p className="text-xs text-gray-500 text-center">
                          Direct checkout powered by Stripe
                        </p>
                      )}
                      {affiliateItems.length > 0 && (
                        <p className="text-xs text-gray-500 text-center">
                          As an Amazon Associate and affiliate partner, we may earn from qualifying purchases.
                        </p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleManualPurchaseComplete}
                    >
                      I Completed My Purchase
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <FulfillmentOptions
                  products={items.map(item => ({
                    id: item.product.id,
                    brand: item.product.brand,
                    product: item.product.product,
                    name: item.product.product,
                    shade: item.shadeName,
                    price: item.product.price * item.quantity,
                    rakutenData: (item.product as any).rakutenData,
                  }))}
                  onPurchase={handlePurchaseComplete}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
