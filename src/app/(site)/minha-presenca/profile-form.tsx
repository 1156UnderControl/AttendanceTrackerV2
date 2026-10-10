"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { Alert, Button, Field, inputClass } from "@/components/ui";
import { locales } from "@/i18n/config";
import type { ActionState } from "@/lib/errors";
import { updateProfile } from "./actions";

export function ProfileForm({
  name,
  code,
  locale,
  typeLabel,
  category,
}: {
  name: string;
  code: string;
  locale: string;
  typeLabel: string;
  category: string;
}) {
  const t = useTranslations();
  const [state, action, pending] = useActionState<ActionState, FormData>(updateProfile, {});

  return (
    <form action={action} className="flex flex-col gap-4">
      {state.error && <Alert>{t(`errors.${state.error}`)}</Alert>}
      {state.ok && <Alert tone="success">{t("me.profileSaved")}</Alert>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("me.name")}>
          <input
            name="name"
            required
            minLength={2}
            maxLength={80}
            defaultValue={name}
            className={inputClass}
          />
        </Field>
        <Field label={t("me.code")}>
          <input
            name="code"
            required
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            defaultValue={code}
            className={inputClass}
          />
        </Field>
        <Field label={t("me.language")}>
          <select name="locale" defaultValue={locale} className={inputClass}>
            {locales.map((l) => (
              <option key={l} value={l}>
                {t(`language.${l}`)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={`${t("me.type")} / ${t("me.category")}`} hint={t("me.readOnlyHint")}>
          <input value={`${typeLabel} · ${category}`} disabled readOnly className={inputClass} />
        </Field>
      </div>
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? t("common.saving") : t("common.save")}
        </Button>
      </div>
    </form>
  );
}
