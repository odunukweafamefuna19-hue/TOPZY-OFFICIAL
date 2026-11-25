import { createClient } from "@supabase/supabase-js";
import { config } from "./config.js";
export const adminDb = createClient(config.supabaseUrl, config.serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});
export function userDb(token) {
  return createClient(config.supabaseUrl, config.anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false }
  });
}
