import React from 'react';
import Header from '../components/Header';
import VisualFoundationMatches from '../components/VisualFoundationMatches';
import { Toaster } from '@/components/ui/toaster';
import AuthGuard from '../components/AuthGuard';
import { useSubscription } from '@/hooks/useSubscription';
import { Card, CardContent } from '@/components/ui/card';
import { Crown, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const PerfectMatches = () => {
  const { isPremium, loading } = useSubscription();
  const navigate = useNavigate();

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50">
          <Header />
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (!isPremium) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50">
          <Header />
          <div className="py-8">
            <div className="container mx-auto px-4">
              <Card className="max-w-2xl mx-auto text-center">
                <CardContent className="p-8">
                  <Lock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h1 className="text-3xl font-bold mb-4">Premium Feature</h1>
                  <p className="text-muted-foreground mb-6">
                    Perfect Matches is a premium feature that provides detailed foundation matches across all major brands using our advanced AI technology.
                  </p>
                  <Button onClick={() => navigate('/subscription')} size="lg">
                    <Crown className="w-5 h-5 mr-2" />
                    Upgrade to Premium
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
          <Toaster />
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50">
        <Header />
        <div className="py-8">
          <div className="container mx-auto px-4 text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full mb-4">
              <Crown className="w-5 h-5" />
              <span className="font-semibold">Premium Feature</span>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Perfect Foundation Matches
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover your ideal foundation matches across all major brands with our advanced AI color analysis.
            </p>
          </div>
          
          <main className="container mx-auto px-4 py-8">
            <VisualFoundationMatches 
              originalShade="220"
              originalBrand="Fenty Beauty"
            />
          </main>
        </div>
        <Toaster />
      </div>
    </AuthGuard>
  );
};

export default PerfectMatches;