import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendViberMessage, adminSupabaseClient, getViberAuthToken } from "../_shared/viber.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type EndpointResult = {
  id: string;
  name: string;
  category: "retailer" | "affiliate" | "internal";
  status: "ok" | "degraded" | "down" | "not_configured";
  httpStatus: number | null;
  latencyMs: number | null;
  detail: string;
  checkedAt: string;
};

const timedFetch = async (url: string, init: RequestInit, timeoutMs = 8000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const started = Date.now();
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    return { response, latencyMs: Date.now() - started };
  } finally {
    clearTimeout(timer);
  }
};

const checkRakutenProductSearch = async (): Promise<EndpointResult> => {
  const base: Omit<EndpointResult, "status" | "httpStatus" | "latencyMs" | "detail"> = {
    id: "rakuten_product_search",
    name: "Rakuten Product Search",
    category: "retailer",
    checkedAt: new Date().toISOString(),
  };

  const url =
    "https://api.linksynergy.com/productsearch/1.0?keyword=foundation%20makeup&max=1&pagenumber=1&language=en_US&cat=beauty";

  try {
    const { response, latencyMs } = await timedFetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    return {
      ...base,
      status: response.ok ? "ok" : response.status >= 500 ? "down" : "degraded",
      httpStatus: response.status,
      latencyMs,
      detail: response.ok ? "Responded with product results" : `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      ...base,
      status: "down",
      httpStatus: null,
      latencyMs: null,
      detail: error instanceof Error ? error.message : "Request failed",
    };
  }
};

const checkRakutenDeepLink = async (): Promise<EndpointResult> => {
  const base: Omit<EndpointResult, "status" | "httpStatus" | "latencyMs" | "detail"> = {
    id: "rakuten_deeplink",
    name: "Rakuten Deep Link API",
    category: "affiliate",
    checkedAt: new Date().toISOString(),
  };

  const token = Deno.env.get("RAKUTEN_ADVERTISING_TOKEN");
  if (!token) {
    return {
      ...base,
      status: "not_configured",
      httpStatus: null,
      latencyMs: null,
      detail: "RAKUTEN_ADVERTISING_TOKEN is not set",
    };
  }

  try {
    const { response, latencyMs } = await timedFetch("https://api.linksynergy.com/v1/deeplink", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        url: "https://www.sephora.com/",
        advertiser_id: 99999,
        u1: "health-check",
      }),
    });

    // 4xx here still proves the endpoint + credentials path is reachable.
    const status = response.status === 401 || response.status === 403
      ? "degraded"
      : response.status >= 500
        ? "down"
        : "ok";

    return {
      ...base,
      status,
      httpStatus: response.status,
      latencyMs,
      detail:
        status === "degraded"
          ? "Credentials rejected by Rakuten"
          : status === "down"
            ? `Rakuten error HTTP ${response.status}`
            : "Reachable and authenticating",
    };
  } catch (error) {
    return {
      ...base,
      status: "down",
      httpStatus: null,
      latencyMs: null,
      detail: error instanceof Error ? error.message : "Request failed",
    };
  }
};

const checkUlta = async (): Promise<EndpointResult> => {
  const base: Omit<EndpointResult, "status" | "httpStatus" | "latencyMs" | "detail"> = {
    id: "ulta_affiliate",
    name: "Ulta Affiliate Feed",
    category: "retailer",
    checkedAt: new Date().toISOString(),
  };

  const sid = Deno.env.get("ULTA_AFFILIATE_ACCOUNT_SID");
  const authToken = Deno.env.get("ULTA_AFFILIATE_AUTH_TOKEN");

  if (!sid || !authToken) {
    return {
      ...base,
      status: "not_configured",
      httpStatus: null,
      latencyMs: null,
      detail: "Ulta affiliate credentials are not set",
    };
  }

  try {
    const { response, latencyMs } = await timedFetch(
      "https://api.impact.com/Mediapartners/" + sid + "/Catalogs?PageSize=1",
      {
        method: "GET",
        headers: {
          Authorization: `Basic ${btoa(`${sid}:${authToken}`)}`,
          Accept: "application/json",
        },
      }
    );

    return {
      ...base,
      status: response.ok ? "ok" : response.status === 401 || response.status === 403 ? "degraded" : "down",
      httpStatus: response.status,
      latencyMs,
      detail: response.ok ? "Catalog endpoint reachable" : `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      ...base,
      status: "down",
      httpStatus: null,
      latencyMs: null,
      detail: error instanceof Error ? error.message : "Request failed",
    };
  }
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

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: isAdmin } = await serviceClient.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "admin",
    });
    const { data: isSuperadmin } = await serviceClient.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "superadmin",
    });

    if (!isAdmin && !isSuperadmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const endpoints = await Promise.all([
      checkRakutenProductSearch(),
      checkRakutenDeepLink(),
      checkUlta(),
    ]);

    const nowIso = new Date().toISOString();
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const [{ count: totalRows }, { count: freshRows }, { count: staleRows }, recent] = await Promise.all([
      serviceClient.from("live_product_prices").select("*", { count: "exact", head: true }),
      serviceClient
        .from("live_product_prices")
        .select("*", { count: "exact", head: true })
        .gt("expires_at", nowIso),
      serviceClient
        .from("live_product_prices")
        .select("*", { count: "exact", head: true })
        .lt("last_checked_at", oneDayAgo),
      serviceClient
        .from("live_product_prices")
        .select("brand, product, retailer, price, source, availability, last_checked_at")
        .order("last_checked_at", { ascending: false })
        .limit(20),
    ]);

    const { count: lastHourRows } = await serviceClient
      .from("live_product_prices")
      .select("*", { count: "exact", head: true })
      .gte("last_checked_at", oneHourAgo);

    return new Response(
      JSON.stringify({
        generatedAt: nowIso,
        endpoints,
        cache: {
          totalRows: totalRows ?? 0,
          freshRows: freshRows ?? 0,
          staleRows: staleRows ?? 0,
          fetchedLastHour: lastHourRows ?? 0,
        },
        recentFetches: recent.data ?? [],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("pricing-health error", error);
    return new Response(JSON.stringify({ error: "Health check failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
