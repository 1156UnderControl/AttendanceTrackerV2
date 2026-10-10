import Link from "next/link";
import { notFound } from "next/navigation";
import { getFormatter, getNow, getTranslations } from "next-intl/server";
import { Button, Card, inputClass, PageTitle, Section, Table, Td, Th, Tr } from "@/components/ui";
import { discardSession, saveSession } from "@/app/(site)/admin/sessoes/actions";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { MemberCharts } from "@/components/charts/member-charts";
import { loadMemberSeries } from "@/lib/attendance/load-series";
import { toLocalInput } from "@/lib/attendance/local-input";
import { memberTrack } from "@/lib/attendance/track";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { setAdmin } from "../actions";
import { MemberForm } from "./member-form";
import { SessionForm } from "./session-form";

export default async function EditMemberPage({ params }: PageProps<"/admin/membros/[id]">) {
  const { id } = await params;
  const auth = await requireAdmin();
  const [t, format] = await Promise.all([getTranslations(), getFormatter()]);
  const supabase = await createClient();

  const { data: member } = await supabase.from("members").select("*").eq("id", id).maybeSingle();
  if (!member) notFound();
  const { data: adminRow } = member.user_id
    ? await supabase.from("admins").select("user_id").eq("user_id", member.user_id).maybeSingle()
    : { data: null };
  const isSelf = member.user_id === auth.userId;
  const { data: sessions } = await supabase
    .from("sessions")
    .select("id, check_in, check_out, auto_closed, credited_minutes")
    .eq("member_id", member.id)
    .eq("discarded", false)
    .order("check_in", { ascending: false })
    .limit(30);
  // 004-AC7: charts for the current season.
  const [{ data: currentSeason }, now] = await Promise.all([
    supabase.rpc("current_season_id"),
    getNow(),
  ]);
  const series = await loadMemberSeries(
    supabase,
    member.id,
    memberTrack(member.type, member.category),
    currentSeason ?? null,
    now,
  );

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
      <MemberCharts series={series} />
      <Section title={t("admin.memberSessions.title")}>
        <p className="text-sm">{t("admin.memberSessions.hint")}</p>
        <Card title={t("admin.memberSessions.newTitle")} tone="brand">
          <SessionForm memberId={member.id} />
        </Card>
        {!sessions?.length ? (
          <p className="opacity-80">{t("admin.memberSessions.none")}</p>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{t("me.date")}</Th>
                <Th>{t("admin.memberSessions.checkIn")}</Th>
                <Th>{t("admin.memberSessions.checkOut")}</Th>
                <Th />
                <Th />
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <Tr key={s.id} data-testid="admin-session-row">
                  <Td>
                    <span className="font-bold">
                      {format.dateTime(new Date(s.check_in), { dateStyle: "medium" })}
                    </span>
                    {s.check_out === null && (
                      <p className="text-sm">{t("admin.memberSessions.open")}</p>
                    )}
                    {s.auto_closed && (
                      <p className="text-sm text-[#b26a00]">
                        {t("admin.memberSessions.autoClosed")}
                      </p>
                    )}
                  </Td>
                  {/* The form lives in the "Salvar" cell; inputs join it with form="…". */}
                  <Td>
                    <input
                      form={`session-${s.id}`}
                      type="datetime-local"
                      name="checkIn"
                      aria-label={t("admin.memberSessions.checkIn")}
                      required
                      defaultValue={toLocalInput(s.check_in)}
                      className={inputClass}
                    />
                  </Td>
                  <Td>
                    <input
                      form={`session-${s.id}`}
                      type="datetime-local"
                      name="checkOut"
                      aria-label={t("admin.memberSessions.checkOut")}
                      required
                      defaultValue={s.check_out ? toLocalInput(s.check_out) : ""}
                      className={inputClass}
                    />
                  </Td>
                  <Td>
                    <ActionForm
                      id={`session-${s.id}`}
                      action={saveSession}
                      successMessage={t("admin.memberSessions.saved")}
                      testId="session-form"
                    >
                      <input type="hidden" name="memberId" value={member.id} />
                      <input type="hidden" name="sessionId" value={s.id} />
                      <SubmitButton variant="secondary">
                        {t("admin.memberSessions.save")}
                      </SubmitButton>
                    </ActionForm>
                  </Td>
                  <Td>
                    <form action={discardSession}>
                      <input type="hidden" name="sessionId" value={s.id} />
                      <input type="hidden" name="memberId" value={member.id} />
                      <Button type="submit" variant="danger" className="px-3 py-1">
                        {t("admin.memberSessions.discard")}
                      </Button>
                    </form>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Section>
    </>
  );
}
