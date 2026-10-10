"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { saveSession } from "@/app/(site)/admin/sessoes/actions";
import { Alert, Button, inputClass } from "@/components/ui";
import type { ActionState } from "@/lib/errors";

/** Creates a manual session (006-AC5). Existing sessions are edited in the table rows. */
export function SessionForm({ memberId }: { memberId: string }) {
  const t = useTranslations();
  const [state, action, pending] = useActionState<ActionState, FormData>(saveSession, {});

  return (
    <form action={action} className="flex flex-wrap items-end gap-2" data-testid="new-session-form">
      <input type="hidden" name="memberId" value={memberId} />
      <label className="flex flex-col text-sm font-bold">
        {t("admin.memberSessions.checkIn")}
        <input type="datetime-local" name="checkIn" required className={inputClass} />
      </label>
      <label className="flex flex-col text-sm font-bold">
        {t("admin.memberSessions.checkOut")}
        <input type="datetime-local" name="checkOut" required className={inputClass} />
      </label>
      <Button type="submit" disabled={pending} className="py-2">
        {t("admin.memberSessions.add")}
      </Button>
      {state.error && (
        <div className="basis-full">
          <Alert>{t(`errors.${state.error}`)}</Alert>
        </div>
      )}
      {state.ok && (
        <div className="basis-full">
          <Alert tone="success">{t("admin.memberSessions.saved")}</Alert>
        </div>
      )}
    </form>
  );
}
