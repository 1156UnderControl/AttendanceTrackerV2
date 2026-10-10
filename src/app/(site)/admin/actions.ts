"use server";

import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type PresentMember = { memberId: string; name: string; checkIn: string };

// 004-AC5: "Agora no lab", read with the admin's own client (RLS allows admins).
export async function presentNow(): Promise<PresentMember[]> {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase
    .from("sessions")
    .select("check_in, members(id, name)")
    .is("check_out", null)
    .eq("discarded", false)
    .order("check_in");
  return (data ?? []).flatMap((s) =>
    s.members ? [{ memberId: s.members.id, name: s.members.name, checkIn: s.check_in }] : [],
  );
}
