import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';
import SkinToneSlider from './SkinToneSlider';
import HeritageGlobe from './HeritageGlobe';

interface UserInfo {
  makeupItems: string[];
  skinTone: {
    hexColor: string;
    depth: number;
    undertone: string;
  } | null;
  heritage: {
    country: string;
    region: string;
    coordinates?: [number, number];
  } | null;
}

const OptionalUserInfo = () => {
  const [userInfo, setUserInfo] = useState<UserInfo>({
    makeupItems: [],
    skinTone: null,
    heritage: null
  });

  const [currentStep, setCurrentStep] = useState<'makeup' | 'skinTone' | 'heritage' | 'complete'>('makeup');

  const makeupCategories = [
    'Foundation', 'Concealer', 'Blush', 'Bronzer', 'Highlighter',
    'Eyeshadow', 'Mascara', 'Lipstick', 'Lip Gloss', 'Brow Products'
  ];

  const handleMakeupItemToggle = (item: string) => {
    setUserInfo(prev => ({
      ...prev,
      makeupItems: prev.makeupItems.includes(item)
        ? prev.makeupItems.filter(i => i !== item)
        : [...prev.makeupItems, item]
    }));
  };

  const handleSkinToneSelect = (toneData: { hexColor: string; depth: number; undertone: string }) => {
    setUserInfo(prev => ({
      ...prev,
      skinTone: toneData
    }));
    setCurrentStep('heritage');
  };

  const handleHeritageSelect = (locationData: { country: string; region: string; coordinates?: [number, number] }) => {
    setUserInfo(prev => ({
      ...prev,
      heritage: locationData
    }));
    setCurrentStep('complete');
  };

  const handleSubmit = () => {
    console.log('User info submitted:', userInfo);
    // Here you would save the user info to your backend
  };

  const handleNext = () => {
    if (currentStep === 'makeup') {
      setCurrentStep('skinTone');
    } else if (currentStep === 'skinTone') {
      setCurrentStep('heritage');
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'makeup':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                What makeup items do you currently use?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
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
              <Button onClick={handleNext} className="w-full">
                Continue to Skin Tone Matching
              </Button>
            </CardContent>
          </Card>
        );

      case 'skinTone':
        return <SkinToneSlider onSkinToneSelect={handleSkinToneSelect} />;

      case 'heritage':
        return <HeritageGlobe onLocationSelect={handleHeritageSelect} />;

      case 'complete':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Profile Complete!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p><strong>Makeup Items:</strong> {userInfo.makeupItems.join(', ') || 'None selected'}</p>
                {userInfo.skinTone && (
                  <div className="flex items-center gap-2">
                    <strong>Skin Tone:</strong>
                    <div 
                      className="w-6 h-6 rounded-full border"
                      style={{ backgroundColor: userInfo.skinTone.hexColor }}
                    />
                    <span>{userInfo.skinTone.undertone} undertone, depth {userInfo.skinTone.depth}</span>
                  </div>
                )}
                {userInfo.heritage && (
                  <p><strong>Heritage:</strong> {userInfo.heritage.country}, {userInfo.heritage.region}</p>
                )}
              </div>
              <Button onClick={handleSubmit} size="lg" className="w-full">
                Save Profile & Get Recommendations
              </Button>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
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

      {/* Progress Indicator */}
      <div className="flex justify-center space-x-2 mb-6">
        {['makeup', 'skinTone', 'heritage', 'complete'].map((step, index) => (
          <div
            key={step}
            className={`w-3 h-3 rounded-full transition-colors ${
              ['makeup', 'skinTone', 'heritage', 'complete'].indexOf(currentStep) >= index
                ? 'bg-primary'
                : 'bg-muted'
            }`}
          />
        ))}
      </div>

      {renderCurrentStep()}
    </div>
  );
};

export default OptionalUserInfo;