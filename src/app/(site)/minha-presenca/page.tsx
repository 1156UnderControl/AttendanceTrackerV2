import Link from "next/link";
import { getFormatter, getNow, getTranslations } from "next-intl/server";
import { Card, PageTitle } from "@/components/ui";
import { requireUser } from "@/lib/auth/session";
import { parseThresholds, pctTone, toneClass } from "@/lib/format/attendance";
import { createClient } from "@/lib/supabase/server";
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
  const [stats, sessions, settings] = await Promise.all([
    supabase.rpc("my_stats"),
    supabase
      .from("sessions")
      .select("id, check_in, check_out, auto_closed, credited_minutes", { count: "exact" })
      .eq("member_id", member.id)
      .eq("discarded", false)
      .order("check_in", { ascending: false })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1),
    supabase.from("settings").select("value").eq("key", "color_thresholds").maybeSingle(),
  ]);

  const row = stats.data?.[0];
  const thresholds = parseThresholds(settings.data?.value);
  const hours = (minutes: number | null) =>
    minutes === null
      ? t("common.empty")
      : t("common.hours", { value: format.number(minutes / 60, { maximumFractionDigits: 1 }) });
  const pct = (value: number | null) =>
    value === null ? t("common.empty") : `${format.number(value, { maximumFractionDigits: 0 })}%`;
  const total = sessions.count ?? 0;
  const now = (await getNow()).getTime();

  return (
    <div className="flex flex-col gap-6">
      <PageTitle>{t("me.title")}</PageTitle>

      {row ? (
        <Card>
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            <Stat label={t("me.week")} value={hours(row.week_minutes)} />
            <Stat label={t("me.phase")} value={hours(row.phase_minutes)} />
            <Stat label={t("me.season")} value={hours(row.season_minutes)} />
            <Stat label={t("me.expected")} value={hours(row.expected_minutes)} />
            <Stat
              label={t("me.pct")}
              value={
                <span className={toneClass[pctTone(row.pct_to_date, thresholds)]}>
                  {pct(row.pct_to_date)}
                </span>
              }
            />
          </dl>
          <p className="mt-4 text-sm opacity-80">
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

      <Card title={t("me.sessionsTitle")}>
        {total === 0 ? (
          <p className="text-sm opacity-70">{t("me.noSessions")}</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="opacity-70">
                  <tr>
                    <th className="py-2 pr-4 font-medium">{t("me.date")}</th>
                    <th className="py-2 pr-4 font-medium">{t("me.checkIn")}</th>
                    <th className="py-2 pr-4 font-medium">{t("me.checkOut")}</th>
                    <th className="py-2 font-medium">{t("me.duration")}</th>
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
                      <tr
                        key={s.id}
                        className="border-t border-foreground/10"
                        data-testid="session-row"
                      >
                        <td className="py-2 pr-4">
                          {format.dateTime(checkIn, { dateStyle: "medium" })}
                        </td>
                        <td className="py-2 pr-4">
                          {format.dateTime(checkIn, { timeStyle: "short" })}
                        </td>
                        <td className="py-2 pr-4">
                          {s.check_out === null ? (
                            t("me.open")
                          ) : s.auto_closed && s.credited_minutes === 0 ? (
                            <span className="text-amber-600 dark:text-amber-400">
                              {t("me.autoClosed")}
                            </span>
                          ) : (
                            format.dateTime(new Date(s.check_out), { timeStyle: "short" })
                          )}
                        </td>
                        <td className="py-2">{hours(minutes)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex justify-between text-sm">
              {page > 0 ? <Link href={`?page=${page - 1}`}>← {t("me.next")}</Link> : <span />}
              {(page + 1) * PAGE_SIZE < total && (
                <Link href={`?page=${page + 1}`}>{t("me.previous")} →</Link>
              )}
            </div>
          </>
        )}
      </Card>

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

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs opacity-70">{label}</dt>
      <dd className="text-xl font-semibold">{value}</dd>
    </div>
  );
}
