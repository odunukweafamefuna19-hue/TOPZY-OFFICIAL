# TOPZY_NOTIFICATION_ENGINE

In-app notifications for the TOPZY customer dashboard and admin panel.

## Features
- Customer notification list.
- Unread notification count.
- Mark one notification read.
- Mark all notifications read.
- Admin can send a notification to one customer.
- Admin can send a notice to all users.

## Important
This is an in-app notification engine only. It does not send email, SMS, WhatsApp, or mobile push notifications. It is an integration package and is not connected to the live TOPZY website until configured and integrated.
Review existing database objects before running `supabase/schema.sql`. Keep the Supabase service-role key on the backend only.
The broadcast endpoint currently lists up to 1,000 Auth users in one request; for larger user bases, replace it with a paginated background job before production.

## Setup
1. Extract the ZIP.
2. Copy `.env.example` to `.env` and add Supabase credentials.
3. Review and run `supabase/schema.sql` in Supabase SQL Editor.
4. Ensure the admin's Auth UUID is present in `topzy_admins` (created by the other TOPZY backend modules).
5. Run `npm install`, then `npm start`.
6. Connect your existing notification bell and admin notification form to the API.

## API
Protected routes require `Authorization: Bearer SUPABASE_ACCESS_TOKEN`.

- `GET /api/notifications`
- `GET /api/notifications/unread-count`
- `PATCH /api/notifications/:id/read`
- `PATCH /api/notifications/read-all`
- `POST /api/admin/notifications` (admin only)

Admin request example:
```json
{
  "userId": "CUSTOMER_AUTH_UUID",
  "title": "Order update",
  "message": "Your order is now processing.",
  "type": "order",
  "metadata": { "orderId": "ORDER_UUID" }
}
```
Omit `userId` to broadcast to all users (up to the documented current limit).
