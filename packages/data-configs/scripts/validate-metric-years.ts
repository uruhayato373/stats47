/**
 * validate-metric-years — metric config の years が 4 桁年に正規化されているか検証する lint。
 *
 * 背景: e-Stat の @time は 10 桁のフルタイムコード (例 "2009100000")。これを config.years や
 * R2 yearCode にそのまま入れると「年フィルタが 0 件」「年セレクタにフルコード表示」等の不具合が
 * 再発する (詳細: .claude/rules/estat-api.md / packages/estat-api/.../extract-year-code.ts)。
 *
 * 本 lint は config.years に 4 桁年 (1900-2100) 以外が混入したら fail する。
 * 新規 metric 量産・編集後、CI / pre-commit / data-ingester agent から実行する。
 *
 * 使い方:
 *   npx tsx packages/data-configs/scripts/validate-metric-years.ts
 *   → 違反ゼロで exit 0、違反ありで一覧表示して exit 1
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const METRICS_DIR = resolve(__dirname, "../src/metrics");

const MIN_YEAR = 1900;
const MAX_YEAR = 2100;

interface Violation {
  file: string;
  bad: number[];
}

function main() {
  const files = readdirSync(METRICS_DIR).filter(
    (f) => f.endsWith(".ts") && f !== "index.ts",
  );
  const violations: Violation[] = [];

  for (const f of files) {
    const text = readFileSync(join(METRICS_DIR, f), "utf8");
    // "years": { ... } ブロックだけを対象 (statsDataId 等を誤検出しない)
    const m = text.match(/"years":\s*\{([^}]*)\}/s);
    if (!m) continue;
    const nums = (m[1].match(/\d+/g) ?? []).map(Number);
    const bad = nums.filter((n) => n < MIN_YEAR || n > MAX_YEAR);
    if (bad.length > 0) violations.push({ file: f.replace(".ts", ""), bad });
  }

  if (violations.length === 0) {
    console.log(`✅ metric years 検証: 違反なし (${files.length} configs)`);
    process.exit(0);
  }

  console.error(
    `❌ metric years 検証: ${violations.length} 件にフルタイムコード/不正年が混入\n` +
      "   config.years は 4 桁年 (例 2009) を使うこと。フルコード (2009100000) は禁止。\n" +
      "   修正: 各 year を先頭 4 桁に。規約: .claude/rules/estat-api.md\n",
  );
  for (const v of violations.slice(0, 50)) {
    console.error(`  ${v.file}: ${v.bad.slice(0, 6).join(", ")}${v.bad.length > 6 ? " …" : ""}`);
  }
  if (violations.length > 50) console.error(`  … 他 ${violations.length - 50} 件`);
  process.exit(1);
}

main();
