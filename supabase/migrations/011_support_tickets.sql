create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_number text not null unique default ('TICK-' || lpad((floor(random() * 100000))::text, 5, '0')),
  user_id uuid not null references public.profiles(id) on delete cascade,
  customer_name text not null,
  customer_email text not null,
  category text not null,
  order_number text,
  subject text not null,
  message text not null,
  status text not null default 'open' check (status in ('open', 'pending', 'resolved')),
  created_at timestamptz not null default now()
);

alter table public.support_tickets enable row level security;
create index if not exists support_tickets_user_idx on public.support_tickets(user_id, created_at desc);
create index if not exists support_tickets_email_idx on public.support_tickets(customer_email, created_at desc);

create policy "support_tickets_select_own_or_admin"
on public.support_tickets for select
using (
  auth.uid() = user_id
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('super_admin', 'admin', 'staff'))
);

create policy "support_tickets_insert_own"
on public.support_tickets for insert
with check (auth.uid() = user_id);
