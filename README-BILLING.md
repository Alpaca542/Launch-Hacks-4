Stripe + Supabase billing setup

What this adds

-   Database schema `database/billing.sql` that:

    -   Enables Wrappers and the Stripe FDW, creates `stripe` schema and imports `customers` and `subscriptions` foreign tables.
    -   Tables: `public.user_billing` (maps auth.users -> stripe customer), `public.user_usage` (JSONB per-month usage map).
    -   View: `public.user_plus_status` to check Plus via Stripe subscriptions.
    -   RPCs:
        -   `user_is_plus(uid uuid)` -> boolean
        -   `get_ai_usage()` -> usage_this_month, limit_this_month, is_plus
        -   `increment_ai_usage()` -> increments with limits (20 free, 200 Plus)
        -   `ensure_stripe_customer(p_email text)` -> creates/fetches Stripe customer and maps to user

-   Edge functions:

    -   `ai-remote`: now enforces/increments usage via RPC before calling OpenAI.
    -   `stripe-checkout`: creates a Stripe Checkout Session for a subscription price.

-   Frontend:
    -   Streaming call now sends the user’s access token in Authorization, so RPCs see auth.uid().
    -   `src/services/billing.ts` provides `getUsage()` and `startCheckout()` helpers.

Setup steps

1. Env vars (project > Functions > Variables)

-   SUPABASE_URL = https://<your-project>.supabase.co
-   SUPABASE_ANON_KEY = <anon key>
-   OPENAI_API_KEY = <your OpenAI key>
-   STRIPE*SECRET_KEY = sk_live* or sk*test*...

2. Database migration

-   Execute `database/billing.sql` in the SQL Editor (ensure you wire the Stripe FDW server to Vault or inline api_key).
-   If not using the Integrations UI, uncomment and configure the `create server stripe_server ...` section accordingly.

3. Deploy functions

-   supabase functions deploy ai-remote
-   supabase functions deploy stripe-checkout

4. Stripe price

-   Create a recurring price in Stripe (e.g., monthly Plus). Copy its `price_xxx` id.

5. Frontend usage

-   Call `getUsage()` to display current usage and Plus status.
-   Call `startCheckout(priceId, successUrl, cancelUrl)` to redirect the user to Checkout.

Notes

-   Limits: 20/month for free, 200/month for Plus. Reset happens naturally by keying usage with `MM.YYYY`.
-   Race safety: `increment_ai_usage()` locks the row to avoid concurrent overruns.
-   Security: Only authenticated users can execute the RPCs; writes happen via security definer functions.
