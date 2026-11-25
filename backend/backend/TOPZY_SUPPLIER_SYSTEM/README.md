# TOPZY Supplier System

A central supplier layer that lets TOPZY connect multiple providers through one normalized interface.

## Included
- One registry for multiple supplier adapters
- A common product format
- Combined catalog retrieval
- Individual supplier product lookup
- Supplier order handoff endpoint
- Per-provider error reporting

## Setup

1. Copy this folder into the TOPZY backend.
2. Install no extra dependencies beyond the backend's existing Express installation.
3. Create provider adapters using `providers/example-provider.js` as the template.
4. Register providers in the backend:

```js
const express = require("express");
const { createSupplierRegistry, createSupplierService, createSupplierRouter } = require("./supplier-system");
const { createExampleProvider } = require("./supplier-system/providers/example-provider");

const registry = createSupplierRegistry([
  createExampleProvider({
    apiKey: process.env.EXAMPLE_SUPPLIER_API_KEY,
    baseUrl: process.env.EXAMPLE_SUPPLIER_BASE_URL
  })
]);

const supplierService = createSupplierService(registry);
app.use("/api/suppliers", createSupplierRouter(express, supplierService, requireAdmin));
```

Adjust the import paths to match where this folder is placed.

## API
- `GET /api/suppliers` — list registered providers
- `GET /api/suppliers/catalog` — combined catalog
- `GET /api/suppliers/catalog?supplierId=example-provider` — one provider catalog
- `GET /api/suppliers/:supplierId/products/:productId` — one supplier product
- `POST /api/suppliers/:supplierId/orders` — submit supplier order (protect with admin/order authorization)

## Important
This is the integration framework, not a live supplier connection. Real supplier names, API documentation, credentials, product mapping, order rules, and testing are required before any provider can go live. Do not expose supplier API keys to the browser. Do not let customers submit arbitrary supplier orders directly.
