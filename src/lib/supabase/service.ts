import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { supabaseEnv } from "./env";

/**
 * Service-role client (bypasses RLS). Only for the kiosk and cron server code, and only
 * to call their dedicated SQL functions (docs/architecture/auth-and-security.md).
 */
export function createServiceClient() {
  const env = supabaseEnv();
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!env || !secretKey) throw new Error("Supabase service access is not configured");
  return createClient<Database>(env.url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
