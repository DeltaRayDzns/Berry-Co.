create table if not exists public.support_ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  sender_type text not null check (sender_type in ('customer', 'admin')),
  sender_name text not null,
  sender_email text,
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.support_ticket_messages enable row level security;
create index if not exists support_ticket_messages_ticket_idx on public.support_ticket_messages(ticket_id, created_at asc);

create policy "support_ticket_messages_select_own_or_admin"
on public.support_ticket_messages for select
using (
  exists (
    select 1
    from public.support_tickets st
    where st.id = ticket_id
      and (
        st.user_id = auth.uid()
        or exists (
          select 1 from public.profiles p
          where p.id = auth.uid() and p.role in ('super_admin', 'admin', 'staff')
        )
      )
  )
);

create policy "support_ticket_messages_insert_customer_own_ticket"
on public.support_ticket_messages for insert
with check (
  sender_type = 'customer'
  and exists (
    select 1
    from public.support_tickets st
    where st.id = ticket_id and st.user_id = auth.uid()
  )
);

create policy "support_ticket_messages_insert_admin"
on public.support_ticket_messages for insert
with check (
  sender_type = 'admin'
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('super_admin', 'admin', 'staff')
  )
);
