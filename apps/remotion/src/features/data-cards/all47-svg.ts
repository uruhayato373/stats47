import { PREF_CAPITAL_COORDS } from '../../../../../packages/migration-flow/src/lib/pref-capitals';
import { CHANGE_TILE_LAYOUT } from './tile-layout';

export interface All47Entry {
  areaCode: string;
  areaName: string;
  value: number;
}
export interface All47Options {
  title: string;
  year: string;
  unit: string;
  source: string;
  note?: string;
  capitalCities?: boolean;
}
const escape = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
const widthOf = (s: string) =>
  [...s].reduce((a, c) => a + (/[\x20-\x7e]/.test(c) ? 0.58 : 1), 0);
const colors = ['#EDF2F1', '#CCDCD8', '#97BAB1', '#4E8C80', '#175F54'];
export function renderAll47TileSvg(
  entries: All47Entry[],
  opts: All47Options
): string {
  const rows = new Map(entries.map((r) => [Number(r.areaCode.slice(0, 2)), r]));
  if (
    entries.length !== 47 ||
    rows.size !== 47 ||
    CHANGE_TILE_LAYOUT.some(([id]) => !rows.has(id)) ||
    entries.some(
      (r) => !/^\d{2}000$/.test(r.areaCode) || !Number.isFinite(r.value)
    )
  )
    throw new Error('全47県タイル図は47県の重複・欠測なし有限値が必要です');
  const values = entries.map((r) => r.value).sort((a, b) => a - b);
  const lo = values[0],
    hi = values.at(-1)!;
  const fmt = (v: number) =>
    v.toLocaleString('ja-JP', { maximumFractionDigits: 2 });
  const text = (
    s: string,
    x: number,
    y: number,
    size: number,
    maxWidth: number,
    color = '#183B48',
    weight = 700
  ) =>
    `<text x="${x}" y="${y}" font-size="${Math.min(size, maxWidth / Math.max(1, widthOf(s)))}" font-weight="${weight}" fill="${color}">${escape(s)}</text>`;
  const tiles = CHANGE_TILE_LAYOUT.map(([id, x, y]) => {
    const r = rows.get(id)!;
    const bin =
      hi === lo ? 2 : Math.min(4, Math.floor(((r.value - lo) / (hi - lo)) * 5));
    const color = bin >= 3 ? '#FFFFFF' : '#183B48';
    const name = opts.capitalCities
      ? (r.areaCode === '13000' ? '東京区部' : PREF_CAPITAL_COORDS[r.areaCode.slice(0, 2)].name)
      : r.areaName === '北海道'
        ? r.areaName
        : r.areaName.replace(/[都府県]$/, '');
    return `<g transform="translate(${60 + x * 80},${302 + y * 80})" data-area="${r.areaCode}" data-value="${r.value}"><rect width="75" height="75" rx="8" fill="${colors[bin]}"/>${text(name, 5, 28, 21, 65, color)}${text(fmt(r.value), 5, 57, 23, 65, color)}</g>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350"><rect width="1080" height="1350" fill="#F8F5EC"/><g font-family="'Noto Sans JP','Hiragino Kaku Gothic ProN',sans-serif">
    ${text('stats47', 52, 90, 36, 180)}${text(opts.capitalCities ? '47都市を見比べる' : '全47都道府県を見比べる', 686, 90, 22, 340)}
    ${text(opts.title, 52, 193, 54, 976)}${text(opts.year, 52, 255, 32, 350)}${text('単位：' + opts.unit, 52, 312, 25, 660)}
    ${text(opts.capitalCities ? 'あなたの街は、どのくらい？' : '自分の県も、隣の県も。', 64, 433, 47, 620)}${text(opts.capitalCities ? '47都市を、一枚で。' : '全47県を、一枚で。', 64, 501, 47, 620)}
    ${text('色が濃いほど値が大きい', 64, 574, 26, 600, '#425965', 400)}
    ${tiles}
    ${text('同じ大きさのタイルで比較', 556, 1023, 24, 464)}
    ${colors.map((c, i) => `<rect x="${556 + i * 80}" y="1050" width="80" height="22" fill="${c}"/>`).join('')}
    ${text(fmt(lo), 556, 1105, 23, 195, '#425965')}${text(fmt(hi), 810, 1105, 23, 210, '#425965')}
    <path d="M60 1209 H1020" stroke="#C9CCC5"/>
    ${text(opts.note || 'タイルは模式図。面積や人口規模を表しません。', 60, 1240, 19, 960, '#425965', 400)}
    ${text('出典：' + opts.source, 60, 1273, 19, 960, '#425965', 400)}
    ${text('値は小数第2位まで表示（必要な桁のみ）。詳しい数値・出典は stats47.jp', 60, 1306, 19, 960, '#425965', 400)}
  </g></svg>`;
}
