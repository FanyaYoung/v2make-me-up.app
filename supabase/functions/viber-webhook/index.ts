import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { sendViberMessage, adminSupabaseClient, getViberAuthToken } from "../_shared/viber.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ViberWebhookPayload {
  event?: string;
  timestamp?: number;
  message_token?: number;
  user_id?: string;
  user?: {
    id?: string;
    name?: string;
    avatar?: string;
    language?: string;
    api_version?: number;
    country?: string;
  };
  sender?: {
    id?: string;
    name?: string;
    avatar?: string;
    language?: string;
    api_version?: number;
    country?: string;
  };
  message?: {
    type?: string;
    text?: string;
    tracking_data?: string;
  };
  context?: string;
  subscribed?: boolean;
}

const WELCOME_TEXT = `Hi! You're now subscribed to Make Me Up pricing alerts. I'll notify you when live retailer prices change significantly. Reply STOP at any time to unsubscribe.`;
const HELP_TEXT = `Make Me Up bot commands:\n- STOP: unsubscribe from alerts\n- START or HI: resubscribe\n- STATUS: check subscription status`;

async function upsertSubscriber(payload: ViberWebhookPayload) {
  const user = payload.user ?? payload.sender;
  const userId = payload.user_id ?? user?.id;
  if (!userId) return;

  const now = new Date().toISOString();
  const supabase = adminSupabaseClient();

  const { data: existing } = await supabase
    .from("viber_subscriptions")
    .select("id, is_active")
    .eq("viber_user_id", userId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("viber_subscriptions")
      .update({
        viber_chat_id: userId,
        name: user?.name ?? null,
        avatar: user?.avatar ?? null,
        is_active: true,
        subscribed_at: existing.is_active ? undefined : now,
        unsubscribed_at: null,
        updated_at: now,
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("viber_subscriptions").insert({
      viber_user_id: userId,
      viber_chat_id: userId,
      name: user?.name ?? null,
      avatar: user?.avatar ?? null,
      is_active: true,
      subscribed_at: now,
    });
  }
}

async function deactivateSubscriber(userId: string) {
  const supabase = adminSupabaseClient();
  await supabase
    .from("viber_subscriptions")
    .update({
      is_active: false,
      unsubscribed_at: new Date().toISOString(),
    })
    .eq("viber_user_id", userId);
}

async function handleIncomingMessage(payload: ViberWebhookPayload) {
  const senderId = payload.sender?.id;
  const text = payload.message?.text?.trim().toUpperCase() ?? "";
  if (!senderId) return;

  if (text === "STOP" || text === "UNSUBSCRIBE") {
    await deactivateSubscriber(senderId);
    await sendViberMessage({
      receiver: senderId,
      type: "text",
      text: "You've been unsubscribed from pricing alerts. Reply START to resubscribe.",
    });
    return;
  }

  if (text === "START" || text === "HI" || text === "HELLO") {
    await upsertSubscriber(payload);
    await sendViberMessage({
      receiver: senderId,
      type: "text",
      text: WELCOME_TEXT,
    });
    return;
  }

  if (text === "STATUS") {
    const supabase = adminSupabaseClient();
    const { data } = await supabase
      .from("viber_subscriptions")
      .select("is_active")
      .eq("viber_user_id", senderId)
      .maybeSingle();

    const statusText = data?.is_active
      ? "You're subscribed to pricing alerts."
      : "You're not subscribed. Reply START to subscribe.";
    await sendViberMessage({ receiver: senderId, type: "text", text: statusText });
    return;
  }

  await sendViberMessage({ receiver: senderId, type: "text", text: HELP_TEXT });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const payload: ViberWebhookPayload = await req.json();
    const event = payload.event;

    console.log("Viber webhook event:", event, payload);

    if (!getViberAuthToken()) {
      console.warn("VIBER_AUTH_TOKEN not configured; acknowledging event but not processing replies");
      return new Response(JSON.stringify({ status: 0, status_message: "ok" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (event === "subscribed" || event === "conversation_started") {
      await upsertSubscriber(payload);
      const userId = payload.user?.id ?? payload.user_id;
      if (userId) {
        await sendViberMessage({ receiver: userId, type: "text", text: WELCOME_TEXT });
      }
    } else if (event === "unsubscribed") {
      const userId = payload.user_id;
      if (userId) await deactivateSubscriber(userId);
    } else if (event === "message") {
      await handleIncomingMessage(payload);
    }

    return new Response(JSON.stringify({ status: 0, status_message: "ok" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("viber-webhook error:", error);
    return new Response(JSON.stringify({ status: 0, status_message: "ok" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
