import { isOk } from "@stats47/types";
import { getRankingPageCardRepository } from "@stats47/database/server";
import { logger } from "@/lib/logger";
import { StatsLineChartCard } from "./StatsLineChartCard";
import type { StatsLineChartProps } from "../../types/ranking-page-card";

interface RankingPageCardsContainerProps {
  rankingKey: string;
}

/**
 * ランキングページ用カードコンテナ（Server Component）
 *
 * DB からカード定義を取得し、componentType に応じて適切なコンポーネントを描画する。
 * カードが 0 件の場合は null を返す。
 */
export async function RankingPageCardsContainer({
  rankingKey,
}: RankingPageCardsContainerProps) {
  const repo = getRankingPageCardRepository();
  const result = await repo.listCardsByRankingKey(rankingKey);

  if (!isOk(result) || result.data.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      {result.data.map((card) => {
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
