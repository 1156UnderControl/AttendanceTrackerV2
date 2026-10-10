import { getFormatter, getNow, getTranslations } from "next-intl/server";
import { Button, Card, PageTitle, Section, Table, Td, Th, Tr } from "@/components/ui";
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
      <Section title={t("admin.invites.listTitle")}>
        {!invites?.length ? (
          <p className="opacity-80">{t("admin.invites.none")}</p>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{t("admin.invites.label")}</Th>
                <Th>{t("admin.invites.type")}</Th>
                <Th>{t("admin.invites.uses")}</Th>
                <Th>{t("admin.invites.expires")}</Th>
                <Th>{t("admin.invites.status")}</Th>
                <Th>{t("admin.invites.redeemedBy")}</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {invites.map((invite) => {
                const s = status(invite);
                return (
                  <Tr key={invite.id} data-testid="invite-row">
                    <Td>{invite.label || t("common.empty")}</Td>
                    <Td>
                      {t(`labels.${invite.type}`)}
                      {invite.category && ` · ${invite.category}`}
                    </Td>
                    <Td>
                      {invite.uses}/{invite.max_uses}
                    </Td>
                    <Td>{format.dateTime(new Date(invite.expires_at), { dateStyle: "short" })}</Td>
                    <Td>{t(`admin.invites.${s}`)}</Td>
                    <Td>{invite.members.map((m) => m.name).join(", ") || t("common.empty")}</Td>
                    <Td>
                      {s === "active" && (
                        <form action={revokeInvite}>
                          <input type="hidden" name="id" value={invite.id} />
                          <Button type="submit" variant="danger" className="px-2 py-1">
                            {t("admin.invites.revoke")}
                          </Button>
                        </form>
                      )}
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Section>
    </>
  );
}
