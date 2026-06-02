/**
 * SSDS 出典マッピング生成器。
 *
 * 入力:
 *   - src/ssds/cdcat01-sources.generated.json … cdCat01 → {kind, sources[](原典名), formula?}
 *     (extract-ssds-sources.py が公式 Excel から生成)
 *   - src/ssds/source-name-to-survey.ts        … 原典名 → survey id 正規化辞書
 *
 * 出力:
 *   - src/ssds/ssds-provenance.generated.json  … cdCat01 → { kind, originalSurveys: [{id,name}] }
 *     (アプリ/exporter が読む最終形。2 階層出典モデルの「原典」側)
 *
 * 併せて、metrics ディレクトリを走査して SSDS metric の原典解決カバレッジを stdout に報告する。
 *
 * 実行:
 *   cd packages/data-configs && npx tsx scripts/ssds/build-ssds-provenance.ts
 */

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  CDCAT01_SOURCE_OVERRIDE,
  KNOWN_SOURCE_TO_SURVEY,
  PROPOSED_NEW_SURVEYS,
} from "../../src/ssds/source-name-to-survey";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SSDS_DIR = join(__dirname, "../../src/ssds");
const METRICS_DIR = join(__dirname, "../../src/metrics");

type RawEntry = { kind: "base" | "indicator"; sources: string[]; formula?: string };
type Survey = { id: string; name: string };
type ProvenanceEntry = { kind: "base" | "indicator"; originalSurveys: Survey[] };

/** 辞書未登録の原典名を決定的に auto survey へ。formal なマスタ化は後追い。 */
function autoSlug(name: string): string {
  return `ssds-src:${name}`;
}

function resolveSurvey(sourceName: string): Survey {
  const known = KNOWN_SOURCE_TO_SURVEY[sourceName];
  if (known) return { id: known, name: sourceName };
  const proposed = PROPOSED_NEW_SURVEYS[sourceName];
  if (proposed) return { id: proposed.id, name: proposed.name };
  return { id: autoSlug(sourceName), name: sourceName };
}

function dedupeSurveys(surveys: Survey[]): Survey[] {
  const seen = new Map<string, Survey>();
  for (const s of surveys) if (!seen.has(s.id)) seen.set(s.id, s);
  return [...seen.values()];
}

function main(): void {
  const raw: Record<string, RawEntry> = JSON.parse(
    readFileSync(join(SSDS_DIR, "cdcat01-sources.generated.json"), "utf-8"),
  );

  // 1) cdCat01 → 原典 survey[] の最終マップ
  //    Excel に資料源が無い派生項目は CDCAT01_SOURCE_OVERRIDE で補完する。
  const provenance: Record<string, ProvenanceEntry> = {};
  const codes = new Set([
    ...Object.keys(raw),
    ...Object.keys(CDCAT01_SOURCE_OVERRIDE),
  ]);
  for (const code of codes) {
    const entry = raw[code];
    const override = CDCAT01_SOURCE_OVERRIDE[code];
    const sourceNames =
      override ?? entry?.sources ?? [];
    const surveys = dedupeSurveys(sourceNames.map(resolveSurvey));
    provenance[code] = { kind: entry?.kind ?? "indicator", originalSurveys: surveys };
  }
  writeFileSync(
    join(SSDS_DIR, "ssds-provenance.generated.json"),
    JSON.stringify(provenance, null, 0),
    "utf-8",
  );

  // 2) SSDS metric のカバレッジ報告 (metric ファイルを走査)
  const files = readdirSync(METRICS_DIR).filter((f) => f.endsWith(".ts"));
  let ssdsCount = 0;
  let resolvedCount = 0;
  let autoOnlyCount = 0; // 辞書ヒットゼロ (auto-slug のみ)
  const unresolved: string[] = [];
  for (const f of files) {
    const txt = readFileSync(join(METRICS_DIR, f), "utf-8");
    if (!txt.includes("社会・人口統計体系")) continue;
    ssdsCount++;
    const key = /"key"\s*:\s*"([^"]+)"/.exec(txt)?.[1] ?? f;
    const code = /"cdCat01"\s*:\s*"([^"]+)"/.exec(txt)?.[1];
    if (!code || !provenance[code]) {
      unresolved.push(`${key} (cdCat01=${code ?? "none"})`);
      continue;
    }
    const surveys = provenance[code].originalSurveys;
    if (surveys.length === 0) {
      unresolved.push(`${key} (${code}: 原典0)`);
      continue;
    }
    resolvedCount++;
    const anyKnown = surveys.some(
      (s) => !s.id.startsWith("ssds-src:"),
    );
    if (!anyKnown) autoOnlyCount++;
  }

  const pct = (n: number) => ((n / ssdsCount) * 100).toFixed(1);
  console.log(`cdCat01 provenance entries: ${Object.keys(provenance).length}`);
  console.log(`SSDS metrics: ${ssdsCount}`);
  console.log(`  原典解決済: ${resolvedCount} (${pct(resolvedCount)}%)`);
  console.log(`  うち辞書ヒットあり: ${resolvedCount - autoOnlyCount} (${pct(resolvedCount - autoOnlyCount)}%)`);
  console.log(`  うち auto-slug のみ(辞書追記候補): ${autoOnlyCount} (${pct(autoOnlyCount)}%)`);
  console.log(`  未解決(cdCat01がExcelに無い等): ${unresolved.length}`);
  if (unresolved.length) {
    console.log("  --- 未解決 metric ---");
    for (const u of unresolved.slice(0, 20)) console.log(`    ${u}`);
  }
}

main();
