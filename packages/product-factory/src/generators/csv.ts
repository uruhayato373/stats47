/**
 * データセット → data.csv (UTF-8 BOM + CRLF)。日本語 Excel で文字化けしない形式。
 */
import type { Dataset } from "../data/dataset";
import { PREFECTURE_BY_CODE5 } from "../data/prefectures";

const BOM = "﻿";
const MISSING_LABEL: Readonly<Record<string, string>> = { missing: "欠損", confidential: "秘匿", na: "非該当" };

function escapeCell(s: string): string {
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** 47 県データを data.csv 文字列に変換する。 */
export function serializeDatasetCsv(ds: Dataset): string {
  const header = ["都道府県コード", "都道府県", "値", "単位", "基準年", "注記"];
  const rows = ds.values.map((d) => {
    const name = PREFECTURE_BY_CODE5.get(d.code5)?.name ?? "";
    const value = d.value === null ? "" : String(d.value);
    const note = d.missing ? MISSING_LABEL[d.missing] ?? "" : "";
    return [d.code5, name, value, ds.unit, ds.year, note];
  });
  return BOM + [header, ...rows].map((r) => r.map(escapeCell).join(",")).join("\r\n") + "\r\n";
}
