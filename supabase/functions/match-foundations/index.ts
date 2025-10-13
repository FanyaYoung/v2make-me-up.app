import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { hexToOKLab, oklabDistance, adjustOKLabForLighting, undertoneFromOKLab } from './color.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_hex, lighting_cct_k = 4000, lighting_cri = 80, n_results = 5 } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Query the foundation catalog
    const { data, error } = await supabase
      .from('productsandshadeswithimages')
      .select('brand, product, name, hex, specific, url, "imgSrc"')
      .not('hex', 'is', null)
      .limit(5000);

    if (error) throw error;

    const userOK = hexToOKLab(user_hex);
    const userAdj = adjustOKLabForLighting(userOK, lighting_cct_k, lighting_cri);
    const userUT = undertoneFromOKLab(userOK);

    // Map undertone from shade name
    const getUndertone = (shadeName: string): "cool" | "neutral" | "warm" => {
      if (/\bNC\d+/i.test(shadeName)) return "warm";
      if (/\bNW\d+/i.test(shadeName)) return "cool";
      if (/cool|pink|rose/i.test(shadeName)) return "cool";
      if (/warm|yellow|golden/i.test(shadeName)) return "warm";
      return "neutral";
    };

    const scored = data.map((r: any) => {
      const ok = hexToOKLab(r.hex);
      const dist = oklabDistance(userAdj, ok);
      const undertone = getUndertone(r.name || r.specific || '');
      const utPenalty = undertone === userUT ? 1.0 : 0.9;
      const score = dist * utPenalty;
      return { 
        brand: r.brand, 
        product: r.product, 
        shade_name: r.name, 
        hex: r.hex, 
        undertone,
        url: r.url,
        img: r.imgSrc,
        score, 
        ok 
      };
    }).sort((a: any, b: any) => a.score - b.score);

    const top_matches = scored.slice(0, n_results);

    // Find perimeter options (3-12% darker)
    const base = top_matches[0];
    const targetL = base.ok.L;
    const darker = scored.filter((x: any) => {
      const dL = targetL - x.ok.L;
      return dL >= 0.03 && dL <= 0.12;
    }).sort((a: any, b: any) => {
      const utA = (a.undertone === base.undertone) ? 1 : 0;
      const utB = (b.undertone === base.undertone) ? 1 : 0;
      return (utB - utA) || (a.score - b.score);
    }).slice(0, 3);

    return new Response(JSON.stringify({
      ok: true,
      top_matches: top_matches.map(({ ok, ...x }: any) => x),
      perimeter_options: darker.map(({ ok, ...x }: any) => x)
    }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });

  } catch (e) {
    console.error('Match foundations error:', e);
    return new Response(JSON.stringify({ 
      ok: false, 
      error: e instanceof Error ? e.message : String(e) 
    }), { 
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
