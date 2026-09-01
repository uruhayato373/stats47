/**
 * カード内埋め込み用の分布スパークバー (Layer 3 UIミニチャート)。
 * item.json に焼き込まれた分布ビン (builder の binMunicipalityValues 由来) を描くだけの
 * 装飾チャート。カード全体がリンクなので非インタラクティブ・aria-hidden にする
 * (数値情報はカードのテキストが持つ。リンク内に tooltip を置かない)。
 */

export interface MiniDistributionBar {
  count: number;
}

interface Props {
  bins: readonly MiniDistributionBar[];
  className?: string;
}

const WIDTH = 240;
const HEIGHT = 36;
const GAP = 1.5;

export function MiniDistributionBars({ bins, className }: Props) {
  if (bins.length === 0) return null;
  const maxCount = Math.max(1, ...bins.map((bin) => bin.count));
  const slot = WIDTH / bins.length;
  const barWidth = Math.max(1, slot - GAP);

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      width="100%"
      height={HEIGHT}
      aria-hidden
      className={className}
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
  );
}
