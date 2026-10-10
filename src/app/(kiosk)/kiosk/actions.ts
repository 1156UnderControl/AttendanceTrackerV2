"use server";

import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { isLocale, LOCALE_COOKIE, type Locale } from "@/i18n/config";
import { isKioskDevice } from "@/lib/kiosk/device";
import { createServiceClient } from "@/lib/supabase/service";

export type Present = { memberId: string; name: string; checkIn: string };

export type KioskResult =
  | { ok: true; action: "in" | "out" | "noop"; message: string; present: Present[] }
  | {
      ok: false;
      error: "CODE_NOT_FOUND" | "NO_OPEN_SESSION" | "UNAUTHORIZED" | "INVALID";
      present?: Present[];
    };

type RpcResult = {
  ok: boolean;
  action?: "in" | "out" | "noop";
  error?: string;
  name?: string;
  locale?: string;
  minutes?: number;
};

async function present(): Promise<Present[]> {
  const { data } = await createServiceClient().rpc("kiosk_present");
  return (data ?? []).map((p) => ({ memberId: p.member_id, name: p.name, checkIn: p.check_in }));
}

/** Greeting in the member's own language (001-AC10), not the kiosk's. */
async function greeting(result: RpcResult): Promise<string> {
  const locale: Locale = isLocale(result.locale) ? result.locale : "pt-BR";
  const t = await getTranslations({ locale, namespace: "kiosk" });
  const name = result.name ?? "";
  if (result.action !== "out") return t("welcome", { name });
  const minutes = result.minutes ?? 0;
  const duration = t("duration", { hours: Math.floor(minutes / 60), minutes: minutes % 60 });
  return t("goodbye", { name, duration });
}

async function toResult(data: unknown): Promise<KioskResult> {
  const result = data as RpcResult;
  if (!result?.ok) {
    const error = result?.error === "NO_OPEN_SESSION" ? "NO_OPEN_SESSION" : "CODE_NOT_FOUND";
    return { ok: false, error, present: await present() };
  }
  return {
    ok: true,
    action: result.action ?? "noop",
    message: await greeting(result),
    present: await present(),
  };
}

// 001-AC1, AC2, AC4
export async function submitCode(code: string): Promise<KioskResult> {
  if (!(await isKioskDevice())) return { ok: false, error: "UNAUTHORIZED" };
  const parsed = z
    .string()
    .regex(/^\d{6}$/)
    .safeParse(code);
  if (!parsed.success) return { ok: false, error: "CODE_NOT_FOUND" };
  const { data, error } = await createServiceClient().rpc("kiosk_toggle", { p_code: parsed.data });
  if (error) throw new Error(error.message);
  return toResult(data);
}

// 001-AC3
export async function checkOut(memberId: string): Promise<KioskResult> {
  if (!(await isKioskDevice())) return { ok: false, error: "UNAUTHORIZED" };
  const parsed = z.uuid().safeParse(memberId);
  if (!parsed.success) return { ok: false, error: "INVALID" };
  const { data, error } = await createServiceClient().rpc("kiosk_checkout", {
    p_member_id: parsed.data,
  });
  if (error) throw new Error(error.message);
  return toResult(data);
}

// 001-AC8: the grid refreshes periodically.
export async function refreshPresent(): Promise<Present[] | null> {
  if (!(await isKioskDevice())) return null;
  return present();
}

/** Kiosk language toggle (001-AC10). Only the cookie; never touches a member profile. */
export async function setKioskLocale(value: string) {
  if (!isLocale(value)) return;
  (await cookies()).set(LOCALE_COOKIE, value, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
