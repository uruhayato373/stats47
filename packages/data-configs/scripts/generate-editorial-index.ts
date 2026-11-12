/**
 * generate-editorial-index — 台帳 areas.editorial (県の本文 47 ファイル) から editorial/index.ts を再生成する。
 *
 * 各 <code>.json の areaCode がファイル名と一致することを確かめ、JSON の静的 import と
 * AREA_EDITORIALS 登録簿を areaCode 昇順で機械生成する (index.ts の手編集・競合を排除)。
 *
 * 使い方:
 *   npx tsx packages/data-configs/scripts/generate-editorial-index.ts          # 書き込み
 *   npx tsx packages/data-configs/scripts/generate-editorial-index.ts --check  # diff 検証
 *
 * 規約: .claude/rules/area-databook-standards.md
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { datasetDir } from "../../../config/datasets.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "../../..");
const RECORD_DIR = resolve(REPO_ROOT, datasetDir("areas.editorial"));
const INDEX_PATH = resolve(__dirname, "../src/area-databook/editorial", "index.ts");
const CHECK = process.argv.includes("--check");

interface Entry {
  areaCode: string;
  importPath: string;
}

function collect(): Entry[] {
  const entries: Entry[] = [];
  for (const file of readdirSync(RECORD_DIR)) {
    if (!/^\d{5}\.json$/.test(file)) continue;
    const record = JSON.parse(readFileSync(resolve(RECORD_DIR, file), "utf8")) as { areaCode?: string };
    const code = file.replace(".json", "");
    if (record.areaCode !== code) {
      throw new Error(`${file}: areaCode "${record.areaCode}" がファイル名と不一致`);
    }
    const importPath = relative(dirname(INDEX_PATH), resolve(RECORD_DIR, file)).replace(/\\/g, "/");
    entries.push({ areaCode: code, importPath });
  }
  entries.sort((a, b) => a.areaCode.localeCompare(b.areaCode));
  return entries;
}

function render(entries: Entry[]): string {
  const imports = entries.map((e) => `import e${e.areaCode} from "${e.importPath}";`).join("\n");
  const names = entries.map((e) => `  e${e.areaCode},`).join("\n");
  return (
    `/**\n` +
    ` * AREA_EDITORIALS — 県別編集コンテンツ (特産品・県シンボル) の登録簿。\n` +
    ` *\n` +
    ` * ⚠️ AUTO-GENERATED — DO NOT EDIT.\n` +
    ` * 生成: npx tsx packages/data-configs/scripts/generate-editorial-index.ts\n` +
    ` * 記録の正本は台帳 areas.editorial (県ごとの JSON + Schema)。ファイルを追加したら再生成する。\n` +
    ` * 規約: .claude/rules/area-databook-standards.md\n` +
    ` */\n` +
    `import type { AreaEditorial } from "../types";\n` +
    `${imports}\n\n` +
    `const RECORDS = [\n${names}\n];\n\n` +
    `/** 県別編集コンテンツの登録簿 (areaCode → editorial)。sourceNote (出典の注記) は記録だけが持ち、ここには出さない。 */\n` +
    `export const AREA_EDITORIALS: Record<string, AreaEditorial> = Object.fromEntries(\n` +
    `  RECORDS.map(({ sourceNote: _sourceNote, ...editorial }) => [editorial.areaCode, editorial as AreaEditorial]),\n` +
    `);\n\n` +
    `/** 登録済み editorial 配列。 */\n` +
    `export function listAreaEditorials(): AreaEditorial[] {\n` +
    `  return Object.values(AREA_EDITORIALS);\n` +
    `}\n`
  );
}

function main() {
  const entries = collect();
  const content = render(entries);

  if (CHECK) {
    const existing = (() => {
      try {
        return readFileSync(INDEX_PATH, "utf8");
      } catch {
        return null;
      }
    })();
    if (existing !== content) {
      console.error(
        `\n❌ editorial/index.ts が古い (${entries.length} 県)。再生成してください:`,
      );
      console.error("   npx tsx packages/data-configs/scripts/generate-editorial-index.ts");
      process.exit(1);
    }
    console.log(`✅ editorial/index.ts は最新 (${entries.length} 県)`);
    process.exit(0);
  }

  writeFileSync(INDEX_PATH, content, "utf8");
  console.log(`✅ editorial/index.ts を再生成 (${entries.length} 県登録)`);
  process.exit(0);
}

main();
