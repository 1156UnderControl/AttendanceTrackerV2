// Health check used by the deploy smoke test and keepalive.yml (spec 007).
// TODO(milestone 3): replace the Auth ping with a trivial RPC once the schema exists.
export const dynamic = "force-dynamic";

async function checkSupabase(): Promise<"ok" | "not_configured" | "unreachable"> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return "not_configured";
  try {
    const response = await fetch(`${url}/auth/v1/health`, {
      headers: { apikey: key },
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });
    return response.ok ? "ok" : "unreachable";
  } catch {
    return "unreachable";
  }
}

export async function GET() {
  const supabase = await checkSupabase();
  const healthy = supabase !== "unreachable";
  return Response.json(
    { status: healthy ? "ok" : "degraded", supabase, time: new Date().toISOString() },
    { status: healthy ? 200 : 503 },
  );
}
