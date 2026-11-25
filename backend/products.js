const router = require("express").Router();
const { supabase } = require("../config/supabase");
const asyncHandler = require("../utils/asyncHandler");
const { HttpError } = require("../utils/httpError");

router.get("/", asyncHandler(async (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
  const from = (page - 1) * limit;
  let query = supabase.from("products")
    .select("id, name, description, price, image_url, category, stock, is_active, created_at", { count: "exact" })
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .range(from, from + limit - 1);

  if (req.query.category) query = query.eq("category", String(req.query.category));
  if (req.query.search) query = query.ilike("name", `%${String(req.query.search).slice(0, 80)}%`);

  const { data, error, count } = await query;
  if (error) throw error;
  res.json({ success: true, products: data, pagination: { page, limit, total: count } });
}));

router.get("/:id", asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from("products")
    .select("id, name, description, price, image_url, category, stock, is_active")
    .eq("id", req.params.id).eq("is_active", true).maybeSingle();
  if (error) throw error;
  if (!data) throw new HttpError(404, "Product not found");
  res.json({ success: true, product: data });
}));

module.exports = router;
