import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const VIBER_API = "https://chatapi.viber.com/pa";

export interface ViberSendMessagePayload {
  receiver: string;
  type: "text" | "picture" | "video" | "file" | "contact" | "location" | "url";
  text?: string;
  caption?: string;
  media?: string;
  size?: number;
  file_name?: string;
}

export function getViberAuthToken(): string | null {
  return Deno.env.get("VIBER_AUTH_TOKEN") ?? null;
}

export async function sendViberMessage(payload: ViberSendMessagePayload): Promise<{
  ok: boolean;
  status: number;
  body: any;
}> {
  const token = getViberAuthToken();
  if (!token) {
    console.warn("VIBER_AUTH_TOKEN is not set; skipping Viber message send");
    return { ok: false, status: 0, body: { error: "token_not_configured" } };
  }

  const res = await fetch(`${VIBER_API}/send_message`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Viber-Auth-Token": token,
    },
    body: JSON.stringify({
      auth_token: token,
      ...payload,
    }),
  });

  let body: any;
  try {
    body = await res.json();
  } catch {
    body = { error: "non_json_response", raw: await res.text() };
  }

  if (!res.ok || body?.status !== 0) {
    console.error("Viber send_message failed:", res.status, body);
  }

  return { ok: res.ok && body?.status === 0, status: res.status, body };
}

export function adminSupabaseClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}
