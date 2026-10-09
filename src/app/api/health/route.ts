// Keep-alive target for .github/workflows/keepalive.yml (spec 007).
// TODO(milestone 3): run a trivial query so the Supabase project stays active.
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ status: "ok", time: new Date().toISOString() });
}
