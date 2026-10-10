import type { Enums } from "@/lib/database.types";

export type Track = Enums<"track">;
export const TRACKS: Track[] = ["FRC_STUDENTS", "FTC_STUDENTS", "MENTORS"];

/** Mirrors public.member_track(): students by category, all mentors together (ADR 0004). */
export function memberTrack(type: Enums<"member_type">, category: Enums<"category">): Track {
  if (type === "mentor") return "MENTORS";
  return category === "FRC" ? "FRC_STUDENTS" : "FTC_STUDENTS";
}
