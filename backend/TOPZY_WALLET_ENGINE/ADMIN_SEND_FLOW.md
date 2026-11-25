# Admin SEND flow

1. Customer submits a top-up request.
2. Request is stored with status `pending`.
3. Admin checks the incoming transfer in OPay/Moniepoint.
4. Admin taps SEND for that exact pending request.
5. Server checks admin permission and locks the request in a database transaction.
6. Wallet balance is incremented and a unique ledger row is inserted.
7. Request becomes `credited`.
8. A repeat SEND cannot credit it twice.

Never enable SEND before checking the actual bank transfer.
