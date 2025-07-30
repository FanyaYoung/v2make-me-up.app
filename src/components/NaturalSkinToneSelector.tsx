import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Hand, Palette } from 'lucide-react';

interface NaturalSkinToneSelectorProps {
  onSkinToneSelect: (toneData: { hexColor: string; depth: string; undertone: string; category: string }) => void;
}

const NaturalSkinToneSelector = ({ onSkinToneSelect }: NaturalSkinToneSelectorProps) => {
  const [selectedRange, setSelectedRange] = useState<string | null>(null);
  const [selectedUndertone, setSelectedUndertone] = useState<string | null>(null);

  // Natural Skin Tone Ranges based on user's specification
  const skinToneRanges = {
    fair: {
      name: 'Fair',
      description: 'Very light skin, often with pink or red undertones, that burns easily',
      colors: {
        cool: '#F7E6E0',
        neutral: '#F5E1D8', 
        warm: '#F3DDD0',
        olive: '#F1DBC8'
      }
    },
    light: {
      name: 'Light', 
      description: 'Even skin tone, slightly darker than fair, with pink or golden undertones, may tan slightly',
      colors: {
        cool: '#E8C4B0',
        neutral: '#E5BFA8',
        warm: '#E2BAA0', 
        olive: '#DFB598'
      }
    },
    medium: {
      name: 'Medium',
      description: 'Sun-kissed or olive skin, with warm or yellow undertones, tans easily',
      colors: {
        cool: '#C89882',
        neutral: '#C5937A',
        warm: '#C28E72',
        olive: '#BF896A'
      }
    },
    dark: {
      name: 'Dark',
      description: 'Brown skin, with warm or cool undertones, tans deeply',
      colors: {
        cool: '#8B5A3C',
        neutral: '#885534',
        warm: '#85502C',
        olive: '#824B24'
      }
    }
  };

  const undertoneDescriptions = {
    cool: 'Pink or red undertones - veins appear blue',
    neutral: 'Balanced undertones - veins appear blue-green', 
    warm: 'Yellow or golden undertones - veins appear green',
    olive: 'Green or yellow undertones - deeper complexion'
  };

  const handleRangeSelect = (range: string) => {
    setSelectedRange(range);
    setSelectedUndertone(null);
  };

  const handleUndertoneSelect = (undertone: string) => {
    setSelectedUndertone(undertone);
  };

  const handleConfirm = () => {
    if (selectedRange && selectedUndertone) {
      const hexColor = skinToneRanges[selectedRange as keyof typeof skinToneRanges].colors[selectedUndertone as keyof typeof undertoneDescriptions];
      onSkinToneSelect({
        hexColor,
        depth: selectedRange,
        undertone: selectedUndertone,
        category: selectedRange
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Hand className="w-5 h-5" />
          Find Your Natural Skin Tone
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Select your natural skin tone range and undertone to get personalized foundation recommendations
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Step 1: Select Range */}
        <div>
          <label className="text-sm font-medium mb-3 block">Step 1: Select your skin tone range</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(skinToneRanges).map(([key, range]) => (
              <button
                key={key}
                onClick={() => handleRangeSelect(key)}
                className={`p-4 text-left border-2 rounded-lg transition-all hover:shadow-md ${
                  selectedRange === key 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: range.colors.neutral }}
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm">{range.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{range.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Select Undertone */}
        {selectedRange && (
          <div>
            <label className="text-sm font-medium mb-3 block">Step 2: Select your undertone</label>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(undertoneDescriptions).map(([key, description]) => {
                const range = skinToneRanges[selectedRange as keyof typeof skinToneRanges];
                const color = range.colors[key as keyof typeof range.colors];
                
                return (
                  <button
                    key={key}
                    onClick={() => handleUndertoneSelect(key)}
                    className={`p-3 text-left border-2 rounded-lg transition-all hover:shadow-md ${
                      selectedUndertone === key 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: color }}
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-sm capitalize">{key}</h4>
                        <p className="text-xs text-muted-foreground">{description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Comparison Helper */}
        {selectedRange && selectedUndertone && (
          <div className="bg-muted/50 p-4 rounded-lg">
            <label className="text-sm font-medium mb-3 block">Compare with your skin</label>
            <div className="flex items-center gap-4">
              <div 
                className="w-20 h-20 rounded-lg border-2 border-white shadow-sm"
                style={{ 
                  backgroundColor: skinToneRanges[selectedRange as keyof typeof skinToneRanges].colors[selectedUndertone as keyof typeof undertoneDescriptions] 
                }}
              />
              <div className="flex-1 text-center">
                <Hand className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground">
                  Hold your hand here for comparison
                </p>
              </div>
            </div>
          </div>
        )}

        {selectedRange && selectedUndertone && (
          <Button onClick={handleConfirm} className="w-full">
            <Palette className="w-4 h-4 mr-2" />
            Find My Foundation Matches
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default NaturalSkinToneSelector;