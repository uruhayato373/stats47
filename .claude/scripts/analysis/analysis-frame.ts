#!/usr/bin/env tsx
/**
 * 市区町村の分析用の表を組み立て、計算の前の検査を通す。
 *
 *   npx tsx .claude/scripts/analysis/analysis-frame.ts --spec .claude/scripts/analysis/examples/h01-vacancy.json
 *   npx tsx .claude/scripts/analysis/analysis-frame.ts --spec <spec> --out /tmp/frame.json --data-dir <dir>
 *
 * 公開の R2 を読む。素の fetch が通らない環境では <key>.cities.json / <key>.values.json を
 * --data-dir に置くとそちらを読む。合計が県と合わなければ exit 1。判定は analysis-frame-core.mjs。
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { buildMunicipalityEntityPolicy, listPublishableMunicipalities } from "@stats47/area";

import { R2_PUBLIC_BASE_URL } from "../lib/site-config.cjs";
import { buildFrame, checkCoverage, checkReliability, checkTotal, checkYears, columnOf, indexRows, latestYear, summarize } from "./analysis-frame-core.mjs";

interface SpecMetric {
  alias: string;
  key: string;
  /** 省くと最新年 */
  years?: number[];
  /** 実数の指標だけ県の合計と比べる (率は足せない) */
  total?: boolean;
}
interface Spec {
  question: string;
  metrics: SpecMetric[];
  /** 抜けた町を比べる列 `別名_年` */
  compareColumn?: string;
  /** 変化を見る 3 時点 */
  reliability?: Array<{ alias: string; years: number[] }>;
}

const arg = (name: string) => {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
const specPath = arg("--spec");
if (!specPath) {
  console.error("--spec <file> が要る");
  process.exit(2);
}
const spec: Spec = JSON.parse(readFileSync(specPath, "utf8"));
const dataDir = arg("--data-dir");
const R2_BASE = process.env.R2_PUBLIC_FETCH_URL || R2_PUBLIC_BASE_URL;

async function readRows(key: string, file: "cities" | "values"): Promise<Array<Record<string, unknown>> | null> {
  const local = dataDir ? join(dataDir, `${key}.${file}.json`) : null;
  if (local && existsSync(local)) return JSON.parse(readFileSync(local, "utf8")).rows;
  if (dataDir) return null;
  const res = await fetch(`${R2_BASE}/app/stats/${key}/${file}.json`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`${key}/${file}: HTTP ${res.status}`);
  return (await res.json()).rows;
}

const entities = listPublishableMunicipalities(buildMunicipalityEntityPolicy()).map((e) => ({ code: e.code, name: e.name }));

async function main() {
  const metrics = await Promise.all(
    spec.metrics.map(async (metric) => {
      const rows = await readRows(metric.key, "cities");
      if (!rows) throw new Error(`市区町村の値が無い: ${metric.key}`);
      const prefectureRows = metric.total ? await readRows(metric.key, "values") : null;
      return { ...metric, rows, prefectureRows };
    }),
  );

  const frame = buildFrame({ entities, metrics });
  const totals = metrics
    .filter((m) => m.total)
    .flatMap((m) => (m.years?.map(String) ?? [latestYear(indexRows(m.rows))]).map((year) => checkTotal({ alias: m.alias, year, rows: m.rows, entities, prefectureRows: m.prefectureRows })));
  const years = checkYears(frame);
  const coverage = checkCoverage(frame, { required: frame.columns.map((c) => c.column), compareColumn: spec.compareColumn ?? null });
  const reliability = (spec.reliability ?? []).map((r) => checkReliability(frame, { alias: r.alias, years: r.years.map(String) }));
  const summary = summarize({ totals, years, coverage, reliability });

  console.log(`# ${spec.question}\n`);
  console.log(`表: ${frame.rows.length} 自治体 × ${frame.columns.length} 列 (${frame.columns.map((c) => columnOf(c.alias, c.year)).join(", ")})`);
  console.log(`年: ${JSON.stringify(years.latestByAlias)}`);
  for (const t of totals) console.log(`合計 ${t.alias} ${t.year}: 全行 ${t.allRows} / 公開の自治体 ${t.entitySum} / 県 ${t.reference ?? "なし"} [${t.status}]`);
  console.log(`そろう自治体: ${coverage.kept} / ${coverage.total} (${(coverage.share * 100).toFixed(1)}%)`);
  if (spec.compareColumn) console.log(`  ${spec.compareColumn} の中央値: そろう ${coverage.keptMedian} / 抜けた ${coverage.droppedMedian}`);
  for (const r of reliability) console.log(`変化の信頼性 ${r.alias} ${r.years.join("→")}: r=${r.r?.toFixed(2)} n=${r.n} [${r.status}]`);
  for (const w of summary.warnings) console.log(`! ${w}`);
  for (const b of summary.blockers) console.error(`✗ ${b}`);
  console.log(summary.ok ? "✓ 検査を通過。結論の前に、定義の循環と指標の意味を人が読むこと" : "✗ 合計が合わない。計算に進まない");

  const out = arg("--out");
  if (out) {
    writeFileSync(out, `${JSON.stringify({ question: spec.question, columns: frame.columns, rows: coverage.rows, droppedRows: frame.rows.filter((row) => !coverage.rows.includes(row)), report: { totals, years, coverage: { ...coverage, rows: undefined }, reliability, summary } }, null, 2)}\n`);
    console.log(`→ ${out}`);
  }
  process.exit(summary.ok ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(2);
});
