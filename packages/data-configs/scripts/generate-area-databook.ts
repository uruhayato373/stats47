/**
 * generate-area-databook — AreaDatabookTemplate (SSOT) から生成物を出力する。
 *
 * 生成物:
 *   apps/web/scripts/data/page-components/area/<code>.json … R2 verbatim export 用 (byte 一致)
 *   (chart ブロックのみ。47 県共通テンプレのため全県同一内容)
 *
 * 使い方:
 *   npx tsx packages/data-configs/scripts/generate-area-databook.ts          # 書き込み
 *   npx tsx packages/data-configs/scripts/generate-area-databook.ts --check  # committed と diff 検証 (CI/pre-commit)
 *
 * 規約: .claude/rules/area-databook-standards.md
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { AREA_DATABOOK_TEMPLATE } from "../src/area-databook/template";
import { templateToPageComponentsJson } from "../src/area-databook/transform";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "../../..");
const PAGE_COMPONENTS_AREA_DIR = resolve(
  REPO_ROOT,
  "apps/web/scripts/data/page-components/area",
);
const PREFECTURES_JSON = resolve(
  REPO_ROOT,
  "packages/area/src/data/prefectures.json",
);

const CHECK = process.argv.includes("--check");

function listAreaCodes(): string[] {
  const rows = JSON.parse(readFileSync(PREFECTURES_JSON, "utf8")) as Array<{
    prefCode: string;
  }>;
  const codes = rows.map((r) => r.prefCode);
  if (codes.length !== 47) {
    throw new Error(`prefectures.json が 47 件ではない (${codes.length} 件)`);
  }
  return codes;
}

function readExisting(path: string): string | null {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return null;
  }
}

function main() {
  const content = templateToPageComponentsJson(AREA_DATABOOK_TEMPLATE);
  const codes = listAreaCodes();

  if (CHECK) {
    const stale: string[] = [];
    for (const code of codes) {
      const path = resolve(PAGE_COMPONENTS_AREA_DIR, `${code}.json`);
      if (readExisting(path) !== content) stale.push(`page-components: area/${code}.json`);
    }
    if (stale.length > 0) {
      console.error(
        `\n❌ area-databook 生成物が古い/手編集されています (${stale.length} 件):`,
      );
      for (const s of stale.slice(0, 10)) console.error("   " + s);
      if (stale.length > 10) console.error(`   … 他 ${stale.length - 10} 件`);
      console.error(
        "   → npm run generate:area-databook --workspace=@stats47/data-configs で再生成",
      );
      console.error("   規約: .claude/rules/area-databook-standards.md");
      process.exit(1);
    }
    console.log(`✅ area-databook 生成物は最新 (${codes.length} files)`);
    process.exit(0);
  }

  let written = 0;
  for (const code of codes) {
    const path = resolve(PAGE_COMPONENTS_AREA_DIR, `${code}.json`);
    if (readExisting(path) === content) continue;
    writeFileSync(path, content, "utf8");
    written++;
  }
  console.log(
    `✅ area-databook: ${written} files written / ${codes.length} targets`,
  );
  process.exit(0);
}

main();
