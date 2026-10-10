"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { LOCALE_COOKIE, locales } from "@/i18n/config";
import { errorCode, type ActionState } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  token: z.string().min(10).max(200),
  name: z.string().trim().min(2).max(80),
  category: z.enum(["FRC", "FTC"]).optional(),
  code: z
    .string()
    .trim()
    .regex(/^(\d{6})?$/),
  locale: z.enum(locales),
});

// 002-AC3–AC6, AC10
export async function redeemInvite(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = schema.safeParse({
    token: formData.get("token"),
    name: formData.get("name"),
    category: formData.get("category") || undefined,
    code: formData.get("code") ?? "",
    locale: formData.get("locale"),
  });
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0];
    return {
      error: field === "name" ? "NAME_INVALID" : field === "code" ? "CODE_INVALID" : "UNKNOWN",
    };
  }

  const { token, name, category, code, locale } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.rpc("redeem_invite", {
    p_token: token,
    p_name: name,
    p_category: category,
    p_code: code || undefined,
    p_locale: locale,
  });

  if (error) {
    const code = errorCode(error);
    if (code === "ALREADY_MEMBER") redirect("/minha-presenca");
    return { error: code };
  }

  (await cookies()).set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  redirect("/minha-presenca");
}
