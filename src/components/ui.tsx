import type { ComponentProps, ReactNode } from "react";

// Shared primitives in the Team 1156 style (docs/architecture/design-system.md):
// thick black borders, hard offset shadows, team yellow, cream inputs, League Spartan.
// Screens compose these instead of styling elements ad hoc.

export const inputClass =
  "w-full rounded-brutal border-2 border-ink bg-cream px-3 py-2 text-base font-semibold text-foreground shadow-brutal outline-none transition focus:-translate-x-0.5 focus:-translate-y-0.5 focus:bg-white disabled:bg-paper disabled:opacity-70 disabled:shadow-none";

const buttonVariants = {
  primary: "bg-brand text-ink",
  secondary: "bg-white text-ink",
  danger: "bg-danger text-white",
} as const;

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: keyof typeof buttonVariants }) {
  return (
    <button
      className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-brutal border-2 border-ink px-4 py-2 font-bold shadow-brutal transition active:translate-x-[3px] active:translate-y-[3px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-50 disabled:active:translate-x-0 disabled:active:translate-y-0 ${buttonVariants[variant]} ${className}`}
      {...props}
    />
  );
}

export function Card({
  title,
  children,
  tone = "white",
  className = "",
}: {
  title?: ReactNode;
  children: ReactNode;
  /** "brand" is the yellow form card from V1. */
  tone?: "white" | "brand";
  className?: string;
}) {
  return (
    <section
      className={`rounded-brutal border-2 border-ink p-5 shadow-brutal ${tone === "brand" ? "bg-brand" : "bg-white"} ${className}`}
    >
      {title && <h2 className="mb-4 text-xl font-black">{title}</h2>}
      {children}
    </section>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-bold">{label}</span>
      {children}
      {hint && <span className="text-sm opacity-80">{hint}</span>}
    </label>
  );
}

export function Alert({
  tone = "error",
  children,
}: {
  tone?: "error" | "success";
  children: ReactNode;
}) {
  const tones = { error: "bg-[#ffd6d2]", success: "bg-[#c8f5df]" };
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-brutal border-2 border-ink px-3 py-2 font-semibold shadow-brutal ${tones[tone]}`}
    >
      {children}
    </p>
  );
}

export function PageTitle({ children }: { children: ReactNode }) {
  return <h1 className="mb-6 text-3xl font-black">{children}</h1>;
}

/** V1 "styled-table": bordered box with a hard shadow, sticky yellow header, zebra rows. */
export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="max-h-[500px] overflow-auto rounded-brutal border-2 border-ink bg-white shadow-brutal">
      <table className="w-full border-collapse text-left">{children}</table>
    </div>
  );
}

export function Th({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <th className={`sticky top-0 z-10 bg-brand px-4 py-3 font-bold text-ink ${className}`}>
      {children}
    </th>
  );
}

export function Tr({ children, ...props }: ComponentProps<"tr">) {
  return (
    <tr
      className="border-b border-[#dddddd] last:border-b-2 last:border-brand even:bg-paper"
      {...props}
    >
      {children}
    </tr>
  );
}

export function Td({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>;
}

/** A titled block without a frame, used around tables (the table brings its own border). */
export function Section({ title, children }: { title?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      {title && <h2 className="text-xl font-black">{title}</h2>}
      {children}
    </section>
  );
}
