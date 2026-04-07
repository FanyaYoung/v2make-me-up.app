import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CACHE_TTL_MINUTES = 30;

type PricingRequest = {
  brand?: string;
  product?: string;
  forceRefresh?: boolean;
};

type RakutenProduct = {
  name?: string;
  brand?: string;
  description?: string;
  price?: number;
  salePrice?: number | null;
  imageUrl?: string;
  productUrl?: string;
  originalUrl?: string;
  inStock?: boolean;
};

const normalize = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const makeProductKey = (brand: string, product: string) =>
  `${normalize(brand)}|${normalize(product)}`;

const scoreCandidate = (candidate: RakutenProduct, brand: string, product: string) => {
  const brandNeedle = normalize(brand);
  const productNeedle = normalize(product);
  const haystack = normalize(`${candidate.brand || ""} ${candidate.name || ""}`);

  let score = 0;
  if (brandNeedle && haystack.includes(brandNeedle)) score += 3;
  if (productNeedle && haystack.includes(productNeedle)) score += 4;

  for (const token of productNeedle.split(" ").filter(Boolean)) {
    if (token.length >= 3 && haystack.includes(token)) score += 1;
  }

  if (typeof candidate.salePrice === "number" && candidate.salePrice > 0) score += 1;
  if (typeof candidate.price === "number" && candidate.price > 0) score += 1;
  return score;
};

const fetchRakutenProducts = async (brand: string, product: string): Promise<RakutenProduct[]> => {
  const keywords = encodeURIComponent(`${brand} ${product} foundation makeup`.trim());
  const rakutenUrl = `https://api.linksynergy.com/productsearch/1.0?keyword=${keywords}&max=5&pagenumber=1&sort=productname&sorttype=asc&language=en_US&cat=beauty`;

  const response = await fetch(rakutenUrl, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Rakuten API returned ${response.status}`);
  }

  const data = await response.json();
  const rakutenToken = Deno.env.get("RAKUTEN_ADVERTISING_TOKEN");

  return await Promise.all(
    (data.item || []).map(async (item: Record<string, unknown>) => {
      const merchantId = String(item.mid || "99999");
      const productUrl = String(item.linkurl || item.link || "");
      let affiliateUrl = productUrl;

      if (rakutenToken && productUrl) {
        try {
          const deepLinkResponse = await fetch("https://api.linksynergy.com/v1/deeplink", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${rakutenToken}`,
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              url: productUrl,
              advertiser_id: parseInt(merchantId, 10),
              u1: "makeup-matcher",
            }),
          });

          if (deepLinkResponse.ok) {
            const deepLinkData = await deepLinkResponse.json();
            affiliateUrl =
              deepLinkData.advertiser?.deep_link?.deep_link_url ||
              deepLinkData.deep_link_url ||
              productUrl;
          }
        } catch (_error) {
          // Keep original URL if deeplink generation fails.
        }
      }

      return {
        name: String(item.productname || item.title || ""),
        brand: String(item.merchantname || brand),
        description: String(item.description || ""),
        price: parseFloat(String(item.price || "0").replace(/[^0-9.]/g, "")) || undefined,
        salePrice: item.saleprice
          ? parseFloat(String(item.saleprice).replace(/[^0-9.]/g, "")) || null
          : null,
        imageUrl: String(item.imageurl || item.thumbnailimage || ""),
        productUrl: affiliateUrl,
        originalUrl: productUrl,
        inStock: item.isclearance !== "Yes",
      };
    })
  );
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await anonClient.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: PricingRequest = await req.json();
    const brand = body.brand?.trim();
    const product = body.product?.trim();
    const forceRefresh = Boolean(body.forceRefresh);

    if (!brand || !product) {
      return new Response(JSON.stringify({ error: "brand and product are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const productKey = makeProductKey(brand, product);
    const { data: cachedRow } = await serviceClient
      .from("live_product_prices")
      .select("*")
      .eq("product_key", productKey)
      .maybeSingle();

    const isFresh =
      cachedRow &&
      !forceRefresh &&
      cachedRow.expires_at &&
      new Date(cachedRow.expires_at).getTime() > Date.now();

    if (isFresh) {
      return new Response(
        JSON.stringify({
          price: cachedRow.price,
          salePrice: cachedRow.sale_price,
          imageUrl: cachedRow.image_url,
          productUrl: cachedRow.product_url,
          affiliateUrl: cachedRow.affiliate_url,
          retailer: cachedRow.retailer,
          checkedAt: cachedRow.last_checked_at,
          source: "live",
          cached: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    try {
      const products = await fetchRakutenProducts(brand, product);
      const best = products.sort((a, b) => scoreCandidate(b, brand, product) - scoreCandidate(a, brand, product))[0];

      const now = new Date();
      const expiresAt = new Date(now.getTime() + CACHE_TTL_MINUTES * 60 * 1000);

      const upsertPayload = {
        product_key: productKey,
        brand,
        product,
        retailer: best?.brand || cachedRow?.retailer || null,
        source: best ? "rakuten" : cachedRow ? "cache" : "unavailable",
        currency: "USD",
        price: best?.salePrice ?? best?.price ?? null,
        sale_price: best?.salePrice ?? null,
        image_url: best?.imageUrl || cachedRow?.image_url || null,
        product_url: best?.originalUrl || cachedRow?.product_url || null,
        affiliate_url: best?.productUrl || cachedRow?.affiliate_url || null,
        availability: best ? (best.inStock ? "in_stock" : "unknown") : cachedRow?.availability || "unknown",
        raw_payload: best || cachedRow?.raw_payload || null,
        last_checked_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
      };

      const { data: savedRow, error: upsertError } = await serviceClient
        .from("live_product_prices")
        .upsert(upsertPayload, { onConflict: "product_key" })
        .select("*")
        .single();

      if (upsertError) throw upsertError;

      return new Response(
        JSON.stringify({
          price: savedRow.price,
          salePrice: savedRow.sale_price,
          imageUrl: savedRow.image_url,
          productUrl: savedRow.product_url,
          affiliateUrl: savedRow.affiliate_url,
          retailer: savedRow.retailer,
          checkedAt: savedRow.last_checked_at,
          source: "live",
          cached: false,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (refreshError) {
      if (cachedRow) {
        return new Response(
          JSON.stringify({
            price: cachedRow.price,
            salePrice: cachedRow.sale_price,
            imageUrl: cachedRow.image_url,
            productUrl: cachedRow.product_url,
            affiliateUrl: cachedRow.affiliate_url,
            retailer: cachedRow.retailer,
            checkedAt: cachedRow.last_checked_at,
            source: "cache",
            cached: true,
            warning: refreshError instanceof Error ? refreshError.message : "Live refresh failed",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw refreshError;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Service temporarily unavailable";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
