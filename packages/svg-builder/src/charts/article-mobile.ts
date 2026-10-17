/** Opt-in article prototypes. Fixed values; separate from the canonical Web/SNS renderers. */
import { FONT_FAMILY, SCATTER_COLORS } from '../shared/color';
import { paddedRange, linearScale, niceTicks, formatTick } from '../shared/axis';
import { linearRegression } from '../shared/regression';
import type { ScatterPoint } from './scatter';

const WIDTH = 640;
const HEIGHT = 960;
const INK = '#1e293b';
const MUTED = '#475569';
const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const text = (x: number, y: number, value: string, size = 26, anchor = 'start', bold = false) =>
  `<text x="${x}" y="${y}" font-size="${size}" text-anchor="${anchor}" fill="${INK}"${bold ? ' font-weight="700"' : ''}>${escape(value)}</text>`;
function lines(value: string, maxCharacters: number, maxLines: number): string[] {
  const result = value.split('\n').flatMap(line => {
    const chars = Array.from(line), rows: string[] = [];
    while (chars.length) rows.push(chars.splice(0, maxCharacters).join(''));
    return rows;
  });
  if (result.length > maxLines) throw Error('Mobile chart copy exceeds its readable area; shorten the copy.');
  return result;
}
function frame(title: string, subtitle: string, content: string): string {
  const heading = lines(title, 18, 2).map((line, i) => text(24, 46 + i * 38, line, 32, 'start', true)).join('\n');
  if (subtitle.length > 27) throw Error('Mobile chart subtitle is too long.');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" font-family="${FONT_FAMILY}" role="img" aria-label="${escape(title)}">
<title>${escape(title)}</title><desc>${escape(subtitle)}</desc>
<rect width="640" height="960" fill="white"/>
${heading}${text(24, 116, subtitle, 24)}
${content}
</svg>`;
}
function assertPrefectures(rows: { code: string }[]) {
  const codes = rows.map(r => r.code.slice(0, 2));
  if (rows.length !== 47 || new Set(codes).size !== 47 || codes.some(c => !/^(0[1-9]|[1-3][0-9]|4[0-7])$/.test(c)))
    throw Error('The mobile prototype requires all 47 unique prefectures.');
}

export interface MobileScatterOptions {
  title: string;
  subtitle: string;
  /** Two horizontal lines maximum. Include unit and observation year. */
  xLabel: string;
  yLabel: string;
  /** At most two article-mentioned prefectures, numbered in the plot and named below. */
  focusNames: string[];
}
export function generateMobileScatterSvg(points: ScatterPoint[], options: MobileScatterOptions): string {
  assertPrefectures(points);
  if (points.some(p => !p.name || !Number.isFinite(p.x) || !Number.isFinite(p.y))) throw Error('Invalid scatter values.');
  if (options.focusNames.length > 2 || new Set(options.focusNames).size !== options.focusNames.length || options.focusNames.some(n => !points.some(p => p.name === n)))
    throw Error('Select up to two existing prefectures.');
  const plot = { left: 92, right: 604, top: 200, bottom: 712 };
  const xr = paddedRange(points.map(p => p.x)), yr = paddedRange(points.map(p => p.y), 0.08);
  if (xr.lo === xr.hi || yr.lo === yr.hi) throw Error('A scatter comparison needs variation on both axes.');
  const sx = linearScale(xr.lo, xr.hi, plot.left, plot.right), sy = linearScale(yr.lo, yr.hi, plot.bottom, plot.top);
  const content: string[] = [];
  lines(options.yLabel, 23, 2).forEach((s, i) => content.push(text(24, 155 + i * 30, s)));
  content.push(`<rect x="92" y="200" width="512" height="512" fill="#f8fafc" stroke="#cbd5e1"/>`);
  for (const v of niceTicks(xr.lo, xr.hi, 4)) {
    const x = sx(v);
    content.push(`<line x1="${x}" y1="200" x2="${x}" y2="712" stroke="#e2e8f0"/>`, text(x, 746, formatTick(v), 24, 'middle'));
  }
  for (const v of niceTicks(yr.lo, yr.hi, 4)) {
    const y = sy(v);
    content.push(`<line x1="92" y1="${y}" x2="604" y2="${y}" stroke="#e2e8f0"/>`, text(80, y + 8, formatTick(v), 24, 'end'));
  }
  const reg = linearRegression(points);
  content.push(`<defs><clipPath id="mobile-scatter-plot"><rect x="92" y="200" width="512" height="512"/></clipPath></defs>`);
  content.push(`<line x1="92" y1="${sy(reg.slope * xr.lo + reg.intercept)}" x2="604" y2="${sy(reg.slope * xr.hi + reg.intercept)}" stroke="#64748b" stroke-width="2" stroke-dasharray="8 5" clip-path="url(#mobile-scatter-plot)"/>`);
  for (const p of points) content.push(`<circle data-pref="${p.code}" cx="${sx(p.x)}" cy="${sy(p.y)}" r="6" fill="${SCATTER_COLORS.mid.fill}" stroke="${SCATTER_COLORS.mid.stroke}"><title>${escape(p.name)}: X=${p.x}, Y=${p.y}</title></circle>`);
  options.focusNames.forEach((name, i) => {
    const p = points.find(p => p.name === name)!;
    const cx = sx(p.x), cy = sy(p.y);
    const bx = Math.max(plot.left + 18, Math.min(plot.right - 18, cx + 28));
    const by = Math.max(plot.top + 18, cy - 30);
    content.push(`<circle cx="${cx}" cy="${cy}" r="10" fill="none" stroke="${INK}" stroke-width="3"/>`,
      `<line x1="${cx}" y1="${cy}" x2="${bx}" y2="${by}" stroke="${INK}" stroke-width="2"/>`,
      `<circle cx="${bx}" cy="${by}" r="18" fill="white" stroke="${INK}" stroke-width="2"/>`, text(bx, by + 9, String(i + 1), 26, 'middle', true),
      text(24, 859 + i * 38, `${i + 1} ${name}  X=${p.x} / Y=${p.y}`, 26, 'start', true));
  });
  lines(options.xLabel, 23, 2).forEach((s, i) => content.push(text(320, 787 + i * 30, s, 26, 'middle')));
  content.push(text(24, 940, '47都道府県・点線は回帰線（因果を示さない）', 22));
  return frame(options.title, options.subtitle, content.join('\n'));
}

export interface MobileMapRegion {
  code: string;
  name: string;
  value: number;
  /** Real geographic geometry, projected by the shared map utility. */
  path: string;
  fill: string;
}
export interface MobileMapOptions {
  title: string;
  subtitle: string;
  unit: string;
  /** Same continuous scale and exact domain used to color the geographic paths. */
  legend: { min: number; max: number; colors: string[] };
  focusCodes: string[];
}
export function generateMobileMapSvg(regions: MobileMapRegion[], options: MobileMapOptions): string {
  assertPrefectures(regions);
  if (regions.some(r => !r.path || !/^[MmLlHhVvCcSsQqTtAaZz0-9.,eE+\s-]+$/.test(r.path) || !Number.isFinite(r.value) || !/^(#[a-f\d]{6}|rgb\([\d.,%\s]+\))$/i.test(r.fill))) throw Error('Invalid map path or value.');
  const { min, max, colors } = options.legend;
  if (!Number.isFinite(min) || !Number.isFinite(max) || max < min || min !== Math.min(...regions.map(r => r.value)) || max !== Math.max(...regions.map(r => r.value)) || colors.length < 2 || colors.some(c => !/^(#[a-f\d]{6}|rgb\([\d.,%\s]+\))$/i.test(c))) throw Error('Map legend must match its complete value domain.');
  if (options.focusCodes.length !== 2 || options.focusCodes.some(c => !regions.some(r => r.code === c))) throw Error('Select two existing map regions.');
  if (regions.find(r => r.code === options.focusCodes[0])!.value !== max || regions.find(r => r.code === options.focusCodes[1])!.value !== min) throw Error('Maximum and minimum callouts must match the numeric data.');
  const content = [
    ...regions.map(r => `<path data-pref="${r.code}" d="${r.path}" fill="${r.fill}" stroke="#64748b" stroke-width="0.7"><title>${escape(r.name)} ${r.value}${escape(options.unit)}</title></path>`),
    ...regions.filter(r => options.focusCodes.includes(r.code)).map(r => `<path d="${r.path}" fill="none" stroke="${INK}" stroke-width="2"/>`),
    `<rect x="24" y="552" width="180" height="96" fill="none" stroke="#94a3b8" stroke-dasharray="5 4"/>`,
    text(24, 684, '沖縄は別枠・同じ色の尺度', 24),
    `<defs><linearGradient id="mobile-map-legend">${colors.map((c, i) => `<stop offset="${i / (colors.length - 1)}" stop-color="${c}"/>`).join('')}</linearGradient></defs>`,
    `<rect x="24" y="710" width="592" height="28" fill="url(#mobile-map-legend)" stroke="#94a3b8"/>`,
    text(24, 776, `${min} ${options.unit}`, 28, 'start', true),
    text(616, 776, `${max} ${options.unit}`, 28, 'end', true),
    text(320, 811, '低い ← 値の大きさ → 高い', 24, 'middle'),
  ];
  options.focusCodes.forEach((code, i) => {
    const r = regions.find(r => r.code === code)!;
    content.push(text(24, 866 + i * 44, `${i === 0 ? '最大' : '最小'}  ${r.name}`, 28, 'start', true), text(616, 866 + i * 44, `${r.value} ${options.unit}`, 30, 'end', true));
  });
  content.push(`<text x="24" y="946" font-size="22" fill="${MUTED}">47都道府県・色は最小値〜最大値の連続尺度</text>`);
  return frame(options.title, options.subtitle, content.join('\n'));
}
