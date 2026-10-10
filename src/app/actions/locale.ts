"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import { getAuth } from "@/lib/auth/session";
import { LOCALE_COOKIE, locales } from "@/i18n/config";
import { createClient } from "@/lib/supabase/server";

const localeSchema = z.enum(locales);

export async function setLocale(value: string) {
  const locale = localeSchema.parse(value);
  (await cookies()).set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  // Members keep the choice on every device, and the kiosk greets them in it (005-AC7).
  const auth = await getAuth();
  if (auth.member) {
    const supabase = await createClient();
    await supabase.from("members").update({ locale }).eq("id", auth.member.id);
  }
  revalidatePath("/", "layout");
}
