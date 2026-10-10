"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { Alert, Button, Field, inputClass } from "@/components/ui";
import type { Tables } from "@/lib/database.types";
import type { ActionState } from "@/lib/errors";
import { updateMember } from "../actions";

export function MemberForm({ member }: { member: Tables<"members"> }) {
  const t = useTranslations();
  const [state, action, pending] = useActionState<ActionState, FormData>(updateMember, {});

  return (
    <form action={action} className="flex flex-col gap-4" data-testid="member-form">
      <input type="hidden" name="id" value={member.id} />
      {state.error && <Alert>{t(`errors.${state.error}`)}</Alert>}
      {state.ok && <Alert tone="success">{t("admin.members.saved")}</Alert>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("admin.members.name")}>
          <input
            name="name"
            required
            minLength={2}
            maxLength={80}
            defaultValue={member.name}
            className={inputClass}
          />
        </Field>
        <Field label={t("admin.members.code")}>
          <input
            name="code"
            required
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            defaultValue={member.code}
            className={inputClass}
          />
        </Field>
        <Field label={t("admin.members.type")}>
          <select name="type" defaultValue={member.type} className={inputClass}>
            <option value="student">{t("labels.student")}</option>
            <option value="mentor">{t("labels.mentor")}</option>
          </select>
        </Field>
        <Field label={t("admin.members.category")}>
          <select name="category" defaultValue={member.category} className={inputClass}>
            <option value="FRC">FRC</option>
            <option value="FTC">FTC</option>
          </select>
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="active" defaultChecked={member.active} />
        {t("admin.members.activeLabel")}
      </label>
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? t("common.saving") : t("common.save")}
        </Button>
      </div>
    </form>
  );
}
