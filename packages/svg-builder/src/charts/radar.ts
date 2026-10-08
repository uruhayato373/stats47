/**
 * レーダーチャート SVG 生成
 *
 * 軸ごとに 0〜1 へ正規化済みの値を受け取り、1〜3 系列の多角形を重ねた静的 SVG を返す。
 * 正規化と反転は呼び元の責務 (どの向きを外側にするかは指標の意味で決まり、ここでは判断できない)。
 * 参照系列 (47 都道府県の中央値など) は破線の灰色で描き、「外側か内側か」を他県比で読めるようにする。
 */

import { FONT_FAMILY, PALETTES, type PaletteName } from '../shared/color';
import { px } from '../shared/layout';
import { svgThemeStyle } from '../shared/theme';

export interface RadarAxis {
  key: string;
  label: string;
}

export interface RadarSeries {
  name: string;
  /** 軸 key → 0〜1 の正規化値。全軸ぶん必須 */
  values: Record<string, number>;
  /** 系列の色。参照系列では無視する */
  palette?: PaletteName;
  /** 参照系列 (中央値など)。破線・塗りなしの灰色で描く */
  reference?: boolean;
}

export interface RadarOptions {
  title: string;
  /** アクセシビリティ用 <desc>。画面には出さない */
  subtitle?: string;
  ariaLabel?: string;
}

/** キャンバス (blog-svg-chart-standards.md §5)。散布図・タイルマップと同じ 720×720。 */
export const RADAR_CANVAS = { w: 720, h: 720 } as const;

const GRID_LEVELS = [0.2, 0.4, 0.6, 0.8, 1.0];
const MAX_SERIES = 3;
const REFERENCE_COLOR = '#64748b';

function seriesColor(series: RadarSeries, index: number): string {
  if (series.reference) return REFERENCE_COLOR;
  const fallback: PaletteName[] = ['blue', 'red', 'green'];
  return PALETTES[series.palette ?? fallback[index % fallback.length]][0];
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * レーダーチャート SVG を生成する。
 * 値が 0〜1 の有限数でない、軸が 3 未満、系列が 1〜3 でない入力は描かずに例外にする
 * (欠けた値を 0 として描くと、データの欠損が「最小」に見えるため)。
 */
export function generateRadarSvg(
  axes: RadarAxis[],
  series: RadarSeries[],
  options: RadarOptions
): string {
  const { title, subtitle, ariaLabel = title } = options;
  if (axes.length < 3) throw new Error(`radar: 軸は 3 つ以上必要 (${axes.length})`);
  const drawn = series.filter((s) => !s.reference);
  if (drawn.length < 1 || series.length > MAX_SERIES + 1 || drawn.length > MAX_SERIES) {
    throw new Error(`radar: 描く系列は 1〜${MAX_SERIES} (参照系列を除く)`);
  }
  for (const s of series) {
    for (const axis of axes) {
      const v = s.values[axis.key];
      if (typeof v !== 'number' || !Number.isFinite(v) || v < 0 || v > 1) {
        throw new Error(`radar: ${s.name} の ${axis.key} が 0〜1 の数でない (${String(v)})`);
      }
    }
  }

  const { w: W, h: H } = RADAR_CANVAS;
  const CX = W / 2;
  const CY = 392;
  const R = 220;
  const N = axes.length;
  const angleOf = (i: number) => (Math.PI * 2 * i) / N - Math.PI / 2;
  const point = (i: number, r: number) => ({
    x: CX + Math.cos(angleOf(i)) * r,
    y: CY + Math.sin(angleOf(i)) * r,
  });

  const grid = GRID_LEVELS.map(
    (level) =>
      `  <circle cx="${CX}" cy="${CY}" r="${px(R * level)}" fill="none" class="svg-grid" stroke-width="1"/>`
  );
  // 目盛りの数字は軸線と頂点の値に重ならないよう、最初の 2 軸の間に置く
  const gridLabelAngle = angleOf(0) + Math.PI / N;
  const gridLabels = GRID_LEVELS.map((level) => {
    const x = CX + Math.cos(gridLabelAngle) * R * level;
    const y = CY + Math.sin(gridLabelAngle) * R * level;
    return `  <text x="${px(x)}" y="${px(y)}" text-anchor="middle" dominant-baseline="middle" font-size="10" class="svg-tick">${level.toFixed(1)}</text>`;
  });

  const axisLines = axes.map((_, i) => {
    const p = point(i, R);
    return `  <line x1="${CX}" y1="${CY}" x2="${px(p.x)}" y2="${px(p.y)}" class="svg-grid" stroke-width="1"/>`;
  });
  const axisLabels = axes.map((axis, i) => {
    const p = point(i, R + 36);
    const cos = Math.cos(angleOf(i));
    const anchor = Math.abs(cos) < 0.2 ? 'middle' : cos > 0 ? 'start' : 'end';
    return `  <text x="${px(p.x)}" y="${px(p.y)}" text-anchor="${anchor}" dominant-baseline="middle" font-size="14" class="svg-axis">${escapeXml(axis.label)}</text>`;
  });

  // 参照系列を先に描き、データ系列をその上に重ねる
  const ordered = [...series].sort((a, b) => Number(Boolean(b.reference)) - Number(Boolean(a.reference)));
  const polygons = ordered.map((s) => {
    const color = seriesColor(s, drawn.indexOf(s));
    const pts = axes
      .map((axis, i) => {
        const p = point(i, R * s.values[axis.key]);
        return `${px(p.x)},${px(p.y)}`;
      })
      .join(' ');
    const tooltip = axes
      .map((axis) => `${axis.label} ${s.values[axis.key].toFixed(2)}`)
      .join(' / ');
    if (s.reference) {
      return `  <polygon points="${pts}" fill="none" stroke="${color}" stroke-width="2" stroke-dasharray="6 4"><title>${escapeXml(`${s.name}：${tooltip}`)}</title></polygon>`;
    }
    const dots = axes.map((axis, i) => {
      const p = point(i, R * s.values[axis.key]);
      return `  <circle cx="${px(p.x)}" cy="${px(p.y)}" r="4" fill="${color}"/>`;
    });
    return [
      `  <polygon points="${pts}" fill="${color}" fill-opacity="0.22" stroke="${color}" stroke-width="2.5"><title>${escapeXml(`${s.name}：${tooltip}`)}</title></polygon>`,
      ...dots,
    ].join('\n');
  });

  // 単一系列のときだけ頂点に値を書く (重ね描きでは数字が被るため)
  const valueLabels =
    drawn.length === 1
      ? axes.map((axis, i) => {
          const v = drawn[0].values[axis.key];
          // 外周に近い値は多角形の内側に書き、軸ラベルと重ねない
          const p = point(i, v > 0.85 ? R * v - 18 : R * v + 16);
          return `  <text x="${px(p.x)}" y="${px(p.y)}" text-anchor="middle" dominant-baseline="middle" font-size="12" font-weight="bold" fill="${seriesColor(drawn[0], 0)}">${v.toFixed(2)}</text>`;
        })
      : [];

  const legend = series.map((s, i) => {
    const y = 58 + i * 22;
    const color = seriesColor(s, drawn.indexOf(s));
    const swatch = s.reference
      ? `<line x1="24" y1="${y}" x2="44" y2="${y}" stroke="${color}" stroke-width="2" stroke-dasharray="6 4"/>`
      : `<rect x="24" y="${y - 7}" width="20" height="14" fill="${color}" fill-opacity="0.5" stroke="${color}" stroke-width="2"/>`;
    return `  ${swatch}\n  <text x="52" y="${y}" dominant-baseline="middle" font-size="13" class="svg-axis">${escapeXml(s.name)}</text>`;
  });

  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" font-family="${FONT_FAMILY}" role="img" aria-label="${escapeXml(ariaLabel)}">
  <title>${escapeXml(title)}</title>
  ${subtitle ? `<desc>${escapeXml(subtitle)}</desc>` : ''}
${svgThemeStyle()}
  <rect width="${W}" height="${H}" class="svg-bg"/>
  <text x="${W / 2}" y="28" text-anchor="middle" font-size="16" font-weight="bold" class="svg-title">${escapeXml(title)}</text>
  <!-- 凡例 -->
${legend.join('\n')}
  <!-- グリッド -->
${grid.join('\n')}
${axisLines.join('\n')}
${gridLabels.join('\n')}
  <!-- 軸ラベル -->
${axisLabels.join('\n')}
  <!-- 系列 -->
${polygons.join('\n')}
${valueLabels.join('\n')}
</svg>`;
}
