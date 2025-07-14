import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, ArrowLeft, CreditCard } from 'lucide-react';

export default function SubscriptionCanceled() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-rose-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl">Payment Canceled</CardTitle>
          <CardDescription>
            Your subscription payment was canceled. No charges were made.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center text-sm text-muted-foreground">
            <p>Don't worry, you can try again anytime. Your account remains unchanged.</p>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={() => navigate('/subscription')} 
              className="w-full"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button 
              onClick={() => navigate('/')} 
              variant="outline" 
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}