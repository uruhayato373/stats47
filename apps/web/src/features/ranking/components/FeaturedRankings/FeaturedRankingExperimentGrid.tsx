"use client";

import { useEffect, useState } from "react";


import {
  HOME_FEATURED_EXPERIMENT_ID,
  resolveHomeFeaturedAssignment,
  type HomeFeaturedExperimentVariant,
} from "../../utils/home-featured-experiment";
import { FeaturedRankingCard } from "../FeaturedRankingCard";

import { EditorialFeaturedCard } from "./FeaturedRankingCardVisual";
import { TrackedFeaturedRankingCard } from "./TrackedFeaturedRankingCard";

import type { HomeFeaturedEditorialModel } from "../../utils/resolve-home-featured-card";
import type { RankingThumbnailVariant } from "@stats47/data-configs";

/**
 * grid セルの固定高さ (placeholder と実カードで同一クラス = variant 確定前後で grid 高さ不変)。
 * §6.1 同一 grid 内の等高化・§8.3 CLS 回避の要。
 */
const CELL_HEIGHT_CLASS = "h-44 sm:h-52 lg:h-60";

export interface HomeFeaturedGridItem {
  rankingKey: string;
  title: string;
  /** データ年度 (yearCode) */
  latestYear: string;
  unit: string;
  control: {
    variant: RankingThumbnailVariant;
    topAreaName?: string;
    topValue?: string;
    demographicAttr?: string;
    normalizationBasis?: string;
    tileMapSvg?: string;
  };
  /** editorial で描画できる場合のみ (payload 不足は null = control フォールバック §5.4) */
  editorial: HomeFeaturedEditorialModel | null;
}

interface FeaturedRankingExperimentGridProps {
  items: HomeFeaturedGridItem[];
}

/**
 * home-featured-v1 の 50/50 実験 grid (Client Component・仕様 doc 28 §7-8)。
 *
 * - SSG を保つため割当は client で行う (cookie 参照でホームを dynamic 化しない)
 * - SSR / mount 前は固定高さ placeholder で grid 領域を確保 (suppressHydrationWarning で隠さない)
 * - control / editorial 双方で experiment parameter 付きの impression / click を送る
 * - editorial 割当でも item 単位で payload 不足なら control card を描画し、
 *   card_variant にはフォールバック後の実際の variant を送る
 */
export function FeaturedRankingExperimentGrid({ items }: FeaturedRankingExperimentGridProps) {
  const [assignment, setAssignment] = useState<HomeFeaturedExperimentVariant | null>(null);

  useEffect(() => {
    // 割当は client 限定 (localStorage + 乱数)。SSR は placeholder を返し mount 後に確定する
    // 設計なので setState-in-effect は意図的 (VariantAdSlot と同じパターン)。
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAssignment(resolveHomeFeaturedAssignment());
  }, []);

  if (!assignment) {
    // mount 前: カードと同一の固定高さセルで grid を確保する (collapse させない)
    return (
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3" aria-hidden="true">
        {items.map((item) => (
          <div
            key={item.rankingKey}
            className={`${CELL_HEIGHT_CLASS} rounded-none border border-border bg-muted/20`}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map((item, idx) => {
        const editorialModel = assignment === "editorial" ? item.editorial : null;
        const shownVariant = editorialModel ? editorialModel.variant : item.control.variant;
        return (
          <div key={`${item.rankingKey}-${idx}`} className={CELL_HEIGHT_CLASS}>
            <TrackedFeaturedRankingCard
              rankingKey={item.rankingKey}
              cardVariant={shownVariant}
              slot={idx + 1}
              experimentId={HOME_FEATURED_EXPERIMENT_ID}
              experimentVariant={assignment}
            >
              {editorialModel ? (
                <EditorialFeaturedCard
                  rankingKey={item.rankingKey}
                  title={item.title}
                  year={item.latestYear}
                  unit={item.unit}
                  model={editorialModel}
                />
              ) : (
                <FeaturedRankingCard
                  rankingKey={item.rankingKey}
                  title={item.title}
                  latestYear={item.latestYear}
                  unit={item.unit}
                  topAreaName={item.control.topAreaName}
                  topValue={item.control.topValue}
                  demographicAttr={item.control.demographicAttr}
                  normalizationBasis={item.control.normalizationBasis}
                  tileMapSvg={item.control.tileMapSvg}
                  variant={item.control.variant}
                  fitHeight
                />
              )}
            </TrackedFeaturedRankingCard>
          </div>
        );
      })}
    </div>
  );
}
