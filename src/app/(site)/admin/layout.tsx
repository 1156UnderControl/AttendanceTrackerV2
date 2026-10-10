import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/lib/auth/session";

const tabClass =
  "rounded-brutal border-2 border-ink bg-white px-4 py-2 font-bold shadow-brutal transition hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-brand";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin();
  const t = await getTranslations("nav");
  return (
    <div className="flex flex-col gap-6">
      <nav className="flex flex-wrap gap-3">
        <Link href="/admin" className={tabClass}>
          {t("dashboard")}
        </Link>
        <Link href="/admin/membros" className={tabClass}>
          {t("members")}
        </Link>
        <Link href="/admin/convites" className={tabClass}>
          {t("invites")}
        </Link>
        <Link href="/kiosk/unlock" className={tabClass}>
          {t("kiosk")}
        </Link>
      </nav>
      {children}
    </div>
  );
}
