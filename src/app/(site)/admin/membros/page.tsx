import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button, Card, inputClass, PageTitle } from "@/components/ui";
import { memberTrack, TRACKS, type Track } from "@/lib/attendance/track";
import { createClient } from "@/lib/supabase/server";

export default async function MembersPage({ searchParams }: PageProps<"/admin/membros">) {
  const params = await searchParams;
  const track = TRACKS.find((tr) => tr === params.track) as Track | undefined;
  const status =
    params.status === "inactive" ? "inactive" : params.status === "all" ? "all" : "active";

  const t = await getTranslations();
  const supabase = await createClient();
  const [{ data: members }, { data: admins }] = await Promise.all([
    supabase
      .from("members")
      .select("id, user_id, name, code, type, category, active")
      .order("name"),
    supabase.from("admins").select("user_id"),
  ]);
  const adminIds = new Set(admins?.map((a) => a.user_id));
  const rows = (members ?? []).filter(
    (m) =>
      (!track || memberTrack(m.type, m.category) === track) &&
      (status === "all" || m.active === (status === "active")),
  );

  return (
    <>
      <PageTitle>{t("admin.members.title")}</PageTitle>
      <form className="flex flex-wrap items-end gap-3 text-sm">
        <label className="flex flex-col gap-1">
          {t("admin.members.track")}
          <select name="track" defaultValue={track ?? ""} className={inputClass}>
            <option value="">{t("admin.members.all")}</option>
            {TRACKS.map((tr) => (
              <option key={tr} value={tr}>
                {t(`labels.${tr}`)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          {t("admin.members.status")}
          <select name="status" defaultValue={status} className={inputClass}>
            <option value="active">{t("admin.members.active")}</option>
            <option value="inactive">{t("admin.members.inactive")}</option>
            <option value="all">{t("admin.members.all")}</option>
          </select>
        </label>
        <Button type="submit" variant="secondary">
          OK
        </Button>
      </form>
      <Card>
        {rows.length === 0 ? (
          <p className="text-sm opacity-70">{t("admin.members.none")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="opacity-70">
                <tr>
                  <th className="py-2 pr-4 font-medium">{t("admin.members.name")}</th>
                  <th className="py-2 pr-4 font-medium">{t("admin.members.code")}</th>
                  <th className="py-2 pr-4 font-medium">{t("admin.members.track")}</th>
                  <th className="py-2 pr-4 font-medium">{t("admin.members.status")}</th>
                  <th className="py-2 pr-4 font-medium">{t("admin.members.admin")}</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {rows.map((m) => (
                  <tr key={m.id} className="border-t border-foreground/10" data-testid="member-row">
                    <td className="py-2 pr-4">{m.name}</td>
                    <td className="py-2 pr-4 font-mono">{m.code}</td>
                    <td className="py-2 pr-4">{t(`labels.${memberTrack(m.type, m.category)}`)}</td>
                    <td className="py-2 pr-4">
                      {m.active ? t("admin.members.active") : t("admin.members.inactive")}
                    </td>
                    <td className="py-2 pr-4">
                      {m.user_id && adminIds.has(m.user_id) ? t("common.yes") : ""}
                    </td>
                    <td className="py-2">
                      <Link
                        href={`/admin/membros/${m.id}`}
                        className="underline-offset-4 hover:underline"
                      >
                        {t("admin.members.edit")}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
