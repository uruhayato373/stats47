import { readHighlyCorrelatedFromR2 } from "@stats47/correlation/server";
import { isOk } from "@stats47/types";

import { CorrelationSectionClient, type CorrelationListItem } from "./CorrelationSectionClient";

interface CorrelationSectionContainerProps {
    rankingKey: string;
}

// 一覧で使わない散布図・他の相関係数をブラウザへ送らない。
// 年はこの指標の最新年と違うペアにだけ渡す (相関は両方に値のある最新の共通年で計算している)。
const listItem = (latestYear: string | undefined) =>
    ({ rankingKey, title, populationAdjustedR, year }: CorrelationListItem): CorrelationListItem =>
        ({ rankingKey, title, populationAdjustedR, ...(year && latestYear && year !== latestYear ? { year } : {}) });

export async function CorrelationSectionContainer({
    rankingKey,
}: CorrelationSectionContainerProps) {
    // 選定済みの正負別一覧を読み、空の組は表示側で省く。
    const result = await readHighlyCorrelatedFromR2(rankingKey);

    if (!isOk(result)) {
        return null;
    }

    const toItem = listItem(result.data.latestYear);
    return <CorrelationSectionClient groups={{
        positive: result.data.positive.map(toItem),
        negative: result.data.negative.map(toItem),
    }} />;
}
