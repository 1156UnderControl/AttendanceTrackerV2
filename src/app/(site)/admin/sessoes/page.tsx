import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { Button, PageTitle, Section, Table, Td, Th, Tr } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { reviewCorrection } from "./actions";

export default async function AdminSessionsPage() {
  const [t, format] = await Promise.all([getTranslations("admin.sessions"), getFormatter()]);
  const supabase = await createClient();
  const [{ data: requests }, { data: autoClosed }] = await Promise.all([
    supabase
      .from("correction_requests")
      .select("id, requested_check_out, note, sessions(check_in, check_out), members(id, name)")
      .eq("status", "pending")
      .order("created_at"),
    supabase
      .from("sessions")
      .select("id, check_in, check_out, members(id, name), correction_requests(status)")
      .eq("auto_closed", true)
      .eq("credited_minutes", 0)
      .eq("discarded", false)
      .order("check_in", { ascending: false })
      .limit(100),
  ]);
  const when = (iso: string) =>
    format.dateTime(new Date(iso), { dateStyle: "short", timeStyle: "short" });
  const withoutRequest = (autoClosed ?? []).filter(
    (s) => !s.correction_requests.some((r) => r.status === "pending"),
  );

  return (
    <>
      <PageTitle>{t("title")}</PageTitle>

      <Section title={t("pendingTitle")}>
        {!requests?.length ? (
          <p className="opacity-80">{t("noPending")}</p>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{t("member")}</Th>
                <Th>{t("checkIn")}</Th>
                <Th>{t("requestedExit")}</Th>
                <Th>{t("note")}</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <Tr key={r.id} data-testid="correction-row">
                  <Td>{r.members?.name}</Td>
                  <Td>{r.sessions && when(r.sessions.check_in)}</Td>
                  <Td>{when(r.requested_check_out)}</Td>
                  <Td>{r.note}</Td>
                  <Td>
                    <div className="flex gap-2">
                      {[true, false].map((approve) => (
                        <form key={String(approve)} action={reviewCorrection}>
                          <input type="hidden" name="id" value={r.id} />
                          <input type="hidden" name="approve" value={String(approve)} />
                          <Button
                            type="submit"
                            variant={approve ? "primary" : "danger"}
                            className="px-3 py-1"
                          >
                            {approve ? t("approve") : t("reject")}
                          </Button>
                        </form>
                      ))}
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Section>

      <Section title={t("autoClosedTitle")}>
        {!withoutRequest.length ? (
          <p className="opacity-80">{t("noAutoClosed")}</p>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{t("member")}</Th>
                <Th>{t("checkIn")}</Th>
                <Th>{t("autoClosedAt")}</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {withoutRequest.map((s) => (
                <Tr key={s.id}>
                  <Td>{s.members?.name}</Td>
                  <Td>{when(s.check_in)}</Td>
                  <Td>{s.check_out && when(s.check_out)}</Td>
                  <Td>
                    {s.members && (
                      <Link
                        href={`/admin/membros/${s.members.id}`}
                        className="font-bold underline underline-offset-4"
                      >
                        {t("fix")}
                      </Link>
                    )}
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
