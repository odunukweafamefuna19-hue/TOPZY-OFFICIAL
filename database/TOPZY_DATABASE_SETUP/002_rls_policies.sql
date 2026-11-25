-- TOPZY Row Level Security
-- Admin check uses a SECURITY DEFINER function to avoid recursive profile policies.
create or replace function public.topzy_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

revoke all on function public.topzy_is_admin() from public;
grant execute on function public.topzy_is_admin() to authenticated;

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.payments enable row level security;
alter table public.suppliers enable row level security;
alter table public.supplier_products enable row level security;
alter table public.notifications enable row level security;

drop policy if exists "profile read own or admin" on public.profiles;
create policy "profile read own or admin" on public.profiles
for select to authenticated
using (id = auth.uid() or public.topzy_is_admin());

drop policy if exists "profile update own or admin" on public.profiles;
create policy "profile update own or admin" on public.profiles
for update to authenticated
using (id = auth.uid() or public.topzy_is_admin())
with check (id = auth.uid() or public.topzy_is_admin());

drop policy if exists "active products readable" on public.products;
create policy "active products readable" on public.products
for select to anon, authenticated
using (is_active = true or public.topzy_is_admin());

drop policy if exists "admins manage products" on public.products;
create policy "admins manage products" on public.products
for all to authenticated
using (public.topzy_is_admin())
with check (public.topzy_is_admin());

drop policy if exists "users read own orders" on public.orders;
create policy "users read own orders" on public.orders
for select to authenticated
using (user_id = auth.uid() or public.topzy_is_admin());

drop policy if exists "users create own orders" on public.orders;
create policy "users create own orders" on public.orders
for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists "admins manage orders" on public.orders;
create policy "admins manage orders" on public.orders
for all to authenticated
using (public.topzy_is_admin())
with check (public.topzy_is_admin());

drop policy if exists "users read own order items" on public.order_items;
create policy "users read own order items" on public.order_items
for select to authenticated
using (
  exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  or public.topzy_is_admin()
);

drop policy if exists "admins manage order items" on public.order_items;
create policy "admins manage order items" on public.order_items
for all to authenticated
using (public.topzy_is_admin())
with check (public.topzy_is_admin());

drop policy if exists "users read own wallet transactions" on public.wallet_transactions;
create policy "users read own wallet transactions" on public.wallet_transactions
for select to authenticated
using (user_id = auth.uid() or public.topzy_is_admin());

drop policy if exists "admins manage wallet transactions" on public.wallet_transactions;
create policy "admins manage wallet transactions" on public.wallet_transactions
for all to authenticated
using (public.topzy_is_admin())
with check (public.topzy_is_admin());

drop policy if exists "users read own payments" on public.payments;
create policy "users read own payments" on public.payments
for select to authenticated
using (user_id = auth.uid() or public.topzy_is_admin());

drop policy if exists "admins manage payments" on public.payments;
create policy "admins manage payments" on public.payments
for all to authenticated
using (public.topzy_is_admin())
with check (public.topzy_is_admin());

drop policy if exists "admins manage suppliers" on public.suppliers;
create policy "admins manage suppliers" on public.suppliers
for all to authenticated
using (public.topzy_is_admin())
with check (public.topzy_is_admin());

drop policy if exists "admins manage supplier products" on public.supplier_products;
create policy "admins manage supplier products" on public.supplier_products
for all to authenticated
using (public.topzy_is_admin())
with check (public.topzy_is_admin());

drop policy if exists "users read own notifications" on public.notifications;
create policy "users read own notifications" on public.notifications
for select to authenticated
using (user_id = auth.uid() or public.topzy_is_admin());

drop policy if exists "users mark own notifications read" on public.notifications;
create policy "users mark own notifications read" on public.notifications
for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "admins manage notifications" on public.notifications;
create policy "admins manage notifications" on public.notifications
for all to authenticated
using (public.topzy_is_admin())
with check (public.topzy_is_admin());
