/**
 * 時系列の縦持ち CSV (UTF-8 BOM + CRLF)。1 行 = 指標 × 年 × 都道府県。日本語 Excel で文字化けしない。
 * 欠測は 0 にせず値を空欄にして「欠損理由」を書く。年の定義 (暦年/年度) の変わり目は「年の区分」列で分かる。
 */
import type { MetricTimeSeries } from "../data/time-series";
import { PREFECTURE_BY_CODE5 } from "../data/prefectures";

const BOM = "﻿";
const MISSING_LABEL: Readonly<Record<string, string>> = { missing: "欠損", confidential: "秘匿", na: "非該当" };

export const TIMESERIES_CSV_HEADER = ["指標キー", "指標名", "単位", "年", "年の区分", "都道府県コード", "都道府県", "値", "欠損理由"] as const;

function escapeCell(s: string): string {
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function serializeSeriesCsv(series: readonly MetricTimeSeries[]): string {
  const lines: string[] = [TIMESERIES_CSV_HEADER.join(",")];
  for (const s of series) {
    for (const y of s.years) {
      for (const v of y.values) {
        lines.push(
          [
            s.rankingKey,
            s.indicator,
            s.unit,
            y.year,
            y.basis,
            v.code5,
            PREFECTURE_BY_CODE5.get(v.code5)?.name ?? "",
            v.value === null ? "" : String(v.value),
            v.value === null ? (MISSING_LABEL[v.missing ?? "missing"] ?? "欠損") : "",
          ]
            .map(escapeCell)
            .join(","),
        );
      }
    }
  }
  return BOM + lines.join("\r\n") + "\r\n";
}

/** 注記だけの CSV (指標ごとの年の定義の変更・補完・換算・欠測)。注記のある指標だけを 1 行ずつ。 */
export function serializeSeriesNotesCsv(series: readonly MetricTimeSeries[]): string {
  const lines = [["指標キー", "指標名", "単位", "収録年", "注記"].join(",")];
  for (const s of series) {
    if (s.notes.length === 0) continue;
    const first = s.years[0]?.year ?? "";
    const last = s.years[s.years.length - 1]?.year ?? "";
    lines.push([s.rankingKey, s.indicator, s.unit, first === last ? first : `${first}〜${last}`, s.notes.join(" ")].map(escapeCell).join(","));
  }
  return BOM + lines.join("\r\n") + "\r\n";
}
