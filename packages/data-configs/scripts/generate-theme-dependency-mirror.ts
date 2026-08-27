#!/usr/bin/env -S npx tsx
/**
 * テーマ chart の期待依存集合 (正典 TS) から、素の node 用の JSON 鏡を **生成** する。
 * (CROSS-PAGE-DATA-SSOT-01 WP4 residual)
 *
 * ## なぜ生成にするか
 *
 * live 監査 `.claude/scripts/audit/theme-chart-live-audit.mjs` は素の `node` で走るため
 * TS collector を import できない。一方、期待依存集合 (どの R2 metric を読むか、移行中だけ
 * 残る移行前互換 e-Stat request は何か) の正典は
 * `packages/data-configs/src/theme-catalog/chart-dependencies.ts` (TS)。
 *
 * 両者に同じ集合が要るが、監査側で独自抽出すると集合がずれる (旧監査は 130 request しか
 * 見ておらず、pyramid の 34 と composition/donut の展開が期待集合から漏れていた)。
 * ここで正典から機械生成し `--check` で差分を検出する
 * (unit-semantics の TS 正典 → .mjs 鏡と同じ二層 SSOT)。
 *
 * Usage:
 *   npx tsx packages/data-configs/scripts/generate-theme-dependency-mirror.ts
 *   npx tsx packages/data-configs/scripts/generate-theme-dependency-mirror.ts --check
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { buildThemeDependencyMirror } from "../src/theme-catalog/chart-dependencies";
import { THEME_CATALOGS } from "../src/theme-catalog/index";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "../../..");
const OUT = resolve(REPO_ROOT, ".claude/scripts/audit/theme-chart-dependencies.generated.json");

/** 決定的にシリアライズする (末尾改行つき)。 */
function serialize(): string {
  const mirror = buildThemeDependencyMirror(THEME_CATALOGS);
  return `${JSON.stringify(mirror, null, 2)}\n`;
}

function main(): void {
  const check = process.argv.includes("--check");
  const next = serialize();

  if (check) {
    let current: string;
    try {
      current = readFileSync(OUT, "utf8");
    } catch {
      console.error(
        `❌ 依存ミラーが存在しません: ${OUT}\n` +
          `   生成: npx tsx packages/data-configs/scripts/generate-theme-dependency-mirror.ts`,
      );
      process.exit(1);
    }
    if (current !== next) {
      console.error(
        `❌ 依存ミラーが正典 (THEME_CATALOGS) と乖離しています: ${OUT}\n` +
          `   catalog を変えたら再生成する:\n` +
          `   npx tsx packages/data-configs/scripts/generate-theme-dependency-mirror.ts`,
      );
      process.exit(1);
    }
    console.log("✅ 依存ミラーは最新 (THEME_CATALOGS と一致)");
    return;
  }

  writeFileSync(OUT, next);
  const parsed = JSON.parse(next);
  console.log(
      `✅ 依存ミラーを生成: ${OUT}\n` +
      `   R2 metric ${parsed.totalMetricRefs} refs / ${parsed.distinctMetricRefs} distinct\n` +
      `   legacy e-Stat ${parsed.totalRequests} refs / ${parsed.distinctRequests} distinct`,
  );
}

main();
