import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import { getAuth } from "@/lib/auth/session";
import { isLocale, LOCALE_COOKIE, TIME_ZONE, resolveLocale } from "./config";

export default getRequestConfig(async ({ locale: requested }) => {
  // An explicit locale, e.g. getTranslations({ locale }) for the kiosk greeting in the
  // member's language (001-AC10), wins over the visitor's own locale.
  if (isLocale(requested)) {
    return {
      locale: requested,
      timeZone: TIME_ZONE,
      messages: (await import(`../../messages/${requested}.json`)).default,
    };
  }

  const [cookieStore, headerStore, auth] = await Promise.all([cookies(), headers(), getAuth()]);

  const locale = resolveLocale({
    memberLocale: auth.member?.locale,
    cookieLocale: cookieStore.get(LOCALE_COOKIE)?.value,
    acceptLanguage: headerStore.get("accept-language"),
  });

  return {
    locale,
    timeZone: TIME_ZONE,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
