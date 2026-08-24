import { HorizontalCardCarousel } from '@/components/surface';

import { FeaturedRankingCard } from '../FeaturedRankingCard';

import { TrackedFeaturedRankingCard } from './TrackedFeaturedRankingCard';

import type { FeaturedRankingCardModel } from '../../utils/resolve-featured-ranking-card';

export interface FeaturedRankingGridItem {
  rankingKey: string;
  /** データ年度 (yearCode) */
  latestYear: string;
  unit: string;
  model: FeaturedRankingCardModel;
}

interface FeaturedRankingGridProps {
  items: FeaturedRankingGridItem[];
  compact?: boolean;
  trackHomeEvents?: boolean;
}

/**
 * home 注目ランキング grid。
 *
 * home-featured-v1のA/Bは終了済み。現在は全カードを地理地図＋1位情報の
 * `FeaturedRankingCard` 1形式でSSR描画する。
 *
 * - client 割当 (localStorage + 乱数) と mount 前 placeholder は撤去 (A/B 不要のため)。
 *   描画は決定的なのでSSR HTMLに主要linkが含まれ、CLSも無い。
 * - impression / click 計測は維持 (experiment_variant は採用値 "editorial" 固定で継続)。
 */
export function FeaturedRankingGrid({
  items,
  compact = false,
  trackHomeEvents = true,
}: FeaturedRankingGridProps) {
  const cards = items.map((item, idx) => {
    const card = (
      <FeaturedRankingCard
        rankingKey={item.rankingKey}
        year={item.latestYear}
        unit={item.unit}
        model={item.model}
      />
    );

    return (
      <div key={`${item.rankingKey}-${idx}`}>
        {trackHomeEvents ? (
          <TrackedFeaturedRankingCard
            rankingKey={item.rankingKey}
            slot={idx + 1}
          >
            {card}
          </TrackedFeaturedRankingCard>
        ) : (
          card
        )}
      </div>
    );
  });

  if (compact) {
    return (
      <HorizontalCardCarousel ariaLabel="注目ランキング">
        {cards}
      </HorizontalCardCarousel>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {cards}
    </div>
  );
}
