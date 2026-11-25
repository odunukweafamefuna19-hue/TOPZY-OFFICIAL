const router = require("express").Router();
const { authenticate } = require("../middleware/auth");
const { supabase } = require("../config/supabase");
const asyncHandler = require("../utils/asyncHandler");

router.use(authenticate);

router.get("/", asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from("wallets")
    .select("balance, currency, updated_at")
    .eq("user_id", req.user.id).maybeSingle();
  if (error) throw error;
  res.json({ success: true, wallet: data || { balance: 0, currency: "NGN" } });
}));

router.get("/transactions", asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from("wallet_transactions")
    .select("id, type, amount, status, reference, description, created_at")
    .eq("user_id", req.user.id).order("created_at", { ascending: false }).limit(100);
  if (error) throw error;
  res.json({ success: true, transactions: data });
}));

module.exports = router;
