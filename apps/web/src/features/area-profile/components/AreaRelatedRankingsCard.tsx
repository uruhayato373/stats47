import Link from 'next/link';

import { ArrowRight, TrendingDown, TrendingUp } from 'lucide-react';

import { SectionCard } from '@/components/surface';

import { AreaHighlightList, type AreaHighlightListItem } from './AreaHighlightList';

import type { AreaHighlight, AreaHighlights } from '@stats47/area-profile';

interface AreaRelatedRankingsCardProps {
  areaName: string;
  /** selectAreaHighlights の結果 (件数は呼び出し側が選定時に渡す) */
  highlights: AreaHighlights;
}

/** 家計調査は県庁所在市 (東京都は区部) の値なので注記する (SNS の中立規約と同じ)。 */
export function toHighlightListItem(item: AreaHighlight): AreaHighlightListItem {
  return {
    rankingKey: item.rankingKey,
    label: item.label,
    rank: item.rank,
    value: item.value,
    unit: item.unit,
    year: item.year,
    tone: item.tone,
    ...(item.isKakei ? { note: '県庁所在市の値' } : {}),
  };
}

/**
 * 県ページの「特徴」カード。選び方は packages/area-profile の selectAreaHighlights だけが決め、
 * ここは受け取った結果を描くだけ (切り出し・並べ替えをしない)。
 *
 * 表現は中立 (「強み/弱み」とは書かない)。良否の色は METRIC_POLARITY で極性が確定した指標の順位チップにだけ付き、
 * グループ見出しの矢印は向きだけを示すので色を付けない。
 */
export function AreaRelatedRankingsCard({ areaName, highlights }: AreaRelatedRankingsCardProps) {
  if (highlights.top.length === 0 && highlights.bottom.length === 0) return null;

  const groups = [
    { key: 'top', title: `${areaName}が全国上位`, icon: TrendingUp, items: highlights.top },
    { key: 'bottom', title: `${areaName}が全国下位`, icon: TrendingDown, items: highlights.bottom },
  ] as const;

  return (
    <section aria-labelledby="area-highlights-title">
      <div className="mb-4">
        <h2 id="area-highlights-title" className="text-xl font-bold text-foreground">
          {areaName}の特徴
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          県データブックの指標のうち、全国順位が上位・下位の指標です。順位の色は、値が高いほど良い・悪いが定まった指標にだけ付けています。
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {groups.map(({ key, title, icon: Icon, items }) =>
          items.length > 0 ? (
            <SectionCard
              key={key}
              title={title}
              icon={<Icon className="h-4 w-4 text-muted-foreground" />}
              headerAction={
                <Link
                  href="/themes"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                  テーマ一覧
                  <ArrowRight className="h-3 w-3" />
                </Link>
              }
            >
              <AreaHighlightList items={items.map(toHighlightListItem)} rankScope="全国順位" />
            </SectionCard>
          ) : null,
        )}
      </div>
    </section>
  );
}
