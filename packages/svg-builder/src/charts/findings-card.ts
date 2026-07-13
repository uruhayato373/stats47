import { FONT_FAMILY } from "../shared/color";
import { svgThemeStyle } from "../shared/theme";

export interface FindingsCardItem {
  /** 太字の見出し (要点の核心)。旧 inline 生成器の heading+text 構造互換 */
  heading?: string;
  /** 要点テキスト (1-2 行程度) */
  text: string;
}

export interface FindingsCardData {
  /** 要点の配列。番号は自動付与 (1-indexed) */
  findings: FindingsCardItem[] | string[];
  /** カードタイトル。デフォルト "この記事でわかったこと" */
  title?: string;
  /** provenance コメント挿入用 */
  sourceFile?: string;
}

export interface FindingsCardOptions {
  /** ariaLabel */
  ariaLabel?: string;
}

/** heading (18px bold) の 1 行あたり最大文字数 (テキスト開始 x=90 から右余白 40 を引いた 830px ÷ 18px ≈ 46 の保守値) */
const HEADING_CHARS_PER_LINE = 40;
/** text (16px) の 1 行あたり最大文字数 (830px ÷ 16px ≈ 51 の保守値) */
const TEXT_CHARS_PER_LINE = 44;
/** 1 行の高さ (px) */
const LINE_H = 22;
/** カード間の垂直余白 */
const CARD_GAP = 10;
/** カード内 padding (上下) */
const CARD_PAD_V = 14;
/** カード水平マージン */
const CARD_MX = 40;
/** 円の半径 */
const CIRCLE_R = 18;
/** 円の中心から左端 */
const CIRCLE_CX = CARD_MX + CIRCLE_R;
/** テキスト開始 X */
const TEXT_X = CIRCLE_CX + CIRCLE_R + 14;
/** 全体幅 */
const W = 960;
/** ヘッダー高さ */
const HEADER_H = 72;

/** テキストの行数を推定 (簡易: 文字数 ÷ 1 行の最大文字数) */
function estimateLines(text: string, maxChars: number): number {
  return Math.max(1, Math.ceil(text.length / maxChars));
}

/** 1 カードの高さを計算 (heading 行 + text 行) */
function cardHeight(item: { heading?: string; text: string }): number {
  const headingLines = item.heading ? estimateLines(item.heading, HEADING_CHARS_PER_LINE) : 0;
  const textLines = estimateLines(item.text, TEXT_CHARS_PER_LINE);
  return CARD_PAD_V * 2 + (headingLines + textLines) * LINE_H;
}

/** 長いテキストを複数の tspan に分割 */
function wrapText(text: string, x: number, y: number, maxChars: number): string {
  if (text.length <= maxChars) {
    return `<tspan x="${x}" dy="0">${escapeXml(text)}</tspan>`;
  }
  const parts: string[] = [];
  let remaining = text;
  let first = true;
  while (remaining.length > 0) {
    const chunk = remaining.slice(0, maxChars);
    remaining = remaining.slice(maxChars);
    parts.push(`<tspan x="${x}" dy="${first ? 0 : LINE_H}">${escapeXml(chunk)}</tspan>`);
    first = false;
  }
  return parts.join("");
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * 「この記事でわかったこと」要点カード SVG を生成する。
 *
 * 各要点を丸数字 + テキストのカード行で表示する。
 * ダークモード対応 (`svgThemeStyle()` + svg-* class 使用)。
 */
export function generateFindingsCardSvg(
  data: FindingsCardData,
  options: FindingsCardOptions = {}
): string {
  const title = data.title ?? "この記事でわかったこと";
  const rawFindings = data.findings ?? [];
  const findings: { heading?: string; text: string }[] = rawFindings.map((f) =>
    typeof f === "string" ? { text: f } : f
  );

  if (findings.length === 0) {
    return `<!-- findings-card: no data -->`;
  }

  const ariaLabel = options.ariaLabel ?? title;

  // 各カードの高さを計算
  const cardHeights = findings.map((f) => cardHeight(f));
  const totalCardsH =
    cardHeights.reduce((a, b) => a + b, 0) + CARD_GAP * (findings.length - 1);

  const H = HEADER_H + totalCardsH + 32; // 下余白 32px

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="${FONT_FAMILY}" role="img" aria-label="${escapeXml(ariaLabel)}">\n`;
  svg += svgThemeStyle() + "\n";

  // 背景
  svg += `  <rect width="${W}" height="${H}" class="svg-bg"/>\n`;

  // ヘッダーテキスト
  svg += `  <text x="${W / 2}" y="46" text-anchor="middle" font-size="26" font-weight="bold" class="svg-title">${escapeXml(title)}</text>\n`;

  // 各カード
  let y = HEADER_H;
  findings.forEach((item, idx) => {
    const h = cardHeights[idx];
    const cardX = CARD_MX;
    const cardW = W - CARD_MX * 2;
    const cy = y + h / 2;
    const textY = y + CARD_PAD_V + LINE_H * 0.8;

    // カード背景
    svg += `  <rect x="${cardX}" y="${y}" width="${cardW}" height="${h}" class="svg-plot" rx="8"/>\n`;

    // 番号円 (赤)
    svg += `  <circle cx="${CIRCLE_CX}" cy="${cy}" r="${CIRCLE_R}" fill="#dc2626"/>\n`;
    svg += `  <text x="${CIRCLE_CX}" y="${cy + 6}" text-anchor="middle" font-size="16" font-weight="bold" fill="#ffffff">${idx + 1}</text>\n`;

    // heading (太字) + text (補足)。heading 無しの string 要点は text を 18px 主役で描く
    if (item.heading) {
      const headingLines = estimateLines(item.heading, HEADING_CHARS_PER_LINE);
      const headingSpans = wrapText(item.heading, TEXT_X, textY, HEADING_CHARS_PER_LINE);
      svg += `  <text x="${TEXT_X}" y="${textY}" font-size="18" font-weight="bold" class="svg-title">${headingSpans}</text>\n`;
      const bodyY = textY + headingLines * LINE_H;
      const bodySpans = wrapText(item.text, TEXT_X, bodyY, TEXT_CHARS_PER_LINE);
      svg += `  <text x="${TEXT_X}" y="${bodyY}" font-size="16" class="svg-axis">${bodySpans}</text>\n`;
    } else {
      const tspans = wrapText(item.text, TEXT_X, textY, TEXT_CHARS_PER_LINE);
      svg += `  <text x="${TEXT_X}" y="${textY}" font-size="18" class="svg-title">${tspans}</text>\n`;
    }

    y += h + CARD_GAP;
  });

  if (data.sourceFile) {
    svg += `<!-- data-source: ${data.sourceFile} | generated: ${new Date().toISOString()} -->\n`;
  }
  svg += `</svg>`;

  return svg;
}
