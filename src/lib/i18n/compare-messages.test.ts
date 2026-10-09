import { describe, expect, it } from "vitest";
import ptBR from "../../../messages/pt-BR.json";
import en from "../../../messages/en.json";
import { compareMessages, flattenMessages, placeholders } from "./compare-messages";

describe("compareMessages", () => {
  it("flattens nested keys", () => {
    expect([...flattenMessages({ a: { b: "x" }, c: "y" }).keys()]).toEqual(["a.b", "c"]);
  });

  it("extracts ICU placeholders", () => {
    expect(placeholders("Olá, {name}! {count, plural, one {#} other {#}}")).toEqual([
      "count",
      "name",
    ]);
  });

  it("reports missing, extra and mismatched placeholders", () => {
    const issues = compareMessages({ a: "x", b: "Olá {name}" }, { b: "Hi {nome}", c: "z" });
    expect(issues).toEqual([
      { kind: "missing", key: "a" },
      { kind: "placeholders", key: "b", expected: ["name"], actual: ["nome"] },
      { kind: "extra", key: "c" },
    ]);
  });

  it("[007-AC10] en.json has exactly the keys of pt-BR.json", () => {
    expect(compareMessages(ptBR, en)).toEqual([]);
  });
});
