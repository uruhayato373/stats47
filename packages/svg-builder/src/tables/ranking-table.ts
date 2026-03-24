/**
 * ランキングテーブル SVG 生成
 *
 * 都道府県ランキングを表形式の静的 SVG 文字列として出力する。
 */

import { FONT_FAMILY } from "../shared/color";

export interface RankingTableRow {
  rank: number;
  name: string;
  value: number | string;
  /** 強調表示（自分の県など） */
  highlight?: boolean;
}

export interface RankingTableOptions {
  /** テーブルタイトル */
  title?: string;
  /** 値列のヘッダー */
  valueHeader?: string;
  /** 値のフォーマット関数 */
  formatValue?: (v: number | string) => string;
  /** 幅 */
  width?: number;
}

const ROW_H = 24;
const HEADER_H = 32;
const TITLE_H = 28;
const PADDING = 12;

/**
 * ランキングテーブル SVG を生成する
 */
export function generateRankingTableSvg(
  rows: RankingTableRow[],
  options: RankingTableOptions = {},
): string {
  const {
    title,
    valueHeader = "値",
    formatValue = (v) => String(v),
    width = 400,
  } = options;

  const titleOffset = title ? TITLE_H : 0;
  const tableTop = titleOffset + HEADER_H;
  const totalH = tableTop + rows.length * ROW_H + PADDING;

  const rankColW = 48;
  const valueColW = 100;
  const nameColW = width - rankColW - valueColW;

  // ヘッダー
  const headerY = titleOffset + HEADER_H / 2 + 5;
  const header = [
    `  <rect x="0" y="${titleOffset}" width="${width}" height="${HEADER_H}" fill="#f3f4f6"/>`,
    `  <text x="${rankColW / 2}" y="${headerY}" text-anchor="middle" font-size="11" font-weight="bold" fill="#374151">順位</text>`,
    `  <text x="${rankColW + nameColW / 2}" y="${headerY}" text-anchor="middle" font-size="11" font-weight="bold" fill="#374151">都道府県</text>`,
    `  <text x="${width - valueColW / 2}" y="${headerY}" text-anchor="middle" font-size="11" font-weight="bold" fill="#374151">${valueHeader}</text>`,
  ];

  // 行
  const rowEls = rows.map((row, i) => {
    const y = tableTop + i * ROW_H;
    const textY = y + ROW_H / 2 + 4;
    const bg = row.highlight
      ? "#fef9c3"
      : i % 2 === 0
        ? "#ffffff"
        : "#f9fafb";
    const rankColor =
      row.rank === 1 ? "#b91c1c" : row.rank <= 3 ? "#c2410c" : "#6b7280";

    return [
      `  <rect x="0" y="${y}" width="${width}" height="${ROW_H}" fill="${bg}"/>`,
      `  <text x="${rankColW / 2}" y="${textY}" text-anchor="middle" font-size="12" font-weight="${row.rank <= 3 ? "bold" : "normal"}" fill="${rankColor}">${row.rank}</text>`,
      `  <text x="${rankColW + 8}" y="${textY}" font-size="12" fill="#111827">${row.name}</text>`,
      `  <text x="${width - 8}" y="${textY}" text-anchor="end" font-size="12" fill="#374151">${formatValue(row.value)}</text>`,
    ].join("\n");
  });

  // 罫線
  const lines = [
    `  <line x1="0" y1="${titleOffset}" x2="${width}" y2="${titleOffset}" stroke="#e5e7eb" stroke-width="1"/>`,
    `  <line x1="0" y1="${tableTop}" x2="${width}" y2="${tableTop}" stroke="#d1d5db" stroke-width="1"/>`,
    `  <line x1="${rankColW}" y1="${titleOffset}" x2="${rankColW}" y2="${totalH - PADDING}" stroke="#e5e7eb" stroke-width="1"/>`,
    `  <line x1="${width - valueColW}" y1="${titleOffset}" x2="${width - valueColW}" y2="${totalH - PADDING}" stroke="#e5e7eb" stroke-width="1"/>`,
    `  <line x1="0" y1="${totalH - PADDING}" x2="${width}" y2="${totalH - PADDING}" stroke="#d1d5db" stroke-width="1"/>`,
    ...rows.map((_, i) => {
      const y = tableTop + i * ROW_H;
      return `  <line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="#f3f4f6" stroke-width="1"/>`;
    }),
  ];

  const titleEl = title
    ? `  <text x="${width / 2}" y="${TITLE_H - 6}" text-anchor="middle" font-size="13" font-weight="bold" fill="#111827">${title}</text>`
    : "";

  return `<svg width="${width}" height="${totalH}" viewBox="0 0 ${width} ${totalH}" xmlns="http://www.w3.org/2000/svg" font-family="${FONT_FAMILY}" role="img">
  <rect width="${width}" height="${totalH}" fill="#ffffff" rx="6" stroke="#e5e7eb" stroke-width="1"/>
${titleEl}
${lines.join("\n")}
${header.join("\n")}
${rowEls.join("\n")}
</svg>`;
}

/**
 * ランキングデータから RankingTableRow[] を生成する
 */
export function toTableRows(
  data: ReadonlyArray<{ areaCode: string; areaName: string; value: number; rank: number }>,
  highlightCode?: string,
): RankingTableRow[] {
  return data.map((d) => ({
    rank: d.rank,
    name: d.areaName,
    value: d.value,
    highlight: d.areaCode === highlightCode,
  }));
}
