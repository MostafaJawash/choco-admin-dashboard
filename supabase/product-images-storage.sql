-- Run this in the Supabase SQL editor for this project.
-- It makes product image files readable through:
-- https://<project-ref>.supabase.co/storage/v1/object/public/product-images/<file-path>

insert into storage.buckets (id, name, public, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  array[
    'image/avif',
    'image/gif',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
on conflict (id) do update
set
  public = true,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read product images" on storage.objects;
drop policy if exists "Authenticated upload product images" on storage.objects;
drop policy if exists "Authenticated update product images" on storage.objects;
drop policy if exists "Authenticated delete product images" on storage.objects;

create policy "Public read product images"
on storage.objects
for select
to public
using (bucket_id = 'product-images');

create policy "Authenticated upload product images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'product-images'
  and lower(storage.extension(name)) in ('avif', 'gif', 'jpg', 'jpeg', 'png', 'webp')
  and coalesce(metadata->>'mimetype', '') like 'image/%'
);

create policy "Authenticated update product images"
on storage.objects
for update
to authenticated
using (bucket_id = 'product-images')
with check (
  bucket_id = 'product-images'
  and lower(storage.extension(name)) in ('avif', 'gif', 'jpg', 'jpeg', 'png', 'webp')
  and coalesce(metadata->>'mimetype', '') like 'image/%'
);

create policy "Authenticated delete product images"
on storage.objects
for delete
to authenticated
using (bucket_id = 'product-images');
