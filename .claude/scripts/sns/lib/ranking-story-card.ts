/** X用の編集カード。quick-still --layout から明示選択し、実データだけを組版する。 */
import { formatValueLabel, resolveValuePrecision } from "../../../../packages/svg-builder/src/shared/axis.ts";
import { FONT_FAMILY } from "../../../../packages/svg-builder/src/shared/color.ts";

export const STORY_LAYOUTS = ["spotlight", "comparison", "distribution"] as const;
export type StoryLayout = (typeof STORY_LAYOUTS)[number];
export interface StoryEntry { areaCode: string; areaName: string; value: number }
export interface StoryOptions { title: string; year: string; unit: string; source: string; layout: StoryLayout }

const WIDTH = 960;
const HEIGHT = 404;
const INK = "#17312f";
const TEAL = "#176b60";
const MUTED = "#536b66";
const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

// 日本語は全角、数字・欧文は保守的に0.68emとして配置。見出しを切り捨てない。
const textWidth = (s: string, size: number) => [...s].reduce((sum, c) => sum + (/[\x20-\x7e]/.test(c) ? 0.68 : 1), 0) * size;
function text(s: string, x: number, y: number, size: number, color = INK, maxWidth = WIDTH - x - 32, weight = 700) {
  const fitted = Math.min(size, size * maxWidth / Math.max(textWidth(s, size), 1));
  return `<text x="${x}" y="${y}" font-size="${fitted}" font-weight="${weight}" fill="${color}">${escape(s)}</text>`;
}
const rect = (x: number, y: number, width: number, height: number, fill: string, extra = "") =>
  `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${fill}" ${extra}/>`;

export function prepareStoryData(entries: StoryEntry[]) {
  if (entries.length < 2 || entries.some(e => !Number.isFinite(e.value) || !e.areaCode || !e.areaName)) {
    throw new Error("編集カードには有限値を持つ2地域以上のデータが必要です");
  }
  if (new Set(entries.map(e => e.areaCode)).size !== entries.length) throw new Error("地域コードが重複しています");
  const sorted = [...entries].sort((a, b) => b.value - a.value || a.areaCode.localeCompare(b.areaCode));
  const high = sorted[0];
  const low = sorted[sorted.length - 1];
  const middle = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 ? sorted[middle].value : (sorted[middle - 1].value + sorted[middle].value) / 2;
  return { sorted, high, low, median, highCount: sorted.filter(e => e.value === high.value).length, lowCount: sorted.filter(e => e.value === low.value).length };
}

/** 0を共有する棒。負数は左、正数は右へ伸ばし、比較する全県で同じ尺度を使う。 */
export function barGeometry(value: number, min: number, max: number, x: number, width: number) {
  const lo = Math.min(0, min);
  const hi = Math.max(0, max);
  const scale = (v: number) => x + (v - lo) / (hi - lo || 1) * width;
  const zero = scale(0);
  const end = scale(value);
  return { x: Math.min(zero, end), width: Math.abs(end - zero), zero };
}

export function renderRankingStoryCard(entries: StoryEntry[], opts: StoryOptions): string {
  if (!STORY_LAYOUTS.includes(opts.layout)) throw new Error(`未対応のレイアウト: ${opts.layout}`);
  const { sorted, high, low, median, highCount, lowCount } = prepareStoryData(entries);
  const precision = resolveValuePrecision(sorted.map(e => e.value));
  const fmt = (n: number) => formatValueLabel(n, precision);
  const highLabel = highCount > 1 ? `最大値・同値${highCount}県のうち` : "最大値";
  const lowLabel = lowCount > 1 ? `最小値・同値${lowCount}県のうち` : "最小値";
  const isDark = opts.layout === "spotlight";
  const foreground = isDark ? "#f5f5eb" : INK;
  const secondary = isDark ? "#afc4bd" : MUTED;
  const background = isDark ? INK : opts.layout === "comparison" ? "#f5f0e5" : "#fbfcf8";
  const fragments = [
    rect(0, 0, WIDTH, HEIGHT, background),
    text("都道府県の数字", 32, 31, 13, secondary, 200),
    text(opts.year, 760, 31, 13, secondary, 168),
    text(opts.title, 32, 79, 34, foreground, 896),
    rect(32, 365, 896, 1, isDark ? "#48615b" : "#ccd8cf"),
    text("stats47.jp", 32, 389, 14, foreground, 130),
    text(`出典：${opts.source}`, 200, 389, 11, secondary, 728, 400),
  ];
  const bar = (e: StoryEntry, x: number, y: number, width: number, color: string) => {
    const g = barGeometry(e.value, low.value, high.value, x, width);
    return rect(g.x, y, g.width, 12, color, `data-value="${e.value}"`) + rect(g.zero, y - 3, 1, 18, secondary);
  };

  if (opts.layout === "spotlight") {
    fragments.push(
      rect(32, 109, 4, 224, "#bce17e"),
      text(`${highLabel} / ${high.areaName}`, 53, 135, 21, "#bce17e", 480),
      text(fmt(high.value), 49, 241, 100, foreground, 485),
      text(opts.unit, 55, 281, 25, "#bce17e", 475),
      text(`${sorted.length}県の中で、どこに位置する？`, 53, 332, 16, secondary, 475),
      rect(572, 115, 1, 220, "#48615b"),
      text("全県を比べるための目安", 602, 136, 16, secondary, 326),
      text(`${sorted.length}県の中央値`, 602, 183, 14, secondary, 326),
      text(`${fmt(median)} ${opts.unit}`, 602, 222, 32, foreground, 326),
      text(`${lowLabel} / ${low.areaName}`, 602, 277, 14, secondary, 326),
      text(`${fmt(low.value)} ${opts.unit}`, 602, 316, 32, foreground, 326),
    );
  } else if (opts.layout === "comparison") {
    const cols = [{ entry: high, label: highLabel, x: 32, color: TEAL }, { entry: low, label: lowLabel, x: 510, color: "#8b5035" }];
    for (const { entry, label, x, color } of cols) {
      fragments.push(
        text(label, x, 119, 13, color, 418),
        text(entry.areaName, x, 156, 29, color, 418),
        text(fmt(entry.value), x, 235, 72, color, 418),
        text(opts.unit, x, 266, 20, color, 418),
        bar(entry, x, 281, 418, color),
      );
    }
    const differenceUnit = /^[%％]$/.test(opts.unit.trim()) ? "ポイント" : opts.unit;
    fragments.push(
      rect(479, 116, 1, 178, "#c8cec2"),
      text(`最大値と最小値の差  ${fmt(high.value - low.value)} ${differenceUnit}`, 32, 341, 25, INK, 896),
    );
  } else {
    const plot = { x: 50, y: 180, width: 860, height: 109 };
    const lo = Math.min(0, low.value);
    const hi = Math.max(0, high.value);
    const sy = (v: number) => plot.y + plot.height - (v - lo) / (hi - lo || 1) * plot.height;
    const zero = sy(0);
    const band = plot.width / sorted.length;
    fragments.push(
      text(`${sorted.length}県を大きい順に並べる`, 32, 125, 20, TEAL, 600),
      text(`単位：${opts.unit}`, 720, 125, 14, MUTED, 208),
      text(`${high.areaName}  ${fmt(high.value)}`, 50, 163, 18, TEAL, 405),
      text(`${low.areaName}  ${fmt(low.value)}`, 505, 163, 18, "#8b5035", 405),
      rect(plot.x, zero, plot.width, 1, "#a7b8ac"),
      text("0", 32, zero + 4, 11, MUTED, 16),
    );
    sorted.forEach((e, i) => {
      const end = sy(e.value);
      const color = e.value === high.value ? TEAL : e.value === low.value ? "#8b5035" : "#9cbbb1";
      fragments.push(rect(plot.x + i * band + 1, Math.min(end, zero), Math.max(1, band - 3), Math.abs(end - zero), color, `data-value="${e.value}"`));
    });
    fragments.push(
      text("← 大きい値", 50, 315, 13, MUTED, 400),
      text("小さい値 →", 800, 315, 13, MUTED, 110),
      text(`中央値 ${fmt(median)} ${opts.unit}  /  棒1本が1県・値の大小を比較`, 32, 347, 16, INK, 896),
    );
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-label="${escape(`${opts.title} ${opts.year} ${sorted.length}県比較`)}"><g font-family="${escape(FONT_FAMILY)}">${fragments.join("\n")}</g></svg>`;
}
