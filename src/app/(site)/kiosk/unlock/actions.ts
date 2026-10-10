"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { LOCALE_COOKIE, locales } from "@/i18n/config";
import { requireAdmin } from "@/lib/auth/session";
import { KIOSK_COOKIE } from "@/lib/kiosk/device";

const YEAR = 60 * 60 * 24 * 365;

// 001-AC7: an admin turns this browser into the kiosk, with its default language (001-AC10).
export async function unlockKiosk(formData: FormData) {
  await requireAdmin();
  const token = process.env.KIOSK_TOKEN;
  if (!token) throw new Error("KIOSK_TOKEN is not configured");
  const locale = z.enum(locales).parse(formData.get("locale"));

  const store = await cookies();
  store.set(KIOSK_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: YEAR,
  });
  store.set(LOCALE_COOKIE, locale, { path: "/", maxAge: YEAR, sameSite: "lax" });
  redirect("/kiosk");
}

export async function lockKiosk() {
  await requireAdmin();
  (await cookies()).delete(KIOSK_COOKIE);
  redirect("/kiosk/unlock");
}
