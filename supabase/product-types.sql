create extension if not exists pgcrypto;

create table if not exists public.product_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category_id uuid references public.categories(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.products
  add column if not exists type_id uuid references public.product_types(id) on delete set null;

create index if not exists products_type_id_idx on public.products(type_id);
