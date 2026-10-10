import Link from "next/link";
import { getFormatter, getNow, getTranslations } from "next-intl/server";
import { Card, PageTitle, Section, Table, Td, Th, Tr } from "@/components/ui";
import { requireUser } from "@/lib/auth/session";
import { parseThresholds, pctTone, toneClass } from "@/lib/format/attendance";
import { createClient } from "@/lib/supabase/server";
import { MemberCharts } from "@/components/charts/member-charts";
import { loadMemberSeries } from "@/lib/attendance/load-series";
import { toLocalInput } from "@/lib/attendance/local-input";
import { memberTrack } from "@/lib/attendance/track";
import { CorrectionForm } from "./correction-form";
import { ProfileForm } from "./profile-form";

const PAGE_SIZE = 20;

export default async function MyAttendancePage({ searchParams }: PageProps<"/minha-presenca">) {
  const auth = await requireUser("/minha-presenca");
  const [t, format] = await Promise.all([getTranslations(), getFormatter()]);

  if (!auth.member) {
    return (
      <div className="mx-auto max-w-md">
        <Card title={t("me.notMemberTitle")}>
          <p className="text-sm">{t("me.notMemberBody")}</p>
        </Card>
      </div>
    );
  }

  const member = auth.member;
  const page = Math.max(0, Number((await searchParams).page ?? 0) || 0);
  const supabase = await createClient();
  const [stats, sessions, settings, requests] = await Promise.all([
    supabase.rpc("my_stats"),
    supabase
      .from("sessions")
      .select("id, check_in, check_out, auto_closed, credited_minutes", { count: "exact" })
      .eq("member_id", member.id)
      .eq("discarded", false)
      .order("check_in", { ascending: false })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1),
    supabase.from("settings").select("value").eq("key", "color_thresholds").maybeSingle(),
    supabase
      .from("correction_requests")
      .select("session_id, status, created_at")
      .eq("member_id", member.id)
      .order("created_at", { ascending: true }),
  ]);
  // Latest request per session wins (006-AC7).
  const requestBySession = new Map((requests.data ?? []).map((r) => [r.session_id, r.status]));
  const requestLabel = {
    pending: "me.requestPending",
    approved: "me.requestApproved",
    rejected: "me.requestRejected",
  } as const;

  const row = stats.data?.[0];
  const thresholds = parseThresholds(settings.data?.value);
  const hours = (minutes: number | null) =>
    minutes === null
      ? t("common.empty")
      : t("common.hours", { value: format.number(minutes / 60, { maximumFractionDigits: 1 }) });
  const pct = (value: number | null) =>
    value === null ? t("common.empty") : `${format.number(value, { maximumFractionDigits: 0 })}%`;
  const total = sessions.count ?? 0;
  // 005-AC3: weekly hours vs the weekly goal of the member's track.
  const { data: currentSeason } = await supabase.rpc("current_season_id");
  const series = await loadMemberSeries(
    supabase,
    member.id,
    memberTrack(member.type, member.category),
    currentSeason ?? null,
    await getNow(),
  );
  const now = (await getNow()).getTime();

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <PageTitle>{t("me.title")}</PageTitle>

      {row ? (
        <Card tone="brand">
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-5 sm:gap-4">
            <Stat label={t("me.week")} value={hours(row.week_minutes)} />
            <Stat label={t("me.phase")} value={hours(row.phase_minutes)} />
            <Stat label={t("me.season")} value={hours(row.season_minutes)} />
            <Stat label={t("me.expected")} value={hours(row.expected_minutes)} />
            <Stat
              wide
              label={t("me.pct")}
              value={
                <span className={toneClass[pctTone(row.pct_to_date, thresholds)]}>
                  {pct(row.pct_to_date)}
                </span>
              }
            />
          </dl>
          <p className="mt-5 font-semibold">
            {t("me.position", {
              position: row.position,
              total: row.total,
              track: t(`labels.${row.track}`),
            })}
            {" · "}
            {row.current_phase
              ? t("me.currentPhase", { phase: row.current_phase })
              : t("me.noPhase")}
          </p>
        </Card>
      ) : (
        <Card>
          <p className="text-sm">{t("me.noSeason")}</p>
        </Card>
      )}

      {row && <MemberCharts series={series} cumulative={false} />}

      <Section title={t("me.sessionsTitle")}>
        {total === 0 ? (
          <p className="opacity-80">{t("me.noSessions")}</p>
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>{t("me.date")}</Th>
                  <Th>{t("me.checkIn")}</Th>
                  <Th>{t("me.checkOut")}</Th>
                  <Th>{t("me.duration")}</Th>
                </tr>
              </thead>
              <tbody>
                {sessions.data?.map((s) => {
                  const checkIn = new Date(s.check_in);
                  const minutes =
                    s.credited_minutes ??
                    ((s.check_out ? new Date(s.check_out).getTime() : now) - checkIn.getTime()) /
                      60_000;
                  return (
                    <Tr key={s.id} data-testid="session-row">
                      <Td>{format.dateTime(checkIn, { dateStyle: "medium" })}</Td>
                      <Td>{format.dateTime(checkIn, { timeStyle: "short" })}</Td>
                      <Td>
                        {s.check_out === null ? (
                          t("me.open")
                        ) : s.auto_closed && s.credited_minutes === 0 ? (
                          <div>
                            <span className="font-semibold text-[#b26a00]">
                              {t("me.autoClosed")}
                            </span>
                            {requestBySession.has(s.id) &&
                            requestBySession.get(s.id) !== "rejected" ? (
                              <p className="text-sm font-bold">
                                {t(requestLabel[requestBySession.get(s.id)!])}
                              </p>
                            ) : (
                              <>
                                {requestBySession.get(s.id) === "rejected" && (
                                  <p className="text-sm font-bold">{t("me.requestRejected")}</p>
                                )}
                                <CorrectionForm
                                  sessionId={s.id}
                                  min={toLocalInput(s.check_in)}
                                  max={toLocalInput(s.check_out)}
                                />
                              </>
                            )}
                          </div>
                        ) : (
                          <>
                            {format.dateTime(new Date(s.check_out), { timeStyle: "short" })}
                            {requestBySession.get(s.id) === "approved" && (
                              <p className="text-sm font-bold text-success">
                                {t("me.requestApproved")}
                              </p>
                            )}
                          </>
                        )}
                      </Td>
                      <Td>{hours(minutes)}</Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
            <div className="mt-4 flex justify-between text-sm">
              {page > 0 ? <Link href={`?page=${page - 1}`}>← {t("me.next")}</Link> : <span />}
              {(page + 1) * PAGE_SIZE < total && (
                <Link href={`?page=${page + 1}`}>{t("me.previous")} →</Link>
              )}
            </div>
          </>
        )}
      </Section>

      <Card title={t("me.profileTitle")}>
        <ProfileForm
          name={member.name}
          code={member.code}
          locale={member.locale}
          typeLabel={t(`labels.${member.type}`)}
          category={member.category}
        />
      </Card>
    </div>
  );
}

function Stat({ label, value, wide }: { label: string; value: React.ReactNode; wide?: boolean }) {
  // The fifth tile spans the row on phones instead of sitting alone.
  return (
    <div
      className={`rounded-brutal border-2 border-ink bg-white p-3 shadow-brutal ${wide ? "col-span-2 sm:col-span-1" : ""}`}
    >
      <dt className="text-sm font-semibold">{label}</dt>
      <dd className="text-2xl font-black">{value}</dd>
    </div>
  );
}
