import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { readXlsxSheet } from "../../scripts/lib/read-xlsx-sheet.js";

const require = createRequire(import.meta.url);
const JSZip = require("jszip") as typeof import("jszip");
const SCRIPTS = resolve(dirname(fileURLToPath(import.meta.url)), "../../scripts");

/** 共有文字列 2 件(どちらもふりがな <rPh> 付き)と数値 1 件を持つ最小の xlsx を作る。 */
async function buildXlsx(): Promise<Buffer> {
  const zip = new JSZip();
  zip.file(
    "xl/sharedStrings.xml",
    `<sst><si><t>全体</t><rPh sb="0" eb="2"><t>ゼンタイ</t></rPh></si><si><r><t>札幌</t></r><r><t>市</t></r><rPh sb="0" eb="3"><t>サッポロシ</t></rPh></si></sst>`,
  );
  zip.file("xl/workbook.xml", `<workbook><sheets><sheet name="国語" sheetId="1" r:id="rId1"/></sheets></workbook>`);
  zip.file("xl/_rels/workbook.xml.rels", `<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>`);
  zip.file(
    "xl/worksheets/sheet1.xml",
    `<worksheet><sheetData><row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1"><v>12</v></c></row><row r="2"><c r="A2" t="s"><v>1</v></c></row></sheetData></worksheet>`,
  );
  return Buffer.from(await zip.generateAsync({ type: "nodebuffer" }));
}

describe("readXlsxSheet", () => {
  it("共有文字列のふりがな(rPh)を本文に混ぜない", async () => {
    const rows = await readXlsxSheet(await buildXlsx(), "国語");
    expect(rows.get(1)?.get("A")).toBe("全体");
    expect(rows.get(2)?.get("A")).toBe("札幌市");
    expect(rows.get(1)?.get("B")).toBe("12");
  });
});

describe("xlsx 読み取りの複製を持たない", () => {
  it("ingest-nier-achievement.ts は lib/read-xlsx-sheet.ts を使い、自前の共有文字列パーサを持たない", () => {
    const src = readFileSync(resolve(SCRIPTS, "ingest-nier-achievement.ts"), "utf8");
    expect(src).toContain('from "./lib/read-xlsx-sheet.js"');
    expect(src).not.toContain("sharedStrings.xml");
  });
});
