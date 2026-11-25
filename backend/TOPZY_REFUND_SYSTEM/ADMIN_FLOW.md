# Admin refund workflow

1. Open the refund queue.
2. Check the original order and confirm the original payment was received.
3. Approve or reject the request with an optional note.
4. If approved, send the refund manually through the appropriate bank app.
5. Verify the transfer succeeded in the bank app.
6. Record the bank transfer reference using the mark-sent endpoint.

Never mark a refund sent before the actual bank transfer is confirmed. The API only records the admin action; it does not move funds.
