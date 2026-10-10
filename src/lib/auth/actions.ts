"use server";

import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { devLoginEnabled } from "@/lib/auth/dev-login";
import { safeNext } from "@/lib/auth/session";
import { requestOrigin } from "@/lib/http";
import { createClient } from "@/lib/supabase/server";

export async function signInWithGoogle(formData: FormData) {
  const next = safeNext(formData.get("next"));
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${await requestOrigin()}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });
  if (error || !data.url) redirect(`/login?error=1&next=${encodeURIComponent(next)}`);
  redirect(data.url);
}

const DEV_PASSWORD = "devpassword";

/**
 * Local/CI only (ADR 0008): signs in with a seeded test account, or creates one.
 * Staging and prod have the email provider disabled, so this can't work there
 * even if ENABLE_DEV_LOGIN were set by mistake.
 */
export async function devSignIn(formData: FormData) {
  if (!devLoginEnabled()) notFound();
  const next = safeNext(formData.get("next"));
  const email = z.email().parse(formData.get("email"));
  const supabase = await createClient();

  const signIn = await supabase.auth.signInWithPassword({ email, password: DEV_PASSWORD });
  if (signIn.error) {
    const signUp = await supabase.auth.signUp({ email, password: DEV_PASSWORD });
    if (signUp.error) redirect(`/login?error=1&next=${encodeURIComponent(next)}`);
  }
  redirect(next);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
