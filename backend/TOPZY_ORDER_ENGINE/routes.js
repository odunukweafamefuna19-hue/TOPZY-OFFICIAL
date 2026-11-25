function createOrderRouter({ express, engine, requireAuth, requireAdmin }) {
  if (!express || !engine || !requireAuth) {
    throw new Error("express, engine and requireAuth are required.");
  }

  const router = express.Router();

  router.post("/", requireAuth, async (req, res, next) => {
    try {
      const order = await engine.createOrder(req, req.body || {});
      res.status(201).json({ success: true, order });
    } catch (error) {
      next(error);
    }
  });

  router.get("/", requireAuth, async (req, res, next) => {
    try {
      const orders = await engine.listMyOrders(req);
      res.json({ success: true, orders });
    } catch (error) {
      next(error);
    }
  });

  router.get("/:orderId", requireAuth, async (req, res, next) => {
    try {
      const order = await engine.getMyOrder(req, req.params.orderId);
      res.json({ success: true, order });
    } catch (error) {
      next(error);
    }
  });

  if (requireAdmin) {
    router.patch("/:orderId/status", requireAuth, requireAdmin, async (req, res, next) => {
      try {
        const status = String(req.body?.status || "");
        const order = await engine.updateOrderStatus(req.params.orderId, status, req.user?.id || "admin");
        res.json({ success: true, order });
      } catch (error) {
        next(error);
      }
    });
  }

  return router;
}

module.exports = { createOrderRouter };