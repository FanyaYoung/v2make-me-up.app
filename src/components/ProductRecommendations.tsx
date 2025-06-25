
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { FoundationMatch } from '../types/foundation';

interface ProductRecommendationsProps {
  matches: FoundationMatch[];
  onSelectMatch: (match: FoundationMatch) => void;
  currentFoundation: {brand: string, shade: string} | null;
}

const ProductRecommendations = ({ matches, onSelectMatch, currentFoundation }: ProductRecommendationsProps) => {
  // Enhanced product images for better visual appeal
  const productImages = [
    "https://images.unsplash.com/photo-1631214540242-0671f8420636?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=2030&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=2126&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Perfect Matches Found</h2>
        <p className="text-gray-600">
          Based on your {currentFoundation?.brand} {currentFoundation?.shade}, here are similar shades:
        </p>
      </div>
      
      <div className="grid gap-6">
        {matches.map((match, index) => (
          <Card key={match.id} className="bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 border-0 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-shrink-0">
                  <img 
                    src={productImages[index] || productImages[0]}
                    alt={`${match.brand} ${match.product}`}
                    className="w-32 h-32 object-cover rounded-lg shadow-md"
                  />
                </div>
                
                <div className="flex-grow space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800">{match.brand}</h3>
                      <p className="text-gray-600 font-medium">{match.product}</p>
                      <p className="text-rose-600 font-semibold">{match.shade}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-800">${match.price}</div>
                      <Badge variant="secondary" className="bg-gradient-to-r from-green-100 to-green-200 text-green-800">
                        {match.matchPercentage}% Match
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="border-rose-200 text-rose-700">
                      {match.undertone} undertone
                    </Badge>
                    <Badge variant="outline" className="border-purple-200 text-purple-700">
                      {match.coverage} coverage
                    </Badge>
                    <Badge variant="outline" className="border-blue-200 text-blue-700">
                      {match.finish} finish
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={`text-xs ${i < Math.floor(match.rating) ? 'text-yellow-400' : 'text-gray-300'}`}>
                            ★
                          </span>
                        ))}
                      </div>
                      <span>{match.rating} ({match.reviewCount} reviews)</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2 text-sm">
                      {match.availability.online && (
                        <Badge className="bg-green-100 text-green-800">Available Online</Badge>
                      )}
                      {match.availability.inStore && (
                        <Badge className="bg-blue-100 text-blue-800">In Store</Badge>
                      )}
                      {match.availability.readyForPickup && (
                        <Badge className="bg-purple-100 text-purple-800">Ready for Pickup</Badge>
                      )}
                    </div>
                    
                    {match.availability.nearbyStores.length > 0 && (
                      <p className="text-sm text-gray-600">
                        Available at: {match.availability.nearbyStores.join(', ')}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex gap-3 pt-2">
                    <Button 
                      onClick={() => onSelectMatch(match)}
                      className="bg-gradient-to-r from-rose-500 to-purple-500 hover:from-rose-600 hover:to-purple-600 text-white"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Virtual Try-On
                    </Button>
                    <Button variant="outline" className="border-rose-200 text-rose-700 hover:bg-rose-50">
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ProductRecommendations;
