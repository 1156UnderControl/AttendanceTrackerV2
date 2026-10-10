import { getTranslations } from "next-intl/server";
import { PageTitle } from "@/components/ui";

// Public page; also the privacy policy URL on the Google OAuth consent screen.
export default async function PrivacyPage() {
  const t = await getTranslations("privacy");
  const sections = [
    { title: t("collectTitle"), items: [t("collect1"), t("collect2"), t("collect3")] },
    { title: t("useTitle"), body: t("use") },
    { title: t("accessTitle"), body: t("access") },
    { title: t("storageTitle"), body: t("storage") },
    { title: t("rightsTitle"), body: t("rights") },
  ];

  return (
    <article className="mx-auto flex max-w-2xl flex-col gap-5 leading-relaxed">
      <PageTitle>{t("title")}</PageTitle>
      <p className="text-sm opacity-70">{t("updated")}</p>
      <p>{t("intro")}</p>
      {sections.map((s) => (
        <section key={s.title} className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">{s.title}</h2>
          {s.items ? (
            <ul className="list-disc space-y-1 pl-5">
              {s.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <p>{s.body}</p>
          )}
        </section>
      ))}
    </article>
  );
}
