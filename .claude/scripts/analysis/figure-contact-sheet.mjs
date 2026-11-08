#!/usr/bin/env node
/**
 * 分析の図 (*.svg) を 1 枚の一覧 PNG にする (npm run analysis:contact-sheet)。
 *
 *   npm run analysis:contact-sheet -- --dir <記事の data ディレクトリ> --out <png>
 *
 * -dark / -mobile / -ig の派生版は除く。1 枚 270×338、4 列。出力は --out だけに書く。
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";

import { isPrimaryFigure, renderContactSheet, sheetSize } from "./figure-contact-sheet-core.mjs";

const { values } = parseArgs({ options: { dir: { type: "string" }, out: { type: "string" } } });
if (!values.dir || !values.out) {
  console.error("使い方: npm run analysis:contact-sheet -- --dir <data dir> --out <png>");
  process.exit(2);
}

const names = readdirSync(values.dir).filter(isPrimaryFigure).sort();
if (names.length === 0) {
  console.error(`SVG が無い: ${values.dir}`);
  process.exit(1);
}
const png = await renderContactSheet(names.map((name) => ({ name, svg: readFileSync(join(values.dir, name)) })));
writeFileSync(values.out, png);
const { width, height } = sheetSize(names.length);
console.log(`${names.length} 枚 → ${values.out} (${width}×${height})`);
