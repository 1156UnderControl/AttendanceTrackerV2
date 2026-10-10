import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { PageTitle, Table, Td, Th, Tr } from "@/components/ui";
import type { Json } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

const PAGE_SIZE = 50;
const IGNORED_KEYS = new Set(["updated_at", "created_at"]);

type Row = Record<string, Json | undefined>;

const ISO_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** "field: before → after" for updates; a short identifier for inserts and deletes. */
function describe(
  action: string,
  before: Json | null,
  after: Json | null,
  show: (value: Json | undefined) => string,
): string[] {
  const b = (before ?? {}) as Row;
  const a = (after ?? {}) as Row;
  if (action === "update") {
    return Object.keys(a)
      .filter((key) => !IGNORED_KEYS.has(key) && JSON.stringify(a[key]) !== JSON.stringify(b[key]))
      .map((key) => `${key}: ${show(b[key])} → ${show(a[key])}`);
  }
  const row = action === "delete" ? b : a;
  return [
    show(
      row.name ?? row.label ?? row.key ?? row.requested_check_out ?? row.check_in ?? row.user_id,
    ),
  ];
}

// 006-AC6: every change made by a logged-in user (written by the audit_row trigger).
export default async function AuditPage({ searchParams }: PageProps<"/admin/auditoria">) {
  const page = Math.max(0, Number((await searchParams).page ?? 0) || 0);
  const [t, format] = await Promise.all([getTranslations("admin.audit"), getFormatter()]);
  const supabase = await createClient();
  const [{ data: entries }, { data: members }] = await Promise.all([
    supabase
      .from("audit_log")
      .select("id, actor, action, entity, entity_id, before, after, at")
      .order("at", { ascending: false })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
    supabase.from("members").select("user_id, name").not("user_id", "is", null),
  ]);
  const names = new Map(members?.map((m) => [m.user_id, m.name]));
  const rows = (entries ?? []).slice(0, PAGE_SIZE);
  const hasMore = (entries?.length ?? 0) > PAGE_SIZE;
  // Times in São Paulo, user ids as member names.
  const show = (value: Json | undefined): string => {
    if (value === null || value === undefined) return "∅";
    if (typeof value === "string" && ISO_INSTANT.test(value)) {
      return format.dateTime(new Date(value), { dateStyle: "short", timeStyle: "short" });
    }
    if (typeof value === "string" && UUID.test(value) && names.has(value)) return names.get(value)!;
    return typeof value === "object" ? JSON.stringify(value) : String(value);
  };
  const actionLabel = (action: string) =>
    action === "insert" || action === "update" || action === "delete" ? t(action) : action;

  return (
    <>
      <PageTitle>{t("title")}</PageTitle>
      {rows.length === 0 ? (
        <p className="opacity-80">{t("none")}</p>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>{t("when")}</Th>
              <Th>{t("who")}</Th>
              <Th>{t("what")}</Th>
              <Th>{t("changes")}</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => (
              <Tr key={e.id} data-testid="audit-row">
                <Td className="whitespace-nowrap">
                  {format.dateTime(new Date(e.at), { dateStyle: "short", timeStyle: "short" })}
                </Td>
                <Td>{(e.actor && names.get(e.actor)) ?? t("unknownUser")}</Td>
                <Td>
                  {actionLabel(e.action)} <span className="font-mono text-sm">{e.entity}</span>
                </Td>
                <Td>
                  <ul className="font-mono text-sm">
                    {describe(e.action, e.before, e.after, show).map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
      <div className="flex justify-between font-bold">
        {page > 0 ? <Link href={`?page=${page - 1}`}>← {t("previous")}</Link> : <span />}
        {hasMore && <Link href={`?page=${page + 1}`}>{t("next")} →</Link>}
      </div>
    </>
  );
}
