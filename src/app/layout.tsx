import type { Metadata } from "next";
import { League_Spartan } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import "./globals.css";

// The team font from V1 (docs/architecture/design-system.md).
const leagueSpartan = League_Spartan({
  variable: "--font-league-spartan",
  subsets: ["latin"],
});

const SERVER_ONLY_NAMESPACES = new Set(["login", "privacy", "home", "metadata"]);

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");
  return { title: t("title"), description: t("description") };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [locale, messages] = await Promise.all([getLocale(), getMessages()]);
  // Client components only need these namespaces; server-only text (login hints,
  // privacy policy, metadata) stays on the server.
  const clientMessages = Object.fromEntries(
    Object.entries(messages).filter(([namespace]) => !SERVER_ONLY_NAMESPACES.has(namespace)),
  );

  return (
    <html lang={locale} className={`${leagueSpartan.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider messages={clientMessages}>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
