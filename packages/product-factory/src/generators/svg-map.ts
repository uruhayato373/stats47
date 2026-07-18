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

export function renderChoroplethSvg(geo: PrefectureGeometry, spec: ChoroplethSpec, opts: SvgMapOptions): string {
  const width = opts.width;
  const titleH = opts.title ? 46 : 8;
  const footerH = opts.footer ? 26 : 8;
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
  const title = opts.title
    ? `<text x="${width / 2}" y="30" text-anchor="middle" ${font} font-size="22" font-weight="700" fill="${BRAND.text}">${escapeXml(opts.title)}</text>`
    : "";
  const footer = opts.footer
    ? `<text x="10" y="${height - 9}" ${font} font-size="12" fill="${BRAND.subtext}">${escapeXml(opts.footer)}</text>`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"><rect width="${width}" height="${height}" fill="${BRAND.cardBg}"/>${title}${paths}${footer}</svg>`;
}
