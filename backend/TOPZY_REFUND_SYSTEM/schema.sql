-- Review this against the existing TOPZY database before running.
create table if not exists public.topzy_refunds (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id),
  user_id uuid not null references auth.users(id),
  amount numeric(12,2) not null check (amount > 0),
  reason text not null check (reason in (
    'duplicate_payment', 'order_cancelled', 'item_unavailable', 'wrong_item', 'other'
  )),
  details text,
  status text not null default 'requested' check (status in (
    'requested', 'approved', 'processing', 'rejected', 'sent'
  )),
  admin_note text,
  reviewed_by uuid references auth.users(id),
  transfer_reference text,
  sent_by uuid references auth.users(id),
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists topzy_refunds_user_created_idx
  on public.topzy_refunds(user_id, created_at desc);
create index if not exists topzy_refunds_status_created_idx
  on public.topzy_refunds(status, created_at);

-- One active request per order prevents duplicate pending refunds.
create unique index if not exists topzy_refunds_one_active_per_order
  on public.topzy_refunds(order_id)
  where status in ('requested', 'approved', 'processing');

alter table public.topzy_refunds enable row level security;

-- Backend uses the service role after checking the authenticated user/admin.
-- Do not expose the service-role key to the browser.

create or replace function public.topzy_mark_refund_sent(
  p_refund_id uuid,
  p_admin_id uuid,
  p_transfer_reference text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_refund public.topzy_refunds%rowtype;
begin
  if not exists (select 1 from public.topzy_admins where user_id = p_admin_id) then
    raise exception 'Admin access required';
  end if;

  select * into v_refund
  from public.topzy_refunds
  where id = p_refund_id
  for update;

  if not found then raise exception 'Refund not found'; end if;
  if v_refund.status <> 'approved' and v_refund.status <> 'processing' then
    raise exception 'Refund must be approved before it can be marked sent';
  end if;

  update public.topzy_refunds
  set status = 'sent',
      transfer_reference = p_transfer_reference,
      sent_by = p_admin_id,
      sent_at = now(),
      updated_at = now()
  where id = p_refund_id
  returning * into v_refund;

  return jsonb_build_object(
    'id', v_refund.id,
    'order_id', v_refund.order_id,
    'status', v_refund.status,
    'transfer_reference', v_refund.transfer_reference,
    'sent_at', v_refund.sent_at
  );
end;
$$;
