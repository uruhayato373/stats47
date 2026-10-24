/**
 * コロプレス地図の SVG レンダラ (プレビュー PNG 用)。geometry + ChoroplethSpec → SVG 文字列。
 * PPTX 側は custGeom shape を直接使う (本 SVG はプレビュー/サムネイル生成用)。
 */
import type { PrefectureGeometry } from "../maps/prefecture-geometry";
import type { ChoroplethSpec } from "../charts/chart-spec";
import { BRAND } from "../design/tokens";

function escapeXml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c);
}

export interface SvgMapOptions {
  readonly width: number;
  readonly title?: string;
  readonly footer?: string;
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
      return `<path d="${d}" fill="${fill}" stroke="${BRAND.mapBorder}" stroke-width="0.5"/>`;
    })
    .join("");

  const font = `font-family="'Hiragino Kaku Gothic ProN','Noto Sans JP',sans-serif"`;
  const title = titleLines.map((line, index) =>
    `<text x="${width / 2}" y="${30 + index * 26}" text-anchor="middle" ${font} font-size="20" font-weight="700" fill="${BRAND.text}">${escapeXml(line)}</text>`,
  ).join("");
  const footer = footerLines.map((line, index) =>
    `<text x="10" y="${height - footerH + 16 + index * 17}" ${font} font-size="12" fill="${BRAND.subtext}">${escapeXml(line)}</text>`,
  ).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"><rect width="${width}" height="${height}" fill="${BRAND.cardBg}"/>${title}${paths}${footer}</svg>`;
}
