import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getAuth } from "@/lib/auth/session";

const ctaClass =
  "rounded-brutal border-2 border-ink bg-brand px-6 py-3 text-lg font-bold shadow-brutal transition hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-[3px] active:translate-y-[3px] active:shadow-none";

export default async function Home() {
  const [t, auth] = await Promise.all([getTranslations("home"), getAuth()]);

  return (
    <div className="flex flex-col items-center gap-6 py-12 text-center">
      <Image
        src="/icon.jpg"
        alt=""
        width={160}
        height={160}
        className="rounded-full border-4 border-ink shadow-brutal-lg"
        priority
      />
      <h1 className="text-4xl font-black sm:text-5xl">{t("title")}</h1>
      <p className="text-xl">{t("subtitle")}</p>
      <Link href={auth.member ? "/minha-presenca" : "/login"} className={ctaClass}>
        {auth.member ? t("goToMyAttendance") : t("signIn")}
      </Link>
    </div>
  );
}
