import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSkinToneReferences } from '@/hooks/useSkinToneReferences';
import { Palette, Info } from 'lucide-react';

interface SkinToneReferenceProps {
  onToneSelect?: (hex: string, undertone: string, depth: string) => void;
  showSelector?: boolean;
}

const SkinToneReference = ({ onToneSelect, showSelector = false }: SkinToneReferenceProps) => {
  const [selectedCategory, setSelectedCategory] = useState<'depth' | 'undertone'>('depth');
  const [hoveredTone, setHoveredTone] = useState<string | null>(null);
  const { skinToneReferences, skinToneByCategory, skinToneByUndertone, loading, error } = useSkinToneReferences();

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading skin tone references...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center text-red-500">
            <p>Error loading skin tone references: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleToneClick = (tone: any) => {
    if (onToneSelect) {
      onToneSelect(tone.hex_color, tone.undertone, tone.depth);
    }
  };

  const renderToneGrid = (tones: any[], title: string) => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{title}</h3>
      <div className="grid grid-cols-8 md:grid-cols-12 gap-2">
        {tones.map((tone, index) => (
          <div
            key={index}
            className="relative group"
            onMouseEnter={() => setHoveredTone(tone.hex_color)}
            onMouseLeave={() => setHoveredTone(null)}
          >
            <button
              className={`w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-gray-300 hover:border-gray-400 transition-all duration-200 hover:scale-110 ${
                showSelector ? 'cursor-pointer' : ''
              }`}
              style={{ backgroundColor: tone.hex_color }}
              onClick={() => handleToneClick(tone)}
              title={tone.name || tone.hex_color}
            />
            
            {/* Tooltip */}
            {hoveredTone === tone.hex_color && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-xs rounded-lg opacity-95 pointer-events-none whitespace-nowrap z-20 shadow-lg">
                <div className="font-medium">{tone.name || 'Untitled'}</div>
                <div className="text-gray-300">{tone.hex_color}</div>
                <div className="flex gap-1 mt-1">
                  <Badge variant="outline" className="text-xs bg-white/10 border-white/20">
                    {tone.undertone}
                  </Badge>
                  <Badge variant="outline" className="text-xs bg-white/10 border-white/20">
                    {tone.depth}
                  </Badge>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Comprehensive Skin Tone Reference
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Real skin tone references compiled from diverse sources to ensure accurate matching across all ethnicities and undertones.
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-blue-50 p-2 rounded-lg">
          <Info className="w-4 h-4" />
          <span>Total references: {skinToneReferences.length} • Sources: Professional color palettes and inclusive beauty standards</span>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as 'depth' | 'undertone')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="depth">By Depth</TabsTrigger>
            <TabsTrigger value="undertone">By Undertone</TabsTrigger>
          </TabsList>
          
          <TabsContent value="depth" className="space-y-6 mt-6">
            {Object.entries(skinToneByCategory).map(([depth, tones]) => (
              <div key={depth}>
                {renderToneGrid(tones, `${depth.charAt(0).toUpperCase() + depth.slice(1).replace('-', ' ')} (${tones.length} tones)`)}
              </div>
            ))}
          </TabsContent>
          
          <TabsContent value="undertone" className="space-y-6 mt-6">
            {Object.entries(skinToneByUndertone).map(([undertone, tones]) => (
              <div key={undertone}>
                {renderToneGrid(tones, `${undertone.charAt(0).toUpperCase() + undertone.slice(1)} (${tones.length} tones)`)}
              </div>
            ))}
          </TabsContent>
        </Tabs>
        
        {showSelector && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              Click on any color above to select it as your skin tone reference.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SkinToneReference;