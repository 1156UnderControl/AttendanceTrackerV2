import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { GoogleSignIn } from "@/components/google-sign-in";
import { Card } from "@/components/ui";
import { getAuth } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { RedeemForm } from "./redeem-form";

type Preview = { valid: boolean; type?: "student" | "mentor"; category?: "FRC" | "FTC" | null };

export default async function InvitePage({ params }: PageProps<"/convite/[token]">) {
  const { token } = await params;
  const [t, auth, locale] = await Promise.all([getTranslations(), getAuth(), getLocale()]);

  // Members never consume another invite (002-AC6).
  if (auth.member) redirect("/minha-presenca");

  const supabase = await createClient();
  const { data } = await supabase.rpc("invite_preview", { p_token: token });
  const preview = (data ?? { valid: false }) as Preview;

  if (!preview.valid || !preview.type) {
    return (
      <div className="mx-auto max-w-md">
        <Card title={t("invite.invalidTitle")}>
          <p className="text-sm">{t("invite.invalidBody")}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <Card title={t("invite.title")}>
        <div className="flex flex-col gap-5">
          <p>{t("invite.invitedAs", { type: t(`labels.${preview.type}`) })}</p>
          {auth.userId ? (
            <>
              <h3 className="font-semibold">{t("invite.completeProfile")}</h3>
              <RedeemForm
                token={token}
                fixedCategory={preview.category ?? null}
                defaultName={auth.fullName ?? ""}
                defaultLocale={locale}
              />
            </>
          ) : (
            <>
              <p className="text-sm opacity-80">{t("invite.signInToContinue")}</p>
              <GoogleSignIn next={`/convite/${token}`} />
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
