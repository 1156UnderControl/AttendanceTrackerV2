"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { LOCALE_COOKIE, locales } from "@/i18n/config";

const localeSchema = z.enum(locales);

export async function setLocale(value: string) {
  const locale = localeSchema.parse(value);
  // TODO(spec 005): also persist to members.locale when a member is logged in.
  (await cookies()).set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
