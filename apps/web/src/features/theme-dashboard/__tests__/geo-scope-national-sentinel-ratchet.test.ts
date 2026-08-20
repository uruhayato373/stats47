import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * `selectedPrefectureCode ?? "00000"` (legacy sentinel) の縮小専用ラチェット
 * (GEO-SCOPE-SEPARATION-01 WP1 §7 step 4)。
 *
 * ★このパターンは「未選択 (prefecture-set)」を e-Stat の全国コード "00000" に
 *   変換し、そのまま fetch action へ渡す (doc 43 §2 の中核欠陥)。2026-08-20 時点で
 *   `ThemeMetricsDashboard.tsx` / `MetricFocusCharts.tsx` の 2 箇所に存在した。
 *
 * ★WP2 (2026-08-20) で `MetricFocusCharts.tsx` はこのパターンを撤去した
 *   (未選択時は fetch 自体を行わない)。残る 1 箇所
 *   (`ThemeMetricsDashboard.tsx` の `pageComponentsAreaCode`) は KPI タイルの
 *   「平均を代表値として見せる」経路とは別物で、page_components チャート
 *   (`ThemeDbChartRenderer`) が `selectNationalSeries` 経由で official/average を
 *   正しく出し分ける既存の健全な実装。この 1 箇所は意図的に残す
 *   (BASELINE=1 はこの 1 箇所だけを許容する値。0 への削減は
 *   ThemeDbChartRenderer 経路自体を作り直す別作業になる)。
 *
 * 新規混入 (BASELINE を超える増加) は禁止。
 */

const THEME_DASHBOARD_DIR = path.resolve(__dirname, "..");
const PATTERN = /\?\?\s*["']00000["']/g;

/** 現在の既知件数 (page_components チャート経路の意図的な 1 件のみ)。増やす変更は禁止。 */
const BASELINE = 1;

function walkTsxFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "__tests__" || entry.name === "node_modules") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkTsxFiles(full));
    } else if (/\.(ts|tsx)$/.test(entry.name) && statSync(full).isFile()) {
      out.push(full);
    }
  }
  return out;
}

describe("legacy '?? \"00000\"' sentinel ratchet", () => {
  it("theme-dashboard feature 内の出現数が BASELINE を超えない", () => {
    const files = walkTsxFiles(THEME_DASHBOARD_DIR);
    // 検査そのものが空振りしていないことを確認する (feature 配下のファイルが 0 件なら無意味)
    expect(files.length).toBeGreaterThan(0);

    const hits: { file: string; count: number }[] = [];
    for (const file of files) {
      const content = readFileSync(file, "utf8");
      const matches = content.match(PATTERN);
      if (matches && matches.length > 0) {
        hits.push({ file: path.relative(THEME_DASHBOARD_DIR, file), count: matches.length });
      }
    }
    const total = hits.reduce((acc, h) => acc + h.count, 0);

    // 増加は禁止 (== ではなく <= で、WP2 の削減を歓迎しつつ新規混入だけを止める)
    expect(total, `検出箇所: ${JSON.stringify(hits)}`).toBeLessThanOrEqual(BASELINE);
  });
});
