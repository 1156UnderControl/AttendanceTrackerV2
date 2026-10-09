type Messages = { [key: string]: string | Messages };

/** Flattens nested messages into "a.b.c" → value. */
export function flattenMessages(messages: Messages, prefix = ""): Map<string, string> {
  const out = new Map<string, string>();
  for (const [key, value] of Object.entries(messages)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") out.set(path, value);
    else for (const [k, v] of flattenMessages(value, path)) out.set(k, v);
  }
  return out;
}

/** Top-level ICU argument names, e.g. "Olá, {name}" → ["name"]. */
export function placeholders(message: string): string[] {
  return [...new Set([...message.matchAll(/\{\s*(\w+)/g)].map((m) => m[1]))].sort();
}

export type MessageIssue =
  | { kind: "missing"; key: string }
  | { kind: "extra"; key: string }
  | { kind: "placeholders"; key: string; expected: string[]; actual: string[] };

/** Compares a locale's messages against the source locale (pt-BR). */
export function compareMessages(source: Messages, target: Messages): MessageIssue[] {
  const src = flattenMessages(source);
  const tgt = flattenMessages(target);
  const issues: MessageIssue[] = [];
  for (const [key, value] of src) {
    const other = tgt.get(key);
    if (other === undefined) {
      issues.push({ kind: "missing", key });
      continue;
    }
    const expected = placeholders(value);
    const actual = placeholders(other);
    if (expected.join() !== actual.join()) {
      issues.push({ kind: "placeholders", key, expected, actual });
    }
  }
  for (const key of tgt.keys()) {
    if (!src.has(key)) issues.push({ kind: "extra", key });
  }
  return issues;
}
