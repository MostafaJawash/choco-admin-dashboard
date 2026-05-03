alter table if exists public.categories
  add column if not exists image_url text;

alter table if exists public.product_types
  add column if not exists image_url text;

alter table if exists public.product_types
  add column if not exists category_id uuid references public.categories(id) on delete set null;

alter table if exists public.sections
  add column if not exists image_url text;

create table if not exists public.coupons (
  code text primary key,
  discount_percentage numeric(5,2) not null check (discount_percentage >= 0 and discount_percentage <= 100),
  is_active boolean not null default true,
  expiration_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
