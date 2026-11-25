# TOPZY Order Engine

Order creation, customer order history, order lookup, and controlled status transitions for TOPZY.

## Requirements

- Node.js 18+
- Existing Express backend
- Existing Supabase client
- Database tables: `products`, `orders`, and `order_items`
- Authentication middleware that makes the authenticated user available through the `getUser(req)` callback

## Install / place in project

Copy this folder into the TOPZY backend repository as:

```text
TOPZY BACKEND/
  server.js
  src/
  TOPZY_ORDER_ENGINE/
    index.js
    src/
```

No separate `npm install` is required for this module. It uses Node.js built-ins and the Supabase client already used by the backend.

## Mount in Express

```js
const { createOrderEngine } = require("./TOPZY_ORDER_ENGINE");
const { createOrderRouter } = require("./TOPZY_ORDER_ENGINE/src/routes");

const orderEngine = createOrderEngine({
  supabase,
  getUser: async (req) => req.user
});

app.use(
  "/api/orders",
  createOrderRouter({
    express,
    engine: orderEngine,
    requireAuth,
    requireAdmin
  })
);
```

Adjust the import paths and `getUser` callback to match the actual backend files. Do not paste secrets into this package or commit `.env` files.

## API

- `POST /api/orders` — create an order for the authenticated user
- `GET /api/orders` — list the authenticated user's orders
- `GET /api/orders/:orderId` — retrieve one of the authenticated user's orders
- `PATCH /api/orders/:orderId/status` — admin status update (only mounted when `requireAdmin` is supplied)

Example create body:

```json
{
  "items": [
    { "product_id": "PRODUCT_UUID", "quantity": 2 }
  ],
  "customer_note": "Please call before delivery."
}
```

## Status flow

`pending -> confirmed -> processing -> shipped -> delivered`

Cancellation is allowed from `pending`, `confirmed`, or `processing`. Delivered and cancelled orders are terminal.

## Important integration notes

- This module calculates order totals from product prices read from the database. It does not trust prices sent by the browser.
- Stock is checked before the order is created, but this basic module does not reserve or decrement inventory. Add a database transaction / RPC before enabling high-volume checkout to prevent simultaneous orders overselling stock.
- Payment collection, payment verification, supplier dispatch, refunds, and delivery tracking are not implemented by this package.
- Make sure your database schema has the columns used by this module. Review and reconcile it with the existing TOPZY database setup before running it.
- Enforce ownership and admin permissions with your existing middleware and Supabase Row Level Security.
- Add an Express error handler that returns `error.status || 500` without exposing private database details to customers.
