"use client";

import { useId, useRef, type ReactNode } from "react";
import { Button } from "@/components/ui";

/**
 * Submit button for destructive actions: asks for confirmation in a dialog, then
 * submits its enclosing form (or the form named by `form`). Native <dialog> gives
 * focus trapping and Escape for free.
 */
export function ConfirmSubmit({
  children,
  title,
  message,
  confirmLabel,
  cancelLabel,
  form,
  disabled,
  className = "",
}: {
  children: ReactNode;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  form?: string;
  disabled?: boolean;
  className?: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  function submit() {
    dialog.current?.close();
    const target = form ? document.getElementById(form) : trigger.current?.closest("form");
    (target as HTMLFormElement | null)?.requestSubmit();
  }

  return (
    <>
      <Button
        ref={trigger}
        type="button"
        variant="danger"
        disabled={disabled}
        className={className}
        onClick={() => dialog.current?.showModal()}
      >
        {children}
      </Button>
      <dialog
        ref={dialog}
        aria-labelledby={titleId}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-brutal border-4 border-ink bg-brand p-6 text-left whitespace-normal text-foreground shadow-brutal-lg backdrop:bg-ink/40"
      >
        <h2 id={titleId} className="mb-2 text-xl font-black">
          {title}
        </h2>
        <p className="mb-6">{message}</p>
        <div className="flex flex-wrap justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            autoFocus
            onClick={() => dialog.current?.close()}
          >
            {cancelLabel}
          </Button>
          <Button type="button" variant="danger" onClick={submit}>
            {confirmLabel}
          </Button>
        </div>
      </dialog>
    </>
  );
}
