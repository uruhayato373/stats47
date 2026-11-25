/**
 * カード内埋め込み用の分布スパークバー (Layer 3 UIミニチャート)。
 * item.json に焼き込まれた分布ビン (builder の binMunicipalityValues 由来) を描くだけの
 * 装飾チャート。カード全体がリンクなので非インタラクティブ・aria-hidden にする
 * (数値情報はカードのテキストが持つ。リンク内に tooltip を置かない)。
 *
 * 棒の下に横軸の両端の値 (最小・最大。裾を畳んだビンは「未満」「以上」) を文字で添える。
 * 軸の無い棒だけでは何の分布か読めなかった (2026-10-31 の週次 UI 検査 other--municipalities-theme)。
 */

import { formatUnitForDisplay } from '@stats47/data-configs/unit';

import {
  distributionEdgeLabels,
  type DistributionEdgeBin,
} from './distribution-edge-labels';

export interface MiniDistributionBar extends DistributionEdgeBin {
  count: number;
}

interface Props {
  bins: readonly MiniDistributionBar[];
  /** 指標の単位 (表示用に整える前の値)。端の値に付ける */
  unit: string;
  className?: string;
}

const WIDTH = 240;
const HEIGHT = 36;
const GAP = 1.5;

export function MiniDistributionBars({ bins, unit, className }: Props) {
  const edges = distributionEdgeLabels(bins, formatUnitForDisplay(unit));
  if (!edges) return null;
  const maxCount = Math.max(1, ...bins.map((bin) => bin.count));
  const slot = WIDTH / bins.length;
  const barWidth = Math.max(1, slot - GAP);

  return (
    <div className={className}>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        width="100%"
        height={HEIGHT}
        aria-hidden
      >
        {bins.map((bin, index) => {
          const height = Math.max(
            bin.count > 0 ? 1.5 : 0,
            (bin.count / maxCount) * (HEIGHT - 2)
          );
          return (
            <rect
              key={index}
              x={slot * index + GAP / 2}
              y={HEIGHT - height}
              width={barWidth}
              height={height}
              fill="hsl(var(--primary) / 0.45)"
            />
          );
        })}
      </svg>
      <p className="mt-1 flex justify-between gap-2 text-xs text-muted-foreground">
        <span>{edges.min}</span>
        <span>{edges.max}</span>
      </p>
    </div>
  );
}
