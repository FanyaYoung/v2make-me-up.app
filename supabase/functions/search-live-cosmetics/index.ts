import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ProviderName = "rakuten" | "ulta";

type SearchRequest = {
  keywords?: string;
  brand?: string;
  productName?: string;
  category?: "foundation" | "makeup" | "all";
  limit?: number;
  providers?: ProviderName[];
};

type LiveCosmeticResult = {
  id: string;
  provider: ProviderName;
  brand: string;
  name: string;
  price: number;
  salePrice?: number | null;
  rating?: number;
  reviewCount?: number;
  imageUrl?: string;
  productUrl?: string;
  affiliateUrl?: string;
  retailer?: string;
  inStock?: boolean;
  category: "foundation" | "makeup";
  shades?: Array<{
    name: string;
    hex?: string;
    available?: boolean;
  }>;
};

const normalize = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const FOUNDATION_HINTS = [
  "foundation",
  "skin tint",
  "tinted moisturizer",
  "bb cream",
  "cc cream",
  "powder foundation",
  "serum foundation",
];

function inferCategory(text: string): "foundation" | "makeup" {
  const normalized = normalize(text);
  return FOUNDATION_HINTS.some((hint) => normalized.includes(hint))
    ? "foundation"
    : "makeup";
}

function clampLimit(value: unknown, fallback = 20) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(1, Math.min(50, Math.trunc(parsed)));
}

function makeKeywords(body: SearchRequest) {
  const category = body.category && body.category !== "all" ? body.category : "makeup";
  return (
    body.keywords ||
    `${body.brand || ""} ${body.productName || ""} ${category}`.trim() ||
    "foundation makeup"
  ).trim();
}

async function authenticate(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { error: unauthorizedResponse(), authHeader: null };
  }

  const anonClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const token = authHeader.replace("Bearer ", "");
  const { data: userData, error: userError } = await anonClient.auth.getUser(token);
  if (userError || !userData.user) {
    return { error: unauthorizedResponse(), authHeader: null };
  }

  return { error: null, authHeader };
}

function unauthorizedResponse() {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function invokeFunction(
  functionName: string,
  authHeader: string,
  body: Record<string, unknown>,
) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  if (!supabaseUrl) {
    throw new Error("Missing SUPABASE_URL");
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(`${functionName} failed with ${response.status}`);
  }

  return data;
}

function normalizeRakutenProducts(data: any): LiveCosmeticResult[] {
  const products = Array.isArray(data?.products) ? data.products : [];
  return products.map((product: any) => ({
    id: String(product.id || product.merchantId || product.name),
    provider: "rakuten" as const,
    brand: String(product.brand || product.merchantname || "Unknown Brand"),
    name: String(product.name || "Unknown Product"),
    price: Number(product.salePrice ?? product.price ?? 0),
    salePrice:
      product.salePrice == null ? null : Number(product.salePrice),
    imageUrl: product.imageUrl || undefined,
    productUrl: product.originalUrl || product.productUrl || undefined,
    affiliateUrl: product.productUrl || undefined,
    retailer: product.brand || "Rakuten",
    inStock: Boolean(product.inStock),
    category: inferCategory(`${product.name || ""} ${product.description || ""}`),
  }));
}

function normalizeUltaProducts(data: any): LiveCosmeticResult[] {
  const products = Array.isArray(data?.products) ? data.products : [];
  return products.map((product: any) => ({
    id: String(product.id || product.name),
    provider: "ulta" as const,
    brand: String(product.brand || "Ulta Beauty"),
    name: String(product.name || "Unknown Product"),
    price: Number(product.price ?? 0),
    salePrice:
      product.salePrice == null ? null : Number(product.salePrice),
    rating:
      product.rating == null ? undefined : Number(product.rating),
    reviewCount:
      product.reviewCount == null ? undefined : Number(product.reviewCount),
    imageUrl: product.imageUrl || undefined,
    productUrl: product.productUrl || undefined,
    affiliateUrl: product.productUrl || undefined,
    retailer: "Ulta Beauty",
    inStock: Boolean(product.inStock),
    category: inferCategory(`${product.name || ""} ${product.brand || ""}`),
    shades: Array.isArray(product.shades)
      ? product.shades.map((shade: any) => ({
          name: String(shade.name || ""),
          hex: shade.hex || undefined,
          available:
            shade.available == null ? undefined : Boolean(shade.available),
        }))
      : undefined,
  }));
}

function dedupeAndSort(
  products: LiveCosmeticResult[],
  requestedCategory: SearchRequest["category"],
): LiveCosmeticResult[] {
  const seen = new Set<string>();
  const filtered = products.filter((product) => {
    if (requestedCategory && requestedCategory !== "all" && product.category !== requestedCategory) {
      return false;
    }

    const key = normalize(`${product.brand} ${product.name} ${product.provider}`);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return filtered.sort((a, b) => {
    const aScore = (a.inStock ? 2 : 0) + (a.rating || 0) + (a.reviewCount ? Math.min(a.reviewCount / 100, 5) : 0);
    const bScore = (b.inStock ? 2 : 0) + (b.rating || 0) + (b.reviewCount ? Math.min(b.reviewCount / 100, 5) : 0);
    return bScore - aScore;
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const auth = await authenticate(req);
    if (auth.error || !auth.authHeader) {
      return auth.error!;
    }

    const body = (await req.json()) as SearchRequest;
    const keywords = makeKeywords(body);
    const limit = clampLimit(body.limit, 20);
    const providers = body.providers?.length ? body.providers : ["rakuten", "ulta"];

    const tasks: Promise<LiveCosmeticResult[]>[] = [];

    if (providers.includes("rakuten")) {
      tasks.push(
        invokeFunction("rakuten-product-search", auth.authHeader, {
          keywords,
          brand: body.brand,
          productName: body.productName,
          limit,
        }).then(normalizeRakutenProducts).catch(() => []),
      );
    }

    if (providers.includes("ulta")) {
      tasks.push(
        invokeFunction("ulta-product-search", auth.authHeader, {
          keywords,
          brand: body.brand,
          productName: body.productName,
          limit,
        }).then(normalizeUltaProducts).catch(() => []),
      );
    }

    const results = dedupeAndSort((await Promise.all(tasks)).flat(), body.category).slice(0, limit);

    return new Response(
      JSON.stringify({
        query: keywords,
        total: results.length,
        providers,
        products: results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
