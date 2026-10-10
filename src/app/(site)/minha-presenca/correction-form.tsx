"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { Alert, Button, Field, inputClass } from "@/components/ui";
import type { ActionState } from "@/lib/errors";
import { requestCorrection } from "./actions";

/** 006-AC3: inline form under an auto-closed session ("Saída não registrada"). */
export function CorrectionForm({
  sessionId,
  min,
  max,
}: {
  sessionId: string;
  min: string;
  max: string;
}) {
  const t = useTranslations();
  const [state, action, pending] = useActionState<ActionState, FormData>(requestCorrection, {});

  if (state.ok) return <Alert tone="success">{t("me.correctionSent")}</Alert>;

  return (
    <details className="mt-2">
      <summary className="cursor-pointer font-bold underline underline-offset-4">
        {t("me.requestCorrection")}
      </summary>
      <form
        action={action}
        className="mt-3 flex flex-col gap-3 rounded-brutal border-2 border-ink bg-brand p-3 shadow-brutal"
      >
        <input type="hidden" name="sessionId" value={sessionId} />
        {state.error && <Alert>{t(`errors.${state.error}`)}</Alert>}
        <Field label={t("me.correctionExit")}>
          <input
            type="datetime-local"
            name="exit"
            required
            min={min}
            max={max}
            className={inputClass}
          />
        </Field>
        <Field label={t("me.correctionNote")}>
          <input name="note" maxLength={500} className={inputClass} />
        </Field>
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? t("common.saving") : t("me.correctionSend")}
        </Button>
      </form>
    </details>
  );
}
