#!/usr/bin/env node
/**
 * check-active-r2-coverage.mjs — 「isActive:true なのに R2 に配信 snapshot が無い」公開漏れ検出
 *
 * 2026-07-03 運営総点検の逆方向突合 (順方向 = ranking-key-consistency.test.ts の
 * 「GONE なのに生きている」検出に対し、こちらは「生きているはずなのに配信物が無い」を検出する)。
 * isActive:true + KNOWN 登録済みのキーは本番で 200 を返す前提だが、R2 の
 * `app/ranking/<key>/item.json` が無いと page は notFound になる (多段公開パイプラインの取りこぼし。
 * 正典: .claude/rules/metric-config-standards.md「isActive:true ≠ 本番公開」)。
 *
 * Usage:
 *   node .claude/scripts/ranking/check-active-r2-coverage.mjs            # KNOWN∩isActive 全キーを HEAD 実測
 *   node .claude/scripts/ranking/check-active-r2-coverage.mjs --limit 100
 *
 * exit code: 欠落 >0 で 1 (週次 CI が Issue 起票に使う) / 0 = 欠落なし
 * 配線: .github/workflows/agent-consistency-weekly.yml
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");
const R2_PUBLIC = process.env.R2_PUBLIC_FETCH_URL || "https://storage.stats47.jp";

const args = process.argv.slice(2);
const getArg = (flag, fb) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fb;
};

const extractQuotedKeys = (filePath) => {
  const src = fs.readFileSync(filePath, "utf8");
  return new Set([...src.matchAll(/^\s*"([^"]+)",?\s*$/gm)].map((m) => m[1]));
};

const known = extractQuotedKeys(
  path.join(PROJECT_ROOT, "packages/ranking/src/config/known-ranking-keys.ts"),
);
const gone = extractQuotedKeys(
  path.join(PROJECT_ROOT, "apps/web/src/config/gone-ranking-keys.ts"),
);

// metric config の isActive:true キー
const metricsDir = path.join(PROJECT_ROOT, "packages/data-configs/src/metrics");
const active = new Set();
for (const f of fs.readdirSync(metricsDir)) {
  if (!f.endsWith(".ts")) continue;
  const src = fs.readFileSync(path.join(metricsDir, f), "utf8");
  const key = src.match(/"key":\s*"([^"]+)"/) ?? src.match(/key:\s*['"]([^'"]+)['"]/);
  if (key && /["']?isActive["']?\s*:\s*true/.test(src)) active.add(key[1]);
}

// 検査対象 = 「本番で 200 を返すべき」キー (KNOWN ∩ isActive、GONE 除外)
const targets = [...known].filter((k) => active.has(k) && !gone.has(k)).sort();
const limit = parseInt(getArg("--limit", "0"), 10);
const list = limit > 0 ? targets.slice(0, limit) : targets;
console.error(`[check] KNOWN∩isActive∖GONE = ${targets.length} keys (実測 ${list.length})`);

const missing = [];
const CONC = 16;
let idx = 0;
async function worker() {
  while (idx < list.length) {
    const key = list[idx++];
    try {
      const res = await fetch(`${R2_PUBLIC}/app/ranking/${key}/item.json`, {
        method: "HEAD",
        signal: AbortSignal.timeout(15_000),
      });
      if (res.status !== 200) missing.push({ key, status: res.status });
    } catch {
      missing.push({ key, status: 0 });
    }
    if (idx % 200 === 0) process.stderr.write(`  probed ${idx}/${list.length}\r`);
  }
}
await Promise.all(Array.from({ length: CONC }, worker));
process.stderr.write("\n");

if (missing.length === 0) {
  console.log(`✓ active-r2-coverage: ${list.length} キーすべて R2 item.json あり (公開漏れなし)`);
  process.exit(0);
}
console.log(`✖ active-r2-coverage: ${missing.length} キーが isActive:true+KNOWN なのに R2 item.json 欠落:`);
for (const m of missing.slice(0, 50)) {
  console.log(`  - ${m.key} (HTTP ${m.status})`);
}
if (missing.length > 50) console.log(`  … 他 ${missing.length - 50} 件`);
console.log(
  "\n対処: /page-data-batch --metric <key> + generate-ranking-items で R2 反映するか、" +
    "廃止なら isActive:false + KNOWN 再生成 + GONE 追加。",
);
process.exit(1);
