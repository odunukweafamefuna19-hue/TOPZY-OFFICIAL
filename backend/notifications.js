const router = require("express").Router();
const { authenticate } = require("../middleware/auth");
const { supabase } = require("../config/supabase");
const asyncHandler = require("../utils/asyncHandler");

router.use(authenticate);

router.get("/", asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from("notifications")
    .select("id, title, message, is_read, created_at")
    .eq("user_id", req.user.id).order("created_at", { ascending: false }).limit(100);
  if (error) throw error;
  res.json({ success: true, notifications: data });
}));

router.patch("/:id/read", asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from("notifications")
    .update({ is_read: true }).eq("id", req.params.id).eq("user_id", req.user.id)
    .select("id, is_read").maybeSingle();
  if (error) throw error;
  res.json({ success: true, notification: data });
}));

module.exports = router;
