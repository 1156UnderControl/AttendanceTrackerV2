import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { LanguageSwitcher } from "@/components/language-switcher";
import { signOut } from "@/lib/auth/actions";
import { getAuth } from "@/lib/auth/session";

const linkClass = "block px-4 py-5 text-lg text-white transition hover:bg-navy-hover";

// V1 navbar: navy bar, white links, TEAM 1156 logo on the right.
export async function SiteHeader() {
  const [auth, t] = await Promise.all([getAuth(), getTranslations()]);
  return (
    <header className="bg-navy">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 px-2 sm:px-4">
        <nav className="flex flex-wrap items-center">
          {auth.member && (
            <Link href="/minha-presenca" className={linkClass}>
              {t("nav.myAttendance")}
            </Link>
          )}
          {auth.isAdmin && (
            <Link href="/admin" className={linkClass}>
              {t("nav.admin")}
            </Link>
          )}
          {auth.userId ? (
            <form action={signOut}>
              <button type="submit" className={`${linkClass} cursor-pointer`}>
                {t("common.signOut")}
              </button>
            </form>
          ) : (
            <Link href="/login" className={linkClass}>
              {t("common.signIn")}
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-4 py-2">
          <LanguageSwitcher />
          <Link href="/" aria-label="Team 1156">
            <Image
              src="/logo.avif"
              alt="Team 1156"
              width={1200}
              height={350}
              priority
              className="h-12 w-auto sm:h-[62px]"
            />
          </Link>
        </div>
      </div>
    </header>
  );
}
