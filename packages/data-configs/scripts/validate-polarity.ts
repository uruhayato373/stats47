#!/usr/bin/env tsx
/**
 * 極性カタログ + 配色決定規則の決定的 lint。
 *
 * 検査:
 *   - error: METRIC_POLARITY / EXCLUDED_FROM_SEED の幽霊キー (registry に無い)
 *   - error: evidence / reason が空
 *   - error: 収載と除外の重複
 *   - error: カバレッジが MIN_POLARITY_COVERAGE を下回った (増加専用ラチェット)
 *   - error: 決定規則が語彙外の配色を返す metric
 *   - warn : 極性が未割当の metric 件数 (段階的に埋める。error 昇格の予定は下記)
 *
 * ★warn → error 昇格の予定: カバレッジが registry の 50% を超えたら
 *   「isActive:true かつ未割当」を error にする (2026-10 目安)。それまでは件数の可視化に留める
 *   — 2,295 件を一度に埋めると推測が混ざるため (正典: src/metric-polarity.ts の冒頭)。
 *
 * Usage: npx tsx packages/data-configs/scripts/validate-polarity.ts [--strict]
 */
import { isKnownColorScheme } from "@stats47/types";

import { resolveColorScheme } from "../src/color-scheme-policy";
import {
  EXCLUDED_FROM_SEED,
  METRIC_POLARITY,
  MIN_POLARITY_COVERAGE,
} from "../src/metric-polarity";
import { listAllMetrics } from "../src/registry";

const strict = process.argv.includes("--strict");

function main() {
  const all = listAllMetrics();
  const keys = new Set(all.map((m) => m.key));
  const errors: string[] = [];
  const warns: string[] = [];

  for (const key of Object.keys(METRIC_POLARITY)) {
    if (!keys.has(key)) {
      errors.push(`[ghost-key] METRIC_POLARITY の "${key}" は registry に存在しない (改名/削除)`);
    }
    if (METRIC_POLARITY[key].evidence.trim().length < 10) {
      errors.push(`[no-evidence] ${key}: evidence が空か短すぎる (推測の混入を防ぐため必須)`);
    }
  }

  for (const e of EXCLUDED_FROM_SEED) {
    if (!keys.has(e.key)) {
      errors.push(`[ghost-key] EXCLUDED_FROM_SEED の "${e.key}" は registry に存在しない`);
    }
    if (e.reason.trim().length < 10) {
      errors.push(`[no-reason] ${e.key}: 除外理由が空か短すぎる`);
    }
    if (e.key in METRIC_POLARITY) {
      errors.push(`[duplicate] ${e.key}: 収載と除外の両方にある`);
    }
  }

  const coverage = Object.keys(METRIC_POLARITY).length;
  if (coverage < MIN_POLARITY_COVERAGE) {
    errors.push(
      `[coverage-ratchet] 極性の収載が ${coverage} 件に減った (床 ${MIN_POLARITY_COVERAGE})。` +
        `減らす変更は原則しない。意図的に減らすなら MIN_POLARITY_COVERAGE も下げる理由を書く`,
    );
  }

  const byReason = new Map<string, number>();
  for (const m of all) {
    const d = resolveColorScheme({
      key: m.key,
      explicit: m.visualization?.colorScheme,
      colorSchemeType: m.visualization?.colorSchemeType,
      category: m.category,
    });
    byReason.set(d.reason, (byReason.get(d.reason) ?? 0) + 1);
    if (!isKnownColorScheme(d.scheme)) {
      errors.push(`[unknown-scheme] ${m.key}: 決定規則が語彙外の "${d.scheme}" を返した`);
    }
  }

  const unassigned = all.filter((m) => !(m.key in METRIC_POLARITY)).length;
  warns.push(`[polarity-unassigned] 極性 未割当 ${unassigned} 件 / 収載 ${coverage} 件`);

  const reasons = [...byReason].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}=${v}`).join(" ");
  console.log(`polarity 検証: ${all.length} metrics / error ${errors.length} / warn ${warns.length}`);
  console.log(`  配色の決定内訳: ${reasons}`);
  for (const w of warns) console.log(`  ⚠️  ${w}`);
  for (const e of errors) console.error(`  ✗ ${e}`);

  if (errors.length > 0 || (strict && warns.length > 0)) process.exit(1);
  console.log("✅ polarity 検証: error なし");
}

main();
