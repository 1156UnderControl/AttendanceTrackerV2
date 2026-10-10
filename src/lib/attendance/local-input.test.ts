import { describe, expect, it } from "vitest";
import { fromLocalInput, toLocalInput } from "./local-input";

describe("datetime-local values in São Paulo time", () => {
  it("formats an instant as local input", () => {
    expect(toLocalInput("2026-10-10T07:00:00Z")).toBe("2026-10-10T04:00");
  });

  it("parses local input as São Paulo time", () => {
    expect(fromLocalInput("2026-10-10T01:30")?.toISOString()).toBe("2026-10-10T04:30:00.000Z");
  });

  it("round-trips", () => {
    expect(toLocalInput(fromLocalInput("2026-12-31T23:59")!)).toBe("2026-12-31T23:59");
  });

  it("rejects malformed values", () => {
    expect(fromLocalInput("2026-10-10 01:30")).toBeNull();
    expect(fromLocalInput("")).toBeNull();
  });
});
