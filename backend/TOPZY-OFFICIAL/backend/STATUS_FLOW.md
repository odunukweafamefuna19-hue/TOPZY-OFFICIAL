# Order status flow

```text
pending
  ├── confirmed
  │     └── processing
  │            ├── shipped
  │            │     └── delivered
  │            └── cancelled
  └── cancelled
```

A confirmed order may also be cancelled. A shipped order cannot be cancelled through this basic status flow. Refund handling is intentionally outside this module.
