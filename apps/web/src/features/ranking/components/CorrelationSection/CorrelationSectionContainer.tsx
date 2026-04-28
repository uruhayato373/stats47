import { readHighlyCorrelatedFromR2 } from "@stats47/correlation/server";
import { isOk } from "@stats47/types";

import { CorrelationSectionClient } from "./CorrelationSectionClient";

interface CorrelationSectionContainerProps {
    rankingKey: string;
}

export async function CorrelationSectionContainer({
    rankingKey,
}: CorrelationSectionContainerProps) {
    // correlation_analysis (1.5M 行) への indexed lookup を回避するため
    // R2 上の per-ranking-key snapshot から読み出す。snapshot 不在時は空配列で
    // null return（CorrelationSection 自体が描画されない）になる。
    const result = await readHighlyCorrelatedFromR2(rankingKey, 10);

    if (!isOk(result) || result.data.length === 0) {
        return null;
    }

    return (
        <CorrelationSectionClient
            correlatedItems={result.data}
        />
    );
}
