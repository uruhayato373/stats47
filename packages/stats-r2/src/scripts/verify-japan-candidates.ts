/**
 * GEO-SCOPE-SEPARATION-01 WP6 — official 候補 (行の存在=hasNational:true) を値レベルで
 * 一次資料照合し、実際に採用できるものだけを選別する。
 *
 * WP0 で「00000 行はあるが全時点で value='-'」という誤判定リスクが実際に 1 件見つかった
 * (in-pref-university-entrance-ratio-by-highschool-origin)。行の存在だけで official 認定
 * しないため、候補ごとに `generateOneMetric()` (実際の生成コアと同一ロジック) を実行し、
 * `buildJapanSeriesRows` が実際に ≥1 件の有効な年を返すかで判定する。
 *
 * 入力: packages/data-configs/scripts/classify-japan-candidates.ts の出力 (JSON, stdin または --input)。
 * 出力: 検証済み分類 (verified-official / verified-unsupported / fetch-error) の JSON を stdout へ。
 *
 * ★write はしない (検証専用)。artifact の実書き込みは検証 OK 分だけ別途 `--write` runner で行う。
 * ★e-Stat への負荷を抑えるため、statsDataId ごとに逐次実行し軽い wait を挟む。
 *
 * Usage:
 *   npx tsx packages/stats-r2/src/scripts/verify-japan-candidates.ts --input <classification.json>
 */
import { readFileSync } from "node:fs";

import { generateOneMetric } from "./generate-japan-series";

interface ClassificationEntry {
  themeKey: string;
  metricKey: string;
  classification: string;
}

interface ClassificationFile {
  results: ClassificationEntry[];
}

function parseArgs() {
  const argv = process.argv.slice(2);
  const out: { input?: string; limit?: number } = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--input") out.input = argv[++i];
    if (argv[i] === "--limit") out.limit = Number(argv[++i]);
  }
  return out;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const args = parseArgs();
  if (!args.input) {
    console.error("使い方: --input <classify-japan-candidates.tsの出力json> [--limit N]");
    process.exit(1);
  }
  const file = JSON.parse(readFileSync(args.input, "utf8")) as ClassificationFile;
  const candidates = file.results.filter((r) => r.classification === "official-candidate");
  const targets = args.limit ? candidates.slice(0, args.limit) : candidates;

  console.error(`[verify] ${targets.length} / ${candidates.length} 候補を値レベル検証します`);

  const verified: Array<{
    themeKey: string;
    metricKey: string;
    verdict: "verified-official" | "verified-unsupported" | "fetch-error";
    detail: string;
  }> = [];

  let i = 0;
  for (const c of targets) {
    i += 1;
    process.stderr.write(`[${i}/${targets.length}] ${c.metricKey} ... `);
    try {
      const result = await generateOneMetric(c.metricKey, { write: false });
      if (result.ok) {
        verified.push({
          themeKey: c.themeKey,
          metricKey: c.metricKey,
          verdict: "verified-official",
          detail: `rows=${result.rows} range=${result.rangeFrom}..${result.rangeTo} latest=${result.latestValue}${result.latestUnit}`,
        });
        process.stderr.write(`OK (latest ${result.rangeTo}=${result.latestValue}${result.latestUnit})\n`);
      } else {
        verified.push({
          themeKey: c.themeKey,
          metricKey: c.metricKey,
          verdict: "verified-unsupported",
          detail: result.reason,
        });
        process.stderr.write(`UNSUPPORTED (${result.reason})\n`);
      }
    } catch (e) {
      verified.push({
        themeKey: c.themeKey,
        metricKey: c.metricKey,
        verdict: "fetch-error",
        detail: e instanceof Error ? e.message : String(e),
      });
      process.stderr.write(`ERROR (${e instanceof Error ? e.message : String(e)})\n`);
    }
    // e-Stat への負荷を抑える軽い wait (連続 API 呼び出しの礼儀)
    await sleep(300);
  }

  const summary = {
    total: verified.length,
    "verified-official": verified.filter((v) => v.verdict === "verified-official").length,
    "verified-unsupported": verified.filter((v) => v.verdict === "verified-unsupported").length,
    "fetch-error": verified.filter((v) => v.verdict === "fetch-error").length,
  };
  console.error(`[verify] summary: ${JSON.stringify(summary)}`);
  console.log(JSON.stringify({ summary, verified }, null, 2));
}

import { pathToFileURL } from "node:url";
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
