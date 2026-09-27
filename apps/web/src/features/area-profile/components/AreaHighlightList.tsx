import Link from 'next/link';

import { formatUnitForDisplay } from '@stats47/data-configs/unit';

import { RankBadge } from '@/components/atoms/RankBadge';

import type { HighlightTone } from '@stats47/area-profile';

/** 一覧の 1 行。県は選定関数の AreaHighlight、市区町村は profile.json の strengths を渡す。 */
export interface AreaHighlightListItem {
  rankingKey: string;
  label: string;
  rank: number;
  value: number;
  unit: string;
  year: string;
  /** 良否の色。極性が確定していない指標は neutral (選定関数が決める) */
  tone: HighlightTone;
  /** 家計調査など、値の範囲の注記 (例: 県庁所在市の値) */
  note?: string;
}

interface AreaHighlightListProps {
  items: readonly AreaHighlightListItem[];
  /** 「全国」「県内」など順位の母集団 (読み上げ用) */
  rankScope: string;
}

/**
 * 「順位 + 指標 + 値」の一覧。県ページの「特徴」カードと市区町村ページで共用する唯一の部品
 * (AREA-HIGHLIGHTS-SSOT-01 step 3)。順位チップは RankBadge だけで描く。
 * クリックは共通の NavClickTracker が `data-nav-surface="area_highlights"` で nav_click として数える。
 */
export function AreaHighlightList({ items, rankScope }: AreaHighlightListProps) {
  if (items.length === 0) return null;
  return (
    <ol className="space-y-1.5" data-nav-surface="area_highlights">
      {items.map((item) => (
        <li key={item.rankingKey} className="flex items-baseline gap-2">
          <RankBadge rank={item.rank} tone={item.tone} />
          <span className="sr-only">{rankScope}</span>
          <div className="min-w-0 flex-1">
            <Link
              href={`/ranking/${item.rankingKey}`}
              data-nav-label={item.rankingKey}
              className="line-clamp-2 text-sm font-medium leading-snug text-foreground hover:text-primary hover:underline"
            >
              {item.label}
            </Link>
            <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
              {item.value.toLocaleString('ja-JP')}
              {formatUnitForDisplay(item.unit)}（{item.year}）
              {item.note ? ` ※${item.note}` : ''}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
