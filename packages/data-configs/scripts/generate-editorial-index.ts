/**
 * generate-editorial-index — editorial/<code>.ts 群から editorial/index.ts を再生成する。
 *
 * 各 editorial/<code>.ts の `export const XXX_EDITORIAL` と `areaCode: "NNNNN"` を抽出し、
 * import + AREA_EDITORIALS 登録簿を areaCode 昇順で機械生成する。県別ファイルを並列 agent が
 * 書いても、登録は本スクリプトで決定的に行う (index.ts の手編集・競合を排除)。
 *
 * 使い方:
 *   npx tsx packages/data-configs/scripts/generate-editorial-index.ts          # 書き込み
 *   npx tsx packages/data-configs/scripts/generate-editorial-index.ts --check  # diff 検証
 *
 * 規約: .claude/rules/area-databook-standards.md
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const EDITORIAL_DIR = resolve(__dirname, "../src/area-databook/editorial");
const INDEX_PATH = resolve(EDITORIAL_DIR, "index.ts");
const CHECK = process.argv.includes("--check");

interface Entry {
  areaCode: string;
  exportName: string;
  file: string;
}

function collect(): Entry[] {
  const entries: Entry[] = [];
  for (const file of readdirSync(EDITORIAL_DIR)) {
    if (!/^\d{5}\.ts$/.test(file)) continue;
    const src = readFileSync(resolve(EDITORIAL_DIR, file), "utf8");
    const exportName = src.match(/export const (\w+_EDITORIAL)\b/)?.[1];
    const areaCode = src.match(/areaCode:\s*"(\d{5})"/)?.[1];
    if (!exportName || !areaCode) {
      throw new Error(`${file}: export const XXX_EDITORIAL または areaCode "NNNNN" が見つからない`);
    }
    if (areaCode !== file.replace(".ts", "")) {
      throw new Error(`${file}: areaCode "${areaCode}" がファイル名と不一致`);
    }
    entries.push({ areaCode, exportName, file: file.replace(".ts", "") });
  }
  entries.sort((a, b) => a.areaCode.localeCompare(b.areaCode));
  return entries;
}

function render(entries: Entry[]): string {
  const imports = entries
    .map((e) => `import { ${e.exportName} } from "./${e.file}";`)
    .join("\n");
  const registrations = entries
    .map((e) => `  "${e.areaCode}": ${e.exportName},`)
    .join("\n");
  return (
    `/**\n` +
    ` * AREA_EDITORIALS — 県別編集コンテンツ (特産品・県シンボル) の登録簿。\n` +
    ` *\n` +
    ` * ⚠️ AUTO-GENERATED — DO NOT EDIT.\n` +
    ` * 生成: npx tsx packages/data-configs/scripts/generate-editorial-index.ts\n` +
    ` * 県別ファイル editorial/<code>.ts を追加後に再生成する。\n` +
    ` * 規約: .claude/rules/area-databook-standards.md\n` +
    ` */\n` +
    `import type { AreaEditorial } from "../types";\n` +
    `${imports}\n\n` +
    `/** 県別編集コンテンツの登録簿 (areaCode → editorial)。 */\n` +
    `export const AREA_EDITORIALS: Record<string, AreaEditorial> = {\n` +
    `${registrations}\n` +
    `};\n\n` +
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
