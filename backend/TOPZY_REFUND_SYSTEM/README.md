# TOPZY REFUND ENGINE

Standalone refund-request and admin-review module.

## Features
- Customer submits a refund request for their own order.
- Customer views their refund history.
- Admin reviews requests and approves or rejects them.
- Admin records a refund as sent only after making the bank transfer and entering its reference.
- Database lock and status checks prevent marking the same refund sent twice.

## Important
This module does NOT send money, connect to a bank, or verify a transfer automatically. Admin must send the refund through the bank app and independently verify it before using `mark-sent`. Approval alone does not mean the customer has received money.

## Setup
1. Extract into `TOPZY BACKEND/TOPZY_REFUND_ENGINE`.
2. Copy `.env.example` to `.env`.
3. Add Supabase URL, anon key and service-role key to `.env`. Never upload `.env` or the service-role key to GitHub.
4. Review `supabase/schema.sql` against the real TOPZY schema before running it.
5. Install dependencies with `npm install`, then run `npm start`.

Default port: `3004`.

## API
- `GET /health`
- `POST /api/refunds/orders/:orderId/refunds` — body: `{ "reason": "order_cancelled", "details": "Optional explanation" }`
- `GET /api/refunds/my-refunds`
- `GET /api/refunds/admin/refunds`
- `PATCH /api/refunds/admin/refunds/:refundId/review` — body: `{ "action": "approve", "adminNote": "Optional note" }`
- `POST /api/refunds/admin/refunds/:refundId/mark-sent` — body: `{ "transferReference": "bank reference" }`

All API calls except `/health` require a Supabase access token. Admin endpoints also require membership in `topzy_admins`.

## Integration warning
This is a scaffold and remains separate from the other TOPZY engines. It assumes `orders.id` is UUID, `orders.user_id` references `auth.users`, `orders.total_amount` is the refundable amount, and `topzy_admins.user_id` exists. These assumptions must be checked and aligned with the final shared database before production. Add a proper refund policy and partial-refund rules before launch if required.
