
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search } from 'lucide-react';

interface Brand {
  id: string;
  name: string;
  logo_url: string;
  is_active: boolean;
}

interface FoundationInputProps {
  onSubmit: (brand: string, shade: string, userHexColor: string) => void;
  brands: Brand[];
}

const FoundationInput = ({ onSubmit, brands }: FoundationInputProps) => {
  const [selectedBrand, setSelectedBrand] = useState('');
  const [shadeInput, setShadeInput] = useState('');
  const [userHexColorInput, setUserHexColorInput] = useState(''); // New state for hex color

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedBrand && shadeInput.trim() && userHexColorInput.trim()) {
      onSubmit(selectedBrand, shadeInput.trim(), userHexColorInput.trim());
    }
  };

  return (
    <Card className="bg-white/70 backdrop-blur-sm shadow-xl border-0 mb-8">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-gray-800 mb-2">
          Enter Your Current Foundation
        </CardTitle>
        <p className="text-gray-600">
          Tell us what foundation you're currently using and we'll find similar shades across all brands
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Brand</label>
            <Select value={selectedBrand} onValueChange={setSelectedBrand}>
              <SelectTrigger className="w-full h-12 border-rose-200 focus:border-rose-400">
                <SelectValue placeholder="Select your foundation brand" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {brands.map((brand) => (
                  <SelectItem key={brand.id} value={brand.name}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Shade Name/Number</label>
            <Input
              type="text"
              placeholder="e.g., 220, Medium Beige, NC30"
              value={shadeInput}
              onChange={(e) => setShadeInput(e.target.value)}
              className="h-12 border-rose-200 focus:border-rose-400"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Current Foundation Hex Color</label>
            <Input
              type="text"
              placeholder="e.g., #F4D5B4"
              value={userHexColorInput}
              onChange={(e) => setUserHexColorInput(e.target.value)}
              className="h-12 border-rose-200 focus:border-rose-400"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 bg-gradient-to-r from-rose-500 to-purple-500 hover:from-rose-600 hover:to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
            disabled={!selectedBrand || !shadeInput.trim()}
          >
            <Search className="w-5 h-5 mr-2" />
            Find Similar Shades
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default FoundationInput;
