import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Button, Card, PageTitle } from "@/components/ui";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { setAdmin } from "../actions";
import { MemberForm } from "./member-form";

export default async function EditMemberPage({ params }: PageProps<"/admin/membros/[id]">) {
  const { id } = await params;
  const auth = await requireAdmin();
  const t = await getTranslations();
  const supabase = await createClient();

  const { data: member } = await supabase.from("members").select("*").eq("id", id).maybeSingle();
  if (!member) notFound();
  const { data: adminRow } = member.user_id
    ? await supabase.from("admins").select("user_id").eq("user_id", member.user_id).maybeSingle()
    : { data: null };
  const isSelf = member.user_id === auth.userId;

  return (
    <>
      <Link href="/admin/membros" className="text-sm">
        ← {t("common.back")}
      </Link>
      <PageTitle>{t("admin.members.editTitle")}</PageTitle>
      <Card>
        <MemberForm member={member} />
      </Card>
      <Card title={t("admin.members.adminTitle")}>
        {!member.user_id ? (
          <p className="text-sm opacity-70">{t("admin.members.noAccount")}</p>
        ) : (
          <form action={setAdmin} className="flex flex-col gap-2">
            <input type="hidden" name="userId" value={member.user_id} />
            <input type="hidden" name="makeAdmin" value={adminRow ? "false" : "true"} />
            <div>
              <Button type="submit" variant={adminRow ? "danger" : "secondary"} disabled={isSelf}>
                {adminRow ? t("admin.members.removeAdmin") : t("admin.members.makeAdmin")}
              </Button>
            </div>
            {isSelf && <p className="text-xs opacity-70">{t("admin.members.ownAdminHint")}</p>}
          </form>
        )}
      </Card>
    </>
  );
}
