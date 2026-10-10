import { describe, expect, it } from "vitest";
import { errorCode } from "@/lib/errors";
import { shiftYears } from "./dates";

describe("[003-AC5] shiftYears", () => {
  it("moves a date by whole years", () => {
    expect(shiftYears("2026-10-01", 1)).toBe("2027-10-01");
    expect(shiftYears("2027-04-30", 2)).toBe("2029-04-30");
  });

  it("maps Feb 29 to Feb 28 in non-leap years", () => {
    expect(shiftYears("2028-02-29", 1)).toBe("2029-02-28");
  });
});

describe("errorCode for seasons and phases", () => {
  it("distinguishes phase overlaps from session overlaps", () => {
    expect(
      errorCode({
        code: "23P01",
        message: 'violates exclusion constraint "season_phases_no_overlap"',
      }),
    ).toBe("PHASE_OVERLAP");
    expect(
      errorCode({ code: "23P01", message: 'violates exclusion constraint "sessions_no_overlap"' }),
    ).toBe("SESSION_OVERLAP");
  });

  it("maps season and phase constraint errors", () => {
    expect(errorCode({ code: "P0001", message: "PHASE_OUTSIDE_SEASON" })).toBe(
      "PHASE_OUTSIDE_SEASON",
    );
    expect(errorCode({ code: "23514", message: "PHASE_OUTSIDE_SEASON" })).toBe(
      "PHASE_OUTSIDE_SEASON",
    );
    expect(
      errorCode({
        code: "23505",
        message: 'duplicate key value violates unique constraint "seasons_name_key"',
      }),
    ).toBe("SEASON_NAME_IN_USE");
    expect(errorCode({ code: "23514", message: 'violates check constraint "seasons_check"' })).toBe(
      "INVALID_DATES",
    );
  });
});
