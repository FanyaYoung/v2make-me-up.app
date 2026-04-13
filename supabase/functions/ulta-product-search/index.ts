import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type JsonRecord = Record<string, unknown>;

interface UltaProduct {
  id: string;
  name: string;
  brand: string;
  price: number;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  productUrl: string;
  inStock: boolean;
  shades: Array<{
    name: string;
    hex: string;
    available: boolean;
  }>;
}

function getRequiredEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function buildBasicAuthHeader(accountSid: string, authToken: string): string {
  return `Basic ${btoa(`${accountSid}:${authToken}`)}`;
}

function asRecord(value: unknown): JsonRecord | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : null;
}

function asArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  return [value];
}

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed) return trimmed;
    }
  }
  return null;
}

function firstNumber(...values: unknown[]): number | null {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const parsed = Number(value.replace(/[^0-9.-]/g, ""));
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

function firstBoolean(...values: unknown[]): boolean | null {
  for (const value of values) {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (["true", "yes", "y", "1", "instock", "available"].includes(normalized)) return true;
      if (["false", "no", "n", "0", "outofstock", "unavailable"].includes(normalized)) return false;
    }
  }
  return null;
}

function toHttpsUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol === "http:" || url.protocol === "https:") return url.toString();
  } catch {
    return null;
  }
  return null;
}

function toBoundedInt(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = firstNumber(value);
  if (parsed == null) return fallback;
  return Math.max(min, Math.min(max, Math.trunc(parsed)));
}

async function fetchImpactJson(url: string, init: RequestInit) {
  const response = await fetch(url, init);
  const responseText = await response.text();
  let parsedBody: unknown = null;

  try {
    parsedBody = responseText ? JSON.parse(responseText) : null;
  } catch {
    parsedBody = responseText;
  }

  return { response, parsedBody, responseText };
}

function extractCatalogItems(payload: unknown): JsonRecord[] {
  const record = asRecord(payload);
  if (!record) return [];

  const candidateKeys = [
    "Items",
    "CatalogItems",
    "CatalogItem",
    "Item",
    "Results",
    "SearchResults",
  ];

  for (const key of candidateKeys) {
    const raw = record[key];
    const items = asArray(raw).map(asRecord).filter((item): item is JsonRecord => item !== null);
    if (items.length > 0) return items;
  }

  return [];
}

function extractShades(item: JsonRecord): UltaProduct["shades"] {
  const shadesCandidates = [
    item.Shades,
    item.Variants,
    item.Options,
    item.SwatchColors,
  ];

  for (const candidate of shadesCandidates) {
    const shades = asArray(candidate)
      .map(asRecord)
      .filter((shade): shade is JsonRecord => shade !== null)
      .map((shade) => {
        const hex = firstString(
          shade.Hex,
          shade.HexCode,
          shade.ColorHex,
          shade.SwatchHex,
        );
        const name = firstString(
          shade.Name,
          shade.Shade,
          shade.Value,
          shade.DisplayName,
        );

        if (!name) return null;

        return {
          name,
          hex: hex ?? "#D6C2B0",
          available: firstBoolean(
            shade.Available,
            shade.InStock,
            shade.InventoryAvailable,
          ) ?? true,
        };
      })
      .filter((shade): shade is UltaProduct["shades"][number] => shade !== null);

    if (shades.length > 0) return shades;
  }

  return [];
}

function normalizeItem(item: JsonRecord): UltaProduct | null {
  const id = firstString(
    item.Id,
    item.ItemId,
    item.CatalogItemId,
    item.Sku,
    item.UPC,
  );
  const name = firstString(
    item.Name,
    item.ProductName,
    item.Title,
  );

  if (!id || !name) return null;

  const productUrl = toHttpsUrl(firstString(
    item.Url,
    item.URI,
    item.Uri,
    item.ClickUrl,
    item.ProductUrl,
  ));

  return {
    id,
    name,
    brand: firstString(item.Brand, item.BrandName, item.Manufacturer, item.AdvertiserName) ?? "Ulta Beauty",
    price: firstNumber(item.CurrentPrice, item.Price, item.SalePrice, item.BasePrice) ?? 0,
    rating: firstNumber(item.Rating, item.AverageRating, item.ReviewRating) ?? 0,
    reviewCount: firstNumber(item.ReviewCount, item.NumReviews, item.RatingsCount) ?? 0,
    imageUrl: toHttpsUrl(firstString(
      item.ImageUrl,
      item.ImageURL,
      item.LargeImageUrl,
      item.ThumbnailUrl,
      item.ThumbnailURL,
    )) ?? "https://placehold.co/600x600?text=Ulta",
    productUrl: productUrl ?? "https://www.ulta.com/",
    inStock: firstBoolean(
      item.InStock,
      item.Available,
      item.InventoryAvailable,
      item.StockAvailable,
    ) ?? true,
    shades: extractShades(item),
  };
}

async function createTrackingLink(
  accountSid: string,
  authToken: string,
  baseUrl: string,
  campaignId: string | null,
  destinationUrl: string | null,
) {
  if (!campaignId || !destinationUrl) return null;

  const trackingUrl = `${baseUrl}/Mediapartners/${encodeURIComponent(accountSid)}/Programs/${encodeURIComponent(campaignId)}/TrackingLinks`;
  const body = new URLSearchParams({
    DestinationUrl: destinationUrl,
  });

  const response = await fetch(trackingUrl, {
    method: "POST",
    headers: {
      Authorization: buildBasicAuthHeader(accountSid, authToken),
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body,
  });

  const responseText = await response.text();
  if (!response.ok) {
    console.error("Impact tracking-link creation failed", trackingUrl, response.status, responseText);
    return null;
  }

  let parsedBody: unknown = null;
  try {
    parsedBody = responseText ? JSON.parse(responseText) : null;
  } catch {
    parsedBody = responseText;
  }

  const record = asRecord(parsedBody);
  return toHttpsUrl(firstString(
    record?.TrackingLink,
    record?.TrackingUrl,
    record?.ClickUrl,
    record?.Uri,
    record?.Url,
  ));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      getRequiredEnv("SUPABASE_URL"),
      getRequiredEnv("SUPABASE_ANON_KEY"),
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const query = firstString(body.query, body.keywords, body.search);
    const limit = toBoundedInt(body.limit, 12, 1, 50);

    if (!query) {
      return new Response(JSON.stringify({ error: "Search query is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const accountSid = getRequiredEnv("ULTA_AFFILIATE_ACCOUNT_SID");
    const authToken = getRequiredEnv("ULTA_AFFILIATE_AUTH_TOKEN");
    const baseUrl = (Deno.env.get("ULTA_AFFILIATE_API_BASE_URL") ?? "https://api.impact.com").replace(/\/$/, "");

    const itemSearchUrl = `${baseUrl}/Mediapartners/${encodeURIComponent(accountSid)}/Catalogs/ItemSearch?${new URLSearchParams({
      Keyword: query,
      PageSize: String(limit),
      Page: "1",
    }).toString()}`;

    console.log("Searching Ulta catalog", { itemSearchUrl, query, limit });

    const { response, parsedBody, responseText } = await fetchImpactJson(itemSearchUrl, {
      method: "GET",
      headers: {
        Authorization: buildBasicAuthHeader(accountSid, authToken),
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.error("Ulta catalog search failed", response.status, responseText);
      return new Response(JSON.stringify({
        products: [],
        total: 0,
        diagnostics: {
          endpoint: itemSearchUrl,
          status: response.status,
          body: parsedBody,
        },
        message: "Ulta catalog search failed",
      }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rawItems = extractCatalogItems(parsedBody);
    const products = (await Promise.all(rawItems.map(async (item) => {
      const normalized = normalizeItem(item);
      if (!normalized) return null;

      const campaignId = firstString(item.CampaignId, item.ProgramId);
      const destinationUrl = toHttpsUrl(firstString(
        item.Url,
        item.URI,
        item.Uri,
        item.ProductUrl,
      ));

      const trackingLink = await createTrackingLink(
        accountSid,
        authToken,
        baseUrl,
        campaignId,
        destinationUrl,
      );

      return {
        ...normalized,
        productUrl: trackingLink ?? normalized.productUrl,
      };
    }))).filter((product): product is UltaProduct => product !== null);

    await supabase.from("user_activity").insert({
      user_id: userId,
      activity_type: "ulta_search",
      activity_data: {
        query,
        results_count: products.length,
        source: "impact",
      },
    });

    const payloadRecord = asRecord(parsedBody);
    const total = toBoundedInt(payloadRecord?.["@total"], products.length, 0, 100000);

    return new Response(JSON.stringify({
      products,
      total,
      source: "impact",
      diagnostics: {
        endpoint: itemSearchUrl,
        rawCount: rawItems.length,
      },
      message: products.length === 0 ? "No Ulta catalog items were returned for this query" : undefined,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in ulta-product-search:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Internal server error",
      products: [],
      total: 0,
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
