"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import { LOCALE_COOKIE, locales } from "@/i18n/config";
import { getAuth } from "@/lib/auth/session";
import { errorCode, type ActionState } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/),
  locale: z.enum(locales),
});

// 005-AC4, AC7: members edit only name, code and language (also enforced by members_guard).
export async function updateProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const auth = await getAuth();
  if (!auth.member) return { error: "NOT_AUTHENTICATED" };

  const parsed = schema.safeParse({
    name: formData.get("name"),
    code: formData.get("code"),
    locale: formData.get("locale"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.path[0] === "name" ? "NAME_INVALID" : "CODE_INVALID" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("members").update(parsed.data).eq("id", auth.member.id);
  if (error) return { error: errorCode(error) };

  (await cookies()).set(LOCALE_COOKIE, parsed.data.locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
  return { ok: true };
}
