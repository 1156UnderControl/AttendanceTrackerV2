"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { errorCode, type ActionState } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";

const memberSchema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(2).max(80),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/),
  type: z.enum(["student", "mentor"]),
  category: z.enum(["FRC", "FTC"]),
  active: z.boolean(),
});

// 002-AC8: every change is audited by the audit_row trigger.
export async function updateMember(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = memberSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    code: formData.get("code"),
    type: formData.get("type"),
    category: formData.get("category"),
    active: formData.get("active") === "on",
  });
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0];
    return {
      error: field === "name" ? "NAME_INVALID" : field === "code" ? "CODE_INVALID" : "UNKNOWN",
    };
  }

  const { id, ...values } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("members").update(values).eq("id", id);
  if (error) return { error: errorCode(error) };

  revalidatePath("/admin/membros");
  return { ok: true };
}

export async function setAdmin(formData: FormData) {
  const auth = await requireAdmin();
  const userId = z.uuid().parse(formData.get("userId"));
  const makeAdmin = formData.get("makeAdmin") === "true";
  // RLS also refuses deleting your own row; this keeps the UI honest (002-AC8).
  if (userId === auth.userId) return;

  const supabase = await createClient();
  if (makeAdmin) await supabase.from("admins").insert({ user_id: userId });
  else await supabase.from("admins").delete().eq("user_id", userId);
  revalidatePath("/admin/membros");
}
