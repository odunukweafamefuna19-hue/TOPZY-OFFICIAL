const router = require("express").Router();
const { authenticate } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/admin");
const asyncHandler = require("../utils/asyncHandler");
const { supabase } = require("../config/supabase");

router.get("/status", authenticate, requireAdmin, asyncHandler(async (_req, res) => {
  const { data, error } = await supabase.from("suppliers")
    .select("id, name, is_active, priority, created_at")
    .order("priority", { ascending: true });
  if (error) throw error;
  res.json({
    success: true,
    suppliers: data,
    note: "Provider API credentials and adapters must be configured before live orders can be routed."
  });
}));

module.exports = router;
