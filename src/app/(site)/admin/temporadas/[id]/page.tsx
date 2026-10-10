import Link from "next/link";
import { notFound } from "next/navigation";
import { getFormatter, getNow, getTranslations } from "next-intl/server";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { ConfirmSubmit } from "@/components/confirm-submit";
import {
  Badge,
  Button,
  Card,
  DangerZone,
  Field,
  inputClass,
  PageTitle,
  Section,
  Table,
  Td,
  Th,
  Tr,
} from "@/components/ui";
import { TRACKS, type Track } from "@/lib/attendance/track";
import { createClient } from "@/lib/supabase/server";
import {
  copyPhases,
  deletePhase,
  deleteSeason,
  makeCurrent,
  savePhase,
  updateSeason,
} from "../actions";

export default async function SeasonPage({
  params,
  searchParams,
}: PageProps<"/admin/temporadas/[id]">) {
  const { id } = await params;
  const requested = (await searchParams).track;
  const track: Track = TRACKS.find((tr) => tr === requested) ?? "FRC_STUDENTS";
  const [t, format, now] = await Promise.all([getTranslations(), getFormatter(), getNow()]);
  const supabase = await createClient();

  const { data: season } = await supabase.from("seasons").select("*").eq("id", id).maybeSingle();
  if (!season) notFound();
  const [{ data: phases }, { data: expectedToDate }, { data: expectedFull }] = await Promise.all([
    supabase
      .from("season_phases")
      .select("*")
      .eq("season_id", id)
      .eq("track", track)
      .order("starts_on"),
    supabase.rpc("expected_minutes", { p_season_id: id, p_track: track, p_at: now.toISOString() }),
    supabase.rpc("expected_full_minutes", { p_season_id: id, p_track: track }),
  ]);
  const hours = (minutes: number | null) =>
    t("admin.seasons.hours", {
      value: format.number((minutes ?? 0) / 60, { maximumFractionDigits: 1 }),
    });
  const dateBounds = { min: season.starts_on, max: season.ends_on };

  return (
    <>
      <Link href="/admin/temporadas" className="font-bold">
        ← {t("common.back")}
      </Link>
      {/* Header: the season's status sits next to its name. */}
      <div className="flex flex-wrap items-center gap-3">
        <PageTitle>{t("admin.seasons.editTitle", { name: season.name })}</PageTitle>
        {season.is_current ? (
          <Badge>{t("admin.seasons.current")}</Badge>
        ) : (
          <form action={makeCurrent}>
            <input type="hidden" name="id" value={season.id} />
            <Button type="submit" variant="secondary" className="px-3 py-1">
              {t("admin.seasons.makeCurrent")}
            </Button>
          </form>
        )}
      </div>

      <Card title={t("admin.seasons.detailsTitle")}>
        <ActionForm
          action={updateSeason}
          successMessage={t("admin.seasons.saved")}
          className="flex flex-col gap-4"
          testId="season-form"
        >
          <input type="hidden" name="id" value={season.id} />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={t("admin.seasons.name")}>
              <input
                name="name"
                required
                maxLength={40}
                defaultValue={season.name}
                className={inputClass}
              />
            </Field>
            <Field label={t("admin.seasons.startsOn")}>
              <input
                name="startsOn"
                type="date"
                required
                defaultValue={season.starts_on}
                className={inputClass}
              />
            </Field>
            <Field label={t("admin.seasons.endsOn")}>
              <input
                name="endsOn"
                type="date"
                required
                defaultValue={season.ends_on}
                className={inputClass}
              />
            </Field>
          </div>
          <div className="flex justify-end">
            <SubmitButton>{t("admin.seasons.save")}</SubmitButton>
          </div>
        </ActionForm>
      </Card>

      {/* 003-AC2: one tab per track */}
      <nav className="flex flex-wrap gap-3" aria-label={t("admin.seasons.phasesTitle")}>
        {TRACKS.map((tr) => (
          <Link
            key={tr}
            href={`?track=${tr}`}
            aria-current={tr === track ? "page" : undefined}
            className={`rounded-brutal border-2 border-ink px-4 py-2 font-bold shadow-brutal ${tr === track ? "bg-brand" : "bg-white"}`}
          >
            {t(`labels.${tr}`)}
          </Link>
        ))}
      </nav>

      {/* 003-AC4 */}
      <dl className="grid grid-cols-2 gap-4 sm:max-w-md">
        <div className="rounded-brutal border-2 border-ink bg-white p-3 shadow-brutal">
          <dt className="text-sm font-semibold">{t("admin.seasons.expectedFull")}</dt>
          <dd className="text-2xl font-black" data-testid="expected-full">
            {hours(expectedFull)}
          </dd>
        </div>
        <div className="rounded-brutal border-2 border-ink bg-white p-3 shadow-brutal">
          <dt className="text-sm font-semibold">{t("admin.seasons.expectedToDate")}</dt>
          <dd className="text-2xl font-black">{hours(expectedToDate)}</dd>
        </div>
      </dl>

      <Section title={t("admin.seasons.phasesTitle")}>
        {!phases?.length ? (
          <>
            <p className="opacity-80">{t("admin.seasons.noPhases")}</p>
            <Card title={t("admin.seasons.copyTitle")} tone="brand">
              <p className="mb-3 text-sm">{t("admin.seasons.copyHint")}</p>
              <ActionForm
                action={copyPhases}
                className="flex flex-wrap gap-3"
                testId="copy-phases-form"
              >
                <input type="hidden" name="seasonId" value={season.id} />
                <input type="hidden" name="track" value={track} />
                {TRACKS.filter((tr) => tr !== track).map((tr) => (
                  <SubmitButton key={tr} name="source" value={`track:${tr}`} variant="secondary">
                    {t("admin.seasons.copyFromTrack", { track: t(`labels.${tr}`) })}
                  </SubmitButton>
                ))}
                <SubmitButton name="source" value="previous" variant="secondary">
                  {t("admin.seasons.copyFromPrevious")}
                </SubmitButton>
                {track === "FRC_STUDENTS" && (
                  <SubmitButton name="source" value="template-frc" variant="secondary">
                    {t("admin.seasons.templateFrc")}
                  </SubmitButton>
                )}
              </ActionForm>
            </Card>
          </>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{t("admin.seasons.phaseName")}</Th>
                <Th>{t("admin.seasons.startsOn")}</Th>
                <Th>{t("admin.seasons.endsOn")}</Th>
                <Th>{t("admin.seasons.weeklyHours")}</Th>
                <Th />
                <Th />
              </tr>
            </thead>
            <tbody>
              {phases.map((p) => (
                <Tr key={p.id} data-testid="phase-row">
                  <PhaseRowCells
                    seasonId={season.id}
                    track={track}
                    bounds={dateBounds}
                    phase={{
                      id: p.id,
                      name: p.name,
                      startsOn: p.starts_on,
                      endsOn: p.ends_on,
                      weeklyHours: p.weekly_hours,
                    }}
                  />
                  <Td>
                    <form action={deletePhase}>
                      <input type="hidden" name="phaseId" value={p.id} />
                      <input type="hidden" name="seasonId" value={season.id} />
                      <ConfirmSubmit
                        title={t("admin.seasons.deletePhaseConfirmTitle")}
                        message={t("admin.seasons.deletePhaseConfirm", { name: p.name })}
                        confirmLabel={t("admin.seasons.deletePhase")}
                        cancelLabel={t("common.cancel")}
                        className="px-3 py-1"
                      >
                        {t("admin.seasons.deletePhase")}
                      </ConfirmSubmit>
                    </form>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
        <Card title={t("admin.seasons.addPhase")} tone="brand">
          <PhaseFields seasonId={season.id} track={track} bounds={dateBounds} />
        </Card>
      </Section>

      <DangerZone title={t("admin.seasons.delete")} description={t("admin.seasons.deleteHint")}>
        <form action={deleteSeason}>
          <input type="hidden" name="id" value={season.id} />
          <ConfirmSubmit
            title={t("admin.seasons.deleteConfirmTitle")}
            message={t("admin.seasons.deleteConfirm", { name: season.name })}
            confirmLabel={t("admin.seasons.delete")}
            cancelLabel={t("common.cancel")}
          >
            {t("admin.seasons.delete")}
          </ConfirmSubmit>
        </form>
      </DangerZone>
    </>
  );
}

/** The "Adicionar fase" form (labeled fields). */
async function PhaseFields({
  seasonId,
  track,
  bounds,
}: {
  seasonId: string;
  track: Track;
  bounds: { min: string; max: string };
}) {
  const t = await getTranslations();
  return (
    <ActionForm
      action={savePhase}
      successMessage={t("admin.seasons.saved")}
      className="flex flex-wrap items-end gap-2"
      testId="new-phase-form"
    >
      <input type="hidden" name="seasonId" value={seasonId} />
      <input type="hidden" name="track" value={track} />
      <Field label={t("admin.seasons.phaseName")}>
        <input name="name" required maxLength={60} className={inputClass} />
      </Field>
      <Field label={t("admin.seasons.startsOn")}>
        <input name="startsOn" type="date" required {...bounds} className={inputClass} />
      </Field>
      <Field label={t("admin.seasons.endsOn")}>
        <input name="endsOn" type="date" required {...bounds} className={inputClass} />
      </Field>
      <Field label={t("admin.seasons.weeklyHours")}>
        <input
          name="weeklyHours"
          type="number"
          required
          min={0}
          max={168}
          step="0.5"
          className={`${inputClass} w-28`}
        />
      </Field>
      <SubmitButton>{t("admin.seasons.addPhase")}</SubmitButton>
    </ActionForm>
  );
}

/**
 * One editable phase as table cells (003-AC2). The form lives in the "Salvar" cell and the
 * inputs in the other cells join it through form="…", since a form can't span cells.
 */
async function PhaseRowCells({
  seasonId,
  track,
  bounds,
  phase,
}: {
  seasonId: string;
  track: Track;
  bounds: { min: string; max: string };
  phase: { id: string; name: string; startsOn: string; endsOn: string; weeklyHours: number };
}) {
  const t = await getTranslations();
  const form = `phase-${phase.id}`;
  return (
    <>
      <Td>
        <input
          form={form}
          name="name"
          aria-label={t("admin.seasons.phaseName")}
          required
          maxLength={60}
          defaultValue={phase.name}
          className={`${inputClass} min-w-40`}
        />
      </Td>
      <Td>
        <input
          form={form}
          name="startsOn"
          type="date"
          aria-label={t("admin.seasons.startsOn")}
          required
          {...bounds}
          defaultValue={phase.startsOn}
          className={inputClass}
        />
      </Td>
      <Td>
        <input
          form={form}
          name="endsOn"
          type="date"
          aria-label={t("admin.seasons.endsOn")}
          required
          {...bounds}
          defaultValue={phase.endsOn}
          className={inputClass}
        />
      </Td>
      <Td>
        <input
          form={form}
          name="weeklyHours"
          type="number"
          aria-label={t("admin.seasons.weeklyHours")}
          required
          min={0}
          max={168}
          step="0.5"
          defaultValue={phase.weeklyHours}
          className={`${inputClass} w-24`}
        />
      </Td>
      <Td>
        <ActionForm
          id={form}
          action={savePhase}
          successMessage={t("admin.seasons.saved")}
          testId="phase-form"
        >
          <input type="hidden" name="seasonId" value={seasonId} />
          <input type="hidden" name="track" value={track} />
          <input type="hidden" name="phaseId" value={phase.id} />
          <SubmitButton variant="secondary">{t("admin.seasons.save")}</SubmitButton>
        </ActionForm>
      </Td>
    </>
  );
}
