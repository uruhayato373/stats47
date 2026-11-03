import type { ReactNode } from "react";

import { cn } from "@stats47/components";

export interface ChartLegendItem {
  /** 切り替え・key に使う識別子。省略時は label */
  key?: string;
  label: string;
  color: string;
  /** 色見本の形 (既定は四角。線の地図は line、廃止した線などの点線は dashed-line) */
  marker?: "square" | "line" | "dashed-line";
  /** 右端に出す値 (layout="list" のときだけ) */
  value?: ReactNode;
}

/** 連続色の凡例。色の段を左から右へ並べたグラデーションの帯と、帯の下に左から等間隔で並べるラベル */
export interface ChartLegendScale {
  /** 帯の色の段 (左が小さい値)。CSS の色の値 */
  colors: string[];
  /** 帯の下のラベル (両端。中間の目盛りを足すなら 3 つ以上) */
  labels: ReactNode[];
}

interface ChartLegendProps {
  /** 区分の凡例の項目。scale を渡すときは省略できる */
  items?: ChartLegendItem[];
  /** 連続色の凡例。渡すと items ではなくグラデーションの帯を描く */
  scale?: ChartLegendScale;
  className?: string;
  /** inline: 横に流す小さな凡例 (既定)。list: 1 行 1 項目で右端に値を出す */
  layout?: "inline" | "list";
  /** 渡すと各項目が表示の切り替えボタンになる */
  onToggle?: (key: string) => void;
  /** 表示を切った項目の key */
  hiddenKeys?: ReadonlySet<string>;
  /** 今は押しても切り替わらない項目と、その理由 (key → 理由)。aria-disabled と title で伝える */
  disabledReasons?: ReadonlyMap<string, string>;
  /** 切り替えボタンの集まりの名前 (読み上げ用) */
  label?: string;
}

const itemKey = (item: ChartLegendItem) => item.key ?? item.label;

function Marker({ item }: { item: ChartLegendItem }) {
  if (item.marker === "dashed-line") {
    return (
      <span
        className="inline-block w-4 shrink-0 border-t-2 border-dashed"
        style={{ borderColor: item.color }}
        aria-hidden="true"
      />
    );
  }
  return (
    <span
      className={cn("inline-block shrink-0", item.marker === "line" ? "h-1 w-4" : "size-2")}
      style={{ backgroundColor: item.color }}
      aria-hidden="true"
    />
  );
}

function ScaleLegend({ scale, className, label }: { scale: ChartLegendScale; className?: string; label?: string }) {
  return (
    <div role="group" aria-label={label} className={cn("w-full max-w-md text-xs text-muted-foreground", className)}>
      <div
        className="h-3 w-full"
        style={{ background: `linear-gradient(to right, ${scale.colors.join(", ")})` }}
        aria-hidden="true"
      />
      <div className="mt-0.5 flex justify-between gap-2 tabular-nums">
        {scale.labels.map((text, index) => (
          <span key={index}>{text}</span>
        ))}
      </div>
    </div>
  );
}

/**
 * チャート・地図の凡例。色分けの説明だけなら inline、値を並べるなら list。
 * onToggle を渡すと項目を押して表示を切り替えられる (押された状態は aria-pressed で伝える)。
 * scale を渡すと連続色 (グラデーションの帯 + ラベル) の凡例になる。
 * disabledReasons の項目は押しても切り替わらないことを aria-disabled と title (理由) で伝える (onToggle は呼ぶので、切り替えない判断は呼び出し側が持つ)。
 */
export function ChartLegend({ items = [], scale, className, layout = "inline", onToggle, hiddenKeys, disabledReasons, label }: ChartLegendProps) {
  if (scale) return <ScaleLegend scale={scale} className={className} label={label} />;
  if (items.length === 0) return null;
  const isList = layout === "list";

  return (
    <ul
      aria-label={label}
      className={cn(
        isList
          ? "flex flex-col text-sm"
          : "flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground",
        className,
      )}
    >
      {items.map((item) => {
        const key = itemKey(item);
        const isHidden = hiddenKeys?.has(key) ?? false;
        const disabledReason = disabledReasons?.get(key);
        const content = (
          <>
            <span className="flex min-w-0 items-center gap-2">
              <Marker item={item} />
              <span className={cn(isList && "truncate")}>{item.label}</span>
            </span>
            {isList && item.value !== undefined && (
              <span className="shrink-0 whitespace-nowrap tabular-nums text-muted-foreground">{item.value}</span>
            )}
          </>
        );
        const rowClass = cn(
          "flex items-center gap-2",
          isList && "w-full justify-between py-1",
          isHidden && "opacity-40",
        );
        return (
          <li key={key}>
            {onToggle ? (
              <button
                type="button"
                aria-pressed={!isHidden}
                aria-disabled={disabledReason ? true : undefined}
                title={disabledReason}
                onClick={() => onToggle(key)}
                className={cn(
                  rowClass,
                  "text-left focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
                  disabledReason ? "cursor-default" : "cursor-pointer hover:text-foreground",
                )}
              >
                {content}
              </button>
            ) : (
              <span className={rowClass}>{content}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
