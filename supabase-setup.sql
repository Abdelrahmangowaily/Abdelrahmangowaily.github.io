-- ============================================================
-- Workout Tracker — Supabase Setup
-- Run this in your Supabase project → SQL Editor
-- ============================================================

-- 1. Key-Value store (mirrors localStorage)
--    Each app key (wt_gymDays, wt_workoutLog, etc.) is one row.
create table if not exists public.kv_store (
  id    text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- Auto-update timestamp
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists kv_store_updated_at on public.kv_store;
create trigger kv_store_updated_at
  before update on public.kv_store
  for each row execute procedure public.touch_updated_at();


-- ============================================================
-- 2. Row Level Security
--    For a personal site: allow all reads/writes from the
--    browser using the anon key (no login required).
--    To add auth later, replace the policies with:
--      using (auth.uid() = user_id)
-- ============================================================

alter table public.kv_store enable row level security;

-- Allow anonymous read
create policy "anon read"
  on public.kv_store for select
  using (true);

-- Allow anonymous insert + update
create policy "anon write"
  on public.kv_store for insert
  with check (true);

create policy "anon update"
  on public.kv_store for update
  using (true);

-- Allow anonymous delete
create policy "anon delete"
  on public.kv_store for delete
  using (true);


-- ============================================================
-- 3. Optional: separate tables for better querying later
--    (Don't need these now, but useful if you want server-side
--     analytics, filtering, or sharing data between devices.)
-- ============================================================

-- Uncomment and run when ready:

-- create table public.workout_log (
--   id          uuid primary key default gen_random_uuid(),
--   log_date    date not null,
--   type        text not null,          -- 'gym' | 'skating' | 'basketball' | 'rest' | 'mobility'
--   gym_day_id  text,
--   completed   boolean default true,
--   exercises   jsonb,
--   notes       text,
--   created_at  timestamptz default now()
-- );

-- create table public.food_log (
--   id          uuid primary key default gen_random_uuid(),
--   log_date    date not null,
--   meal        text not null,          -- 'breakfast' | 'lunch' | 'dinner' | 'snacks'
--   food_name   text not null,
--   calories    numeric,
--   protein     numeric,
--   carbs       numeric,
--   fat         numeric,
--   created_at  timestamptz default now()
-- );


-- ============================================================
-- DONE. After running this:
--  1. Copy your project URL and anon key from
--     Supabase → Project Settings → API
--  2. Paste them into js/db.supabase.js
--  3. Follow the activation steps in that file
-- ============================================================
