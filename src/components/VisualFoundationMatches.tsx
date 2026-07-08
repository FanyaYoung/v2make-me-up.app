import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Eye } from 'lucide-react';

interface FoundationMatch {
  id: string;
  brand: string;
  product: string;
  shade: string;
  matchPercentage: number;
  swatchColor: string;
  isOriginal?: boolean;
}

interface VisualFoundationMatchesProps {
  originalShade: string;
  originalBrand: string;
}

const VisualFoundationMatches: React.FC<VisualFoundationMatchesProps> = ({
  originalShade,
  originalBrand
}) => {
  const matches: FoundationMatch[] = [
    {
      id: 'original',
      brand: originalBrand,
      product: 'Pro Filt\'r Soft Matte Foundation',
      shade: originalShade,
      matchPercentage: 100,
      swatchColor: '#CFC1A2',
      isOriginal: true
    },
    {
      id: 'match1',
      brand: 'Charlotte Tilbury',
      product: '6 Medium',
      shade: 'Airbrush Flawless Foundation',
      matchPercentage: 95,
      swatchColor: '#D2C3A4'
    },
    {
      id: 'match2',
      brand: 'Rare Beauty',
      product: '240N',
      shade: 'Liquid Touch Foundation',
      matchPercentage: 95,
      swatchColor: '#CAB89C'
    },
    {
      id: 'match3',
      brand: 'NARS',
      product: 'Barcelona',
      shade: 'Natural Radiant Foundation',
      matchPercentage: 95,
      swatchColor: '#C6B498'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
          Perfect Matches for {originalBrand} {originalShade}
        </h2>
        <p className="text-muted-foreground">Here are identical shades from other brands</p>
      </div>

      {/* Foundation Matches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {matches.map((match) => (
          <Card key={match.id} className={`overflow-hidden transition-all duration-300 hover:shadow-lg ${
            match.isOriginal ? 'ring-2 ring-rose-500' : ''
          }`}>
            <CardContent className="p-0">
              {/* Product Image */}
              <div className="relative flex h-48 items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
                <div className="w-full max-w-[9rem] rounded-[2rem] bg-white px-5 py-6 shadow-sm ring-1 ring-black/5">
                  <div
                    className="mx-auto mb-4 h-20 w-12 rounded-t-full rounded-b-lg shadow-inner"
                    style={{ backgroundColor: match.swatchColor }}
                    aria-hidden="true"
                  />
                  <div className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                    {match.brand}
                  </div>
                  <div className="mt-1 text-center text-sm font-medium text-gray-700">
                    {match.shade}
                  </div>
                </div>
                {match.isOriginal && (
                  <Badge className="absolute top-2 left-2 bg-rose-500 text-white">
                    Original
                  </Badge>
                )}
                {!match.isOriginal && (
                  <Badge className="absolute top-2 left-2 bg-green-500 text-white">
                    {match.matchPercentage}% Match
                  </Badge>
                )}
              </div>
              
              {/* Product Info */}
              <div className="p-4 space-y-3">
                {/* Brand Name */}
                <h3 className="font-semibold text-lg text-center">{match.brand}</h3>
                
                {/* Shade Swatch */}
                <div className="flex justify-center">
                  <div 
                    className="w-12 h-12 rounded-full border-2 border-border shadow-inner"
                    style={{ backgroundColor: match.swatchColor }}
                    title={match.shade}
                  />
                </div>
                
                {/* Shade Name */}
                <p className="text-center font-medium">{match.shade}</p>
                
                {/* Product Name */}
                <p className="text-sm text-muted-foreground text-center">{match.product}</p>
                
                {/* Action Buttons */}
                {!match.isOriginal && (
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" className="flex-1 gap-1" variant="outline">
                      <Eye className="w-3 h-3" />
                      Try
                    </Button>
                    <Button size="sm" className="flex-1 gap-1">
                      <ShoppingBag className="w-3 h-3" />
                      Buy
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Skin Tone Analysis */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="relative">
            <div
              className="h-32 w-full"
              style={{
                backgroundImage:
                  'linear-gradient(90deg, #5b3a2d 0%, #7a5442 14%, #9a7258 28%, #b4896d 42%, #cfa382 57%, #ddb48e 71%, #ebc7a7 85%, #f2d7be 100%)',
              }}
              aria-label="Diverse skin tone swatches"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="flex items-center justify-center gap-4 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-rose-500 rounded-full"></div>
                    <span className="text-sm">Your skin tone</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Perfect Matches</span>
                  </div>
                </div>
                <p className="text-sm opacity-90">All shades shown have been color-matched using our advanced AI technology</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VisualFoundationMatches;
