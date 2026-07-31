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
  max?: number;
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
  top: "bg-blue-500",
  bottom: "bg-slate-400",
  muted: "bg-muted-foreground/60",
} satisfies Record<NonNullable<RankingBarListItem["tone"]>, string>;

export function RankingBarList({
  items,
  max,
  unit = "",
  showRank = false,
  valueMaximumFractionDigits = 0,
  className,
  rowClassName,
  labelClassName,
  barClassName,
  valueClassName,
}: RankingBarListProps) {
  const resolvedMax =
    max ?? Math.max(...items.map((item) => Math.abs(item.value)), 1);
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
          max={resolvedMax}
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
  max,
  unit,
  showRank,
  precision,
  rowClassName,
  labelClassName,
  barClassName,
  valueClassName,
}: {
  item: RankingBarListItem;
  max: number;
  unit: string;
  showRank: boolean;
  precision: number;
  rowClassName?: string;
  labelClassName?: string;
  barClassName?: string;
  valueClassName?: string;
}) {
  const label = item.label ?? (item.areaCode ? lookupArea(item.areaCode)?.areaName : null) ?? item.areaCode ?? "";
  const widthPercent = max > 0 ? Math.min(100, (Math.abs(item.value) / max) * 100) : 0;
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
          className={cn("absolute inset-y-0 left-0", toneBarClassName)}
          style={{ width: `${widthPercent}%` }}
        />
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
