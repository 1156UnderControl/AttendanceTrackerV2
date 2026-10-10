import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/lib/auth/session";
import { AdminNav } from "./admin-nav";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin();
  const t = await getTranslations("nav");
  const items = [
    { href: "/admin", label: t("dashboard") },
    { href: "/admin/membros", label: t("members") },
    { href: "/admin/convites", label: t("invites") },
    { href: "/admin/temporadas", label: t("seasons") },
    { href: "/admin/sessoes", label: t("sessions") },
    { href: "/admin/auditoria", label: t("audit") },
    { href: "/kiosk/unlock", label: t("kiosk") },
  ];
  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <AdminNav items={items} label={t("adminSections")} />
      {children}
    </div>
  );
}
