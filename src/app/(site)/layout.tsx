import { SiteHeader } from "@/components/site-header";

// Everything except the full-screen kiosk (spec 001) gets the site header.
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
    </>
  );
}
