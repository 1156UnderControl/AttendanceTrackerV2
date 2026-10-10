import { describe, expect, it } from "vitest";
import { toCsv } from "./csv";

describe("[004-AC8] toCsv", () => {
  it("starts with a BOM and uses ; separators with CRLF", () => {
    expect(
      toCsv([
        ["Nome", "Horas"],
        ["Ana", 12.5],
      ]),
    ).toBe("﻿Nome;Horas\r\nAna;12,5\r\n");
  });

  it("quotes fields containing separators, quotes or newlines", () => {
    expect(toCsv([['Diz "oi"; tchau', "a\nb", null]])).toBe('﻿"Diz ""oi""; tchau";"a\nb";\r\n');
  });
});
