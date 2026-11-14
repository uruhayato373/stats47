'use client';

/**
 * 全国分布ヒストグラム (Layer 3 UIミニチャート)。
 * サーバー側でビン化済みの集計配列だけを受け取り、生の観測行 (1,700件超) は受け取らない。
 * 選択地域の値はラグ (基線上の縦ティック) で重ねる — 全国件数と地域件数はスケールが
 * 2 桁違うため、同じ y 軸の棒で重ねると地域側が不可視になる。
 */

import { useCallback, useRef } from 'react';

import { formatUnitForDisplay } from "@stats47/data-configs/unit";
import { formatValueWithPrecision } from '@stats47/utils';
import { estimateTextWidth, useD3Tooltip, useReadableFontSize } from '@stats47/visualization';

export interface DistributionHistogramBin {
  x0: number;
  x1: number;
  count: number;
  countInPref: number;
  isOverflow: boolean;
  isUnderflow: boolean;
}

interface Props {
  bins: DistributionHistogramBin[];
  median: number;
  /** データセット全体から解決済みの小数桁 (resolveValuePrecision の結果) */
  precision: number;
  unit: string;
  /** 選択地域のラベル (例: 神奈川県)。未選択時は undefined */
  prefLabel?: string;
  /** 選択地域の値 (ラグ表示用) */
  prefValues?: number[];
  ariaLabel: string;
}

const WIDTH = 640;
const PAD_X = 12;
const PLOT_WIDTH = WIDTH - PAD_X * 2;
const PLOT_HEIGHT = 120;
/** 等倍表示での文字サイズ (viewBox 単位)。縮小表示では画面上で読める大きさまで上げる */
const BASE_FONT_SIZE = 10;
/** 基線から端のラベルの上端までに空ける高さ (ラグの縦ティック 10 + 余白) */
const RUG_SPACE = 14;
/** 中央値のラベルと線・端の間隔 */
const LABEL_GAP = 4;

/**
 * 文字サイズから上下の余白を決める。文字を大きくした分だけ viewBox を縦に伸ばし、棒の高さは変えない。
 * 基準の文字 (10) では従来の余白 (上 16・下 34、viewBox 640×170) になる。
 */
function histogramLayout(fontSize: number) {
  const padTop = fontSize + 6;
  // 端のラベルのベースラインから下端まで (文字の下に出る部分が切れない高さ)
  const labelDescent = Math.max(6, Math.ceil(fontSize * 0.3));
  const padBottom = Math.max(34, Math.ceil(RUG_SPACE + fontSize * 0.85 + labelDescent));
  const baseline = padTop + PLOT_HEIGHT;
  const height = baseline + padBottom;
  return { padTop, baseline, height, edgeLabelY: height - labelDescent };
}

const BAR_FILL = 'hsl(var(--primary) / 0.3)';
const BAR_FILL_PREF = 'hsl(var(--primary))';
const RUG_STROKE = 'hsl(var(--primary))';
const MEDIAN_STROKE = 'hsl(var(--foreground))';
const LABEL_FILL = 'hsl(var(--muted-foreground))';
const AXIS_STROKE = 'hsl(var(--border))';

// 軸端・ビン範囲のスケールラベル。既定丸め (有効 2 桁: 46万 / 2.3万) で十分
const compactFormat = new Intl.NumberFormat('ja-JP', { notation: 'compact' });

/** 値 → x 座標。ビンは等幅スロットで並べ、overflow ビン内は中央に置く */
function valueToX(value: number, bins: DistributionHistogramBin[]): number {
  const slot = PLOT_WIDTH / bins.length;
  for (let i = 0; i < bins.length; i += 1) {
    const bin = bins[i];
    const isLast = i === bins.length - 1;
    if (value < bin.x1 || (isLast && value <= bin.x1)) {
      const span = bin.x1 - bin.x0;
      const fraction =
        bin.isOverflow || bin.isUnderflow
          ? 0.5
          : span > 0
            ? (value - bin.x0) / span
            : 0.5;
      return PAD_X + slot * (i + Math.min(1, Math.max(0, fraction)));
    }
  }
  return PAD_X + PLOT_WIDTH;
}

function binRangeLabel(bin: DistributionHistogramBin, unit: string): string {
  if (bin.isOverflow) return `${compactFormat.format(bin.x0)}${unit} 以上`;
  if (bin.isUnderflow) return `${compactFormat.format(bin.x1)}${unit} 未満`;
  return `${compactFormat.format(bin.x0)}〜${compactFormat.format(bin.x1)}${unit}`;
}

export function DistributionHistogram({
  bins,
  median,
  precision,
  unit: rawUnit,
  prefLabel,
  prefValues = [],
  ariaLabel,
}: Props) {
  const unit = formatUnitForDisplay(rawUnit);
  const svgRef = useRef<SVGSVGElement>(null);
  const { showStackedTooltip, hideTooltip } = useD3Tooltip();
  // 幅 640 の viewBox をスマホの幅に縮めると 10 の文字が約 4px になる。表示幅から文字サイズを逆算する
  const fontSize = useReadableFontSize(svgRef, WIDTH, BASE_FONT_SIZE);
  const { padTop, baseline, height: viewHeight, edgeLabelY } = histogramLayout(fontSize);

  const maxCount = Math.max(1, ...bins.map((bin) => bin.count));
  const slot = PLOT_WIDTH / Math.max(1, bins.length);
  const barWidth = Math.max(1, slot - 1.5);
  const medianX = valueToX(median, bins);

  const handleMove = useCallback(
    (event: React.MouseEvent<SVGSVGElement>) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * WIDTH;
      const index = Math.max(
        0,
        Math.min(bins.length - 1, Math.floor((x - PAD_X) / slot))
      );
      const bin = bins[index];
      if (!bin) return;
      const items = [
        { name: '全国', value: bin.count, color: BAR_FILL_PREF },
        ...(prefLabel
          ? [{ name: prefLabel, value: bin.countInPref, color: RUG_STROKE }]
          : []),
      ];
      showStackedTooltip(event.nativeEvent, binRangeLabel(bin, unit), items, {
        unit: '自治体',
      });
    },
    [bins, slot, unit, prefLabel, showStackedTooltip]
  );

  if (bins.length === 0) return null;

  const medianLabel = `中央値 ${formatValueWithPrecision(median, precision)}${unit}`;
  // 中央値が右寄りのときはラベルを線の左へ回す (右端で切らない)
  const medianLabelOnLeft =
    medianX + LABEL_GAP + estimateTextWidth(medianLabel, fontSize) > WIDTH - PAD_X;

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${WIDTH} ${viewHeight}`}
      width="100%"
      role="img"
      aria-label={ariaLabel}
      onMouseMove={handleMove}
      onMouseLeave={hideTooltip}
    >
      {/* 全国の度数 */}
      {bins.map((bin, index) => {
        const height = (bin.count / maxCount) * PLOT_HEIGHT;
        return (
          <rect
            key={`bar-${index}`}
            x={PAD_X + slot * index + (slot - barWidth) / 2}
            y={baseline - height}
            width={barWidth}
            height={height}
            fill={bin.countInPref > 0 ? BAR_FILL_PREF : BAR_FILL}
            opacity={bin.countInPref > 0 ? 0.55 : 1}
          />
        );
      })}

      {/* 選択地域のラグ (基線上の縦ティック) */}
      {prefValues.map((value, index) => (
        <line
          key={`rug-${index}`}
          x1={valueToX(value, bins)}
          x2={valueToX(value, bins)}
          y1={baseline + 2}
          y2={baseline + 10}
          stroke={RUG_STROKE}
          strokeWidth={1.5}
        />
      ))}

      {/* 中央値 */}
      <line
        x1={medianX}
        x2={medianX}
        y1={padTop - 4}
        y2={baseline}
        stroke={MEDIAN_STROKE}
        strokeWidth={1}
        strokeDasharray="4 3"
        opacity={0.6}
      />
      <text
        x={medianLabelOnLeft ? medianX - LABEL_GAP : medianX + LABEL_GAP}
        y={padTop + 6}
        fontSize={fontSize}
        fill={LABEL_FILL}
        textAnchor={medianLabelOnLeft ? 'end' : 'start'}
      >
        {medianLabel}
      </text>

      {/* 基線と端ラベル */}
      <line
        x1={PAD_X}
        x2={PAD_X + PLOT_WIDTH}
        y1={baseline}
        y2={baseline}
        stroke={AXIS_STROKE}
      />
      <text x={PAD_X} y={edgeLabelY} fontSize={fontSize} fill={LABEL_FILL} textAnchor="start">
        {bins[0].isUnderflow
          ? `${compactFormat.format(bins[0].x1)}${unit} 未満`
          : `${compactFormat.format(bins[0].x0)}${unit}`}
      </text>
      <text
        x={PAD_X + PLOT_WIDTH}
        y={edgeLabelY}
        fontSize={fontSize}
        fill={LABEL_FILL}
        textAnchor="end"
      >
        {bins.at(-1)!.isOverflow
          ? `${compactFormat.format(bins.at(-1)!.x0)}${unit} 以上`
          : `${compactFormat.format(bins.at(-1)!.x1)}${unit}`}
      </text>
    </svg>
  );
}
