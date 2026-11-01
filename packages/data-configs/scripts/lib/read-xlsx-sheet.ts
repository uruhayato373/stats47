import { createRequire } from "node:module";

import type { SheetRows } from "./childcare-waiting-rate.js";

const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-var-requires
const JSZip = require("jszip") as typeof import("jszip");

function decodeXml(s: string): string {
  return s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
}

/** xlsx の指定シートを 行番号→(列→値) に展開する最小パーサ(共有文字列と数式の cached value だけを読む)。 */
export async function readXlsxSheet(buf: Buffer, sheetName: string): Promise<SheetRows> {
  const zip = await JSZip.loadAsync(buf);
  const sharedXml = (await zip.file("xl/sharedStrings.xml")?.async("string")) ?? "";
  const shared: string[] = [];
  for (const m of sharedXml.matchAll(/<si>([\s\S]*?)<\/si>/g)) {
    // ふりがな(<rPh>)の文字を本文に混ぜない(混ぜると「札幌市サッポロシ」のように読める)
    const body = m[1].replace(/<rPh[\s\S]*?<\/rPh>/g, "");
    shared.push(decodeXml(Array.from(body.matchAll(/<t[^>]*>([^<]*)<\/t>/g)).map((t) => t[1]).join("")));
  }
  const wb = await zip.file("xl/workbook.xml")!.async("string");
  const rels = await zip.file("xl/_rels/workbook.xml.rels")!.async("string");
  const sheet = Array.from(wb.matchAll(/<sheet [^>]*name="([^"]+)"[^>]*r:id="([^"]+)"/g)).find((m) => decodeXml(m[1]) === sheetName);
  if (!sheet) throw new Error(`sheet not found: ${sheetName} (available: ${Array.from(wb.matchAll(/<sheet [^>]*name="([^"]+)"/g)).map((m) => m[1]).join(",")})`);
  const rel = Array.from(rels.matchAll(/<Relationship [^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/g)).find((m) => m[1] === sheet[2]);
  if (!rel) throw new Error(`rel not found for ${sheetName}`);
  const target = rel[2].startsWith("/") ? rel[2].slice(1) : `xl/${rel[2]}`;
  const xml = await zip.file(target)!.async("string");
  const rows: SheetRows = new Map();
  for (const c of xml.matchAll(/<c r="([A-Z]+)(\d+)"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
    const [, col, rowStr, attrs, inner = ""] = c;
    const v = inner.match(/<v>([^<]*)<\/v>/)?.[1];
    let value: string | undefined;
    if (/t="s"/.test(attrs)) value = v === undefined ? undefined : shared[Number(v)];
    else if (/t="inlineStr"/.test(attrs)) value = decodeXml(Array.from(inner.matchAll(/<t[^>]*>([^<]*)<\/t>/g)).map((t) => t[1]).join(""));
    else value = v;
    if (value === undefined || value === "") continue;
    const row = Number(rowStr);
    if (!rows.has(row)) rows.set(row, new Map());
    rows.get(row)!.set(col, value);
  }
  return rows;
}
