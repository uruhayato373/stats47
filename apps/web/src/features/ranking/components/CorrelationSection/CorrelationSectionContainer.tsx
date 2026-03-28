import { findHighlyCorrelated } from "@stats47/correlation/server";
import { isOk } from "@stats47/types";

import { CorrelationSectionClient } from "./CorrelationSectionClient";

interface CorrelationSectionContainerProps {
    rankingKey: string;
}

export async function CorrelationSectionContainer({
    rankingKey,
}: CorrelationSectionContainerProps) {
    const result = await findHighlyCorrelated(rankingKey, 10);

    if (!isOk(result) || result.data.length === 0) {
        return null;
    }

    return (
        <CorrelationSectionClient
            rankingKey={rankingKey}
            correlatedItems={result.data}
        />
    );
}
