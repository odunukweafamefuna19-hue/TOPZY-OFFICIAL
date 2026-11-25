# TOPZY_WALLET_ENGINE

Wallet top-up request and admin SEND module for TOPZY.

## Features
- Customer creates a wallet top-up request.
- Request appears in the admin pending queue.
- Admin checks the real incoming transfer in the bank app.
- Admin taps SEND; backend credits the wallet and records a ledger transaction.
- Duplicate SEND requests cannot credit the same top-up twice.
- Customer can fetch their wallet balance and recent transactions.

## Important
This package is an integration module, not yet connected to the existing TOPZY website/backend. Review your current database before running the SQL. The SQL creates dedicated `topzy_wallet_*` tables and expects Supabase Auth. The admin UUID must be added to `topzy_admins`.
The SEND action does not move money between bank accounts. It credits TOPZY's internal customer wallet only after an admin verifies that the customer's transfer actually arrived.
Keep the Supabase service-role key on the server only.

## Setup
1. Extract the ZIP.
2. Copy `.env.example` to `.env` and fill in your Supabase credentials.
3. Review `supabase/schema.sql` and run it in Supabase SQL Editor.
4. Add your Supabase Auth user UUID to `topzy_admins`.
5. Run `npm install`, then `npm start`.
6. Connect the existing TOPZY wallet and admin UI to the endpoints below.

## API
All endpoints require `Authorization: Bearer SUPABASE_ACCESS_TOKEN`.

- `POST /api/wallet/topups` body: `{ "amount": 5000 }`
- `GET /api/wallet/me`
- `GET /api/admin/wallet/topups` (admin only)
- `POST /api/admin/wallet/topups/:topupId/send` (admin only), optional body `{ "note": "Transfer checked in bank app" }`

The frontend should refresh the wallet balance after a successful SEND response.
