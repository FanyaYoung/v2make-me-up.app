import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, ExternalLink, Sparkles } from 'lucide-react';

interface RecommendedProduct {
  brand: string;
  product: string;
  name: string;
  hex: string;
  imgSrc: string;
  url: string;
  'Swatch: hex': string;
  'Swatch: imgSrc': string;
  'Swatch: url': string;
  lightness: number;
  categories: string;
}

const RecommendedFoundations = () => {
  const { data: products, isLoading } = useQuery({
    queryKey: ['recommended-foundations'],
    queryFn: async () => {
      // Fetch a diverse set of foundations from productsandshadeswithimages
      const { data, error } = await supabase
        .from('productsandshadeswithimages')
        .select('*')
        .not('imgSrc', 'is', null)
        .not('hex', 'is', null)
        .limit(100);

      if (error) throw error;

      // Deduplicate by brand+product, pick diverse brands, limit to 24
      const seen = new Map<string, RecommendedProduct>();
      for (const item of (data as RecommendedProduct[])) {
        const key = `${item.brand}__${item.product}__${item.name}`;
        if (!seen.has(key) && item.imgSrc && item.hex) {
          seen.set(key, item);
        }
      }

      // Group by brand, take up to 2 per brand for variety
      const byBrand = new Map<string, RecommendedProduct[]>();
      for (const item of seen.values()) {
        const arr = byBrand.get(item.brand) || [];
        if (arr.length < 2) {
          arr.push(item);
          byBrand.set(item.brand, arr);
        }
      }

      const result: RecommendedProduct[] = [];
      for (const items of byBrand.values()) {
        result.push(...items);
        if (result.length >= 24) break;
      }

      return result.slice(0, 24);
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-rose-500" />
          Recommended For You
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <Card key={i} className="animate-pulse border-0 shadow">
              <div className="aspect-square bg-muted rounded-t-lg" />
              <CardContent className="p-3 space-y-2">
                <div className="h-3 bg-muted rounded w-2/3" />
                <div className="h-4 bg-muted rounded w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!products?.length) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-rose-500" />
          Recommended Foundations
        </h2>
        <Badge variant="outline" className="text-muted-foreground">
          {products.length} picks
        </Badge>
      </div>
      <p className="text-muted-foreground text-sm">
        Curated foundation shades from top brands — find your next perfect match.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {products.map((product, index) => {
          const swatchHex = product['Swatch: hex'] || product.hex;

          return (
            <Card
              key={`${product.brand}-${product.name}-${index}`}
              className="group border-0 shadow hover:shadow-xl transition-all duration-300 overflow-hidden bg-card"
            >
              <div className="aspect-square relative overflow-hidden bg-muted">
                <img
                  src={product.imgSrc}
                  alt={`${product.brand} ${product.name}`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = target.parentElement?.querySelector('.fallback') as HTMLDivElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
                <div
                  className="fallback absolute inset-0 hidden items-center justify-center"
                  style={{ backgroundColor: swatchHex?.startsWith('#') ? swatchHex : `#${swatchHex}` }}
                >
                  <span className="text-white text-xs font-bold text-center px-2">{product.brand}</span>
                </div>

                {/* Shade swatch strip */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-3"
                  style={{ backgroundColor: swatchHex?.startsWith('#') ? swatchHex : `#${swatchHex}` }}
                />
              </div>

              <CardContent className="p-3">
                <div className="space-y-1">
                  <p className="text-[11px] text-muted-foreground font-medium truncate uppercase tracking-wide">
                    {product.brand}
                  </p>
                  <h3 className="font-semibold text-sm line-clamp-2 min-h-[2.5rem] text-card-foreground">
                    {product.name}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate">{product.product}</p>

                  <div className="flex items-center gap-2 pt-1">
                    <div
                      className="w-5 h-5 rounded-full border border-border shadow-sm"
                      style={{ backgroundColor: swatchHex?.startsWith('#') ? swatchHex : `#${swatchHex}` }}
                      title={`Shade: ${swatchHex}`}
                    />
                    <span className="text-[10px] text-muted-foreground">{swatchHex}</span>
                  </div>

                  {product.url && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full mt-2 text-xs"
                      onClick={() => window.open(product.url, '_blank', 'noopener')}
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      View Product
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default RecommendedFoundations;
