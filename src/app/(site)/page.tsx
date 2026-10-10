import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getAuth } from "@/lib/auth/session";

export default async function Home() {
  const [t, auth] = await Promise.all([getTranslations("home"), getAuth()]);

  return (
    <div className="flex flex-col items-center gap-6 py-16 text-center">
      <h1 className="text-4xl font-bold">{t("title")}</h1>
      <p className="text-lg">{t("subtitle")}</p>
      {auth.member ? (
        <Link
          href="/minha-presenca"
          className="rounded-md bg-foreground px-5 py-3 font-medium text-background"
        >
          {t("goToMyAttendance")}
        </Link>
      ) : (
        <Link
          href="/login"
          className="rounded-md bg-foreground px-5 py-3 font-medium text-background"
        >
          {t("signIn")}
        </Link>
      )}
    </div>
  );
}
