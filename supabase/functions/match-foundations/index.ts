import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { hexToOKLab, oklabDistance, adjustOKLabForLighting, undertoneFromOKLab } from './color.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { user_hex, lighting_cct_k = 4000, lighting_cri = 80, n_results = 5 } = await req.json();

    const validHex = (value: unknown): value is string =>
      typeof value === 'string' && /^#?(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value);
    if (!validHex(user_hex) || !Number.isFinite(lighting_cct_k) || lighting_cct_k < 2500 || lighting_cct_k > 7500 ||
        !Number.isFinite(lighting_cri) || lighting_cri < 0 || lighting_cri > 100 ||
        !Number.isInteger(n_results) || n_results < 1 || n_results > 20) {
      return new Response(JSON.stringify({ ok: false, error: 'Invalid color, lighting, or result count' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Reuse the authenticated client (anon key + user's Bearer token) instead of service_role
    const supabase = authClient;

    // Query Sephora products only
    const { data, error } = await supabase
      .from('sephoraproductsbyskintone')
      .select('brand, product, name, "Swatch: imgSrc", specific, url, "imgSrc"')
      .not('"Swatch: imgSrc"', 'is', null)
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

    const scored = (data || []).filter((r: Record<string, unknown>) => validHex(r['Swatch: imgSrc'])).map((r: any) => {
      const hex = r['Swatch: imgSrc']; // Sephora hex color
      const ok = hexToOKLab(hex);
      const dist = oklabDistance(userAdj, ok);
      const undertone = getUndertone(r.name || r.specific || '');
      const utPenalty = undertone === userUT ? 1.0 : 1.1;
      const score = dist * utPenalty;
      return { 
        brand: r.brand, 
        product: r.product, 
        shade_name: r.name, 
        hex: hex, 
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
    if (!base) {
      return new Response(JSON.stringify({ ok: true, top_matches: [], perimeter_options: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
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
    console.error('Match foundations error:', e instanceof Error ? e.message : String(e));
    return new Response(JSON.stringify({ 
      ok: false, 
      error: 'Internal server error' 
    }), { 
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
