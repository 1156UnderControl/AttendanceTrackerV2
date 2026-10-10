import { getTranslations } from "next-intl/server";
import { Card, PageTitle } from "@/components/ui";

// The rankings dashboard arrives with spec 004 (milestone 7).
export default async function AdminHome() {
  const t = await getTranslations("admin");
  return (
    <>
      <PageTitle>{t("title")}</PageTitle>
      <Card>
        <p className="text-sm">{t("dashboardSoon")}</p>
      </Card>
    </>
  );
}
