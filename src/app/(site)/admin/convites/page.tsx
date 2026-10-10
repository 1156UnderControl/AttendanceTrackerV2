import { getFormatter, getNow, getTranslations } from "next-intl/server";
import { Button, Card, PageTitle } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { revokeInvite } from "./actions";
import { CreateInviteForm } from "./create-invite-form";

export default async function InvitesPage() {
  const [t, format] = await Promise.all([getTranslations(), getFormatter()]);
  const supabase = await createClient();
  const { data: invites } = await supabase
    .from("invites")
    .select("id, label, type, category, max_uses, uses, expires_at, revoked_at, members(name)")
    .order("created_at", { ascending: false });

  const now = (await getNow()).getTime();
  const status = (i: NonNullable<typeof invites>[number]) =>
    i.revoked_at
      ? "revoked"
      : new Date(i.expires_at).getTime() <= now
        ? "expired"
        : i.uses >= i.max_uses
          ? "usedUp"
          : "active";

  return (
    <>
      <PageTitle>{t("admin.invites.title")}</PageTitle>
      <Card title={t("admin.invites.createTitle")}>
        <CreateInviteForm />
      </Card>
      <Card title={t("admin.invites.listTitle")}>
        {!invites?.length ? (
          <p className="text-sm opacity-70">{t("admin.invites.none")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="opacity-70">
                <tr>
                  <th className="py-2 pr-4 font-medium">{t("admin.invites.label")}</th>
                  <th className="py-2 pr-4 font-medium">{t("admin.invites.type")}</th>
                  <th className="py-2 pr-4 font-medium">{t("admin.invites.uses")}</th>
                  <th className="py-2 pr-4 font-medium">{t("admin.invites.expires")}</th>
                  <th className="py-2 pr-4 font-medium">{t("admin.invites.status")}</th>
                  <th className="py-2 pr-4 font-medium">{t("admin.invites.redeemedBy")}</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {invites.map((invite) => {
                  const s = status(invite);
                  return (
                    <tr
                      key={invite.id}
                      className="border-t border-foreground/10"
                      data-testid="invite-row"
                    >
                      <td className="py-2 pr-4">{invite.label || t("common.empty")}</td>
                      <td className="py-2 pr-4">
                        {t(`labels.${invite.type}`)}
                        {invite.category && ` · ${invite.category}`}
                      </td>
                      <td className="py-2 pr-4">
                        {invite.uses}/{invite.max_uses}
                      </td>
                      <td className="py-2 pr-4">
                        {format.dateTime(new Date(invite.expires_at), { dateStyle: "short" })}
                      </td>
                      <td className="py-2 pr-4">{t(`admin.invites.${s}`)}</td>
                      <td className="py-2 pr-4">
                        {invite.members.map((m) => m.name).join(", ") || t("common.empty")}
                      </td>
                      <td className="py-2">
                        {s === "active" && (
                          <form action={revokeInvite}>
                            <input type="hidden" name="id" value={invite.id} />
                            <Button type="submit" variant="danger" className="px-2 py-1">
                              {t("admin.invites.revoke")}
                            </Button>
                          </form>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
