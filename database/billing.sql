-- Billing and Stripe integration schema
-- 1) Enable wrappers and Stripe FDW, and connect a `stripe` schema
-- 2) Tables for user billing mapping and monthly usage tracking
-- 3) Views and functions to determine Plus status from Stripe subscriptions
-- 4) RPC to increment usage with monthly limits (20 for non-Plus, 200 for Plus)

-- Enable wrappers extension (requires project owner privileges)
create extension if not exists wrappers with schema extensions;

-- Enable Stripe FDW handler/validator
create foreign data wrapper if not exists stripe_wrapper
  handler stripe_fdw_handler
  validator stripe_fdw_validator;

-- Create schema to hold Stripe foreign tables
create schema if not exists stripe;

-- OPTIONAL: Store Stripe secret in Vault and reference it here.
-- Replace <KEY_ID> or <KEY_NAME> with your Vault secret id/name.
-- You can manage this from the Supabase Dashboard Integrations UI as well.
-- select vault.create_secret('<STRIPE_SECRET_KEY>', 'stripe', 'Stripe API key for Wrappers');

-- Create the Stripe foreign server. Choose one of the options below.
-- With Vault (recommended):
-- create server if not exists stripe_server
--   foreign data wrapper stripe_wrapper
--   options (
--     api_key_id '<KEY_ID>',
--     api_url 'https://api.stripe.com/v1/',
--     api_version '2024-06-20'
--   );

-- Without Vault (NOT recommended; credentials would be stored in pg_catalog in plain text):
-- create server if not exists stripe_server
--   foreign data wrapper stripe_wrapper
--   options (
--     api_key '<STRIPE_SECRET_KEY>',
--     api_url 'https://api.stripe.com/v1/',
--     api_version '2024-06-20'
--   );

-- Import the minimal set of Stripe entities we need
do $$ begin
  begin
    execute $$import foreign schema stripe limit to ("subscriptions", "customers") from server stripe_server into stripe;$$;
  exception when others then
    -- ignore if already imported
    null;
  end;
end $$;

-- Map auth.users -> Stripe customer id
create table if not exists public.user_billing (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text unique,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_user_billing_updated on public.user_billing;
create trigger trg_user_billing_updated
before update on public.user_billing
for each row execute function public.set_updated_at();

-- Track monthly usage as a JSONB map of 'MM.YYYY' -> integer count
create table if not exists public.user_usage (
  user_id uuid primary key references auth.users(id) on delete cascade,
  usage_by_month jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

drop trigger if exists trg_user_usage_updated on public.user_usage;
create trigger trg_user_usage_updated
before update on public.user_usage
for each row execute function public.set_updated_at();

-- RLS
alter table public.user_billing enable row level security;
alter table public.user_usage enable row level security;

-- Users can read their own billing row
do $$ begin
  begin
    create policy user_billing_select_self on public.user_billing
      for select using (auth.uid() = user_id);
  exception when duplicate_object then null; end;
end $$;

-- Users can upsert their own billing mapping (optional; or restrict to admin-only)
do $$ begin
  begin
    create policy user_billing_insert_self on public.user_billing
      for insert with check (auth.uid() = user_id);
  exception when duplicate_object then null; end;
end $$;

do $$ begin
  begin
    create policy user_billing_update_self on public.user_billing
      for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  exception when duplicate_object then null; end;
end $$;

-- Users can read their own usage; writes happen via security definer RPC
do $$ begin
  begin
    create policy user_usage_select_self on public.user_usage
      for select using (auth.uid() = user_id);
  exception when duplicate_object then null; end;
end $$;

-- Helper view: determine if a user has an active Stripe subscription (Plus)
-- A user is Plus if any active/trialing subscription exists for their customer and the period hasn't ended.
create or replace view public.user_plus_status as
select
  ub.user_id,
  exists (
    select 1
    from stripe.subscriptions s
    where s.customer = ub.stripe_customer_id
      and coalesce((s.attrs->>'status'), '') in ('active','trialing')
      and s.current_period_end > now()
  ) as is_plus
from public.user_billing ub;

-- Function to check if a user is Plus
create or replace function public.user_is_plus(uid uuid)
returns boolean
language sql
security definer
set search_path = public, extensions, auth
stable
as $$
  select coalesce(ups.is_plus, false)
  from public.user_plus_status ups
  where ups.user_id = uid;
$$;

grant execute on function public.user_is_plus(uid uuid) to authenticated; 

-- RPC to get usage info for current month
create or replace function public.get_ai_usage()
returns table (usage_this_month integer, limit_this_month integer, is_plus boolean)
language plpgsql
security definer
set search_path = public, extensions, auth
as $$
declare
  uid uuid := auth.uid();
  key text := to_char(now(), 'MM.YYYY');
  plus boolean;
  lim int;
  used int;
begin
  if uid is null then
    raise exception 'not_authenticated';
  end if;

  plus := public.user_is_plus(uid);
  lim := case when plus then 200 else 20 end;

  -- ensure row exists
  insert into public.user_usage(user_id)
  values (uid)
  on conflict (user_id) do nothing;

  select coalesce((usage_by_month->>key)::int, 0) into used
  from public.user_usage where user_id = uid;

  return query select used, lim, plus;
end
$$;

grant execute on function public.get_ai_usage() to authenticated;

-- RPC to increment usage for current month with limit enforcement
create or replace function public.increment_ai_usage()
returns table (usage_this_month integer, limit_this_month integer, is_plus boolean)
language plpgsql
security definer
set search_path = public, extensions, auth
as $$
declare
  uid uuid := auth.uid();
  key text := to_char(now(), 'MM.YYYY');
  plus boolean;
  lim int;
  used int;
begin
  if uid is null then
    raise exception 'not_authenticated';
  end if;

  plus := public.user_is_plus(uid);
  lim := case when plus then 200 else 20 end;

  -- ensure row exists and lock it for update to avoid race conditions
  insert into public.user_usage(user_id)
  values (uid)
  on conflict (user_id) do nothing;

  select coalesce((usage_by_month->>key)::int, 0) into used
  from public.user_usage where user_id = uid
  for update;

  if used >= lim then
    raise exception 'limit_exceeded';
  end if;

  update public.user_usage
  set usage_by_month = jsonb_set(coalesce(usage_by_month, '{}'::jsonb), array[key], to_jsonb(used + 1), true),
      updated_at = now()
  where user_id = uid;

  return query select used + 1, lim, plus;
end
$$;

grant execute on function public.increment_ai_usage() to authenticated;

-- Ensure a Stripe customer exists for the authenticated user and return the id
create or replace function public.ensure_stripe_customer(p_email text default null)
returns text
language plpgsql
security definer
set search_path = public, extensions, auth
as $$
declare
  uid uuid := auth.uid();
  cid text;
begin
  if uid is null then
    raise exception 'not_authenticated';
  end if;

  -- Attempt to read existing mapping
  select stripe_customer_id into cid from public.user_billing where user_id = uid;
  if cid is not null then
    return cid;
  end if;

  -- Create stripe customer via FDW
  insert into stripe.customers(email)
  values (p_email)
  returning id into cid;

  -- Persist mapping
  insert into public.user_billing(user_id, stripe_customer_id)
  values (uid, cid)
  on conflict (user_id) do update set stripe_customer_id = excluded.stripe_customer_id;

  return cid;
end
$$;

grant execute on function public.ensure_stripe_customer(p_email text) to authenticated;
