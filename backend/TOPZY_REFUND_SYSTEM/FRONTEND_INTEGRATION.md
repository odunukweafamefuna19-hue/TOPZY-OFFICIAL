# Frontend integration

Send `Authorization: Bearer <supabase_access_token>`.

Customer:
- Submit refund request with `POST /api/refunds/orders/:orderId/refunds`.
- Display history from `GET /api/refunds/my-refunds`.

Admin:
- Load queue from `GET /api/refunds/admin/refunds`.
- Review with `PATCH /api/refunds/admin/refunds/:refundId/review`.
- After the bank transfer is independently verified, record it with `POST /api/refunds/admin/refunds/:refundId/mark-sent`.

Suggested labels:
- requested: Awaiting review
- approved: Approved — awaiting transfer
- rejected: Rejected
- sent: Refund sent

Do not label `approved` as `refunded` or `sent`.
