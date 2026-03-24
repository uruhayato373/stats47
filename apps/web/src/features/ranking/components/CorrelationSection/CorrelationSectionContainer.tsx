import { isOk } from "@stats47/types";
import { findHighlyCorrelated } from "@stats47/correlation/server";
import type { RankingItem } from "@stats47/ranking";
import { CorrelationSectionClient } from "./CorrelationSectionClient";

interface CorrelationSectionContainerProps {
    rankingKey: string;
    rankingItem: RankingItem;
}

export async function CorrelationSectionContainer({
    rankingKey,
    rankingItem,
}: CorrelationSectionContainerProps) {
    const result = await findHighlyCorrelated(rankingKey);

    if (!isOk(result) || result.data.length === 0) {
        return null;
    }

    return (
        <CorrelationSectionClient
            rankingKey={rankingKey}
            rankingItem={rankingItem}
            correlatedItems={result.data}
        />
    );
}
