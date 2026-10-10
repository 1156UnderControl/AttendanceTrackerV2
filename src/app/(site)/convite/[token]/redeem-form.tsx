"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { Alert, Button, Field, inputClass } from "@/components/ui";
import { locales } from "@/i18n/config";
import type { ActionState } from "@/lib/errors";
import { redeemInvite } from "./actions";

export function RedeemForm({
  token,
  fixedCategory,
  defaultName,
  defaultLocale,
}: {
  token: string;
  fixedCategory: "FRC" | "FTC" | null;
  defaultName: string;
  defaultLocale: string;
}) {
  const t = useTranslations();
  const [state, action, pending] = useActionState<ActionState, FormData>(redeemInvite, {});

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      {state.error && <Alert>{t(`errors.${state.error}`)}</Alert>}

      <Field label={t("invite.name")}>
        <input
          name="name"
          required
          minLength={2}
          maxLength={80}
          defaultValue={defaultName}
          className={inputClass}
        />
      </Field>

      <fieldset className="flex flex-col gap-2 text-sm">
        <legend className="mb-1 font-medium">{t("invite.category")}</legend>
        <div className="flex gap-4">
          {(["FRC", "FTC"] as const).map((category) => (
            <label key={category} className="flex items-center gap-2">
              <input
                type="radio"
                name="category"
                value={category}
                required={!fixedCategory}
                disabled={!!fixedCategory}
                defaultChecked={fixedCategory === category}
              />
              {category}
            </label>
          ))}
        </div>
        {fixedCategory && <span className="text-xs opacity-70">{t("invite.categoryLocked")}</span>}
      </fieldset>

      <Field label={t("invite.code")} hint={t("invite.codeHint")}>
        <input
          name="code"
          inputMode="numeric"
          pattern="\d{6}"
          maxLength={6}
          autoComplete="off"
          className={inputClass}
        />
      </Field>

      <Field label={t("invite.language")}>
        <select name="locale" defaultValue={defaultLocale} className={inputClass}>
          {locales.map((locale) => (
            <option key={locale} value={locale}>
              {t(`language.${locale}`)}
            </option>
          ))}
        </select>
      </Field>

      <Button type="submit" disabled={pending}>
        {pending ? t("common.saving") : t("invite.submit")}
      </Button>
    </form>
  );
}
