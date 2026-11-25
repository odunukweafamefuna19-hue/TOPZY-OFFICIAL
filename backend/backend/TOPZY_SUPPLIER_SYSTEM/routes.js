function createSupplierRouter(express, service, requireAdmin) {
  const router = express.Router();

  router.get("/", async (req, res) => {
    res.json({ suppliers: service.listProviders() });
  });

  router.get("/catalog", async (req, res) => {
    try {
      const result = await service.getCatalog({
        supplierId: req.query.supplierId,
        category: req.query.category,
        search: req.query.search
      });
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Unable to load supplier catalog" });
    }
  });

  router.get("/:supplierId/products/:productId", async (req, res) => {
    try {
      res.json({ product: await service.getProduct(req.params.supplierId, req.params.productId) });
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message || "Request failed" });
    }
  });

  router.post("/:supplierId/orders", ...(requireAdmin ? [requireAdmin] : []), async (req, res) => {
    try {
      const result = await service.createOrder(req.params.supplierId, req.body);
      res.status(201).json({ order: result });
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message || "Order failed" });
    }
  });

  return router;
}

module.exports = { createSupplierRouter };
