import "server-only";
import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

// The lab computer is authenticated as a device, not a user (ADR 0005).
export const KIOSK_COOKIE = "kiosk_token";

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

/** True when this browser was unlocked by an admin at /kiosk/unlock. */
export async function isKioskDevice(): Promise<boolean> {
  const expected = process.env.KIOSK_TOKEN;
  const token = (await cookies()).get(KIOSK_COOKIE)?.value;
  return !!expected && !!token && safeEqual(token, expected);
}
