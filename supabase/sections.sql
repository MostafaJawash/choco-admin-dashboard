create extension if not exists pgcrypto;

create table if not exists public.sections (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

insert into public.sections (name)
values ('رجال'), ('نساء'), ('أطفال')
on conflict (name) do nothing;

alter table public.products
  add column if not exists section_id uuid references public.sections(id) on delete set null;

create index if not exists products_section_id_idx on public.products(section_id);
