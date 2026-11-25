-- TOPZY database foundation (Supabase PostgreSQL)
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category text not null default 'Other',
  price numeric(14,2) not null check (price >= 0),
  currency text not null default 'NGN',
  image_url text,
  is_active boolean not null default true,
  stock_quantity integer check (stock_quantity is null or stock_quantity >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  order_number text unique,
  status text not null default 'pending'
    check (status in ('pending','awaiting_payment','paid','processing','shipped','delivered','cancelled','failed')),
  subtotal numeric(14,2) not null default 0 check (subtotal >= 0),
  delivery_fee numeric(14,2) not null default 0 check (delivery_fee >= 0),
  total numeric(14,2) not null default 0 check (total >= 0),
  delivery_address text,
  customer_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(14,2) not null check (unit_price >= 0),
  line_total numeric(14,2) not null check (line_total >= 0),
  supplier_id text,
  supplier_product_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  type text not null check (type in ('credit','debit','refund','adjustment')),
  amount numeric(14,2) not null check (amount > 0),
  currency text not null default 'NGN',
  status text not null default 'pending' check (status in ('pending','successful','failed','reversed')),
  reference text unique,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete set null,
  user_id uuid not null references public.profiles(id),
  provider text not null default 'manual',
  method text,
  amount numeric(14,2) not null check (amount > 0),
  currency text not null default 'NGN',
  status text not null default 'pending'
    check (status in ('pending','successful','failed','rejected','refunded')),
  reference text unique,
  proof_url text,
  verified_by uuid references public.profiles(id),
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  supplier_code text not null unique,
  name text not null,
  is_enabled boolean not null default false,
  api_base_url text,
  -- Store secret credentials in hosting environment variables or a secrets manager,
  -- not in this table and never in the browser.
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.supplier_products (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  supplier_product_id text not null,
  product_id uuid references public.products(id) on delete set null,
  supplier_name text not null,
  supplier_price numeric(14,2) check (supplier_price is null or supplier_price >= 0),
  currency text not null default 'NGN',
  in_stock boolean not null default true,
  last_synced_at timestamptz,
  unique (supplier_id, supplier_product_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_orders_user_created on public.orders(user_id, created_at desc);
create index if not exists idx_order_items_order on public.order_items(order_id);
create index if not exists idx_wallet_user_created on public.wallet_transactions(user_id, created_at desc);
create index if not exists idx_payments_user_created on public.payments(user_id, created_at desc);
create index if not exists idx_notifications_user_created on public.notifications(user_id, created_at desc);
create index if not exists idx_products_active_category on public.products(is_active, category);
create index if not exists idx_supplier_products_supplier on public.supplier_products(supplier_id);
