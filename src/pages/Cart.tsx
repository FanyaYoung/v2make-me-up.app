import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';

const Cart = () => {
  const { items, removeFromCart, updateQuantity, clearCart, getTotalPrice, getTotalItems } = useCart();
  const navigate = useNavigate();

  const getShadeColor = (shade: string, undertone: string) => {
    const shadeLower = shade.toLowerCase();
    let baseColor = '#D4A574';
    
    if (shadeLower.includes('fair') || shadeLower.includes('light')) {
      baseColor = undertone === 'cool' ? '#F5DCC4' : undertone === 'warm' ? '#F0D0A6' : '#F2D3B3';
    } else if (shadeLower.includes('medium')) {
      baseColor = undertone === 'cool' ? '#E8C2A0' : undertone === 'warm' ? '#D4A574' : '#DEBA8A';
    } else if (shadeLower.includes('deep') || shadeLower.includes('dark')) {
      baseColor = undertone === 'cool' ? '#B5967A' : undertone === 'warm' ? '#A0835C' : '#AA8B6E';
    }
    
    return baseColor;
  };

  const handleCheckout = () => {
    // TODO: Implement checkout functionality
    console.log('Proceeding to checkout with items:', items);
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
                            backgroundColor: getShadeColor(
                              item.shadeName || item.product.shade, 
                              item.product.undertone
                            )
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
                            </div>
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

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal ({getTotalItems()} items)</span>
                    <span>${getTotalPrice().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Shipping</span>
                    <span className="text-green-600">Free</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax</span>
                    <span>${(getTotalPrice() * 0.08).toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span>${(getTotalPrice() * 1.08).toFixed(2)}</span>
                    </div>
                  </div>
                  <Button 
                    className="w-full bg-gradient-to-r from-rose-500 to-purple-500 text-white"
                    onClick={handleCheckout}
                  >
                    Proceed to Checkout
                  </Button>
                  <p className="text-xs text-gray-500 text-center">
                    Secure checkout powered by Stripe
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;