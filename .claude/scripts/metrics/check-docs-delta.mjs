#!/usr/bin/env node
/**
 * 提案の適用前後の文書検査レポートを比べ、適用で増えた error があれば exit 1。
 *
 * Usage:
 *   node .claude/scripts/metrics/check-docs-delta.mjs --before <before.json> --after <after.json>
 *
 * 入力は `node .claude/scripts/lib/check-docs-governance.cjs --json` の出力。
 * 適用前からある error は ::warning:: で出すだけで止めない (判定は lib/docs-error-delta.mjs)。
 */
import { readFileSync } from "node:fs";
import { diffDocsErrors } from "./lib/docs-error-delta.mjs";

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const before = arg("--before");
const after = arg("--after");
if (!before || !after) {
  console.error("--before <json> と --after <json> が必要");
  process.exit(2);
}
const { added, preexisting } = diffDocsErrors(JSON.parse(readFileSync(before, "utf8")), JSON.parse(readFileSync(after, "utf8")));
for (const e of preexisting) console.log(`::warning::適用前からある文書 error (triage の差分ではないので止めない): [${e.code}] ${e.file}: ${e.message}`);
for (const e of added) console.log(`::error::提案の適用で増えた文書 error: [${e.code}] ${e.file}: ${e.message}`);
console.log(`[docs-delta] added=${added.length} preexisting=${preexisting.length}`);
process.exit(added.length ? 1 : 0);
