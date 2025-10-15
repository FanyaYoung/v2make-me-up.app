import React, { useState } from 'react';
import Header from '../components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Crown, Search, Calendar, Heart, Briefcase, PartyPopper, Sun, Moon, Play } from 'lucide-react';
import { Toaster } from '@/components/ui/toaster';

const PremiumLooks = () => {
  const [userTier] = useState<'free' | 'weekly' | 'monthly' | 'premium'>('free'); // This will come from subscription context
  const [selectedOccasion, setSelectedOccasion] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('');
  
  const isPremiumUser = userTier === 'monthly' || userTier === 'premium';
  
  const occasions = [
    { id: 'everyday', name: 'Everyday Casual', icon: Sun },
    { id: 'work', name: 'Professional/Work', icon: Briefcase },
    { id: 'date', name: 'Date Night', icon: Heart },
    { id: 'party', name: 'Party/Night Out', icon: PartyPopper },
    { id: 'formal', name: 'Formal Event', icon: Crown },
    { id: 'wedding', name: 'Wedding Guest', icon: Calendar },
  ];

  const styles = [
    { id: 'natural', name: 'Natural & Fresh' },
    { id: 'glam', name: 'Glamorous' },
    { id: 'bold', name: 'Bold & Dramatic' },
    { id: 'minimal', name: 'Minimal Chic' },
    { id: 'vintage', name: 'Vintage Inspired' },
    { id: 'editorial', name: 'Editorial' },
  ];

  const mockRecommendations = [
    {
      id: 1,
      occasion: 'Date Night',
      style: 'Glamorous',
      foundation: 'Fenty Beauty Pro Filt\'r - 240',
      products: [
        { type: 'Concealer', name: 'Tarte Shape Tape - 27S', price: 29 },
        { type: 'Blush', name: 'Rare Beauty Soft Pinch - Joy', price: 23 },
        { type: 'Highlighter', name: 'Fenty Beauty Killawatt - Trophy Wife', price: 36 },
        { type: 'Eyeshadow', name: 'Charlotte Tilbury Pillow Talk', price: 53 },
        { type: 'Lipstick', name: 'MAC Ruby Woo', price: 26 },
      ],
      totalPrice: 167,
      description: 'A romantic, glowing look perfect for evening dates',
    },
    {
      id: 2,
      occasion: 'Professional',
      style: 'Natural',
      foundation: 'Giorgio Armani Luminous Silk - 6',
      products: [
        { type: 'Concealer', name: 'NARS Radiant Creamy - Vanilla', price: 32 },
        { type: 'Blush', name: 'Glossier Cloud Paint - Puff', price: 22 },
        { type: 'Brow Gel', name: 'Benefit Gimme Brow+ - 3', price: 24 },
        { type: 'Mascara', name: 'Glossier Lash Slick', price: 20 },
        { type: 'Lip Tint', name: 'Glossier Generation G - Leo', price: 20 },
      ],
      totalPrice: 118,
      description: 'Polished and professional for the workplace',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50">
        <Header />
        
        <div className="py-8">
          <div className="container mx-auto px-4">
            {/* Hero Image Section */}
            <div className="relative rounded-lg overflow-hidden mb-8 max-w-4xl mx-auto">
              <img 
                src="/lovable-uploads/b7f78823-7566-40da-8231-db2bfe83f2a7.png"
                alt="Premium makeup model"
                className="w-full h-64 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                <div className="p-6 text-white">
                  <h1 className="text-4xl font-bold mb-2">Premium Makeup Looks</h1>
                  <p className="text-lg text-gray-200">
                    Get personalized makeup recommendations for any occasion
                  </p>
                </div>
              </div>
            </div>
            
            <div className="text-center mb-8">
              {/* Premium Badge */}
              <div className="inline-flex items-center gap-3 bg-white rounded-full px-6 py-3 shadow-lg">
                <Badge variant={isPremiumUser ? 'default' : 'secondary'} className="capitalize">
                  {isPremiumUser ? (
                    <>
                      <Crown className="w-4 h-4 mr-1" />
                      Premium Access
                    </>
                  ) : (
                    'Premium Required'
                  )}
                </Badge>
              </div>
            </div>

            {isPremiumUser ? (
              <>
                {/* Look Builder */}
                <Card className="max-w-4xl mx-auto mb-8">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-rose-500" />
                      Create Your Perfect Look
                    </CardTitle>
                    <CardDescription>
                      Tell us about the occasion and your style preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label htmlFor="occasion">Occasion</Label>
                        <Select value={selectedOccasion} onValueChange={setSelectedOccasion}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an occasion" />
                          </SelectTrigger>
                          <SelectContent>
                            {occasions.map((occasion) => (
                              <SelectItem key={occasion.id} value={occasion.id}>
                                <div className="flex items-center gap-2">
                                  <occasion.icon className="h-4 w-4" />
                                  {occasion.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="style">Style Preference</Label>
                        <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a style" />
                          </SelectTrigger>
                          <SelectContent>
                            {styles.map((style) => (
                              <SelectItem key={style.id} value={style.id}>
                                {style.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Button className="w-full" size="lg" disabled={!selectedOccasion || !selectedStyle}>
                      <Search className="w-5 h-5 mr-2" />
                      Generate My Look
                    </Button>
                  </CardContent>
                </Card>

                {/* Tutorial Videos */}
                <Card className="max-w-4xl mx-auto mb-8">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Play className="h-5 w-5 text-rose-500" />
                      Makeup Tutorial Videos
                    </CardTitle>
                    <CardDescription>
                      Step-by-step video tutorials for your recommended looks
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Play className="h-8 w-8 text-gray-500" />
                        </div>
                        <p className="text-gray-600 font-medium">Tutorial Video Placeholder</p>
                        <p className="text-sm text-gray-500 mt-2">
                          Personalized video tutorials will appear here based on your foundation match
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recommended Looks */}
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-center text-gray-800">
                    Recommended Looks for You
                  </h2>
                  
                  <div className="grid lg:grid-cols-2 gap-6">
                    {mockRecommendations.map((look) => (
                      <Card key={look.id} className="overflow-hidden">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg">{look.occasion} - {look.style}</CardTitle>
                              <CardDescription className="mt-1">
                                Based on your foundation: {look.foundation}
                              </CardDescription>
                            </div>
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              ${look.totalPrice}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <p className="text-sm text-gray-600 italic">
                            {look.description}
                          </p>
                          
                          <div className="space-y-3">
                            <h4 className="font-medium text-gray-800">Complete Product List:</h4>
                            <div className="space-y-2">
                              {look.products.map((product, index) => (
                                <div key={index} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                                  <div>
                                    <span className="font-medium text-gray-800">{product.type}:</span>
                                    <span className="ml-1 text-gray-600">{product.name}</span>
                                  </div>
                                  <span className="text-gray-800 font-medium">${product.price}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="flex gap-3 pt-4">
                            <Button className="flex-1">
                              <Heart className="w-4 h-4 mr-2" />
                              Save Look
                            </Button>
                            <Button variant="outline" className="flex-1">
                              <Search className="w-4 h-4 mr-2" />
                              Shop Products
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              /* Upgrade Prompt */
              <div className="text-center py-16">
                <div className="max-w-md mx-auto">
                  <div className="w-20 h-20 bg-gradient-to-br from-rose-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Crown className="h-10 w-10 text-rose-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">
                    Premium Feature
                  </h3>
                  <p className="text-gray-600 mb-8">
                    Unlock personalized makeup looks and product recommendations based on your skin tone and foundation matches.
                  </p>
                  
                  {/* Premium Features */}
                  <div className="text-left space-y-3 mb-8">
                    <div className="flex items-center gap-3 text-gray-600">
                      <Sparkles className="w-5 h-5 text-rose-500" />
                      <span>Personalized look recommendations</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600">
                      <Calendar className="w-5 h-5 text-rose-500" />
                      <span>Occasion-specific makeup guides</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600">
                      <Search className="w-5 h-5 text-rose-500" />
                      <span>Curated product shopping lists</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600">
                      <Heart className="w-5 h-5 text-rose-500" />
                      <span>Save and organize your favorite looks</span>
                    </div>
                  </div>
                  
                   {/* Upgrade Options */}
                  <div className="space-y-4">
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
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <Toaster />
      </div>
  );
};

export default PremiumLooks;