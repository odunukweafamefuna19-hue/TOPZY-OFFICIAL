const router = require("express").Router();
const { authenticate } = require("../middleware/auth");
const { supabase } = require("../config/supabase");
const asyncHandler = require("../utils/asyncHandler");
const { HttpError } = require("../utils/httpError");

router.use(authenticate);

router.get("/me", asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, phone, role, created_at")
    .eq("id", req.user.id)
    .maybeSingle();
  if (error) throw error;
  res.json({ success: true, profile: data });
}));

router.patch("/me", asyncHandler(async (req, res) => {
  const allowed = {};
  if (typeof req.body.full_name === "string") allowed.full_name = req.body.full_name.trim();
  if (typeof req.body.phone === "string") allowed.phone = req.body.phone.trim();
  if (!Object.keys(allowed).length) throw new HttpError(400, "No valid profile fields supplied");

  const { data, error } = await supabase
    .from("profiles")
    .update(allowed)
    .eq("id", req.user.id)
    .select("id, full_name, phone, role, created_at")
    .single();
  if (error) throw error;
  res.json({ success: true, profile: data });
}));

module.exports = router;
