import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-probe-secret",
};

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

async function fetchJsonOrText(url: string, init: RequestInit) {
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const probeSecret = getRequiredEnv("ULTA_AFFILIATE_PROBE_SECRET");
    const providedSecret = req.headers.get("x-probe-secret");
    if (providedSecret !== probeSecret) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const accountSid = getRequiredEnv("ULTA_AFFILIATE_ACCOUNT_SID");
    const authToken = getRequiredEnv("ULTA_AFFILIATE_AUTH_TOKEN");
    const baseUrl = Deno.env.get("ULTA_AFFILIATE_API_BASE_URL") ?? "https://api.impact.com";
    const normalizedBaseUrl = baseUrl.replace(/\/$/, "");
    const probeCandidates = [
      `${normalizedBaseUrl}/Mediapartners/${encodeURIComponent(accountSid)}/CompanyInformation`,
      `${normalizedBaseUrl}/Mediapartners/${encodeURIComponent(accountSid)}/Campaigns`,
      `${normalizedBaseUrl}/Mediapartners/${encodeURIComponent(accountSid)}`,
    ];

    console.log("Probing Ulta affiliate account", { probeCandidates });

    const requestInit: RequestInit = {
      method: "GET",
      headers: {
        Authorization: buildBasicAuthHeader(accountSid, authToken),
        Accept: "application/json",
      },
    };

    const attempts: Array<{ url: string; status: number; body: unknown }> = [];

    for (const probeUrl of probeCandidates) {
      const { response, parsedBody, responseText } = await fetchJsonOrText(probeUrl, requestInit);
      attempts.push({ url: probeUrl, status: response.status, body: parsedBody });

      if (response.ok) {
        return new Response(JSON.stringify({
          ok: true,
          status: response.status,
          endpoint: probeUrl,
          account: parsedBody,
          attempts,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.error("Ulta affiliate probe failed", probeUrl, response.status, responseText);
    }

    return new Response(JSON.stringify({
      ok: false,
      error: "Ulta affiliate probe failed",
      attempts,
    }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in ulta-affiliate-probe:", error);
    return new Response(JSON.stringify({
      ok: false,
      error: error instanceof Error ? error.message : "Internal server error",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
