import "jsr:@supabase/functions-js/edge-runtime.d.ts"
// Workspace type hint only; Deno exists at runtime in Edge Functions
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const Deno: any

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

async function getUser(accessToken: string, supabaseUrl: string, anonKey: string) {
  const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${accessToken}`, apikey: anonKey },
  })
  if (!res.ok) throw new Error(`auth_user_error ${res.status}`)
  const user = await res.json()
  return user
}

async function rpcEnsureCustomer(supabaseUrl: string, anonKey: string, authz: string, email: string | null) {
  const res = await fetch(`${supabaseUrl}/rest/v1/rpc/ensure_stripe_customer`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: anonKey,
      Authorization: authz,
    },
    body: JSON.stringify({ p_email: email }),
  })
  const txt = await res.text()
  const data = txt ? JSON.parse(txt) : null
  if (!res.ok) throw new Error(data?.message || data?.error || txt || "ensure_stripe_customer failed")
  return data as string
}

async function createCheckoutSession(stripeKey: string, params: Record<string, string>) {
  const form = new URLSearchParams(params)
  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { Authorization: `Bearer ${stripeKey}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error?.message || `stripe_error ${res.status}`)
  return data
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders })
  try {
    if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method Not Allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } })

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY")
    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")
    if (!stripeKey || !supabaseUrl || !anonKey) {
      return new Response(JSON.stringify({ error: "Server not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }

    const authz = req.headers.get("authorization") || req.headers.get("Authorization")
    if (!authz) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } })
    const accessToken = authz.replace(/^Bearer\s+/i, "")

    const { priceId, successUrl, cancelUrl } = await req.json().catch(() => ({}))
    if (!priceId || !successUrl || !cancelUrl) {
      return new Response(JSON.stringify({ error: "Missing priceId/successUrl/cancelUrl" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }

    const user = await getUser(accessToken, supabaseUrl, anonKey)
    const email: string | null = user?.email || null
    const customerId = await rpcEnsureCustomer(supabaseUrl, anonKey, authz, email)

    const session = await createCheckoutSession(stripeKey, {
      mode: "subscription",
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer: customerId,
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": "1",
      allow_promotion_codes: "true",
    })

    return new Response(JSON.stringify({ url: session.url, id: session.id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || "Internal error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } })
  }
})
