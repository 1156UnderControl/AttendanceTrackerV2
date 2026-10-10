import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { Button, Card, Field, inputClass } from "@/components/ui";
import { locales } from "@/i18n/config";
import { requireAdmin, requireUser } from "@/lib/auth/session";
import { isKioskDevice } from "@/lib/kiosk/device";
import { lockKiosk, unlockKiosk } from "./actions";

export default async function KioskUnlockPage() {
  await requireUser("/kiosk/unlock");
  await requireAdmin();
  const [t, locale, unlocked] = await Promise.all([
    getTranslations(),
    getLocale(),
    isKioskDevice(),
  ]);

  return (
    <div className="mx-auto max-w-lg">
      <Card title={t("kioskUnlock.title")} tone="brand">
        <div className="flex flex-col gap-5">
          <p>{t("kioskUnlock.body")}</p>
          {unlocked ? (
            <>
              <p className="font-bold">{t("kioskUnlock.active")}</p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/kiosk"
                  className="rounded-brutal border-2 border-ink bg-white px-4 py-2 font-bold shadow-brutal"
                >
                  {t("kioskUnlock.open")}
                </Link>
                <form action={lockKiosk}>
                  <Button type="submit" variant="danger">
                    {t("kioskUnlock.deactivate")}
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <form action={unlockKiosk} className="flex flex-col gap-4">
              <Field label={t("kioskUnlock.language")}>
                <select name="locale" defaultValue={locale} className={inputClass}>
                  {locales.map((l) => (
                    <option key={l} value={l}>
                      {t(`language.${l}`)}
                    </option>
                  ))}
                </select>
              </Field>
              <Button type="submit" variant="secondary">
                {t("kioskUnlock.activate")}
              </Button>
            </form>
          )}
        </div>
      </Card>
    </div>
  );
}
