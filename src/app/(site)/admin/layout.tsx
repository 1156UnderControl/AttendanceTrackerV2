import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/lib/auth/session";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin();
  const t = await getTranslations("nav");
  return (
    <div className="flex flex-col gap-6">
      <nav className="flex gap-4 border-b border-foreground/10 pb-3 text-sm">
        <Link href="/admin">{t("dashboard")}</Link>
        <Link href="/admin/membros">{t("members")}</Link>
        <Link href="/admin/convites">{t("invites")}</Link>
      </nav>
      {children}
    </div>
  );
}
