// Direct database access for e2e setup that the UI can't create (e.g. an auto-closed
// session from yesterday). Uses the LOCAL service key written by `pnpm env:local`.
import { existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/lib/database.types";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

export const db = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false } },
);

export async function memberId(code: string): Promise<string> {
  const { data, error } = await db.from("members").select("id").eq("code", code).single();
  if (error) throw error;
  return data.id;
}

/** Deletes a member's sessions overlapping [from, to), so tests can rerun on one database. */
export async function clearSessions(member: string, from: string, to: string) {
  const { error } = await db
    .from("sessions")
    .delete()
    .eq("member_id", member)
    .lt("check_in", to)
    .or(`check_out.gt.${from},check_out.is.null`);
  if (error) throw error;
}
