alter table public.products
  add column if not exists short_description text,
  add column if not exists specifications text,
  add column if not exists image_urls text[] default array[]::text[],
  add column if not exists preorder_start_date date,
  add column if not exists preorder_end_date date,
  add column if not exists release_date date,
  add column if not exists sale_percentage integer check (sale_percentage between 0 and 100);

create index if not exists products_preorder_idx
  on public.products(preorder_start_date, preorder_end_date);

create index if not exists products_release_idx
  on public.products(release_date);
