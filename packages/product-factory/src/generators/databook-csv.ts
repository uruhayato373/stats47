/**
 * データブック → data.csv (UTF-8 BOM + CRLF)。複数指標を 1 表に横並び (都道府県 × 指標)。
 * 日本語 Excel で文字化けしない形式。欠損・秘匿・非該当は 0 埋めせず空セル + 注記列。
 */
import type { Dataset } from "../data/dataset";
import { PREFECTURE_CODES5, PREFECTURE_BY_CODE5 } from "../data/prefectures";

const BOM = "﻿";
const MISSING_LABEL: Readonly<Record<string, string>> = { missing: "欠損", confidential: "秘匿", na: "非該当" };

function escapeCell(s: string): string {
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * 複数データセットを横並び (wide) の data.csv に変換する。
 * ヘッダ: 都道府県コード, 都道府県, <指標1（単位・基準年）>, <指標2…>, 注記
 * 注記列には値が欠損/秘匿/非該当の指標を「指標名=理由」で列挙する。
 */
export function serializeDatabookCsv(datasets: readonly Dataset[]): string {
  const header = [
    "都道府県コード",
    "都道府県",
    ...datasets.map((d) => `${d.indicator}（${d.unit}・${d.year}）`),
    "注記",
  ];
  const rows = PREFECTURE_CODES5.map((code5, prefIdx) => {
    const name = PREFECTURE_BY_CODE5.get(code5)?.name ?? "";
    const notes: string[] = [];
    const cells = datasets.map((d) => {
      const datum = d.values[prefIdx];
      if (!datum || datum.value === null) {
        if (datum?.missing) notes.push(`${d.indicator}=${MISSING_LABEL[datum.missing] ?? "欠損"}`);
        return "";
      }
      return String(datum.value);
    });
    return [code5, name, ...cells, notes.join(" / ")];
  });
  return BOM + [header, ...rows].map((r) => r.map(escapeCell).join(",")).join("\r\n") + "\r\n";
}
