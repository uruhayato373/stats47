import { readHighlyCorrelatedFromR2 } from "@stats47/correlation/server";
import { isOk } from "@stats47/types";

import { CorrelationSectionClient, type CorrelationListItem } from "./CorrelationSectionClient";

interface CorrelationSectionContainerProps {
    rankingKey: string;
}

// 一覧で使わない散布図・他の相関係数をブラウザへ送らない。
const listItem = ({ rankingKey, title, populationAdjustedR }: CorrelationListItem): CorrelationListItem =>
    ({ rankingKey, title, populationAdjustedR });

export async function CorrelationSectionContainer({
    rankingKey,
}: CorrelationSectionContainerProps) {
    // 選定済みの正負別一覧を読み、空の組は表示側で省く。
    const result = await readHighlyCorrelatedFromR2(rankingKey);

    if (!isOk(result)) {
        return null;
    }

    return <CorrelationSectionClient groups={{
        positive: result.data.positive.map(listItem),
        negative: result.data.negative.map(listItem),
    }} />;
}
