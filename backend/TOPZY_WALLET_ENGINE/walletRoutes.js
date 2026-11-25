import { Router } from "express";
import { adminDb } from "../supabase.js";
import { requireUser, requireAdmin } from "../middleware/auth.js";

const router = Router();

// Customer requests a top-up. This creates a pending request only; it does NOT add funds.
router.post("/wallet/topups", requireUser, async (req, res) => {
  try {
    const amount = Number(req.body?.amount);
    if (!Number.isFinite(amount) || amount < 100 || amount > 10000000 || Math.round(amount * 100) !== amount * 100) {
      return res.status(400).json({ error: "Enter a valid top-up amount (minimum ₦100)." });
    }
    const { data, error } = await adminDb.rpc("topzy_create_wallet_topup", {
      p_customer_id: req.user.id,
      p_amount: amount
    });
    if (error) throw error;
    res.status(201).json({ topup: data });
  } catch (error) {
    console.error("Top-up request failed:", error.message);
    res.status(500).json({ error: "Could not create top-up request." });
  }
});

// Customer sees their own wallet and recent ledger.
router.get("/wallet/me", requireUser, async (req, res) => {
  try {
    const { data: wallet, error: walletError } = await adminDb
      .from("topzy_wallets").select("balance,currency,updated_at")
      .eq("customer_id", req.user.id).maybeSingle();
    if (walletError) throw walletError;
    const { data: transactions, error: txError } = await adminDb
      .from("topzy_wallet_transactions")
      .select("id,type,amount,status,reference,description,created_at")
      .eq("customer_id", req.user.id).order("created_at", { ascending: false }).limit(30);
    if (txError) throw txError;
    res.json({ wallet: wallet || { balance: 0, currency: "NGN" }, transactions: transactions || [] });
  } catch (error) {
    console.error("Wallet fetch failed:", error.message);
    res.status(500).json({ error: "Could not load wallet." });
  }
});

// Admin queue.
router.get("/admin/wallet/topups", requireUser, requireAdmin, async (_req, res) => {
  const { data, error } = await adminDb.from("topzy_wallet_topups")
    .select("id,customer_id,amount,status,created_at")
    .eq("status", "pending").order("created_at", { ascending: true });
  if (error) return res.status(500).json({ error: "Could not load top-up requests." });
  res.json({ topups: data || [] });
});

// Admin SEND action: only use after checking the actual incoming bank transfer.
router.post("/admin/wallet/topups/:topupId/send", requireUser, requireAdmin, async (req, res) => {
  try {
    const note = typeof req.body?.note === "string" ? req.body.note.slice(0, 500) : null;
    const { data, error } = await adminDb.rpc("topzy_admin_send_wallet_topup", {
      p_topup_id: req.params.topupId,
      p_admin_id: req.user.id,
      p_admin_note: note
    });
    if (error) throw error;
    res.json({ success: true, result: data });
  } catch (error) {
    console.error("Wallet SEND failed:", error.message);
    res.status(400).json({ error: "Top-up could not be sent. Check its status and try again." });
  }
});

export default router;
