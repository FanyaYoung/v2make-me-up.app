import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ShoppingBag } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

const CheckoutSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { clearCart } = useCart();

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-purple-50">
      <Header />
      <main className="container mx-auto px-4 py-10">
        <div className="max-w-2xl mx-auto">
          <Card className="bg-white shadow-sm">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-9 h-9 text-green-600" />
              </div>
              <CardTitle className="text-3xl">Thank You For Your Purchase</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-center">
              <p className="text-muted-foreground">
                Your order has been received and your cart is now cleared.
              </p>
              {sessionId && (
                <p className="text-xs text-muted-foreground break-all">
                  Order Reference: {sessionId}
                </p>
              )}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => navigate('/shade-matcher')}>
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Continue Shopping
                </Button>
                <Button variant="outline" onClick={() => navigate('/')}>
                  Back To Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default CheckoutSuccess;
