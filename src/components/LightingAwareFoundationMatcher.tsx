import React, { useState } from "react";

interface FoundationMatch {
  brand: string;
  product: string;
  shade_name: string;
  hex: string;
  undertone: string;
  url?: string;
  img?: string;
}

export default function LightingAwareFoundationMatcher() {
  const [userHex, setUserHex] = useState("#E5C19E");
  const [cct, setCct] = useState(4000);
  const [cri, setCri] = useState(85);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [top, setTop] = useState<FoundationMatch[]>([]);
  const [perimeter, setPerimeter] = useState<FoundationMatch[]>([]);

  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const FN_PATH = `${SUPABASE_URL}/functions/v1/match-foundations`;

  async function runMatch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    
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

      setTop(data.top_matches || []);
      setPerimeter(data.perimeter_options || []);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-[860px] mx-auto p-4">
      <h2 className="text-2xl font-bold mb-2">Make Me Up — Foundation Matcher</h2>
      <p className="opacity-80 mb-4">
        Lighting-aware, undertone-aware matching. Returns a slightly darker perimeter shade too.
      </p>

      <form onSubmit={runMatch} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end mb-4">
        <label className="grid">
          <span className="text-xs opacity-80 mb-1">Skin HEX</span>
          <input
            value={userHex}
            onChange={(e) => setUserHex(e.target.value)}
            placeholder="#E5C19E"
            className="px-3 py-2.5 border border-border rounded-lg bg-background"
          />
        </label>
        <label className="grid">
          <span className="text-xs opacity-80 mb-1">Lighting CCT (K)</span>
          <input
            type="number"
            value={cct}
            onChange={(e) => setCct(Number(e.target.value))}
            min={2500}
            max={7500}
            step={100}
            className="px-3 py-2.5 border border-border rounded-lg bg-background"
          />
        </label>
        <label className="grid">
          <span className="text-xs opacity-80 mb-1">CRI (0–100)</span>
          <input
            type="number"
            value={cri}
            onChange={(e) => setCri(Number(e.target.value))}
            min={60}
            max={100}
            step={1}
            className="px-3 py-2.5 border border-border rounded-lg bg-background"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2.5 rounded-lg border border-foreground bg-foreground text-background font-semibold disabled:opacity-50"
        >
          {loading ? "Matching..." : "Match"}
        </button>
      </form>

      {error && <div className="text-destructive mb-3">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <h3 className="text-lg font-bold mb-2">Top Matches</h3>
          <Table items={top} empty="Run the matcher to see results." />
        </div>
        <div>
          <h3 className="text-lg font-bold mb-2">Perimeter Options</h3>
          <Table items={perimeter} empty="We'll propose 1–3 slightly darker shades." />
        </div>
      </div>
    </div>
  );
}

function Swatch({ hex }: { hex: string }) {
  return (
    <div
      title={hex}
      className="w-5 h-5 rounded border border-border"
      style={{ backgroundColor: hex }}
    />
  );
}

function Table({ items, empty }: { items: FoundationMatch[]; empty: string }) {
  if (!items?.length) return <div className="opacity-70">{empty}</div>;
  
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <table className="w-full border-collapse">
        <thead className="bg-muted">
          <tr>
            <Th>Shade</Th>
            <Th>Brand</Th>
            <Th>Product</Th>
            <Th>UT</Th>
            <Th>Swatch</Th>
            <Th>Link</Th>
          </tr>
        </thead>
        <tbody>
          {items.map((x, i) => (
            <tr key={i} className="border-t border-border">
              <Td>{x.shade_name}</Td>
              <Td>{x.brand}</Td>
              <Td>{x.product}</Td>
              <Td>{x.undertone}</Td>
              <Td>
                <Swatch hex={x.hex} />
              </Td>
              <Td>
                {x.url ? (
                  <a href={x.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                    View
                  </a>
                ) : (
                  "—"
                )}
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-left py-2.5 px-3 text-xs tracking-wide">
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return (
    <td className="py-2.5 px-3 text-sm">
      {children}
    </td>
  );
}
