const router = require("express").Router();
const { authenticate } = require("../middleware/auth");
const { supabase } = require("../config/supabase");
const asyncHandler = require("../utils/asyncHandler");
const { HttpError } = require("../utils/httpError");

router.use(authenticate);

router.get("/", asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from("orders")
    .select("id, status, total_amount, delivery_address, created_at, order_items(id, product_id, quantity, unit_price)")
    .eq("user_id", req.user.id).order("created_at", { ascending: false });
  if (error) throw error;
  res.json({ success: true, orders: data });
}));

router.post("/", asyncHandler(async (req, res) => {
  const { items, delivery_address } = req.body;
  if (!Array.isArray(items) || !items.length || items.length > 50) {
    throw new HttpError(400, "Provide between 1 and 50 order items");
  }
  if (typeof delivery_address !== "string" || delivery_address.trim().length < 5) {
    throw new HttpError(400, "A valid delivery address is required");
  }

  const ids = [...new Set(items.map(item => item.product_id).filter(Boolean))];
  if (!ids.length || ids.length !== new Set(items.map(item => item.product_id)).size) {
    throw new HttpError(400, "Invalid product list");
  }

  const { data: products, error: productError } = await supabase.from("products")
    .select("id, price, stock, is_active").in("id", ids);
  if (productError) throw productError;
  if (products.length !== ids.length) throw new HttpError(400, "One or more products do not exist");

  const normalized = items.map(item => {
    const product = products.find(p => p.id === item.product_id);
    const quantity = Number(item.quantity);
    if (!product || !product.is_active || !Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
      throw new HttpError(400, "Invalid product or quantity");
    }
    if (product.stock !== null && product.stock < quantity) throw new HttpError(409, "Insufficient stock");
    return { product_id: product.id, quantity, unit_price: Number(product.price) };
  });

  const total = normalized.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  const { data: order, error: orderError } = await supabase.from("orders")
    .insert({
      user_id: req.user.id,
      status: "pending_payment",
      total_amount: total,
      delivery_address: delivery_address.trim()
    }).select("id, status, total_amount, created_at").single();
  if (orderError) throw orderError;

  const rows = normalized.map(item => ({ ...item, order_id: order.id }));
  const { error: itemsError } = await supabase.from("order_items").insert(rows);
  if (itemsError) {
    await supabase.from("orders").delete().eq("id", order.id).eq("user_id", req.user.id);
    throw itemsError;
  }

  res.status(201).json({ success: true, order, message: "Order created. Payment is not yet confirmed." });
}));

router.get("/:id", asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from("orders")
    .select("id, status, total_amount, delivery_address, created_at, order_items(id, product_id, quantity, unit_price)")
    .eq("id", req.params.id).eq("user_id", req.user.id).maybeSingle();
  if (error) throw error;
  if (!data) throw new HttpError(404, "Order not found");
  res.json({ success: true, order: data });
}));

module.exports = router;
