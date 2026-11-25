import "dotenv/config";
const required = (key) => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing environment variable: ${key}`);
  return value;
};
export const config = {
  port: Number(process.env.PORT || 3002),
  frontendOrigin: process.env.FRONTEND_ORIGIN || "*",
  supabaseUrl: required("SUPABASE_URL"),
  anonKey: required("SUPABASE_ANON_KEY"),
  serviceRoleKey: required("SUPABASE_SERVICE_ROLE_KEY")
};
