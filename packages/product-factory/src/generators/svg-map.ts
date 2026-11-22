/**
 * コロプレス地図の SVG レンダラ (プレビュー PNG 用)。geometry + ChoroplethSpec → SVG 文字列。
 * PPTX 側は custGeom shape を直接使う (本 SVG はプレビュー/サムネイル生成用)。
 */
import type { PrefectureGeometry } from "../maps/prefecture-geometry";
import type { ChoroplethSpec, LegendEntry } from "../charts/chart-spec";
import { PREFECTURE_BY_CODE5 } from "../data/prefectures";
import { BRAND } from "../design/tokens";

function escapeXml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c);
}

export interface SvgMapOptions {
  readonly width: number;
  readonly title?: string;
  readonly footer?: string;
  /**
   * 編集用: 県ごとの図形に id (`pref-<5桁コード>`)・data-code・<title>(県名と値) を付ける。
   * Illustrator / Inkscape / PowerPoint の SVG 取り込みで県を選んで色を変えられるようにする。
   */
  readonly editable?: boolean;
  /** 凡例 (地図の左上の余白に置く)。 */
  readonly legend?: { readonly title: string; readonly entries: readonly LegendEntry[]; readonly note?: string };
}

function wrapText(value: string, maxUnits: number): string[] {
  const lines: string[] = [];
  let line = "";
  let units = 0;
  for (const char of value) {
    const width = /[\u0000-\u007f]/.test(char) ? 0.55 : 1;
    if (line && units + width > maxUnits) {
      lines.push(line);
      line = "";
      units = 0;
    }
    line += char;
    units += width;
  }
  if (line) lines.push(line);
  return lines;
}

export function renderChoroplethSvg(geo: PrefectureGeometry, spec: ChoroplethSpec, opts: SvgMapOptions): string {
  const width = opts.width;
  const titleLines = opts.title ? wrapText(opts.title, (width - 24) / 20) : [];
  const footerLines = opts.footer ? wrapText(opts.footer, (width - 20) / 12) : [];
  const titleH = titleLines.length ? titleLines.length * 26 + 12 : 8;
  const footerH = footerLines.length ? footerLines.length * 17 + 8 : 8;
  const scale = (width - 16) / geo.width;
  const mapH = geo.height * scale;
  const height = Math.round(titleH + mapH + footerH);
  const colorByCode = new Map(spec.bins.map((b) => [b.code5, b.color]));
  const valueByCode = new Map(spec.bins.map((b) => [b.code5, b.value]));

  const paths = geo.shapes
    .map((s) => {
      const d = s.rings
        .map(
          (ring) =>
            "M" +
            ring.map((p) => `${(8 + p.x * scale).toFixed(1)},${(titleH + p.y * scale).toFixed(1)}`).join("L") +
            "Z",
        )
        .join(" ");
      const fill = colorByCode.get(s.code5) ?? BRAND.mapNoData;
      if (!opts.editable) return `<path d="${d}" fill="${fill}" stroke="${BRAND.mapBorder}" stroke-width="0.5"/>`;
      const name = PREFECTURE_BY_CODE5.get(s.code5)?.name ?? s.code5;
      const value = valueByCode.get(s.code5);
      const tip = value === null || value === undefined ? `${name}：値なし` : `${name}：${value.toLocaleString("ja-JP")}`;
      return `<path id="pref-${s.code5}" data-code="${s.code5}" d="${d}" fill="${fill}" stroke="${BRAND.mapBorder}" stroke-width="0.5"><title>${escapeXml(tip)}</title></path>`;
    })
    .join("");

  const font = `font-family="'Hiragino Kaku Gothic ProN','Noto Sans JP',sans-serif"`;
  const title = titleLines.map((line, index) =>
    `<text x="${width / 2}" y="${30 + index * 26}" text-anchor="middle" ${font} font-size="20" font-weight="700" fill="${BRAND.text}">${escapeXml(line)}</text>`,
  ).join("");
  const footer = footerLines.map((line, index) =>
    `<text x="10" y="${height - footerH + 16 + index * 17}" ${font} font-size="12" fill="${BRAND.subtext}">${escapeXml(line)}</text>`,
  ).join("");

  const legend = opts.legend ? renderLegend(opts.legend, titleH, font) : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"><rect width="${width}" height="${height}" fill="${BRAND.cardBg}"/>${title}${editableWrap(paths, opts.editable === true)}${legend}${footer}</svg>`;
}

function editableWrap(paths: string, editable: boolean): string {
  return editable ? `<g id="prefectures">${paths}</g>` : paths;
}

const LEGEND_ROW_H = 20;

/** 地図の左上の余白に置く凡例。県の形と重ならないよう、日本地図の左上 (日本海側の海) を使う。 */
function renderLegend(legend: NonNullable<SvgMapOptions["legend"]>, titleH: number, font: string): string {
  const x = 14;
  const y0 = titleH + 14;
  const rows = legend.entries
    .map((e, i) => {
      const y = y0 + 22 + i * LEGEND_ROW_H;
      return `<rect x="${x}" y="${y - 12}" width="16" height="14" fill="${e.color}" stroke="${BRAND.mapBorder}" stroke-width="0.5"/><text x="${x + 24}" y="${y}" ${font} font-size="12" fill="${BRAND.text}">${escapeXml(e.label)}</text>`;
    })
    .join("");
  const noteY = y0 + 22 + legend.entries.length * LEGEND_ROW_H + 4;
  const note = legend.note
    ? `<text x="${x}" y="${noteY}" ${font} font-size="10" fill="${BRAND.subtext}">${escapeXml(legend.note)}</text>`
    : "";
  return `<g id="legend"><text x="${x}" y="${y0 + 4}" ${font} font-size="12" font-weight="700" fill="${BRAND.text}">${escapeXml(legend.title)}</text>${rows}${note}</g>`;
}
