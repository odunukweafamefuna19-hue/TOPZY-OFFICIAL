-- TOPZY WALLET ENGINE
-- Review existing tables before running. This module uses a dedicated wallet ledger.
create table if not exists public.topzy_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.topzy_wallets (
  customer_id uuid primary key references auth.users(id) on delete cascade,
  balance numeric(14,2) not null default 0 check (balance >= 0),
  currency text not null default 'NGN',
  updated_at timestamptz not null default now()
);

create table if not exists public.topzy_wallet_topups (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(14,2) not null check (amount >= 100),
  status text not null default 'pending' check (status in ('pending','credited','rejected')),
  created_at timestamptz not null default now(),
  credited_at timestamptz,
  credited_by uuid references auth.users(id),
  admin_note text
);

create table if not exists public.topzy_wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users(id) on delete cascade,
  topup_id uuid unique references public.topzy_wallet_topups(id),
  type text not null check (type in ('topup','debit','adjustment')),
  amount numeric(14,2) not null check (amount > 0),
  status text not null default 'completed',
  reference text not null unique,
  description text,
  created_at timestamptz not null default now()
);

alter table public.topzy_admins enable row level security;
alter table public.topzy_wallets enable row level security;
alter table public.topzy_wallet_topups enable row level security;
alter table public.topzy_wallet_transactions enable row level security;

revoke all on public.topzy_wallets from anon, authenticated;
revoke all on public.topzy_wallet_topups from anon, authenticated;
revoke all on public.topzy_wallet_transactions from anon, authenticated;
revoke all on public.topzy_admins from anon, authenticated;

create or replace function public.topzy_create_wallet_topup(
  p_customer_id uuid, p_amount numeric
) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare v_row public.topzy_wallet_topups;
begin
  if p_amount < 100 or p_amount > 10000000 then raise exception 'Invalid top-up amount'; end if;
  insert into public.topzy_wallet_topups(customer_id, amount)
  values (p_customer_id, p_amount) returning * into v_row;
  return jsonb_build_object('id', v_row.id, 'amount', v_row.amount, 'status', v_row.status);
end;
$$;

create or replace function public.topzy_admin_send_wallet_topup(
  p_topup_id uuid, p_admin_id uuid, p_admin_note text default null
) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare v_topup public.topzy_wallet_topups;
begin
  if not exists (select 1 from public.topzy_admins where user_id = p_admin_id) then
    raise exception 'Admin access required';
  end if;

  select * into v_topup from public.topzy_wallet_topups
  where id = p_topup_id for update;
  if not found then raise exception 'Top-up request not found'; end if;

  if v_topup.status = 'credited' then
    return jsonb_build_object('already_credited', true, 'topup_id', v_topup.id);
  end if;
  if v_topup.status <> 'pending' then raise exception 'Top-up is not pending'; end if;

  insert into public.topzy_wallets(customer_id, balance)
  values (v_topup.customer_id, v_topup.amount)
  on conflict (customer_id) do update
  set balance = public.topzy_wallets.balance + excluded.balance,
      updated_at = now();

  insert into public.topzy_wallet_transactions(
    customer_id, topup_id, type, amount, reference, description
  ) values (
    v_topup.customer_id, v_topup.id, 'topup', v_topup.amount,
    'TOPUP-' || v_topup.id::text, 'Admin-confirmed wallet top-up'
  );

  update public.topzy_wallet_topups
  set status = 'credited', credited_at = now(), credited_by = p_admin_id,
      admin_note = p_admin_note
  where id = p_topup_id;

  return jsonb_build_object(
    'credited', true,
    'topup_id', v_topup.id,
    'customer_id', v_topup.customer_id,
    'amount', v_topup.amount
  );
end;
$$;

revoke all on function public.topzy_create_wallet_topup(uuid,numeric) from public, anon, authenticated;
revoke all on function public.topzy_admin_send_wallet_topup(uuid,uuid,text) from public, anon, authenticated;
grant execute on function public.topzy_create_wallet_topup(uuid,numeric) to service_role;
grant execute on function public.topzy_admin_send_wallet_topup(uuid,uuid,text) to service_role;

-- After creating your admin user in Supabase Auth, add their UUID:
-- insert into public.topzy_admins(user_id) values ('YOUR-ADMIN-AUTH-UUID');
