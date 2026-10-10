import { NextResponse, type NextRequest } from "next/server";
import { safeNext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

// Google OAuth returns here with a PKCE code (src/lib/auth/actions.ts → signInWithGoogle).
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNext(url.searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  }
  return NextResponse.redirect(
    new URL(`/login?error=1&next=${encodeURIComponent(next)}`, url.origin),
  );
}
