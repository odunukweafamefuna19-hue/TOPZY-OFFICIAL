const { supabase } = require("../config/supabase");
const asyncHandler = require("../utils/asyncHandler");
const { HttpError } = require("../utils/httpError");

const requireAdmin = asyncHandler(async (req, _res, next) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", req.user.id)
    .maybeSingle();

  if (error) throw new HttpError(500, "Could not verify administrator role");
  if (!data || data.role !== "admin") throw new HttpError(403, "Administrator access required");
  next();
});

module.exports = { requireAdmin };
