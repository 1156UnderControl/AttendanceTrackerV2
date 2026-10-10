import { getTranslations } from "next-intl/server";
import { fromLocalInput, toLocalInput } from "@/lib/attendance/local-input";
import { memberTrack } from "@/lib/attendance/track";
import { getAuth } from "@/lib/auth/session";
import { csvResponse } from "@/lib/csv";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
const DAY = /^\d{4}-\d{2}-\d{2}$/;

// 004-AC8: every session that started in [from, to] (local dates), as CSV.
export async function GET(request: Request) {
  if (!(await getAuth()).isAdmin) return new Response("Not found", { status: 404 });
  const url = new URL(request.url);
  const from = url.searchParams.get("from") ?? "";
  const to = url.searchParams.get("to") ?? "";
  if (!DAY.test(from) || !DAY.test(to) || to < from)
    return new Response("Bad request", { status: 400 });

  const start = fromLocalInput(`${from}T00:00`)!;
  const end = new Date(fromLocalInput(`${to}T00:00`)!.getTime() + 86_400_000);
  const supabase = await createClient();
  const [{ data }, t] = await Promise.all([
    supabase
      .from("sessions")
      .select(
        "check_in, check_out, auto_closed, credited_minutes, discarded, members(name, code, type, category)",
      )
      .gte("check_in", start.toISOString())
      .lt("check_in", end.toISOString())
      .eq("discarded", false)
      .order("check_in"),
    getTranslations(),
  ]);

  const rows = (data ?? []).map((s) => {
    const minutes =
      s.credited_minutes ??
      (s.check_out
        ? (new Date(s.check_out).getTime() - new Date(s.check_in).getTime()) / 60_000
        : null);
    return [
      s.members?.name,
      s.members?.code,
      s.members ? t(`labels.${memberTrack(s.members.type, s.members.category)}`) : "",
      toLocalInput(s.check_in).replace("T", " "),
      s.check_out ? toLocalInput(s.check_out).replace("T", " ") : "",
      minutes === null ? null : Math.round((minutes / 60) * 100) / 100,
      s.auto_closed ? t("common.yes") : t("common.no"),
      s.auto_closed && s.credited_minutes === null ? t("common.yes") : t("common.no"),
    ];
  });

  return csvResponse(`sessoes-${from}-${to}.csv`, [
    [
      t("admin.sessions.member"),
      t("admin.members.code"),
      t("admin.members.track"),
      t("admin.memberSessions.checkIn"),
      t("admin.memberSessions.checkOut"),
      `${t("me.duration")} (h)`,
      t("admin.memberSessions.autoClosed"),
      t("me.requestApproved"),
    ],
    ...rows,
  ]);
}
