# TOPZY Database Setup

This package contains a Supabase/PostgreSQL schema and Row Level Security (RLS)
policies for the TOPZY platform.

## Important before running

- Check whether your existing TOPZY backend ZIP already created these tables.
- If tables with the same names already exist, compare the definitions before applying.
- Run this SQL in a development Supabase project first.
- Keep the Supabase `service_role` key on the backend only. Never put it in frontend JavaScript.
- This schema is a foundation; it does not create payment gateway or supplier API connections.

## Install

1. Open your Supabase project.
2. Open SQL Editor.
3. Run `sql/001_schema.sql`.
4. Then run `sql/002_rls_policies.sql`.
5. Confirm the tables and policies appear in the dashboard.

## Tables

- `profiles` — user profile and role
- `products` — TOPZY product catalogue
- `orders` and `order_items` — customer orders
- `wallet_transactions` — wallet ledger
- `payments` — payment records
- `suppliers` and `supplier_products` — central supplier catalogue
- `notifications` — user notifications

## Security model

Customers can read their own profile, orders, payment records, wallet transactions,
and notifications. Active products can be read publicly. Sensitive writes such as
wallet credits, payment confirmation, supplier updates, and order status changes
must be performed by trusted backend code using the Supabase service role after
server-side validation.

The initial `profiles.role` value is `customer`. Only a trusted administrator
should promote a profile to `admin`.
