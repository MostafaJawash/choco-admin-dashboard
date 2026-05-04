create extension if not exists pgcrypto;

create table if not exists public.sections (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category_id uuid references public.categories(id) on delete set null,
  type_id uuid references public.product_types(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.sections
  add column if not exists type_id uuid references public.product_types(id) on delete set null;

alter table public.sections
  add column if not exists category_id uuid references public.categories(id) on delete set null;

insert into public.sections (name)
values ('رجال'), ('نساء'), ('أطفال')
on conflict (name) do nothing;

alter table public.products
  add column if not exists section_id uuid references public.sections(id) on delete set null;

create index if not exists products_section_id_idx on public.products(section_id);
create index if not exists sections_category_id_idx on public.sections(category_id);
create index if not exists sections_type_id_idx on public.sections(type_id);
