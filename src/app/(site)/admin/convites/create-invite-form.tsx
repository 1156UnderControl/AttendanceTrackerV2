"use client";

import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import { Alert, Button, Field, inputClass } from "@/components/ui";
import type { ActionState } from "@/lib/errors";
import { createInvite } from "./actions";

export function CreateInviteForm() {
  const t = useTranslations();
  const [state, action, pending] = useActionState<ActionState, FormData>(createInvite, {});
  const [copied, setCopied] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <form action={action} className="grid gap-4 sm:grid-cols-2">
        <Field label={t("admin.invites.type")}>
          <select name="type" defaultValue="student" className={inputClass}>
            <option value="student">{t("labels.student")}</option>
            <option value="mentor">{t("labels.mentor")}</option>
          </select>
        </Field>
        <Field label={t("admin.invites.category")}>
          <select name="category" defaultValue="" className={inputClass}>
            <option value="">{t("admin.invites.categoryAny")}</option>
            <option value="FRC">FRC</option>
            <option value="FTC">FTC</option>
          </select>
        </Field>
        <Field label={t("admin.invites.label")}>
          <input name="label" maxLength={80} className={inputClass} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t("admin.invites.maxUses")}>
            <input
              name="maxUses"
              type="number"
              min={1}
              max={200}
              defaultValue={1}
              required
              className={inputClass}
            />
          </Field>
          <Field label={t("admin.invites.expiresInDays")}>
            <input
              name="expiresInDays"
              type="number"
              min={1}
              max={90}
              defaultValue={7}
              required
              className={inputClass}
            />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={pending}>
            {pending ? t("common.saving") : t("admin.invites.create")}
          </Button>
        </div>
      </form>

      {state.error && <Alert>{t(`errors.${state.error}`)}</Alert>}
      {state.link && (
        <div className="flex flex-col gap-2">
          <Alert tone="success">{t("admin.invites.created")}</Alert>
          <div className="flex gap-2">
            <input
              readOnly
              value={state.link}
              data-testid="invite-link"
              className={inputClass}
              onFocus={(e) => e.target.select()}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={async () => {
                await navigator.clipboard.writeText(state.link!);
                setCopied(true);
              }}
            >
              {copied ? t("admin.invites.copied") : t("admin.invites.copy")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
