import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { ActionForm, SubmitButton } from "@/components/action-form";
import {
  Badge,
  Button,
  Card,
  Field,
  inputClass,
  PageTitle,
  Section,
  Table,
  Td,
  Th,
  Tr,
} from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { createSeason, makeCurrent } from "./actions";

export default async function SeasonsPage() {
  const [t, format] = await Promise.all([getTranslations("admin.seasons"), getFormatter()]);
  const supabase = await createClient();
  const { data: seasons } = await supabase
    .from("seasons")
    .select("id, name, starts_on, ends_on, is_current")
    .order("starts_on", { ascending: false });
  const date = (day: string) =>
    format.dateTime(new Date(`${day}T12:00:00`), { dateStyle: "medium" });

  return (
    <>
      <PageTitle>{t("title")}</PageTitle>
      <Card title={t("createTitle")} tone="brand">
        <ActionForm
          action={createSeason}
          className="flex flex-wrap items-end gap-3"
          testId="create-season-form"
        >
          <Field label={t("name")}>
            <input
              name="name"
              required
              maxLength={40}
              placeholder={t("namePlaceholder")}
              className={inputClass}
            />
          </Field>
          <Field label={t("startsOn")}>
            <input name="startsOn" type="date" required className={inputClass} />
          </Field>
          <Field label={t("endsOn")}>
            <input name="endsOn" type="date" required className={inputClass} />
          </Field>
          <SubmitButton variant="secondary">{t("create")}</SubmitButton>
        </ActionForm>
      </Card>

      <Section>
        {!seasons?.length ? (
          <p className="opacity-80">{t("none")}</p>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{t("name")}</Th>
                <Th>{t("startsOn")}</Th>
                <Th>{t("endsOn")}</Th>
                <Th />
                <Th />
              </tr>
            </thead>
            <tbody>
              {seasons.map((s) => (
                <Tr key={s.id} data-testid="season-row">
                  <Td className="font-bold">{s.name}</Td>
                  <Td>{date(s.starts_on)}</Td>
                  <Td>{date(s.ends_on)}</Td>
                  <Td>
                    {s.is_current ? (
                      <Badge>{t("current")}</Badge>
                    ) : (
                      <form action={makeCurrent}>
                        <input type="hidden" name="id" value={s.id} />
                        <Button type="submit" variant="secondary" className="px-3 py-1">
                          {t("makeCurrent")}
                        </Button>
                      </form>
                    )}
                  </Td>
                  <Td>
                    <Link
                      href={`/admin/temporadas/${s.id}`}
                      className="font-bold underline underline-offset-4"
                    >
                      {t("open")}
                    </Link>
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
