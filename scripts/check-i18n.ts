// Fails when any locale in messages/ drifts from messages/pt-BR.json (007-AC10).
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { compareMessages } from "../src/lib/i18n/compare-messages";

const dir = join(import.meta.dirname, "..", "messages");
const read = (file: string) => JSON.parse(readFileSync(join(dir, file), "utf8"));
const source = read("pt-BR.json");

let failed = false;
for (const file of readdirSync(dir).filter((f) => f.endsWith(".json") && f !== "pt-BR.json")) {
  for (const issue of compareMessages(source, read(file))) {
    failed = true;
    const detail =
      issue.kind === "placeholders"
        ? ` (expected {${issue.expected.join(", ")}}, got {${issue.actual.join(", ")}})`
        : "";
    console.error(`${file}: ${issue.kind} key "${issue.key}"${detail}`);
  }
}

if (failed) process.exit(1);
console.log("i18n: all locales match pt-BR.json");
