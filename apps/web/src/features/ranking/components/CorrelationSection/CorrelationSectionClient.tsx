"use client";

import { hrefFor } from "@stats47/data-configs/content/href";

import Link from "@/components/atoms/SiteLink";
import { SectionCard, ValueTable } from "@/components/surface";

import { navSurfaceProps } from "@/lib/analytics/events";
import { correlationColorClass, formatCorrelation } from "@/lib/correlation-display";

interface CorrelatedItem {
    rankingKey: string;
    title: string;
    subtitle: string | null;
    unit: string;
    pearsonR: number;
    populationAdjustedR: number;
    partialRPopulation: number | null;
    partialRArea: number | null;
    partialRAging: number | null;
    partialRDensity: number | null;
    scatterData: Array<{
        areaCode: string;
        areaName: string;
        x: number;
        y: number;
    }>;
}

interface CorrelationSectionClientProps {
    correlatedItems: CorrelatedItem[];
    /** 相手指標 rankingKey → この 2 指標の関係を解説した記事 */
    articleByPairKey?: Record<string, { slug: string; title: string }>;
}

export function CorrelationSectionClient({
    correlatedItems,
    articleByPairKey = {},
}: CorrelationSectionClientProps) {
    return (
        <SectionCard title="相関が高い指標">
            {/* 並び順と数値は snapshot の populationAdjustedR (人口補正後の順位相関)。生の r だと人口規模や 1 県の外れ値だけで連動する組が上位を占める */}
            <p className="mb-2 text-xs text-muted-foreground">
                人口規模の影響を除いた順位相関（1県の極端な値に左右されにくい）
            </p>
            {/* 指標・解説記事・順位相関を行ごとに比べて読むので、共通の静的な表で描く (2026-11-03。旧: リンクの一覧) */}
            <div {...navSurfaceProps("ranking_correlation")}>
                <ValueTable
                    ariaLabel="相関が高い指標"
                    columns={[
                        { key: "metric", header: "指標", rowHeader: true },
                        { key: "article", header: "解説", align: "left" },
                        { key: "r", header: "順位相関" },
                    ]}
                    rows={correlatedItems.map((item) => {
                        const article = articleByPairKey[item.rankingKey];
                        return {
                            key: item.rankingKey,
                            cells: [
                                <Link key="metric" href={hrefFor("ranking", { rankingKey: item.rankingKey })}>
                                    {item.title}
                                </Link>,
                                article ? (
                                    <Link key="article" href={hrefFor("blog", { slug: article.slug })} title={article.title}>
                                        解説記事
                                    </Link>
                                ) : (
                                    "—"
                                ),
                                <span key="r" className={correlationColorClass(item.populationAdjustedR)}>
                                    {formatCorrelation(item.populationAdjustedR)}
                                </span>,
                            ],
                        };
                    })}
                />
            </div>
        </SectionCard>
    );
}
