import supabase, { SUPABASE_URL, SUPABASE_ANON_KEY } from "../supabase-client";

export async function getUsage() {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;
  if (!accessToken) throw new Error("Not authenticated");

  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_ai_usage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
    },
    body: "{}",
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || `usage_error_${res.status}`);
  }
  // RPC returns a rowset
  const rows = await res.json();
  const row = Array.isArray(rows) ? rows[0] : rows;
  return row as { usage_this_month: number; limit_this_month: number; is_plus: boolean };
}

export async function startCheckout(priceId: string, successUrl: string, cancelUrl: string) {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;
  if (!accessToken) throw new Error("Not authenticated");

  const res = await fetch(`${SUPABASE_URL}/functions/v1/stripe-checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ priceId, successUrl, cancelUrl }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `stripe_checkout_${res.status}`);
  return data as { url: string; id: string };
}
