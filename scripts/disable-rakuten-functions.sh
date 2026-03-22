#!/usr/bin/env bash

set -euo pipefail

if ! command -v supabase >/dev/null 2>&1; then
  echo "Error: supabase CLI is not installed."
  exit 1
fi

PROJECT_REF="${1:-}"
if [[ -z "$PROJECT_REF" ]]; then
  echo "Usage: $0 <supabase-project-ref>"
  echo "Example: $0 fznzfzhgpjhtpuvorsqj"
  exit 1
fi

FUNCTIONS=(
  "generate-rakuten-deeplink"
  "rakuten-offers"
  "rakuten-product-search"
  "rakuten-coupons"
  "rakuten-transactions"
)

TMP_ROOT="$(mktemp -d)"
trap 'rm -rf "$TMP_ROOT"' EXIT

TMP_WORKDIR="$TMP_ROOT/workdir"
mkdir -p "$TMP_WORKDIR/supabase/functions"

cat >"$TMP_ROOT/stub.ts" <<'EOF'
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  return new Response(
    JSON.stringify({
      error: "This endpoint has been disabled.",
      code: "RAKUTEN_DISABLED"
    }),
    {
      status: 410,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    }
  );
});
EOF

echo "Disabling Rakuten functions on project: $PROJECT_REF"

for fn in "${FUNCTIONS[@]}"; do
  echo "Deploying disabled stub for: $fn"
  fn_dir="$TMP_WORKDIR/supabase/functions/$fn"
  mkdir -p "$fn_dir"
  cp "$TMP_ROOT/stub.ts" "$fn_dir/index.ts"
  supabase functions deploy "$fn" \
    --project-ref "$PROJECT_REF" \
    --no-verify-jwt \
    --workdir "$TMP_WORKDIR"
done

echo "Done. Disabled functions:"
printf ' - %s\n' "${FUNCTIONS[@]}"
echo
echo "Smoke test example:"
echo "curl -i https://${PROJECT_REF}.supabase.co/functions/v1/generate-rakuten-deeplink"
