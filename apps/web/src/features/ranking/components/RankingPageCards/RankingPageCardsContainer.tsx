import { logger } from "@/lib/logger";

import { readRankingPageCardsFromR2 } from "./snapshot-reader";
import { StatsLineChartCard } from "./StatsLineChartCard";

import type { StatsLineChartProps } from "../../types/ranking-page-card";

interface RankingPageCardsContainerProps {
  rankingKey: string;
}

/**
 * ランキングページ用カードコンテナ（Server Component）
 *
 * R2 snapshot からカード定義を取得し、componentType に応じて適切なコンポーネントを描画する。
 * カードが 0 件の場合は null を返す。
 */
export async function RankingPageCardsContainer({
  rankingKey,
}: RankingPageCardsContainerProps) {
  const cards = await readRankingPageCardsFromR2(rankingKey);

  if (cards.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      {cards.map((card) => {
        const title = card.title ?? "";

        switch (card.componentType) {
          case "stats-line-chart": {
            let props: StatsLineChartProps;
            try {
              props = JSON.parse(card.componentProps ?? "{}");
            } catch {
              logger.error(
                { cardId: card.id },
                "RankingPageCardsContainer: componentProps のパースに失敗"
              );
              return null;
            }
            return (
              <StatsLineChartCard key={card.id} title={title} props={props} />
            );
          }
          default:
            return null;
        }
      })}
    </div>
  );
}
