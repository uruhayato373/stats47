import { readHighlyCorrelatedFromR2 } from "@stats47/correlation/server";
import { isOk } from "@stats47/types";

import { listMetricPairArticles } from "@/features/blog/server";

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
    const [result, pairArticles] = await Promise.all([
        readHighlyCorrelatedFromR2(rankingKey, 10),
        listMetricPairArticles(rankingKey),
    ]);

    if (!isOk(result) || result.data.length === 0) {
        return null;
    }

    // 相手指標ごとに最新の解説記事 1 本 (pairArticles は公開日の新しい順)
    const articleByPairKey: Record<string, { slug: string; title: string }> = {};
    for (const article of pairArticles) {
        articleByPairKey[article.pairKey] ??= { slug: article.slug, title: article.title };
    }

    return (
        <CorrelationSectionClient
            correlatedItems={result.data}
            articleByPairKey={articleByPairKey}
        />
    );
}
