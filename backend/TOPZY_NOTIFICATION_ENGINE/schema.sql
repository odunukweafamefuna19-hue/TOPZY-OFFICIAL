-- TOPZY IN-APP NOTIFICATIONS
create table if not exists public.topzy_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  message text not null check (char_length(message) between 1 and 2000),
  type text not null default 'general'
    check (type in ('general','order','payment','wallet','promotion','system')),
  is_read boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists topzy_notifications_user_created_idx
  on public.topzy_notifications(user_id, created_at desc);
create index if not exists topzy_notifications_unread_idx
  on public.topzy_notifications(user_id, is_read) where is_read = false;

alter table public.topzy_notifications enable row level security;
revoke all on public.topzy_notifications from anon, authenticated;

-- Only the backend service role accesses this table. User ownership is enforced in API queries.
