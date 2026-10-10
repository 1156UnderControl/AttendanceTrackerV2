import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { SiteHeader } from "@/components/site-header";

// Everything except the full-screen kiosk (spec 001) gets the site header and footer.
export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const t = await getTranslations("footer");
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
      <footer className="border-t border-foreground/10">
        <div className="mx-auto flex max-w-5xl px-4 py-4 text-xs opacity-70">
          <Link href="/privacidade" className="underline-offset-4 hover:underline">
            {t("privacy")}
          </Link>
        </div>
      </footer>
    </>
  );
}
