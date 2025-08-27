import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Palette, Search, Eye } from 'lucide-react';

interface SkinToneMatch {
  'Hex Number': string;
  'Category': string;
  'Undertones': string;
  'Traits': string;
  'Overtone': string;
  'Color': string;
}

const DatabaseSkinToneMatcher = () => {
  const [selectedHex, setSelectedHex] = useState('#FFDBAC');
  const [searchHex, setSearchHex] = useState('');
  const [closestMatches, setClosestMatches] = useState<SkinToneMatch[]>([]);

//   // Fetch all skin tone data using raw SQL since table isn't typed
//   const { data: skinTones, isLoading } = useQuery({
//     queryKey: ['skintonehexwithswatches'],
//     queryFn: async () => {
//       // Use the skin_tone_references table instead since it's properly typed
//       const { data, error } = await supabase
//         .from('skin_tone_references')
//         .select('*')
//         .order('category');
      
//       if (error) throw error;
//       return data as SkinToneMatch[];
//     },
//   });

  // Calculate color distance between two hex colors
  const colorDistance = (hex1: string, hex2: string): number => {
    const rgb1 = hexToRgb(hex1);
    const rgb2 = hexToRgb(hex2);
    
    if (!rgb1 || !rgb2) return 100;
    
    return Math.sqrt(
      Math.pow(rgb1.r - rgb2.r, 2) +
      Math.pow(rgb1.g - rgb2.g, 2) +
      Math.pow(rgb1.b - rgb2.b, 2)
    );
  };

  // Convert hex to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  // Find closest matches for a given hex color
  const findClosestMatches = (targetHex: string) => {
    if (!skinTones || !targetHex) return;

    const matches = skinTones
      .map(tone => ({
        ...tone,
        distance: colorDistance(targetHex, tone['Hex Number'])
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5);

    setClosestMatches(matches);
  };

  const handleHexSearch = () => {
    if (searchHex) {
      setSelectedHex(searchHex);
      findClosestMatches(searchHex);
    }
  };

  const handleColorSelect = (hex: string) => {
    setSelectedHex(hex);
    setSearchHex(hex);
    findClosestMatches(hex);
  };

  // Group skin tones by category
  const skinTonesByCategory = skinTones?.reduce((acc, tone) => {
    const category = tone.Category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(tone);
    return acc;
  }, {} as Record<string, SkinToneMatch[]>) || {};

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-r-transparent" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hex Color Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Find Your Skin Tone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="hex-input">Enter Hex Color</Label>
                <Input
                  id="hex-input"
                  value={searchHex}
                  onChange={(e) => setSearchHex(e.target.value)}
                  placeholder="#FFDBAC"
                  className="font-mono"
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleHexSearch}>
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Label>Selected Color:</Label>
              <div className="flex items-center gap-2">
                <div 
                  className="w-8 h-8 rounded border-2 border-gray-300"
                  style={{ backgroundColor: selectedHex }}
                />
                <span className="font-mono text-sm">{selectedHex}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Closest Matches */}
      {closestMatches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Closest Matches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {closestMatches.map((match, index) => (
                <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                  <div 
                    className="w-12 h-12 rounded border-2 border-gray-300 flex-shrink-0"
                    style={{ backgroundColor: match['Hex Number'] }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary">{match.Category}</Badge>
                      <Badge variant="outline">{match.Undertones}</Badge>
                      <span className="font-mono text-sm text-muted-foreground">
                        {match['Hex Number']}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{match.Traits}</p>
                    {match.Overtone && (
                      <p className="text-xs text-muted-foreground">Overtone: {match.Overtone}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Skin Tone Palette */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Skin Tone Reference Palette
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(skinTonesByCategory).map(([category, tones]) => (
              <div key={category}>
                <h4 className="font-semibold mb-2">{category}</h4>
                <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2">
                  {tones.map((tone, index) => (
                    <button
                      key={index}
                      onClick={() => handleColorSelect(tone['Hex Number'])}
                      className="group relative"
                      title={`${tone.Undertones} - ${tone.Traits}`}
                    >
                      <div 
                        className="w-8 h-8 rounded border-2 border-gray-300 group-hover:border-primary transition-colors"
                        style={{ backgroundColor: tone['Hex Number'] }}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DatabaseSkinToneMatcher;