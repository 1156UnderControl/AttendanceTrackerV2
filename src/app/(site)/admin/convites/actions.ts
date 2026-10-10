"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { errorCode, type ActionState } from "@/lib/errors";
import { requestOrigin } from "@/lib/http";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  type: z.enum(["student", "mentor"]),
  category: z.enum(["FRC", "FTC"]).optional(),
  label: z.string().trim().max(80),
  maxUses: z.coerce.number().int().min(1).max(200),
  expiresInDays: z.coerce.number().int().min(1).max(90),
});

// 002-AC1: the link is shown once; only the token hash is stored.
export async function createInvite(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = schema.safeParse({
    type: formData.get("type"),
    category: formData.get("category") || undefined,
    label: formData.get("label") ?? "",
    maxUses: formData.get("maxUses"),
    expiresInDays: formData.get("expiresInDays"),
  });
  if (!parsed.success) return { error: "UNKNOWN" };

  const { type, category, label, maxUses, expiresInDays } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_invite", {
    p_type: type,
    p_category: category,
    p_label: label,
    p_max_uses: maxUses,
    p_expires_in_days: expiresInDays,
  });
  if (error || !data?.[0]) return { error: errorCode(error) };

  revalidatePath("/admin/convites");
  return { ok: true, link: `${await requestOrigin()}/convite/${data[0].token}` };
}

export async function revokeInvite(formData: FormData) {
  await requireAdmin();
  const id = z.uuid().parse(formData.get("id"));
  const supabase = await createClient();
  await supabase.from("invites").update({ revoked_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/admin/convites");
}
