import "server-only";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import type { Tables } from "@/lib/database.types";
import { supabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export type Member = Tables<"members">;

export type Auth = {
  userId: string | null;
  email: string | null;
  fullName: string | null;
  member: Member | null;
  isAdmin: boolean;
};

const anonymous: Auth = { userId: null, email: null, fullName: null, member: null, isAdmin: false };

/** The current user, their member profile and admin flag. Cached per request. */
export const getAuth = cache(async (): Promise<Auth> => {
  if (!supabaseEnv()) return anonymous;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return anonymous;

  const [{ data: member }, { data: isAdmin }] = await Promise.all([
    supabase.from("members").select("*").eq("user_id", claims.sub).maybeSingle(),
    supabase.rpc("is_admin"),
  ]);
  const metadata = (claims.user_metadata ?? {}) as Record<string, unknown>;
  const fullName = typeof metadata.full_name === "string" ? metadata.full_name : null;

  return {
    userId: claims.sub,
    email: typeof claims.email === "string" ? claims.email : null,
    fullName,
    member: member ?? null,
    isAdmin: isAdmin === true,
  };
});

/** Only allow same-site relative paths as post-login destinations. */
export function safeNext(next: unknown, fallback = "/minha-presenca"): string {
  return typeof next === "string" &&
    next.startsWith("/") &&
    !next.startsWith("//") &&
    !next.startsWith("/\\")
    ? next
    : fallback;
}

export async function requireUser(next: string): Promise<Auth & { userId: string }> {
  const auth = await getAuth();
  if (!auth.userId) redirect(`/login?next=${encodeURIComponent(next)}`);
  return auth as Auth & { userId: string };
}

/** Admin pages and actions respond 404 to everyone else (004-AC9). */
export async function requireAdmin(): Promise<Auth & { userId: string; member: Member | null }> {
  const auth = await getAuth();
  if (!auth.userId || !auth.isAdmin) notFound();
  return auth as Auth & { userId: string };
}
