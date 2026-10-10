"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fromLocalInput } from "@/lib/attendance/local-input";
import { requireAdmin } from "@/lib/auth/session";
import { errorCode, type ActionState } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";

// 006-AC4
export async function reviewCorrection(formData: FormData) {
  await requireAdmin();
  const id = z.uuid().parse(formData.get("id"));
  const approve = formData.get("approve") === "true";
  const supabase = await createClient();
  await supabase.rpc("review_correction", { p_request_id: id, p_approve: approve });
  revalidatePath("/admin/sessoes");
}

const sessionSchema = z.object({
  memberId: z.uuid(),
  sessionId: z.uuid().optional(),
  checkIn: z.string(),
  checkOut: z.string(),
});

/**
 * 006-AC5: create or edit a session with explicit times. Saving an exit clears
 * credited_minutes, so an auto-closed session counts its real duration (ADR 0003);
 * auto_closed stays true for history. Overlaps are rejected by the database.
 */
export async function saveSession(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = sessionSchema.safeParse({
    memberId: formData.get("memberId"),
    sessionId: formData.get("sessionId") || undefined,
    checkIn: formData.get("checkIn"),
    checkOut: formData.get("checkOut"),
  });
  const checkIn = parsed.success ? fromLocalInput(parsed.data.checkIn) : null;
  const checkOut = parsed.success ? fromLocalInput(parsed.data.checkOut) : null;
  if (!parsed.success || !checkIn || !checkOut || checkOut <= checkIn)
    return { error: "INVALID_TIME" };

  const values = {
    check_in: checkIn.toISOString(),
    check_out: checkOut.toISOString(),
    credited_minutes: null,
  };
  const supabase = await createClient();
  const { error } = parsed.data.sessionId
    ? await supabase.from("sessions").update(values).eq("id", parsed.data.sessionId)
    : await supabase.from("sessions").insert({ ...values, member_id: parsed.data.memberId });
  if (error) return { error: errorCode(error) };

  revalidatePath(`/admin/membros/${parsed.data.memberId}`);
  revalidatePath("/admin/sessoes");
  return { ok: true };
}

// 006-AC5: discarding is a soft delete; the row stays for the audit log.
export async function discardSession(formData: FormData) {
  await requireAdmin();
  const sessionId = z.uuid().parse(formData.get("sessionId"));
  const memberId = z.uuid().parse(formData.get("memberId"));
  const supabase = await createClient();
  await supabase.from("sessions").update({ discarded: true }).eq("id", sessionId);
  revalidatePath(`/admin/membros/${memberId}`);
  revalidatePath("/admin/sessoes");
}
