import { getTranslations } from "next-intl/server";
import { LanguageSwitcher } from "@/components/language-switcher";

export default async function Home() {
  const t = await getTranslations("home");

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="text-4xl font-bold">{t("title")}</h1>
      <p className="text-lg">{t("subtitle")}</p>
      <p className="text-sm opacity-70">{t("status")}</p>
      <LanguageSwitcher />
    </main>
  );
}
