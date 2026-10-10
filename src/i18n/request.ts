import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import { getAuth } from "@/lib/auth/session";
import { LOCALE_COOKIE, TIME_ZONE, resolveLocale } from "./config";

export default getRequestConfig(async () => {
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
