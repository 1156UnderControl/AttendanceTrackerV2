import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";
import { supabaseEnv } from "./env";

/** Supabase client acting as the current user (RLS applies). Create one per request. */
export async function createClient() {
  const env = supabaseEnv();
  if (!env) throw new Error("Supabase is not configured: see .env.example");
  const cookieStore = await cookies();

  return createServerClient<Database>(env.url, env.publishableKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components can't write cookies; src/proxy.ts refreshes the session.
        }
      },
    },
  });
}
