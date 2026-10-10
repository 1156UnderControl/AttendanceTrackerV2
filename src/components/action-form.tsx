"use client";

import { useTranslations } from "next-intl";
import { useActionState, type ComponentProps, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Alert, Button } from "@/components/ui";
import type { ActionState } from "@/lib/errors";

type Action = (prev: ActionState, formData: FormData) => Promise<ActionState>;

/** A form bound to a server action that shows its translated error or success message. */
export function ActionForm({
  action,
  children,
  successMessage,
  className,
  testId,
  id,
}: {
  action: Action;
  children: ReactNode;
  successMessage?: string;
  className?: string;
  testId?: string;
  /** Lets inputs in other table cells join this form with form="…" (a form can't span cells). */
  id?: string;
}) {
  const t = useTranslations();
  const [state, formAction] = useActionState<ActionState, FormData>(action, {});
  return (
    <form id={id} action={formAction} className={className} data-testid={testId}>
      {children}
      {state.error && (
        <div className="basis-full whitespace-normal">
          <Alert>{t(`errors.${state.error}`)}</Alert>
        </div>
      )}
      {state.ok && successMessage && (
        <div className="basis-full whitespace-normal">
          <Alert tone="success">{successMessage}</Alert>
        </div>
      )}
    </form>
  );
}

/** Submit button that disables itself while its form's action is running. */
export function SubmitButton(props: ComponentProps<typeof Button>) {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending || props.disabled} {...props} />;
}
