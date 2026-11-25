import { adminDb, userDb } from "../supabase.js";

export async function requireUser(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (!token) return res.status(401).json({ error: "Sign in is required." });
    const db = userDb(token);
    const { data, error } = await db.auth.getUser();
    if (error || !data?.user) return res.status(401).json({ error: "Invalid or expired session." });
    req.user = data.user;
    req.userDb = db;
    next();
  } catch {
    res.status(401).json({ error: "Could not verify your session." });
  }
}

export async function requireAdmin(req, res, next) {
  try {
    const { data, error } = await adminDb.from("topzy_admins")
      .select("user_id").eq("user_id", req.user.id).maybeSingle();
    if (error) throw error;
    if (!data) return res.status(403).json({ error: "Admin access required." });
    next();
  } catch (error) {
    console.error("Admin check failed:", error.message);
    res.status(500).json({ error: "Could not verify admin access." });
  }
}
