/**
 * R2 の区分表 (r2-key-classes.ts) を一覧で読む。git 側の `npm run check-datasets -- --er` と対。
 * 読むだけで R2 には触れない。`--json` で機械可読、`--bucket public|private` で絞る。
 */
import { fileURLToPath } from "node:url";

import {
  R2_KEY_CLASSES,
  R2_PRIVATE_BUCKET,
  R2_PUBLIC_BUCKET,
  type R2KeyClassRule,
} from "./r2-key-classes";

export function bucketLabel(bucket: string): string {
  return bucket === R2_PRIVATE_BUCKET ? "private" : bucket === R2_PUBLIC_BUCKET ? "public" : bucket;
}

export function formatKeyClassTable(rules: readonly R2KeyClassRule[] = R2_KEY_CLASSES): string {
  const cell = (s: string) => s.replace(/\|/g, "\\|");
  const lines = [
    "| bucket | prefix | 区分 | 書き手 | 何のデータか |",
    "|---|---|---|---|---|",
  ];
  for (const r of rules) {
    const prefix = r.pattern ? `${r.prefix} (${r.pattern.source})` : r.prefix;
    const writer = r.writers.length ? `${r.origin}: ${r.writers.join(", ")}` : r.origin;
    lines.push(`| ${bucketLabel(r.bucket)} | ${cell(prefix)} | ${r.class} | ${cell(writer)} | ${cell(r.what)} |`);
  }
  return lines.join("\n");
}

function main(): void {
  const args = process.argv.slice(2);
  const only = args.includes("--bucket") ? args[args.indexOf("--bucket") + 1] : null;
  const rules = R2_KEY_CLASSES.filter((r) => !only || bucketLabel(r.bucket) === only);
  if (args.includes("--json")) {
    console.log(JSON.stringify(rules.map((r) => ({ ...r, pattern: r.pattern?.source ?? null })), null, 2));
    return;
  }
  console.log(formatKeyClassTable(rules));
  console.log(`\n${rules.length} 行。区分: regenerable=作り直せる / authoritative=R2 が唯一の正本。表に無い key は authoritative 扱い。`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
