import { lookupArea } from "@stats47/area";
import { cn } from "@stats47/components";
import { formatValueWithPrecision, resolveValuePrecision } from "@stats47/utils";

export interface RankingBarListItem {
  key: string;
  label?: string;
  areaCode?: string;
  value: number;
  rank?: number | null;
  highlighted?: boolean;
  tone?: "primary" | "top" | "bottom" | "muted";
}

interface RankingBarListProps {
  items: RankingBarListItem[];
  /** 目盛りの上端。既定は items の最大値と 0 の大きい方 */
  max?: number;
  /**
   * 目盛りの下端。既定は items の最小値と 0 の小さい方。
   * 負の値があると 0 を基準線にして左へ伸ばす。絶対値の長さで右へ描くと、
   * 人口増減率 -18.7 の県の棒が 2 位より長く見え、大小を逆に読ませていた (2026-09-25)。
   * 別リストと目盛りを揃えるときは max と同じく呼び元が渡す。
   */
  min?: number;
  unit?: string;
  showRank?: boolean;
  /**
   * 小数桁の**上限**。実際の桁数は items 全体から 1 度だけ解決する
   * (この上限で頭打ちにする)。上限だけを指定していた旧実装は、同じリストの中で
   * 「2,309」と「2,285.4」が混ざっていた — 44.0 は number では 44 なので、
   * max 指定だけでは整数値の小数が消えるため (2026-07-31)。
   */
  valueMaximumFractionDigits?: number;
  className?: string;
  rowClassName?: string;
  labelClassName?: string;
  barClassName?: string;
  valueClassName?: string;
}

const TONE_BAR_CLASS = {
  primary: "bg-primary/70",
  top: "bg-info",
  bottom: "bg-muted-foreground",
  muted: "bg-muted-foreground/60",
} satisfies Record<NonNullable<RankingBarListItem["tone"]>, string>;

export function RankingBarList({
  items,
  max,
  min,
  unit = "",
  showRank = false,
  valueMaximumFractionDigits = 0,
  className,
  rowClassName,
  labelClassName,
  barClassName,
  valueClassName,
}: RankingBarListProps) {
  const values = items.map((item) => item.value);
  const scale = {
    min: min ?? Math.min(0, ...values),
    max: max ?? Math.max(0, ...values),
  };
  // 桁数は 1 つの値では決まらずデータセット全体で決まる。上限を超えない範囲で
  // items から 1 度だけ解決し、全行に同じ桁数を使う。
  const precision = resolveValuePrecision(
    items.map((item) => item.value),
    valueMaximumFractionDigits,
  );

  return (
    <div className={cn("space-y-1", className)}>
      {items.map((item) => (
        <RankingBarRow
          key={item.key}
          item={item}
          scale={scale}
          unit={unit}
          showRank={showRank}
          precision={precision}
          rowClassName={rowClassName}
          labelClassName={labelClassName}
          barClassName={barClassName}
          valueClassName={valueClassName}
        />
      ))}
    </div>
  );
}

function RankingBarRow({
  item,
  scale,
  unit,
  showRank,
  precision,
  rowClassName,
  labelClassName,
  barClassName,
  valueClassName,
}: {
  item: RankingBarListItem;
  scale: { min: number; max: number };
  unit: string;
  showRank: boolean;
  precision: number;
  rowClassName?: string;
  labelClassName?: string;
  barClassName?: string;
  valueClassName?: string;
}) {
  const label = item.label ?? (item.areaCode ? lookupArea(item.areaCode)?.areaName : null) ?? item.areaCode ?? "";
  const bar = barGeometry(item.value, scale);
  const toneBarClassName = TONE_BAR_CLASS[item.tone ?? "primary"];

  return (
    <div
      className={cn(
        "flex items-center gap-2 text-xs",
        item.highlighted && "font-semibold",
        rowClassName,
      )}
    >
      {showRank && (
        <span className="w-6 shrink-0 text-right text-muted-foreground tabular-nums">
          {item.rank ?? "—"}
        </span>
      )}
      <span className={cn("w-14 shrink-0 truncate", labelClassName)}>
        {label}
      </span>
      <div className={cn("relative h-3 flex-1 overflow-hidden rounded-sm bg-muted", barClassName)}>
        <div
          className={cn("absolute inset-y-0", toneBarClassName)}
          style={{ left: `${bar.leftPercent}%`, width: `${bar.widthPercent}%` }}
        />
        {bar.zeroPercent > 0 && (
          <div
            aria-hidden="true"
            data-testid="ranking-bar-zero-line"
            className="absolute inset-y-0 w-px bg-foreground/40"
            style={{ left: `${bar.zeroPercent}%` }}
          />
        )}
      </div>
      <span className={cn("w-20 shrink-0 text-right tabular-nums", valueClassName)}>
        {formatValueWithPrecision(item.value, precision)}
        {unit && (
          <span className="ml-0.5 font-normal text-muted-foreground">
            {unit}
          </span>
        )}
      </span>
    </div>
  );
}

/** 0 を基準に、正の値は右へ・負の値は左へ伸ばす棒の位置 (トラック幅に対する %) */
export function barGeometry(value: number, scale: { min: number; max: number }) {
  const lower = Math.min(0, scale.min);
  const upper = Math.max(0, scale.max);
  const range = upper - lower;
  if (range <= 0) return { leftPercent: 0, widthPercent: 0, zeroPercent: 0 };
  const toPercent = (v: number) => Math.min(100, Math.max(0, ((v - lower) / range) * 100));
  const zeroPercent = toPercent(0);
  const endPercent = toPercent(value);
  return {
    leftPercent: Math.min(zeroPercent, endPercent),
    widthPercent: Math.abs(endPercent - zeroPercent),
    zeroPercent,
  };
}
