
import { cn } from "@stats47/components";
import { hrefFor } from "@stats47/data-configs/content/href";
import { formatUnitForDisplay } from '@stats47/data-configs/unit';

import { RankBadge } from '@/components/atoms/RankBadge';
import Link from '@/components/atoms/SiteLink';

import type { HighlightTone } from '@stats47/area-profile';

/** 一覧の 1 行。県は選定関数の AreaHighlight、市区町村はデータブックの指標を渡す。 */
export interface AreaHighlightListItem {
  rankingKey: string;
  /** リンク先。既定は都道府県ランキング (`/ranking/<key>`)。 */
  href?: string;
  label: string;
  rank: number;
  value: number;
  unit: string;
  year: string;
  /** 良否の色。極性が確定していない指標は neutral (選定関数が決める) */
  tone: HighlightTone;
  /** 家計調査など、値の範囲の注記 (例: 県庁所在市の値) */
  note?: string;
  /** 年の後ろに続ける補足 (例: 全国の順位) */
  detail?: string;
}

interface AreaHighlightListProps {
  items: readonly AreaHighlightListItem[];
  /** 「全国」「県内」など順位の母集団 (読み上げ用) */
  rankScope: string;
  /**
   * 本文の全幅に置くときの段数の上限。コンテナ幅で 2 段 (@md)・3 段 (@lg) まで増やす。
   * 半幅のカードの中 (県ページの「特徴」) は既定の 1 段。
   */
  columns?: 1 | 3;
}

/**
 * 本文の全幅で 3 段まで並べるとき、最後の段の空きが目立たない段数を件数から選ぶ。
 * 3 で割り切れる件数は 3 段、2 で割り切れて 3 で割り切れない件数 (4・8・10 件) は 2 段にする。
 * どちらでも割り切れない件数 (5・7 件) は 3 段 (空きが 1 マスで済む)。
 */
function prefersThreeColumns(count: number): boolean {
  return count % 3 === 0 || count % 2 !== 0;
}

/**
 * 「順位 + 指標 + 値」の一覧。県ページの「特徴」カードと市区町村ページで共用する唯一の部品
 * (AREA-HIGHLIGHTS-SSOT-01 step 3)。順位チップは RankBadge だけで描く。
 * クリックは共通の NavClickTracker が `data-nav-surface="area_highlights"` で nav_click として数える。
 */
export function AreaHighlightList({ items, rankScope, columns = 1 }: AreaHighlightListProps) {
  if (items.length === 0) return null;
  const list = (
    <ol
      className={cn(
        // 行の間隔 (12px) は、見出しの下線から 1 行目までの間隔 (呼び出し側の pt-3) と揃える
        "grid grid-cols-1 gap-y-3",
        columns === 3 && "gap-x-6 @md:grid-cols-2",
        columns === 3 && (prefersThreeColumns(items.length) ? "@lg:grid-cols-3" : "@lg:grid-cols-2"),
      )}
      data-nav-surface="area_highlights"
    >
      {items.map((item) => (
        <li key={item.rankingKey} className="flex items-baseline gap-2">
          <RankBadge rank={item.rank} tone={item.tone} />
          <span className="sr-only">{rankScope}</span>
          <div className="min-w-0 flex-1">
            <Link
              href={item.href ?? hrefFor("ranking", { rankingKey: item.rankingKey })}
              data-nav-label={item.rankingKey}
              className="line-clamp-2 text-sm font-medium leading-snug text-foreground hover:text-primary hover:underline"
            >
              {item.label}
            </Link>
            <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
              {item.value.toLocaleString('ja-JP')}
              {formatUnitForDisplay(item.unit)}（{item.year}）
              {item.detail ? ` ・ ${item.detail}` : ''}
              {item.note ? ` ※${item.note}` : ''}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
  return columns === 1 ? list : <div className="@container">{list}</div>;
}
