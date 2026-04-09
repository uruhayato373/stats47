import {
    countCorrelationStats,
    listTopCorrelations,
    type TopCorrelation,
} from "@stats47/correlation/server";
import { listRankingItemsLite } from "@stats47/ranking/server";
import { isOk } from "@stats47/types";

import { CorrelationPageClient } from "@/features/correlation";
import { fetchCorrelationPairAction } from "@/features/correlation/server";

import { generateOGMetadata } from "@/lib/metadata/og-generator";

import type { Metadata } from "next";


const title = "都道府県統計の相関分析 | Stats47";
const description =
    "都道府県統計指標間の相関関係を散布図で分析。相関係数ランキングや偏相関係数による疑似相関判定も。";

export const metadata: Metadata = {
    title,
    description,
    robots: "noindex, follow",
    alternates: {
        canonical: "/correlation",
    },
    ...generateOGMetadata({ title, description, imageUrl: "/og-image.jpg" }),
};

interface PageProps {
    searchParams: Promise<{
        x?: string;
        y?: string;
    }>;
}

export default async function CorrelationPage({ searchParams }: PageProps) {
    const { x, y } = await searchParams;

    // DB エラー時は空データでフォールバック（blog/page.tsx と同様のパターン）
    let rankingOptions: { rankingKey: string; title: string; subtitle: string | null | undefined; unit: string }[] = [];
    let topCorrelations: TopCorrelation[] = [];
    let totalPairs = 0;
    let strongCount = 0;

    try {
        const [itemsResult, topCorrs, corrCounts] = await Promise.all([
            listRankingItemsLite({ isActive: true, areaType: "prefecture" }),
            listTopCorrelations(20),
            countCorrelationStats(),
        ]);
        rankingOptions = isOk(itemsResult) ? itemsResult.data : [];
        topCorrelations = topCorrs;
        totalPairs = corrCounts.total;
        strongCount = corrCounts.strong;
    } catch {
        // D1 接続エラー等の場合は空データで描画（500 を防ぐ）
    }

    // URL パラメータ指定 or ランキング1位をデフォルト表示
    const defaultX = x ?? topCorrelations[0]?.rankingKeyX;
    const defaultY = y ?? topCorrelations[0]?.rankingKeyY;

    let initialData: Awaited<ReturnType<typeof fetchCorrelationPairAction>> | undefined;
    if (defaultX && defaultY && defaultX !== defaultY) {
        try {
            initialData = await fetchCorrelationPairAction(defaultX, defaultY);
        } catch {
            // D1接続エラー: initialData = undefined でフォールバック描画
        }
    }

    return (
        <CorrelationPageClient
            rankingOptions={rankingOptions}
            topCorrelations={topCorrelations}
            totalPairs={totalPairs}
            strongCorrelationCount={strongCount}
            initialX={defaultX}
            initialY={defaultY}
            initialData={initialData}
        />
    );
}
