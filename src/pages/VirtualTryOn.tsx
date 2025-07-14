import React, { useState } from 'react';
import Header from '../components/Header';
import VirtualTryOn from '../components/VirtualTryOn';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Camera, Upload, Zap, Crown } from 'lucide-react';
import AuthGuard from '../components/AuthGuard';
import { Toaster } from '@/components/ui/toaster';

const VirtualTryOnPage = () => {
  const [userTier] = useState<'free' | 'weekly' | 'monthly' | 'premium'>('free'); // This will come from subscription context
  const [matchesUsed] = useState(0); // This will come from user data
  
  const tierLimits = {
    free: 3,
    weekly: 7,
    monthly: 15,
    premium: 30
  };
  
  const remainingMatches = tierLimits[userTier] - matchesUsed;
  const canTryOn = remainingMatches > 0;

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50">
        <Header />
        
        <div className="py-8">
          <div className="container mx-auto px-4">
            {/* Header Section */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 bg-clip-text text-transparent mb-4">
                Virtual Foundation Try-On
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
                See how different foundations look on you before you buy. Upload a photo or use your camera for instant results.
              </p>
              
              {/* Usage Tracker */}
              <div className="inline-flex items-center gap-3 bg-white rounded-full px-6 py-3 shadow-lg">
                <Badge variant={userTier === 'free' ? 'secondary' : 'default'} className="capitalize">
                  {userTier === 'premium' ? (
                    <>
                      <Crown className="w-4 h-4 mr-1" />
                      Premium
                    </>
                  ) : (
                    userTier
                  )}
                </Badge>
                <span className="text-sm text-gray-600">
                  {remainingMatches} matches remaining this {
                    userTier === 'premium' || userTier === 'monthly' ? 'month' : 
                    userTier === 'weekly' ? 'week' : 'session'
                  }
                </span>
              </div>
            </div>

            {canTryOn ? (
              <>
                {/* Quick Start Options */}
                <div className="grid md:grid-cols-2 gap-6 mb-8 max-w-4xl mx-auto">
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader className="text-center">
                      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Camera className="h-8 w-8 text-purple-600" />
                      </div>
                      <CardTitle>Use Camera</CardTitle>
                      <CardDescription>
                        Take a photo with your device camera for instant try-on
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button className="w-full" size="lg">
                        <Camera className="w-5 h-5 mr-2" />
                        Start Camera
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader className="text-center">
                      <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Upload className="h-8 w-8 text-rose-600" />
                      </div>
                      <CardTitle>Upload Photo</CardTitle>
                      <CardDescription>
                        Upload an existing photo from your device
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="outline" className="w-full" size="lg">
                        <Upload className="w-5 h-5 mr-2" />
                        Choose File
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Virtual Try-On Component */}
                <VirtualTryOn selectedMatch={null} />
              </>
            ) : (
              /* Upgrade Prompt */
              <div className="text-center py-16">
                <div className="max-w-md mx-auto">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Zap className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">
                    You've Used All Your Try-Ons
                  </h3>
                  <p className="text-gray-600 mb-8">
                    Upgrade your plan to continue using virtual try-on and get more matches.
                  </p>
                  
                  {/* Upgrade Options */}
                  <div className="space-y-4">
                    {userTier === 'free' && (
                      <>
                        <Button size="lg" className="w-full">
                          Upgrade to Weekly - $2/week
                        </Button>
                        <Button variant="outline" size="lg" className="w-full">
                          Upgrade to Monthly - $5/month
                        </Button>
                        <Button size="lg" className="w-full">
                          <Crown className="w-5 h-5 mr-2" />
                          Upgrade to Premium - $10/month
                        </Button>
                      </>
                    )}
                    {userTier === 'weekly' && (
                      <>
                        <Button size="lg" className="w-full">
                          Upgrade to Monthly - $5/month
                        </Button>
                        <Button size="lg" className="w-full">
                          <Crown className="w-5 h-5 mr-2" />
                          Upgrade to Premium - $10/month
                        </Button>
                      </>
                    )}
                    {userTier === 'monthly' && (
                      <Button size="lg" className="w-full">
                        <Crown className="w-5 h-5 mr-2" />
                        Upgrade to Premium - $10/month
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <Toaster />
      </div>
    </AuthGuard>
  );
};

export default VirtualTryOnPage;