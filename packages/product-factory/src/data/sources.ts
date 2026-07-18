/**
 * SOURCES.csv (出典台帳) の行型とシリアライザ。
 * 各成果物に版・基準年・出典・利用許諾・対応環境を入れる要件 (仕様 §共通仕様) の出典部分を担う。
 * 日本語 Excel で文字化けしないよう **UTF-8 BOM + CRLF** で出力する (Phase 0 判定)。
 */
export interface SourceRow {
  /** 調査名 (例「国勢調査」)。 */
  readonly surveyName: string;
  /** 表名・表番号。 */
  readonly tableName: string;
  /** e-Stat statsDataId (無ければ "-")。 */
  readonly statsDataId: string;
  readonly url: string;
  /** 基準年 (4 桁)。 */
  readonly year: string;
  /** 取得日 (YYYY-MM-DD)。 */
  readonly retrievedAt: string;
  readonly unit: string;
  /** 加工式・指標化の方法。 */
  readonly transform: string;
  /** 欠損・秘匿・年次差などの注意事項。 */
  readonly notes: string;
}

/** UTF-8 BOM (日本語 Excel の Shift-JIS 誤判定=文字化けを防ぐ)。 */
const UTF8_BOM = "﻿";

const HEADER = ["調査名", "表名", "statsDataId", "URL", "年", "取得日", "単位", "加工式", "注意事項"] as const;

function escapeCell(s: string): string {
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** SOURCES.csv 文字列 (UTF-8 BOM + CRLF) を生成する。 */
export function serializeSourcesCsv(rows: readonly SourceRow[]): string {
  const body = rows.map((r) =>
    [r.surveyName, r.tableName, r.statsDataId, r.url, r.year, r.retrievedAt, r.unit, r.transform, r.notes]
      .map(escapeCell)
      .join(","),
  );
  const lines = [HEADER.join(","), ...body];
  return UTF8_BOM + lines.join("\r\n") + "\r\n";
}
