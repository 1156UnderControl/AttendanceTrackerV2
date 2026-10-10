import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { GoogleSignIn } from "@/components/google-sign-in";
import { Alert, Card } from "@/components/ui";
import { getAuth, safeNext } from "@/lib/auth/session";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = safeNext(params.next);
  const [t, auth] = await Promise.all([getTranslations("login"), getAuth()]);
  if (auth.userId) redirect(next);

  return (
    <div className="mx-auto max-w-md">
      <Card title={t("title")} tone="brand">
        <div className="flex flex-col gap-4">
          <p className="text-sm opacity-80">{t("subtitle")}</p>
          {params.error && <Alert>{t("error")}</Alert>}
          <GoogleSignIn next={next} />
        </div>
      </Card>
    </div>
  );
}
