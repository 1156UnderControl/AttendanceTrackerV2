import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { LanguageSwitcher } from "@/components/language-switcher";
import { signOut } from "@/lib/auth/actions";
import { getAuth } from "@/lib/auth/session";

export async function SiteHeader() {
  const [auth, t] = await Promise.all([getAuth(), getTranslations()]);
  return (
    <header className="border-b border-foreground/10">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link href="/" className="font-bold">
          Under Control 1156
        </Link>
        <nav className="flex flex-1 gap-4 text-sm">
          {auth.member && <Link href="/minha-presenca">{t("nav.myAttendance")}</Link>}
          {auth.isAdmin && <Link href="/admin">{t("nav.admin")}</Link>}
        </nav>
        <LanguageSwitcher />
        {auth.userId ? (
          <form action={signOut}>
            <button type="submit" className="text-sm underline-offset-4 hover:underline">
              {t("common.signOut")}
            </button>
          </form>
        ) : (
          <Link href="/login" className="text-sm underline-offset-4 hover:underline">
            {t("common.signIn")}
          </Link>
        )}
      </div>
    </header>
  );
}
