/**
 * build-chart-display-units — 全ランキングの「図の表示単位」台帳を作る・確かめる。
 *
 * 台帳: data/metrics/display-units/ledger.json (形の契約は同じ場所の ledger.schema.json)
 * 規則: packages/data-configs/src/unit/chart-display-scale.ts (resolveChartDisplayScale)
 * 規約: .claude/rules/unit-semantics-standards.md §2.6
 *
 * 公開中の都道府県ランキング (KNOWN_RANKING_KEYS) ごとに、最新年の 47 県の最大・最小と、
 * 規則が選んだ表示単位・倍率・小数桁を残す。図 (ブログ・note・X・Instagram の型の画像) はこの規則で
 * 描くので、台帳を見れば「どの指標がどの単位で出るか」「読めない指標が残っていないか」が分かる。
 *
 *   npx tsx packages/data-configs/scripts/build-chart-display-units.ts            # R2 の値を読んで作り直す (週次 weekly:audits)
 *   npx tsx packages/data-configs/scripts/build-chart-display-units.ts --offline  # 残した最大・最小から規則だけ当て直す (規則を変えたとき)
 *   npx tsx packages/data-configs/scripts/build-chart-display-units.ts --check    # 台帳と今の設定・規則を照らす (PR・オフライン)
 *
 * --check が止めるもの (error):
 *   - 台帳の表示単位が、残した最大・最小から規則で求め直した結果と違う (規則を変えたのに --offline で当て直していない)
 *   - 解釈できない単位で 6 桁以上の指標が、台帳の baseline より増えた (縮小専用)
 * 警告にとどめるもの (週次の作り直しで埋まる。R2 の値が出る前の PR を止めない):
 *   - 公開中なのに台帳に無い指標 / 台帳の単位が指標定義の単位と違う (単位を直して再取り込み待ち)
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { SITE } from "@stats47/types";

import { datasetPath } from "../../../config/datasets.mjs";
import { KNOWN_RANKING_KEYS } from "../../ranking/src/config/known-ranking-keys";
import { METRICS_REGISTRY } from "../src/registry";
import { resolveChartDisplayScale, type ChartDisplayScale } from "../src/unit/chart-display-scale";
import { auditAuthoredDisplay, type MetricDisplayInput } from "../src/unit/metric-display-scale";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
export const LEDGER_PATH = resolve(ROOT, datasetPath("metrics.display-units"));
const PUBLIC_BASE = process.env.R2_PUBLIC_FETCH_URL || SITE.r2PublicBaseUrl;
/** 一部の県だけの年は最新年として扱わない (都道府県ランキングとして成立する行数)。 */
const MIN_ROWS = 40;
/** これ以上の桁で解釈できない単位は「読めない図」の候補として数える。 */
const LARGE_FROM = 100_000;

export interface DisplayUnitRow {
  key: string;
  title: string;
  unit: string;
  year: string | null;
  count: number;
  max: number | null;
  min: number | null;
  /** 0 でない最小の絶対値 (0.1未満の判定に使う)。 */
  minNonZeroAbs: number | null;
  chartUnit: string;
  factor: number;
  decimals: number | null;
  reason: ChartDisplayScale["reason"] | "fetch-failed";
}
export interface DisplayUnitLedger {
  schemaVersion: 1;
  generatedAt: string;
  source: { values: string; rule: string };
  summary: {
    metrics: number;
    byReason: Record<string, number>;
    rescaled: number;
    /** 解釈できない単位で、最大値が 6 桁以上の指標 (縮小専用の baseline)。 */
    unparsedLarge: string[];
  };
  rows: DisplayUnitRow[];
}

function scaleFor(row: Pick<DisplayUnitRow, "unit" | "max" | "min" | "minNonZeroAbs">) {
  const values = [row.max, row.min, row.minNonZeroAbs].filter((v): v is number => v !== null);
  return resolveChartDisplayScale(row.unit, values);
}

async function readRow(key: string): Promise<DisplayUnitRow> {
  const metric = METRICS_REGISTRY[key];
  const base = { key, title: metric?.title ?? "", unit: metric?.unit ?? "" };
  try {
    const res = await fetch(`${PUBLIC_BASE}/app/ranking/${key}/values.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as { partitions?: { yearCode: string; values?: { value: unknown; unit?: string }[] }[] };
    const latest = (json.partitions ?? [])
      .filter((p) => (p.values ?? []).length >= MIN_ROWS)
      .sort((a, b) => String(b.yearCode).localeCompare(String(a.yearCode)))[0];
    const values = (latest?.values ?? []).map((v) => v.value).filter((v): v is number => typeof v === "number" && Number.isFinite(v));
    const nonZero = values.filter((v) => v !== 0).map(Math.abs);
    const row = {
      ...base,
      unit: latest?.values?.[0]?.unit ?? base.unit,
      year: latest?.yearCode ?? null,
      count: values.length,
      max: values.length ? Math.max(...values) : null,
      min: values.length ? Math.min(...values) : null,
      minNonZeroAbs: nonZero.length ? Math.min(...nonZero) : null,
    };
    const scale = scaleFor(row);
    return { ...row, chartUnit: scale.unit, factor: scale.factor, decimals: scale.decimals, reason: scale.reason };
  } catch {
    return { ...base, year: null, count: 0, max: null, min: null, minNonZeroAbs: null, chartUnit: base.unit, factor: 1, decimals: null, reason: "fetch-failed" };
  }
}

function summarize(rows: DisplayUnitRow[]): DisplayUnitLedger["summary"] {
  const byReason: Record<string, number> = {};
  for (const r of rows) byReason[r.reason] = (byReason[r.reason] ?? 0) + 1;
  return {
    metrics: rows.length,
    byReason,
    rescaled: byReason.rescaled ?? 0,
    unparsedLarge: rows
      .filter((r) => r.reason === "unparsed" && Math.max(Math.abs(r.max ?? 0), Math.abs(r.min ?? 0)) >= LARGE_FROM)
      .map((r) => r.key)
      .sort(),
  };
}

async function build(offline: boolean) {
  const rows: DisplayUnitRow[] = [];
  if (offline) {
    // 規則だけ当て直す。値は前回 R2 から読んだ最大・最小のまま
    const previous = JSON.parse(readFileSync(LEDGER_PATH, "utf8")) as DisplayUnitLedger;
    for (const row of previous.rows) {
      const scale = row.reason === "fetch-failed" || row.reason === "no-values" ? null : scaleFor(row);
      rows.push(scale ? { ...row, chartUnit: scale.unit, factor: scale.factor, decimals: scale.decimals, reason: scale.reason } : row);
    }
  } else {
    const queue = [...KNOWN_RANKING_KEYS].sort();
    await Promise.all(Array.from({ length: 12 }, async () => {
      for (let key = queue.shift(); key; key = queue.shift()) rows.push(await readRow(key));
    }));
  }
  rows.sort((a, b) => a.key.localeCompare(b.key));
  const failed = rows.filter((r) => r.reason === "fetch-failed");
  // 取得に失敗した行があれば台帳を書き換えない (古い台帳の方が正しい)
  if (failed.length) {
    console.error(`[display-units] 値を読めなかった指標 ${failed.length} 件: ${failed.slice(0, 5).map((r) => r.key).join(", ")}…。台帳は更新しない`);
    process.exit(1);
  }
  const ledger: DisplayUnitLedger = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    source: { values: "R2 app/ranking/<key>/values.json (最新年・40 県以上)", rule: "packages/data-configs/src/unit/chart-display-scale.ts" },
    summary: summarize(rows),
    rows,
  };
  mkdirSync(dirname(LEDGER_PATH), { recursive: true });
  // 1 指標 1 行 (差分で指標ごとの変化が読める。整形すると 2,000 行超で 800KB を超える)
  const { rows: ledgerRows, ...head } = ledger;
  const headJson = JSON.stringify(head, null, 2).replace(/\n}$/, "");
  writeFileSync(LEDGER_PATH, `${headJson},\n  "rows": [\n${ledgerRows.map((r) => "    " + JSON.stringify(r)).join(",\n")}\n  ]\n}\n`);
  console.log(`[display-units] ${rows.length} 指標 / 単位を寄せる ${ledger.summary.rescaled} / 内訳 ${JSON.stringify(ledger.summary.byReason)} / 読めない単位で 6 桁以上 ${ledger.summary.unparsedLarge.length}`);
}

/** 台帳と今の設定・規則を照らす。errors は止める食い違い、warnings は週次の作り直しで埋まるもの。 */
export function checkLedger(ledger: DisplayUnitLedger, activeKeys: Iterable<string>, unitOf: (key: string) => string | undefined): { errors: string[]; warnings: string[] } {
  const errors: string[] = [], warnings: string[] = [];
  const byKey = new Map(ledger.rows.map((r) => [r.key, r]));
  for (const key of activeKeys) {
    const row = byKey.get(key);
    if (!row) { warnings.push(`[missing] ${key}: 公開中なのに台帳に無い`); continue; }
    const unit = unitOf(key);
    if (unit !== undefined && unit !== row.unit && row.reason !== "fetch-failed")
      warnings.push(`[unit-changed] ${key}: 台帳の単位「${row.unit}」と指標定義の「${unit}」が違う`);
    const scale = scaleFor(row);
    if (scale.unit !== row.chartUnit || scale.factor !== row.factor || scale.decimals !== row.decimals)
      errors.push(`[rule-changed] ${key}: 規則で求め直すと ${scale.unit} (×${scale.factor}) で、台帳は ${row.chartUnit} (×${row.factor})`);
  }
  const now = summarize(ledger.rows).unparsedLarge;
  const added = now.filter((k) => !ledger.summary.unparsedLarge.includes(k));
  if (added.length) errors.push(`[unparsed-large] 解釈できない単位で 6 桁以上の指標が増えた: ${added.join(", ")}。単位の語彙を足すか単位を直す`);
  return { errors, warnings };
}

/**
 * 指標の定義が書いた表示単位 (`display.displayUnit`) を、台帳の最新年の最大・最小に照らす。
 * 台帳に値がまだ無い指標 (未公開・港湾別) は検査しない。問題は「[種類] キー: …」で返す。
 */
export function checkAuthoredDisplays(ledger: DisplayUnitLedger, metrics: Iterable<MetricDisplayInput & { key: string }>): string[] {
  const byKey = new Map(ledger.rows.map((r) => [r.key, r]));
  const errors: string[] = [];
  for (const metric of metrics) {
    const row = byKey.get(metric.key);
    if (!metric.display?.displayUnit || !row || row.max === null) continue;
    // 単位を直して再取り込みを待つ指標は、台帳の最大・最小が古い単位の値なので照らさない ([unit-changed] の警告が出る)
    if ((metric.unit ?? "") !== row.unit) continue;
    const problems = auditAuthoredDisplay(metric, {
      max: Math.max(Math.abs(row.max), Math.abs(row.min ?? 0)), minNonZeroAbs: row.minNonZeroAbs,
      ruleFactor: row.factor, ruleDecimals: row.decimals, ruleRescales: row.reason === "rescaled",
    });
    for (const problem of problems) errors.push(problem.replace(/^(\[[a-z-]+\]) /, `$1 ${metric.key}: `));
  }
  return errors.sort();
}

async function main() {
  if (!process.argv.includes("--check")) return build(process.argv.includes("--offline"));
  const ledger = JSON.parse(readFileSync(LEDGER_PATH, "utf8")) as DisplayUnitLedger;
  // 台帳の行と設定の単位を照らす。単位は配信値の単位 (values.json) を正とするが、定義側を直したら作り直す合図にする
  const { errors, warnings } = checkLedger(ledger, KNOWN_RANKING_KEYS, (key) => METRICS_REGISTRY[key]?.unit);
  if (warnings.length) {
    console.warn(`[display-units] 週次の作り直し (npm run weekly:audits の display-units) で埋まる差 ${warnings.length} 件:`);
    for (const w of warnings.slice(0, 10)) console.warn("  " + w);
  }
  if (errors.length) {
    console.error(`[display-units] 台帳が規則と食い違う ${errors.length} 件 (規則を変えたなら --offline で当て直す):`);
    for (const e of errors.slice(0, 30)) console.error("  " + e);
    process.exit(1);
  }
  const displayErrors = checkAuthoredDisplays(ledger, Object.values(METRICS_REGISTRY));
  if (displayErrors.length) {
    console.error(`[display-units] 指標の定義の表示単位 (display) が最新年の値に合わない ${displayErrors.length} 件 (その指標の定義の display を直す):`);
    for (const e of displayErrors) console.error("  " + e);
    process.exit(1);
  }
  console.log(`[display-units] ✓ 台帳 ${ledger.rows.length} 指標と設定・規則が一致`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) void main();
