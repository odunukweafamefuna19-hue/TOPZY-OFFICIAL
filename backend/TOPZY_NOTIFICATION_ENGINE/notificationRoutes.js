import { Router } from "express";
import { adminDb } from "../supabase.js";
import { requireUser, requireAdmin } from "../middleware/auth.js";

const router = Router();

router.get("/notifications", requireUser, async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 30, 1), 100);
    const { data, error } = await adminDb.from("topzy_notifications")
      .select("id,title,message,type,is_read,metadata,created_at")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    res.json({ notifications: data || [] });
  } catch (error) {
    console.error("Notifications fetch failed:", error.message);
    res.status(500).json({ error: "Could not load notifications." });
  }
});

router.get("/notifications/unread-count", requireUser, async (req, res) => {
  const { count, error } = await adminDb.from("topzy_notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", req.user.id).eq("is_read", false);
  if (error) return res.status(500).json({ error: "Could not load unread count." });
  res.json({ unreadCount: count || 0 });
});

router.patch("/notifications/:id/read", requireUser, async (req, res) => {
  const { data, error } = await adminDb.from("topzy_notifications")
    .update({ is_read: true })
    .eq("id", req.params.id).eq("user_id", req.user.id)
    .select("id,is_read").maybeSingle();
  if (error) return res.status(500).json({ error: "Could not update notification." });
  if (!data) return res.status(404).json({ error: "Notification not found." });
  res.json({ notification: data });
});

router.patch("/notifications/read-all", requireUser, async (req, res) => {
  const { error } = await adminDb.from("topzy_notifications")
    .update({ is_read: true })
    .eq("user_id", req.user.id).eq("is_read", false);
  if (error) return res.status(500).json({ error: "Could not mark notifications as read." });
  res.json({ success: true });
});

// Admin can send an in-app notice to one user or all users.
// This endpoint does not send email, SMS, or push notifications.
router.post("/admin/notifications", requireUser, requireAdmin, async (req, res) => {
  try {
    const { userId = null, title, message, type = "general", metadata = {} } = req.body || {};
    const allowedTypes = ["general", "order", "payment", "wallet", "promotion", "system"];
    if (typeof title !== "string" || !title.trim() || title.length > 120) {
      return res.status(400).json({ error: "Title is required (maximum 120 characters)." });
    }
    if (typeof message !== "string" || !message.trim() || message.length > 2000) {
      return res.status(400).json({ error: "Message is required (maximum 2,000 characters)." });
    }
    if (!allowedTypes.includes(type)) return res.status(400).json({ error: "Invalid notification type." });
    if (userId !== null && (typeof userId !== "string" || userId.length > 100)) {
      return res.status(400).json({ error: "Invalid user ID." });
    }

    let recipients;
    if (userId) {
      recipients = [userId];
    } else {
      const { data, error } = await adminDb.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (error) throw error;
      recipients = (data.users || []).map(user => user.id);
    }

    if (!recipients.length) return res.json({ sent: 0 });
    const rows = recipients.map(id => ({
      user_id: id, title: title.trim(), message: message.trim(),
      type, metadata: metadata && typeof metadata === "object" && !Array.isArray(metadata) ? metadata : {}
    }));

    let inserted = 0;
    for (let i = 0; i < rows.length; i += 500) {
      const { data, error } = await adminDb.from("topzy_notifications")
        .insert(rows.slice(i, i + 500)).select("id");
      if (error) throw error;
      inserted += data?.length || 0;
    }
    res.status(201).json({ sent: inserted });
  } catch (error) {
    console.error("Admin notification failed:", error.message);
    res.status(500).json({ error: "Could not send notification." });
  }
});

export default router;
