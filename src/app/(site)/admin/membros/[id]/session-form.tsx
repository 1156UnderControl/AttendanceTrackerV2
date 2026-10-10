"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { saveSession } from "@/app/(site)/admin/sessoes/actions";
import { Alert, Button, inputClass } from "@/components/ui";
import type { ActionState } from "@/lib/errors";

/** Edit an existing session, or create a manual one when sessionId is absent (006-AC5). */
export function SessionForm({
  memberId,
  sessionId,
  checkIn = "",
  checkOut = "",
}: {
  memberId: string;
  sessionId?: string;
  checkIn?: string;
  checkOut?: string;
}) {
  const t = useTranslations();
  const [state, action, pending] = useActionState<ActionState, FormData>(saveSession, {});

  return (
    <form
      action={action}
      className="flex flex-wrap items-end gap-2"
      data-testid={sessionId ? "session-form" : "new-session-form"}
    >
      <input type="hidden" name="memberId" value={memberId} />
      {sessionId && <input type="hidden" name="sessionId" value={sessionId} />}
      <label className="flex flex-col text-sm font-bold">
        {t("admin.memberSessions.checkIn")}
        <input
          type="datetime-local"
          name="checkIn"
          required
          defaultValue={checkIn}
          className={inputClass}
        />
      </label>
      <label className="flex flex-col text-sm font-bold">
        {t("admin.memberSessions.checkOut")}
        <input
          type="datetime-local"
          name="checkOut"
          required
          defaultValue={checkOut}
          className={inputClass}
        />
      </label>
      <Button
        type="submit"
        variant={sessionId ? "secondary" : "primary"}
        disabled={pending}
        className="py-2"
      >
        {sessionId ? t("admin.memberSessions.save") : t("admin.memberSessions.add")}
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
