/**
 * note 表紙 (カバー) の SVG 生成 (1280×670・仕様 §11)。
 * 決定的なタイトルカード (外部 AI 不使用)。stats47 デザイントークンに合わせ別ブランドを増やさない。
 * 実 PNG 化は build-note-covers.ts が sharp で行う。
 */
import type { NoteArticlePlan } from "../types";
import { NOTE_SERIES_REGISTRY } from "../series";
import { BRAND } from "../../../design/tokens";

const W = 1280;
const H = 670;

/** シリーズ → アクセント色 (CVD-safe パレット由来・シリーズ認知用)。 */
const SERIES_ACCENT: Record<string, string> = {
  "prefecture-map-powerpoint": "#2171b5",
  "prefecture-excel-analysis": "#009e73",
  "regional-data-packs": "#8b5cf6",
  "business-location-analysis": "#d55e00",
  "government-statistics-work": "#0072b2",
  "media-data-visuals": "#c81e77",
  "statistics-education": "#b8860b",
  "life-area-comparison": "#1a9850",
  "custom-analysis-services": "#4b5563",
  "license-guide": "#2c7fb8",
  "free-samples": "#1a9850",
};

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function yen(n: number): string {
  return "¥" + n.toLocaleString("ja-JP");
}

/** ASCII 連続 (数字・英字・記号) は 1 トークンとして分割しない。CJK は 1 文字 1 トークン。 */
function tokenize(title: string): string[] {
  const tokens: string[] = [];
  let ascii = "";
  for (const ch of [...title]) {
    if (/[\x21-\x7e]/.test(ch)) {
      ascii += ch;
    } else {
      if (ascii) {
        tokens.push(ascii);
        ascii = "";
      }
      tokens.push(ch);
    }
  }
  if (ascii) tokens.push(ascii);
  return tokens;
}

/** 日本語タイトルを ~maxPerLine 文字で最大 maxLines 行に折る (決定的・ASCII 連続を割らない)。 */
export function wrapTitle(title: string, maxPerLine: number, maxLines: number): string[] {
  const tokens = tokenize(title);
  const lines: string[] = [];
  let cur = "";
  for (const tok of tokens) {
    const curLen = [...cur].length;
    const tokLen = [...tok].length;
    if (curLen > 0 && curLen + tokLen > maxPerLine) {
      lines.push(cur);
      cur = "";
      if (lines.length === maxLines - 1) break;
    }
    cur += tok;
  }
  // 残りトークンを最終行へ (超過は末尾を … で省略)
  const consumedTokens = lines.join("");
  let rest = title.slice(consumedTokens.length);
  if ([...rest].length > maxPerLine) rest = [...rest].slice(0, maxPerLine - 1).join("") + "…";
  if (rest) lines.push(rest);
  return lines.length ? lines : [title];
}

export function renderCoverSvg(article: NoteArticlePlan): string {
  const accent = SERIES_ACCENT[article.series] ?? "#2171b5";
  const seriesName = NOTE_SERIES_REGISTRY[article.series]?.name ?? article.series;
  const isPaid = article.access === "paid";
  const badgeText = isPaid ? yen(article.priceJpy) : "無料サンプル";
  const badgeColor = isPaid ? accent : "#1a9850";

  // 行数に応じてフォントサイズを決める (2 行=64 / 3 行=52)。
  const lines = wrapTitle(article.title, 14, 3);
  const fontSize = lines.length >= 3 ? 52 : 62;
  const lineHeight = fontSize * 1.32;
  const blockH = lines.length * lineHeight;
  const startY = 300 - blockH / 2 + fontSize;

  const titleTspans = lines
    .map(
      (l, i) =>
        `<text x="80" y="${startY + i * lineHeight}" font-family="${BRAND.fontFamily}" font-size="${fontSize}" font-weight="700" fill="${BRAND.text}">${esc(l)}</text>`,
    )
    .join("\n  ");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#ffffff"/>
  <rect width="${W}" height="${H}" fill="#f8fafc"/>
  <rect x="0" y="0" width="20" height="${H}" fill="${accent}"/>
  <rect x="${W - 340}" y="0" width="340" height="${H}" fill="${accent}" opacity="0.07"/>
  <text x="80" y="86" font-family="${BRAND.fontFamily}" font-size="26" font-weight="700" fill="${accent}">統計で見る都道府県</text>
  <text x="80" y="120" font-family="${BRAND.fontFamily}" font-size="22" fill="${BRAND.subtext}">${esc(BRAND.domain)}</text>
  <rect x="80" y="150" rx="18" ry="18" width="${Math.min(560, 40 + [...seriesName].length * 24)}" height="40" fill="${accent}"/>
  <text x="102" y="177" font-family="${BRAND.fontFamily}" font-size="22" font-weight="700" fill="#ffffff">${esc(seriesName)}</text>
  ${titleTspans}
  <rect x="80" y="540" rx="24" ry="24" width="${Math.max(140, 60 + [...badgeText].length * 26)}" height="52" fill="${badgeColor}"/>
  <text x="104" y="575" font-family="${BRAND.fontFamily}" font-size="28" font-weight="700" fill="#ffffff">${esc(badgeText)}</text>
  <text x="80" y="632" font-family="${BRAND.fontFamily}" font-size="20" fill="${BRAND.subtext}">データ出典: 政府統計の総合窓口 (e-Stat) を基に stats47 作成</text>
</svg>`;
}
