import Link from "next/link";

import { ArrowLeftRight, Download } from "lucide-react";

import { HeroShell, KpiGrid, KpiTile } from "@/features/redesign";

import type { AreaProfileData } from "../types";

interface Props {
    profile: AreaProfileData;
}

/**
 * 都道府県ヘッダー / D 暗色ヒーロー
 *
 * - h1: 都道府県名
 * - 4 KPI: top 4 strengths（指標名 + 全国順位）
 * - CTA: 他県と比較 / 全データ CSV
 */
export function AreaProfilePageClient({ profile }: Props) {
    // 上位 4 件の強みを KPI タイルにマップ。strength が 4 件未満なら weakness で補う。
    const kpiItems = [...profile.strengths, ...profile.weaknesses].slice(0, 4);

    return (
        <div className="container mx-auto px-4 pt-4">
            <HeroShell variant="dark">
                <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-[1fr,460px] md:p-8">
                    <div className="min-w-0">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-white/70">
                            47都道府県データ
                        </p>
                        <h1 className="mt-2 text-3xl font-extrabold leading-tight text-white sm:text-4xl">
                            {profile.areaName}
                        </h1>
                        <p className="mt-2 max-w-lg text-sm leading-relaxed text-white/85">
                            {profile.areaName}の人口・経済・教育・医療など 17 カテゴリのデータを、47 都道府県で順位比較できます。
                        </p>
                        <div className="mt-5 flex flex-wrap gap-2">
                            <Link
                                href={`/compare/population?areas=${profile.areaCode}`}
                                className="inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-2 text-sm font-bold text-slate-900 shadow-sm transition-colors hover:bg-white/90"
                            >
                                <ArrowLeftRight className="h-4 w-4" />
                                他県と比較
                            </Link>
                            <Link
                                href={`/ranking?area=${profile.areaCode}`}
                                className="inline-flex items-center gap-1.5 rounded-md border border-white/30 bg-transparent px-3 py-2 text-sm text-white transition-colors hover:bg-white/10"
                            >
                                <Download className="h-4 w-4" />
                                全データ CSV
                            </Link>
                        </div>
                    </div>
                    {kpiItems.length > 0 && (
                        <div>
                            <KpiGrid columns={2}>
                                {kpiItems.map((item, idx) => (
                                    <KpiTile
                                        key={`${item.rankingKey}-${idx}`}
                                        label={item.indicator}
                                        value={String(item.rank)}
                                        unit="位"
                                        note={`${formatValue(item.value)}${item.unit ?? ""}`}
                                        variant="dark"
                                    />
                                ))}
                            </KpiGrid>
                        </div>
                    )}
                </div>
            </HeroShell>
        </div>
    );
}

/** 大きな数値を「○○億」「○○万」に丸める */
function formatValue(value: number): string {
    const abs = Math.abs(value);
    if (abs >= 100_000_000) {
        return `${(value / 100_000_000).toFixed(1)}億`;
    }
    if (abs >= 10_000) {
        return `${(value / 10_000).toFixed(1)}万`;
    }
    if (abs >= 1000) {
        return value.toLocaleString("ja-JP");
    }
    if (abs >= 1) {
        return value.toLocaleString("ja-JP", { maximumFractionDigits: 1 });
    }
    return value.toLocaleString("ja-JP", { maximumFractionDigits: 2 });
}
