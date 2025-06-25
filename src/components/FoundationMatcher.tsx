
import React, { useState } from 'react';
import FoundationInput from './FoundationInput';
import ProductRecommendations from './ProductRecommendations';
import VirtualTryOn from './VirtualTryOn';
import { FoundationMatch } from '../types/foundation';

const FoundationMatcher = () => {
  const [currentFoundation, setCurrentFoundation] = useState<{brand: string, shade: string} | null>(null);
  const [matches, setMatches] = useState<FoundationMatch[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<FoundationMatch | null>(null);

  const handleFoundationSubmit = (brand: string, shade: string) => {
    setCurrentFoundation({ brand, shade });
    
    // Mock API call - in real app, this would call a foundation matching service
    const mockMatches: FoundationMatch[] = [
      {
        id: '1',
        brand: 'Fenty Beauty',
        product: 'Pro Filt\'r Soft Matte Foundation',
        shade: '220 - Medium with neutral undertones',
        price: 36.00,
        rating: 4.4,
        reviewCount: 1247,
        availability: {
          online: true,
          inStore: true,
          readyForPickup: true,
          nearbyStores: ['Sephora - Downtown', 'Ulta - Mall Plaza']
        },
        matchPercentage: 95,
        undertone: 'neutral',
        coverage: 'full',
        finish: 'matte',
        imageUrl: '/placeholder.svg'
      },
      {
        id: '2',
        brand: 'Charlotte Tilbury',
        product: 'Airbrush Flawless Foundation',
        shade: '6 Medium',
        price: 44.00,
        rating: 4.6,
        reviewCount: 892,
        availability: {
          online: true,
          inStore: false,
          readyForPickup: false,
          nearbyStores: []
        },
        matchPercentage: 92,
        undertone: 'neutral',
        coverage: 'medium',
        finish: 'natural',
        imageUrl: '/placeholder.svg'
      },
      {
        id: '3',
        brand: 'Rare Beauty',
        product: 'Liquid Touch Weightless Foundation',
        shade: '240N',
        price: 29.00,
        rating: 4.3,
        reviewCount: 654,
        availability: {
          online: true,
          inStore: true,
          readyForPickup: true,
          nearbyStores: ['Sephora - Westfield']
        },
        matchPercentage: 89,
        undertone: 'neutral',
        coverage: 'medium',
        finish: 'natural',
        imageUrl: '/placeholder.svg'
      }
    ];
    
    setMatches(mockMatches);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <FoundationInput onSubmit={handleFoundationSubmit} />
          {matches.length > 0 && (
            <ProductRecommendations 
              matches={matches}
              onSelectMatch={setSelectedMatch}
              currentFoundation={currentFoundation}
            />
          )}
        </div>
        <div className="lg:col-span-1">
          <VirtualTryOn selectedMatch={selectedMatch} />
        </div>
      </div>
    </div>
  );
};

export default FoundationMatcher;
