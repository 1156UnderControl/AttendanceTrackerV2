import { timingSafeEqual } from "node:crypto";
import { createServiceClient } from "@/lib/supabase/service";

// Daily at 04:00 BRT (vercel.json, 07:00 UTC). Vercel Cron sends
// "Authorization: Bearer $CRON_SECRET". The SQL function uses the fixed cutoff,
// so Hobby's imprecise timing doesn't matter (ADR 0003, spec 006).
export const dynamic = "force-dynamic";

function authorized(header: string | null): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || !header) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(header);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function GET(request: Request) {
  if (!authorized(request.headers.get("authorization"))) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const { data, error } = await createServiceClient().rpc("close_stale_sessions");
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ closed: data });
}
