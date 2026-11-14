import { type ReactNode } from "react";

import { cn } from "../lib/cn";

import { SurfaceCard } from "./surface";

/*
 * 数値タイル (部品の種類「数値タイル」)。見本 (テンプレートの KPI カード。dashboards/modern/total-orders.tsx) と同じく、
 * 名前 14px → 値 24px / 32px・600 (右に単位とバッジ) → 補足 12px の順に並べ、余白は 16px の 1 種類にする。
 * 仕様の正本は部品の台帳 data/design/components.json の stat-tile (枠と props の一致はテストが照合する)。
 *
 * パネルの中で大きな数値を 1 つ見せる所 (テーマの指標カード・ランキング詳細の平均など) も、値の書式は
 * 下の定数を使う (@stats47/components から import)。ページの側で text-xl / text-3xl などの大きさを書かない (`design-system:check` の stat-value-uses-shared-class)。
 */

/** 指標の名前 */
export const STAT_LABEL_CLASS = "text-sm leading-5 text-foreground";

/** 値 (24px / 32px・600・等幅数字) */
export const STAT_VALUE_CLASS = "text-2xl leading-8 font-semibold tabular-nums text-foreground";

/**
 * タイルの中の値は、タイルの幅が 12rem 以上のとき 24px / 32px、それ未満 (スマホの幅で 2 列に並べたときの 1 マス。2026-11-14) は
 * 下の narrowValueClass の大きさにする。24px のままだと 9 桁の値 (113,039,852) が数字の途中で折り返す。
 * タイルの外で STAT_VALUE_CLASS を使う所は変えない。
 */
const STAT_VALUE_WIDE_CLASS = "@[12rem]/stat-tile:text-2xl @[12rem]/stat-tile:leading-8";

/**
 * 幅の狭いタイルでの値の文字の大きさ。1 マスの中身は約 146px (幅 390px の画面で 2 列) なので、桁の多い値ほど小さくして
 * 1 行に収める: 10 文字まで 20px、11〜12 文字 18px、13 文字以上 16px (等幅数字の実測。「113,039,852」は 11 文字)。
 * 文字でない値 (部品) は 20px。
 * 15 文字以上 (丸める前の検算の値「14,047,593.9969」など) は 14px にし、幅の広いタイルでも 24px に戻さず 16px に留める
 * (24px だと 4 列の 1 マスでも数字の途中で折り返す)。
 */
function narrowValueClass(value: ReactNode): string {
  const length = typeof value === "string" || typeof value === "number" ? String(value).length : 0;
  if (length >= 15) return "text-sm leading-7 @[12rem]/stat-tile:text-base";
  const size = length >= 13 ? "text-base leading-7" : length >= 11 ? "text-lg leading-7" : "text-xl leading-7";
  return `${size} ${STAT_VALUE_WIDE_CLASS}`;
}

/** 値の直後の単位 */
export const STAT_UNIT_CLASS = "ml-1 text-sm font-normal text-muted-foreground";

/** 年・全国平均・順位などの補足の 1 行 */
export const STAT_META_CLASS = "text-xs tabular-nums text-muted-foreground";

interface StatTileProps {
  /** 指標の名前 (リンクにするときは呼び出し側で Link を渡す) */
  label: ReactNode;
  /** 表示用に整形した値。null は「—」 */
  value: ReactNode | null;
  unit?: ReactNode;
  /** 値の右に置くバッジ (順位チップ・増減など) */
  badge?: ReactNode;
  /** 値の下の補足 (年・全国平均・検算の内訳の式など)。長い補足は折り返す */
  meta?: ReactNode;
  /** 右上の小さなアイコン (lucide)。飾りで押せない */
  icon?: ReactNode;
  /** 右上に置く押せる操作 (出典の Sheet を開く枠なしのアイコンボタンなど)。icon と同じ場所に置く */
  action?: ReactNode;
  /** 値の下に全幅で置く小さなチャートなど。出すかどうかは呼び出し側が決める */
  children?: ReactNode;
  /** 下端に寄せるリンク行 (出典・ランキングへの導線)。並べたタイルの高さがそろっても下端の位置がそろう */
  footer?: ReactNode;
  className?: string;
}

export function StatTile({
  label,
  value,
  unit,
  badge,
  meta,
  icon,
  action,
  children,
  footer,
  className,
}: StatTileProps) {
  return (
    <SurfaceCard data-slot-kind="stat-tile" className={cn("gap-3", action ? "relative" : undefined, className)}>
      {/* 値の文字の大きさをタイルの幅で決めるためのコンテナ (narrowValueClass) */}
      <div className="@container/stat-tile flex items-start justify-between gap-3">
        {/* 枠より長い数や式は途中で折り返す (wrap-anywhere)。付けないと桁の多い値が枠の外へはみ出す。呼び出し側で付け足さない */}
        <dl className="flex min-w-0 flex-col gap-1 wrap-anywhere">
          {/* 右上の操作は値の行の幅を削らないよう重ねて置き、名前の行だけその分を空ける */}
          <dt className={cn(STAT_LABEL_CLASS, action ? "pr-7" : undefined)}>{label}</dt>
          <dd className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {value === null ? (
              <span className="text-sm text-muted-foreground">—</span>
            ) : (
              <span className={cn(STAT_VALUE_CLASS, narrowValueClass(value))}>
                {value}
                {unit ? <span className={STAT_UNIT_CLASS}>{unit}</span> : null}
              </span>
            )}
            {badge}
          </dd>
          {meta ? <dd className={STAT_META_CLASS}>{meta}</dd> : null}
        </dl>
        {icon ? (
          <span
            aria-hidden="true"
            className="flex shrink-0 rounded-md border border-border p-2.5 text-muted-foreground [&_svg]:size-4"
          >
            {icon}
          </span>
        ) : null}
      </div>
      {action ? <div className="absolute top-3 right-3">{action}</div> : null}
      {children}
      {footer ? (
        <div data-slot="stat-tile-footer" className="mt-auto">
          {footer}
        </div>
      ) : null}
    </SurfaceCard>
  );
}
