-- FreshTrack database schema
-- Run this entire file in Supabase SQL Editor.

create table if not exists public.food_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  category text not null default 'Other',
  quantity numeric(10,2) not null default 1 check (quantity > 0),
  unit text not null default 'pcs',
  expiry_date date not null,
  notes text not null default '',
  status text not null default 'available'
    check (status in ('available', 'consumed', 'wasted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists food_items_user_id_idx on public.food_items(user_id);
create index if not exists food_items_expiry_date_idx on public.food_items(expiry_date);

alter table public.food_items enable row level security;

drop policy if exists "Users can view their own food items" on public.food_items;
create policy "Users can view their own food items"
on public.food_items for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can add their own food items" on public.food_items;
create policy "Users can add their own food items"
on public.food_items for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own food items" on public.food_items;
create policy "Users can update their own food items"
on public.food_items for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own food items" on public.food_items;
create policy "Users can delete their own food items"
on public.food_items for delete
to authenticated
using (auth.uid() = user_id);

grant select, insert, update, delete on public.food_items to authenticated;
