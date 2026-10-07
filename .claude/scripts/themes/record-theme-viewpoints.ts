/**
 * 指標を選ぶ視点の該当件数を週ごとに `data/themes/viewpoint-history.csv` へ記録する。
 *
 * 管理画面 `/quality/theme-viewpoints` は今の件数しか出さない。テーマを直したぶん件数が減っているかを
 * 見るため、週次のテーマ監査 (`run-theme-portfolio-audit.sh`) がこれを呼び、同じ週の行は上書きする
 * (1 週 1 規則 1 行)。判定は data-configs の selection-viewpoints.ts を使い、ここでは数を書くだけ。
 *
 *   node --import tsx .claude/scripts/themes/record-theme-viewpoints.ts [--date YYYY-MM-DD]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { METRICS_REGISTRY } from "../../../packages/data-configs/src/registry";
import { THEME_CATALOGS } from "../../../packages/data-configs/src/theme-catalog/index";
import {
  evaluateSelectionViewpoints,
  MACHINE_VIEWPOINT_IDS,
} from "../../../packages/data-configs/src/theme-catalog/selection-viewpoints";
import { datasetDir } from "../../../config/datasets.mjs";
import { isoWeekOf } from "../lib/effect-verdict/iso-week.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
export const VIEWPOINT_HISTORY_FILE = "viewpoint-history.csv";
const HEADER = "week,rule,hits,themes";

export interface ViewpointHistoryRow {
  week: string;
  rule: string;
  hits: number;
  themes: number;
}

/** 既存の行のうち同じ週を捨てて新しい行に置き換え、週・規則の順に並べる。 */
export function mergeViewpointHistory(
  existing: readonly ViewpointHistoryRow[],
  next: readonly ViewpointHistoryRow[],
): ViewpointHistoryRow[] {
  const weeks = new Set(next.map((r) => r.week));
  return [...existing.filter((r) => !weeks.has(r.week)), ...next].sort(
    (a, b) => a.week.localeCompare(b.week) || a.rule.localeCompare(b.rule),
  );
}

export function parseViewpointHistory(text: string): ViewpointHistoryRow[] {
  return text
    .trim()
    .split(/\r?\n/)
    .slice(1)
    .filter(Boolean)
    .map((line) => {
      const [week, rule, hits, themes] = line.split(",");
      return { week, rule, hits: Number(hits), themes: Number(themes) };
    });
}

function main(): void {
  const dateArg = process.argv.indexOf("--date");
  const date = dateArg >= 0 ? process.argv[dateArg + 1] : new Date().toISOString().slice(0, 10);
  const week = isoWeekOf(date);
  const evaluated = evaluateSelectionViewpoints(Object.values(THEME_CATALOGS), METRICS_REGISTRY);
  const rows = MACHINE_VIEWPOINT_IDS.map((rule) => ({
    week,
    rule,
    hits: evaluated[rule].length,
    themes: new Set(evaluated[rule].map((h) => h.themeKey)).size,
  }));

  const file = path.join(ROOT, datasetDir("themes.portfolio"), VIEWPOINT_HISTORY_FILE);
  const existing = fs.existsSync(file) ? parseViewpointHistory(fs.readFileSync(file, "utf8")) : [];
  const merged = mergeViewpointHistory(existing, rows);
  fs.writeFileSync(file, [HEADER, ...merged.map((r) => `${r.week},${r.rule},${r.hits},${r.themes}`)].join("\n") + "\n");
  console.log(`✎ ${path.relative(ROOT, file)} ${week}: ${rows.map((r) => `${r.rule}=${r.hits}`).join(" ")}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
