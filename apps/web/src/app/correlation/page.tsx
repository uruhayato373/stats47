import { CorrelationPageClient } from "@/features/correlation";
import { fetchCorrelationPairAction } from "@/features/correlation/server";
import { generateOGMetadata } from "@/lib/metadata/og-generator";
import { isOk } from "@stats47/types";
import { listRankingItems } from "@stats47/ranking/server";
import {
    countCorrelationAnalysis,
    countStrongCorrelations,
    listTopCorrelations,
} from "@stats47/correlation/server";
import type { Metadata } from "next";

export const revalidate = 86400;

const title = "都道府県統計の相関分析 | Stats47";
const description =
    "都道府県統計指標間の相関関係を散布図で分析。相関係数ランキングや偏相関係数による疑似相関判定も。";

export const metadata: Metadata = {
    title,
    description,
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

    const [itemsResult, topCorrelations, totalPairs, strongCount] =
        await Promise.all([
            listRankingItems({ isActive: true, areaType: "prefecture" }),
            listTopCorrelations(20),
            countCorrelationAnalysis(),
            countStrongCorrelations(),
        ]);

    const items = isOk(itemsResult) ? itemsResult.data : [];

    const rankingOptions = items.map((item) => ({
        rankingKey: item.rankingKey,
        title: item.title,
        subtitle: item.subtitle ?? null,
        unit: item.unit,
    }));

    let initialData: Awaited<ReturnType<typeof fetchCorrelationPairAction>> | undefined;
    if (x && y && x !== y) {
        initialData = await fetchCorrelationPairAction(x, y);
    }

    return (
        <CorrelationPageClient
            rankingOptions={rankingOptions}
            topCorrelations={topCorrelations}
            totalPairs={totalPairs}
            strongCorrelationCount={strongCount}
            initialX={x}
            initialY={y}
            initialData={initialData}
        />
    );
}
