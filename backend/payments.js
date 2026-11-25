const router = require("express").Router();
const { authenticate } = require("../middleware/auth");
const { supabase } = require("../config/supabase");
const asyncHandler = require("../utils/asyncHandler");
const { HttpError } = require("../utils/httpError");

router.use(authenticate);

router.post("/initialize", asyncHandler(async (req, res) => {
  const { order_id } = req.body;
  if (!order_id) throw new HttpError(400, "order_id is required");

  const { data: order, error } = await supabase.from("orders")
    .select("id, total_amount, status")
    .eq("id", order_id).eq("user_id", req.user.id).maybeSingle();
  if (error) throw error;
  if (!order) throw new HttpError(404, "Order not found");
  if (order.status !== "pending_payment") throw new HttpError(409, "Order is not awaiting payment");

  // A real payment gateway must be configured before payment links can be issued.
  res.status(501).json({
    success: false,
    error: "Payment gateway is not connected yet. No payment has been initiated.",
    order_id: order.id,
    amount: order.total_amount
  });
}));

module.exports = router;
