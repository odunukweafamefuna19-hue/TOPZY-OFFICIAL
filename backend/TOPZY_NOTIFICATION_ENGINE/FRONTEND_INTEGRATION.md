# Frontend integration

Use your existing TOPZY notification bell and notification page.

- Load notification rows with `GET /api/notifications`.
- Load the badge number with `GET /api/notifications/unread-count`.
- Mark a row read with `PATCH /api/notifications/{id}/read`.
- Mark all read with `PATCH /api/notifications/read-all`.
- Admin sends an in-app notification using `POST /api/admin/notifications`.

Refresh the list and unread count after any read action or after returning to the page.
