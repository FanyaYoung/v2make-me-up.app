import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Globe, MapPin, Search } from 'lucide-react';

interface HeritageGlobeProps {
  onLocationSelect: (locationData: { country: string; region: string; coordinates?: [number, number] }) => void;
}

const HeritageGlobe = ({ onLocationSelect }: HeritageGlobeProps) => {
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('');

  // Popular regions for heritage selection
  const regions = [
    { name: 'Northern Europe', countries: ['United Kingdom', 'Ireland', 'Scandinavia', 'Germany', 'Netherlands'] },
    { name: 'Southern Europe', countries: ['Italy', 'Spain', 'Greece', 'Portugal', 'Malta'] },
    { name: 'Eastern Europe', countries: ['Poland', 'Russia', 'Ukraine', 'Czech Republic', 'Hungary'] },
    { name: 'Western Europe', countries: ['France', 'Belgium', 'Switzerland', 'Austria', 'Luxembourg'] },
    { name: 'East Asia', countries: ['China', 'Japan', 'Korea', 'Mongolia', 'Taiwan'] },
    { name: 'Southeast Asia', countries: ['Thailand', 'Vietnam', 'Philippines', 'Indonesia', 'Malaysia'] },
    { name: 'South Asia', countries: ['India', 'Pakistan', 'Bangladesh', 'Sri Lanka', 'Nepal'] },
    { name: 'Middle East', countries: ['Turkey', 'Iran', 'Arab Peninsula', 'Israel', 'Lebanon'] },
    { name: 'North Africa', countries: ['Egypt', 'Morocco', 'Algeria', 'Tunisia', 'Libya'] },
    { name: 'Sub-Saharan Africa', countries: ['Nigeria', 'Kenya', 'Ethiopia', 'South Africa', 'Ghana'] },
    { name: 'North America', countries: ['United States', 'Canada', 'Mexico', 'Indigenous Americas'] },
    { name: 'Central America', countries: ['Guatemala', 'Honduras', 'Costa Rica', 'Panama', 'Nicaragua'] },
    { name: 'South America', countries: ['Brazil', 'Argentina', 'Colombia', 'Peru', 'Chile'] },
    { name: 'Caribbean', countries: ['Jamaica', 'Cuba', 'Dominican Republic', 'Puerto Rico', 'Trinidad'] },
    { name: 'Oceania', countries: ['Australia', 'New Zealand', 'Pacific Islands', 'Papua New Guinea'] }
  ];

  const filteredRegions = regions.filter(region =>
    searchQuery === '' || 
    region.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    region.countries.some(country => country.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleLocationConfirm = () => {
    if (selectedLocation && selectedRegion) {
      onLocationSelect({
        country: selectedLocation,
        region: selectedRegion
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="w-5 h-5" />
          Ancestral Heritage
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Select your birthplace or ancestral origin to help us understand your unique skin characteristics
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search for a region or country..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* 3D Globe Placeholder - Interactive World Map */}
        <div className="relative h-64 bg-gradient-to-b from-blue-50 to-green-50 rounded-lg border overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-2">
              <Globe className="w-16 h-16 mx-auto text-blue-500 animate-spin" style={{ animationDuration: '10s' }} />
              <p className="text-sm text-muted-foreground">Interactive 3D Globe</p>
              <p className="text-xs text-muted-foreground">Click on regions below to explore</p>
            </div>
          </div>
          
          {/* Simulated continents as clickable areas */}
          <svg viewBox="0 0 400 200" className="absolute inset-0 w-full h-full opacity-20">
            {/* Africa */}
            <path d="M180 80 L200 70 L220 80 L210 120 L190 130 L170 110 Z" fill="#8B5A3C" className="hover:opacity-80 cursor-pointer" />
            {/* Europe */}
            <path d="M160 50 L180 45 L200 50 L190 70 L170 65 Z" fill="#DEB887" className="hover:opacity-80 cursor-pointer" />
            {/* Asia */}
            <path d="M200 40 L280 35 L300 60 L280 80 L200 70 Z" fill="#F4A460" className="hover:opacity-80 cursor-pointer" />
            {/* Americas */}
            <path d="M60 50 L100 45 L110 90 L90 130 L70 120 L50 80 Z" fill="#CD853F" className="hover:opacity-80 cursor-pointer" />
          </svg>
        </div>

        {/* Region Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
          {filteredRegions.map((region) => (
            <div key={region.name} className="space-y-1">
              <Button
                variant={selectedRegion === region.name ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setSelectedRegion(region.name);
                  setSelectedLocation('');
                }}
                className="w-full justify-start text-left h-auto p-2"
              >
                <MapPin className="w-3 h-3 mr-2 flex-shrink-0" />
                <span className="font-medium">{region.name}</span>
              </Button>
            </div>
          ))}
        </div>

        {/* Country Selection */}
        {selectedRegion && (
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Select specific country/area in {selectedRegion}:
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {regions.find(r => r.name === selectedRegion)?.countries.map((country) => (
                <Button
                  key={country}
                  variant={selectedLocation === country ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedLocation(country)}
                  className="text-xs justify-start"
                >
                  {country}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Confirm Selection */}
        {selectedLocation && selectedRegion && (
          <div className="pt-4 border-t">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium">
                Selected: {selectedLocation}, {selectedRegion}
              </span>
            </div>
            <Button onClick={handleLocationConfirm} className="w-full">
              <Globe className="w-4 h-4 mr-2" />
              Confirm Heritage Selection
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HeritageGlobe;