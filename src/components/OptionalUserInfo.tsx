import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Camera, Palette, Users, Sparkles, ChevronRight } from 'lucide-react';

interface UserInfo {
  makeupItems: string[];
  heritage: string;
  undertone: string;
  favoriteColors: string[];
  useRealTimeGuidance: boolean;
}

const OptionalUserInfo = () => {
  const [userInfo, setUserInfo] = useState<UserInfo>({
    makeupItems: [],
    heritage: '',
    undertone: '',
    favoriteColors: [],
    useRealTimeGuidance: false
  });

  const [showColorGuidance, setShowColorGuidance] = useState(false);

  const makeupCategories = [
    'Foundation', 'Concealer', 'Blush', 'Bronzer', 'Highlighter',
    'Eyeshadow', 'Mascara', 'Lipstick', 'Lip Gloss', 'Brow Products'
  ];

  const undertoneOptions = [
    { value: 'spring', label: 'Spring - Warm, Light, Clear' },
    { value: 'summer', label: 'Summer - Cool, Light, Muted' },
    { value: 'autumn', label: 'Autumn - Warm, Deep, Muted' },
    { value: 'winter', label: 'Winter - Cool, Deep, Clear' },
    { value: 'unsure', label: 'Not sure' }
  ];

  const colorOptions = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#F4A460', '#FFB6C1', '#98D8C8', '#F7DC6F'
  ];

  const handleMakeupItemToggle = (item: string) => {
    setUserInfo(prev => ({
      ...prev,
      makeupItems: prev.makeupItems.includes(item)
        ? prev.makeupItems.filter(i => i !== item)
        : [...prev.makeupItems, item]
    }));
  };

  const handleColorSelect = (color: string) => {
    setUserInfo(prev => ({
      ...prev,
      favoriteColors: prev.favoriteColors.includes(color)
        ? prev.favoriteColors.filter(c => c !== color)
        : [...prev.favoriteColors, color]
    }));
  };

  const handleSubmit = () => {
    console.log('User info submitted:', userInfo);
    // Here you would save the user info to your backend
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-full mb-4">
          <Sparkles className="w-5 h-5" />
          <span className="font-semibold">Optional Enhancement</span>
        </div>
        <h2 className="text-2xl font-bold mb-2">Help Us Find Your Perfect Match</h2>
        <p className="text-muted-foreground">
          Provide additional information to get even more accurate foundation recommendations
        </p>
      </div>

      <div className="grid gap-6">
        {/* Makeup Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              What makeup items do you currently use?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {makeupCategories.map((item) => (
                <div
                  key={item}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    userInfo.makeupItems.includes(item)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background hover:bg-muted border-border'
                  }`}
                  onClick={() => handleMakeupItemToggle(item)}
                >
                  <span className="text-sm font-medium">{item}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Heritage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Ancestral Heritage (Optional)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Share your ancestral background to help us understand your unique skin characteristics (e.g., Mediterranean, East Asian, African, Nordic, etc.)"
              value={userInfo.heritage}
              onChange={(e) => setUserInfo(prev => ({ ...prev, heritage: e.target.value }))}
              className="min-h-[100px]"
            />
          </CardContent>
        </Card>

        {/* Undertone */}
        <Card>
          <CardHeader>
            <CardTitle>What's your undertone?</CardTitle>
          </CardHeader>
          <CardContent>
            <Select onValueChange={(value) => setUserInfo(prev => ({ ...prev, undertone: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select your seasonal undertone" />
              </SelectTrigger>
              <SelectContent>
                {undertoneOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Color Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>What colors look good on you?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
              {colorOptions.map((color) => (
                <div
                  key={color}
                  className={`w-12 h-12 rounded-full cursor-pointer border-4 transition-all ${
                    userInfo.favoriteColors.includes(color)
                      ? 'border-primary scale-110'
                      : 'border-border hover:border-muted-foreground'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => handleColorSelect(color)}
                />
              ))}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="real-time-guidance"
                checked={userInfo.useRealTimeGuidance}
                onCheckedChange={(checked) => 
                  setUserInfo(prev => ({ ...prev, useRealTimeGuidance: checked as boolean }))
                }
              />
              <Label htmlFor="real-time-guidance" className="cursor-pointer">
                I'd like real-time camera guidance to determine my best colors
              </Label>
            </div>

            {userInfo.useRealTimeGuidance && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Camera className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-800">Real-Time Color Guidance</h4>
                      <p className="text-sm text-blue-600 mb-3">
                        We'll guide you through holding different colored items near your face to see which ones enhance your natural beauty.
                      </p>
                      <Button 
                        size="sm" 
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => setShowColorGuidance(true)}
                      >
                        Start Color Analysis <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-center pt-4">
          <Button onClick={handleSubmit} size="lg" className="px-8">
            Save Preferences & Continue
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OptionalUserInfo;