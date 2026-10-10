import { NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { cookies, headers } from "next/headers";
import { LOCALE_COOKIE, resolveLocale } from "@/i18n/config";
import { isKioskDevice } from "@/lib/kiosk/device";
import { createServiceClient } from "@/lib/supabase/service";
import { KioskClient } from "./kiosk-client";
import "./kiosk.css";

export const metadata = { title: "Kiosk · Team 1156" };

// Full-screen kiosk (spec 001). Outside the (site) group, so it has no site header.
export default async function KioskPage() {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);
  // The kiosk speaks its own default language (set at unlock), even if an admin is
  // signed in on this browser.
  const locale = resolveLocale({
    cookieLocale: cookieStore.get(LOCALE_COOKIE)?.value,
    acceptLanguage: headerStore.get("accept-language"),
  });
  const t = await getTranslations({ locale, namespace: "kiosk" });

  if (!(await isKioskDevice())) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6 text-center">
        <div className="max-w-lg rounded-brutal border-4 border-ink bg-brand p-8 shadow-brutal-lg">
          <h1 className="mb-3 text-3xl font-black">{t("unauthorizedTitle")}</h1>
          <p className="text-lg">{t("unauthorizedBody")}</p>
        </div>
      </main>
    );
  }

  const { data } = await createServiceClient().rpc("kiosk_present");
  const present = (data ?? []).map((p) => ({
    memberId: p.member_id,
    name: p.name,
    checkIn: p.check_in,
  }));
  const messages = (await import(`../../../../messages/${locale}.json`)).default;

  return (
    <NextIntlClientProvider locale={locale} messages={{ kiosk: messages.kiosk }}>
      <KioskClient initialPresent={present} />
    </NextIntlClientProvider>
  );
}
