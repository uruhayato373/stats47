/**
 * カード内埋め込み用の分布スパークバー (Layer 3 UIミニチャート)。
 * item.json に焼き込まれた分布ビン (builder の binMunicipalityValues 由来) を描くだけの
 * 装飾チャート。カード全体がリンクなので非インタラクティブ・aria-hidden にする
 * (数値情報はカードのテキストが持つ。リンク内に tooltip を置かない)。
 *
 * テーマの数値タイルでは 47 都道府県の値を順位の順に 1 本ずつ並べ、`highlightIndex` の 1 本だけを濃く塗って
 * 「47 の中のどこにいるか」を描く (2026-10-31)。負の値は 0 の線から下へ伸ばす。`label` を渡すと読み上げの名前を持つ図になる。
 */

export interface MiniDistributionBar {
  count: number;
}

interface Props {
  bins: readonly MiniDistributionBar[];
  className?: string;
  /** 濃く塗る 1 本 (0 始まり)。無ければ全部同じ色 */
  highlightIndex?: number;
  /** 読み上げの名前。無ければ装飾として読み上げから外す */
  label?: string;
}

const WIDTH = 240;
const HEIGHT = 36;
const GAP = 1.5;

export function MiniDistributionBars({ bins, className, highlightIndex, label }: Props) {
  if (bins.length === 0) return null;
  const top = Math.max(0, ...bins.map((bin) => bin.count));
  const bottom = Math.min(0, ...bins.map((bin) => bin.count));
  const span = Math.max(1e-9, top - bottom);
  const scale = (HEIGHT - 2) / span;
  // 0 の線の位置 (全部 0 以上なら下端)
  const baseline = HEIGHT + bottom * scale;
  const slot = WIDTH / bins.length;
  const barWidth = Math.max(1, slot - GAP);

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      width="100%"
      height={HEIGHT}
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
      className={className}
    >
      {bins.map((bin, index) => {
        const height = Math.max(bin.count !== 0 ? 1.5 : 0, Math.abs(bin.count) * scale);
        const isHighlight = index === highlightIndex;
        return (
          <rect
            key={index}
            x={slot * index + GAP / 2}
            y={bin.count >= 0 ? baseline - height : baseline}
            width={barWidth}
            height={height}
            fill={
              highlightIndex === undefined
                ? 'hsl(var(--primary) / 0.45)'
                : isHighlight
                  ? 'hsl(var(--primary))'
                  : 'hsl(var(--muted-foreground) / 0.25)'
            }
            data-highlight={isHighlight || undefined}
          />
        );
      })}
    </svg>
  );
}
