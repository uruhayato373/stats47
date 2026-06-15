import Link from "next/link";

import { ArrowLeftRight } from "lucide-react";

import { PageHeader } from "@/components/layout";

import type { AreaProfileData } from "../types";

interface Props {
    profile: AreaProfileData;
}

/**
 * 都道府県ヘッダー（ミニマル）
 *
 * - h1: 都道府県名（PageHeader 内部で text-2xl font-bold 固定）
 * - 概要 1 行 + 「他県と比較」CTA
 *
 * 強み指標の KPI は本文側（AreaProfileSidebar / AreaRelatedRankingsCard）に既出のため
 * ヘッダーには出さない。幅制御はページ側 PageShell に委ねる（自前で container を持たない）。
 */
export function AreaProfilePageClient({ profile }: Props) {
    return (
        <PageHeader
            eyebrow="47都道府県データ"
            title={profile.areaName}
            description={`${profile.areaName}の人口・経済・教育・医療など 17 カテゴリのデータを、47 都道府県で順位比較できます。`}
            actions={
                <Link
                    href={`/category/population/compare?areas=${profile.areaCode}`}
                    className="inline-flex items-center gap-1.5 rounded-none border bg-card px-3 py-2 text-sm font-semibold shadow-sm transition-colors hover:bg-accent/40 hover:shadow-md"
                >
                    <ArrowLeftRight className="h-4 w-4" />
                    他県と比較
                </Link>
            }
        />
    );
}
