import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface FoundationMatch {
  brand: string;
  product: string;
  shade_name: string;
  hex: string;
  undertone: string;
  url?: string;
  img?: string;
  score: number;
}

export default function LightingAwareFoundationMatcher() {
  const [userHex, setUserHex] = useState("#E5C19E");
  const [cct, setCct] = useState(4000);
  const [cri, setCri] = useState(85);
  const [loading, setLoading] = useState(false);
  const [topMatches, setTopMatches] = useState<FoundationMatch[]>([]);
  const [perimeterOptions, setPerimeterOptions] = useState<FoundationMatch[]>([]);

  const runMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
    const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    const FN_PATH = `${SUPABASE_URL}/functions/v1/match-foundations`;

    try {
      const res = await fetch(FN_PATH, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          user_hex: userHex,
          lighting_cct_k: Number(cct),
          lighting_cri: Number(cri),
          n_results: 5
        })
      });

      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Unknown error");

      setTopMatches(data.top_matches || []);
      setPerimeterOptions(data.perimeter_options || []);
      toast.success("Found your perfect matches!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to match foundations");
      console.error('Match error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Card className="p-6 mb-6">
        <h2 className="text-2xl font-bold mb-2">Lighting-Aware Foundation Matcher</h2>
        <p className="text-muted-foreground mb-6">
          Get precise foundation matches that account for lighting conditions and undertones.
        </p>

        <form onSubmit={runMatch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="hex">Skin Hex Color</Label>
            <Input
              id="hex"
              value={userHex}
              onChange={(e) => setUserHex(e.target.value)}
              placeholder="#E5C19E"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cct">Lighting CCT (K)</Label>
            <Input
              id="cct"
              type="number"
              value={cct}
              onChange={(e) => setCct(Number(e.target.value))}
              min={2500}
              max={7500}
              step={100}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cri">CRI (0-100)</Label>
            <Input
              id="cri"
              type="number"
              value={cri}
              onChange={(e) => setCri(Number(e.target.value))}
              min={60}
              max={100}
              step={1}
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Matching...
                </>
              ) : (
                "Find Matches"
              )}
            </Button>
          </div>
        </form>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Top Matches</h3>
          <MatchTable items={topMatches} />
        </Card>
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Perimeter Options</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Slightly darker shades for contouring and blending
          </p>
          <MatchTable items={perimeterOptions} />
        </Card>
      </div>
    </div>
  );
}

function MatchTable({ items }: { items: FoundationMatch[] }) {
  if (!items || items.length === 0) {
    return <div className="text-muted-foreground text-center py-8">Run the matcher to see results</div>;
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full border-collapse">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left py-2 px-3 text-xs font-medium">Shade</th>
            <th className="text-left py-2 px-3 text-xs font-medium">Brand</th>
            <th className="text-left py-2 px-3 text-xs font-medium">Product</th>
            <th className="text-left py-2 px-3 text-xs font-medium">UT</th>
            <th className="text-left py-2 px-3 text-xs font-medium">Swatch</th>
            <th className="text-left py-2 px-3 text-xs font-medium">Link</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i} className="border-t hover:bg-muted/30 transition-colors">
              <td className="py-3 px-3 text-sm">{item.shade_name}</td>
              <td className="py-3 px-3 text-sm">{item.brand}</td>
              <td className="py-3 px-3 text-sm">{item.product}</td>
              <td className="py-3 px-3 text-sm capitalize">{item.undertone}</td>
              <td className="py-3 px-3">
                <div
                  className="w-5 h-5 rounded border"
                  style={{ backgroundColor: item.hex }}
                  title={item.hex}
                />
              </td>
              <td className="py-3 px-3 text-sm">
                {item.url ? (
                  <a href={item.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                    View
                  </a>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
