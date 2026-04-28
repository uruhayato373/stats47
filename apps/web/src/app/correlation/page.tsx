import {
    readCorrelationStatsFromR2,
    readTopCorrelationsFromR2,
    type TopCorrelation,
} from "@stats47/correlation/server";
import { listRankingItemsLite } from "@stats47/ranking/server";
import { isOk } from "@stats47/types";

import { CorrelationPageClient } from "@/features/correlation";
import { fetchCorrelationPairAction } from "@/features/correlation/server";

import { logger } from "@/lib/logger";
import { generateOGMetadata } from "@/lib/metadata/og-generator";

import type { Metadata } from "next";

// correlation_analysis (1.5M rows) への full scan を防ぐため、
// 集計済み snapshot を R2 経由で fetch する。Next.js Data Cache に乗せて二重防御。
export const revalidate = 86400;

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
            readTopCorrelationsFromR2(20),
            readCorrelationStatsFromR2(),
        ]);
        rankingOptions = isOk(itemsResult) ? itemsResult.data : [];
        topCorrelations = topCorrs;
        totalPairs = corrCounts.total;
        strongCount = corrCounts.strong;
    } catch (error) {
        // R2 fetch / D1 接続エラー等の場合は空データで描画（500 を防ぐ）。
        // ただしサイレント failure を避けるため必ずログには残す。
        logger.error(
            { error: error instanceof Error ? error.message : String(error) },
            "CorrelationPage: 初期データ取得に失敗。空表示にフォールバック",
        );
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
