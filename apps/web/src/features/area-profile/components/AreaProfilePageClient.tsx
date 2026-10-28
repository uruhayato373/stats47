import { buttonVariants } from "@stats47/components/atoms/ui/button";
import { ArrowLeftRight } from "lucide-react";

import Link from "@/components/atoms/SiteLink";
import { PageHeader } from "@/components/layout";

interface Props {
    profile: { areaCode: string; areaName: string };
}

/**
 * 都道府県ヘッダー（ミニマル）
 *
 * - h1: 都道府県名（PageHeader の見出しの大きさに従う）
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
                    data-slot="button"
                    className={buttonVariants({ variant: "outline" })}
                >
                    <ArrowLeftRight data-icon="inline-start" aria-hidden />
                    他県と比較
                </Link>
            }
        />
    );
}
