#!/usr/bin/env node
/**
 * 総務省 統計局「家計調査 収支項目分類及びその内容例示」の Excel を、品目ごとの JSON に変換して控える。
 *
 * なぜ要るか (2026-10-08): 家計調査の品目に何が含まれ何が含まれないかを確かめる手段がリポジトリに無く、
 * 「371 ぎょうざ」に冷凍品が含まれると metric の注記とブログ本文に書いていた。公式の例示は
 * 「× ぎょうざの冷凍品→370」で、冷凍品は別品目の「370 冷凍調理食品」に入る。
 * 品目の範囲を書く・確かめるときは、この控えを正本にする (検査は check-kakei-classification.ts)。
 *
 * 使い方:
 *   node .claude/scripts/estat/build-kakei-classification.mjs --revision 2020
 *   node .claude/scripts/estat/build-kakei-classification.mjs --revision 2025
 *
 * 出力: data/estat/kakei-classification/<revision>.json (台帳 id: estat.kakei-classification)
 * read-only の取得 (統計局の公開 Excel) とローカルへの書き出しだけ。
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ExcelJS from "exceljs";
import { datasetDir } from "../../../config/datasets.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

/** 改定ごとの公開 Excel。改定が出たら 1 行足す (https://www.stat.go.jp/data/kakei/9.html) */
export const REVISIONS = {
  2020: { url: "https://www.stat.go.jp/data/kakei/kou2020/zuhyou/kouh2020.xlsx", title: "家計調査 収支項目分類及びその内容例示 (2020年1月改定)" },
  2025: { url: "https://www.stat.go.jp/data/kakei/kou2025/zuhyou/kouh2025.xlsx", title: "家計調査 収支項目分類及びその内容例示 (2025年1月改定)" },
};

const ITEM_CODE = /^[0-9]{1,3}[A-Z]?$/;
/** 分類の見出し行。「(360～376)」「380～389・38A」のように範囲か列挙で書かれる */
const GROUP_RANGE = /[～〜・･]/;
const EXCLUDE = /^×\s*(.+?)\s*$/;
const INCLUDE = /^○\s*(.+?)\s*$/;
const MOVED_TO = /→\s*([0-9]{1,3}[A-Z]?)\s*$/;

const text = (value) => {
  if (value == null) return "";
  if (typeof value === "object" && Array.isArray(value.richText)) return value.richText.map((r) => r.text).join("");
  return String(value);
};
const clean = (value) => text(value).replace(/　/g, " ").trim();

/**
 * 1 シートの行を品目へまとめる (pure)。列は A=品目番号 / D=分類番号 / F・G=項目名 / O=内容例示。
 * 品目番号のある行が品目の始まりで、品目番号の無い後続行は直前の品目の例示の続き。
 * 例示が括弧の途中で折り返された行 (「冷凍食品（コロッケ … しゅうまい」→「からあげ）」) は直前の例示へつなぐ。
 */
export function parseClassificationRows(rows, sheetName) {
  const items = {};
  let group = null;
  let current = null;
  for (const row of rows) {
    const code = clean(row[0]);
    const groupCode = clean(row[3]);
    const name = clean(row[6]);
    const detail = clean(row[14]);
    if (code && !ITEM_CODE.test(code) && GROUP_RANGE.test(code)) {
      group = { code: groupCode || null, name: clean(row[5]) || name };
      current = null;
      continue;
    }
    if (ITEM_CODE.test(code) && name) {
      current = { code, name, sheet: sheetName, group, definition: [], includes: [], excludes: [] };
      if (items[code]) throw new Error(`duplicate item code ${code} in ${sheetName}`);
      items[code] = current;
    } else if (code) {
      current = null;
      continue;
    }
    if (!current || !detail) continue;
    const exclude = detail.match(EXCLUDE);
    const include = detail.match(INCLUDE);
    if (exclude) {
      const moved = exclude[1].match(MOVED_TO);
      current.excludes.push({ text: exclude[1].replace(MOVED_TO, "").trim(), movedTo: moved ? moved[1] : null });
    } else if (include) {
      current.includes.push(include[1]);
    } else if (lastOpen(current)) {
      const last = lastOpen(current);
      last.list[last.index] = typeof last.list[last.index] === "string"
        ? `${last.list[last.index]} ${detail}`
        : { ...last.list[last.index], text: `${last.list[last.index].text} ${detail}` };
    } else {
      current.definition.push(detail);
    }
  }
  return items;
}

const unbalanced = (value) => (value.match(/[（(]/g) ?? []).length > (value.match(/[）)]/g) ?? []).length;
/** 括弧が閉じていない最後の例示 (折り返しの続きを受ける先) */
function lastOpen(item) {
  for (const list of [item.excludes, item.includes]) {
    const index = list.length - 1;
    if (index < 0) continue;
    const value = typeof list[index] === "string" ? list[index] : list[index].text;
    if (unbalanced(value)) return { list, index };
  }
  return null;
}

function arg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

async function main() {
  const revision = arg("--revision");
  const spec = REVISIONS[revision];
  if (!spec) throw new Error(`--revision must be one of ${Object.keys(REVISIONS).join(", ")}`);
  const response = await fetch(spec.url);
  if (!response.ok) throw new Error(`fetch failed: HTTP ${response.status} ${spec.url}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(bytes);

  const items = {};
  for (const sheet of workbook.worksheets) {
    const rows = [];
    sheet.eachRow({ includeEmpty: false }, (row) => rows.push(row.values.slice(1)));
    for (const [code, item] of Object.entries(parseClassificationRows(rows, sheet.name.trim()))) {
      if (items[code]) throw new Error(`item code ${code} appears in two sheets`);
      items[code] = item;
    }
  }
  if (!items["371"] || !items["370"]) throw new Error("expected items 370 / 371 are missing; the Excel layout may have changed");

  const out = {
    schemaVersion: 1,
    revision,
    source: {
      publisher: "総務省統計局",
      title: spec.title,
      url: spec.url,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      fetchedAt: new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10), // JST
    },
    itemCount: Object.keys(items).length,
    items,
  };
  const dir = path.join(PROJECT_ROOT, datasetDir("estat.kakei-classification"));
  fs.mkdirSync(dir, { recursive: true });
  const target = path.join(dir, `${revision}.json`);
  fs.writeFileSync(target, `${JSON.stringify(out, null, 2)}\n`);
  console.log(`kakei classification ${revision}: ${out.itemCount} items → ${path.relative(PROJECT_ROOT, target)}`);
}

if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1] ?? "")) {
  main().catch((error) => {
    console.error(`[build-kakei-classification] ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  });
}
