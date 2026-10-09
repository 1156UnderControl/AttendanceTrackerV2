import { describe, expect, it } from "vitest";
import { matchAcceptLanguage, resolveLocale } from "./config";

describe("matchAcceptLanguage", () => {
  it.each([
    ["pt-BR,pt;q=0.9,en;q=0.8", "pt-BR"],
    ["en-US,en;q=0.9", "en"],
    ["pt-PT", "pt-BR"],
    ["fr-FR,en;q=0.5", "en"],
    ["en;q=0.4,pt;q=0.9", "pt-BR"],
  ])("%s → %s", (header, expected) => {
    expect(matchAcceptLanguage(header)).toBe(expected);
  });

  it("returns undefined for unsupported or empty headers", () => {
    expect(matchAcceptLanguage("fr,de")).toBeUndefined();
    expect(matchAcceptLanguage("")).toBeUndefined();
    expect(matchAcceptLanguage(null)).toBeUndefined();
  });
});

describe("resolveLocale (ADR 0006 order)", () => {
  it("prefers the member's saved locale", () => {
    expect(resolveLocale({ memberLocale: "en", cookieLocale: "pt-BR", acceptLanguage: "pt" })).toBe(
      "en",
    );
  });

  it("falls back to the cookie, then Accept-Language, then pt-BR", () => {
    expect(resolveLocale({ cookieLocale: "en", acceptLanguage: "pt" })).toBe("en");
    expect(resolveLocale({ cookieLocale: "xx", acceptLanguage: "en-GB" })).toBe("en");
    expect(resolveLocale({})).toBe("pt-BR");
  });
});
