/**
 * generate-theme-catalog — ThemeCatalog (SSOT) から生成物を出力する。
 *
 * 生成物 (登録済みカタログ = THEME_CATALOGS のテーマのみ):
 *   1. packages/types/src/indicator-sets/<key>.ts        … IndicatorSet codegen (DO NOT EDIT)
 *   2. apps/web/scripts/data/page-components/theme/<key>.json … R2 verbatim export 用 (byte 一致)
 *
 * 未登録テーマ (legacy) は触らない。
 *
 * 使い方:
 *   npx tsx packages/data-configs/scripts/generate-theme-catalog.ts          # 書き込み
 *   npx tsx packages/data-configs/scripts/generate-theme-catalog.ts --check  # committed と diff 検証 (CI/pre-commit)
 *
 * 規約: .claude/rules/theme-catalog-standards.md
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { listThemeCatalogs } from "../src/theme-catalog";
import {
  catalogToIndicatorSetSource,
  catalogToPageComponentsJson,
} from "../src/theme-catalog/transform";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "../../..");
const INDICATOR_SETS_DIR = resolve(REPO_ROOT, "packages/types/src/indicator-sets");
const PAGE_COMPONENTS_THEME_DIR = resolve(
  REPO_ROOT,
  "apps/web/scripts/data/page-components/theme",
);

const CHECK = process.argv.includes("--check");

interface Target {
  path: string;
  label: string;
  content: string;
}

function collectTargets(): Target[] {
  const targets: Target[] = [];
  for (const catalog of listThemeCatalogs()) {
    targets.push({
      path: resolve(INDICATOR_SETS_DIR, `${catalog.key}.ts`),
      label: `indicator-set: ${catalog.key}`,
      content: catalogToIndicatorSetSource(catalog),
    });
    targets.push({
      path: resolve(PAGE_COMPONENTS_THEME_DIR, `${catalog.key}.json`),
      label: `page-components: ${catalog.key}`,
      content: catalogToPageComponentsJson(catalog),
    });
  }
  return targets;
}

function readExisting(path: string): string | null {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return null;
  }
}

function main() {
  const targets = collectTargets();

  if (CHECK) {
    const stale: string[] = [];
    for (const t of targets) {
      const existing = readExisting(t.path);
      if (existing !== t.content) stale.push(t.label);
    }
    if (stale.length > 0) {
      console.error(
        `\n❌ theme-catalog 生成物が古い/手編集されています (${stale.length} 件):`,
      );
      for (const s of stale) console.error("   " + s);
      console.error("   → npm run generate:catalog --workspace=@stats47/data-configs で再生成");
      console.error("   規約: .claude/rules/theme-catalog-standards.md");
      process.exit(1);
    }
    console.log(`✅ theme-catalog 生成物は最新 (${targets.length} files, ${listThemeCatalogs().length} themes)`);
    process.exit(0);
  }

  let written = 0;
  for (const t of targets) {
    const existing = readExisting(t.path);
    if (existing === t.content) continue;
    writeFileSync(t.path, t.content, "utf8");
    written++;
    console.log(`  ✎ ${t.label}`);
  }
  console.log(
    `✅ theme-catalog: ${written} files written / ${targets.length} targets (${listThemeCatalogs().length} themes)`,
  );
  process.exit(0);
}

main();
