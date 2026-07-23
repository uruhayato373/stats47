import { fetchPrefectures } from "@stats47/area";

import { PageShell, PageHeader, Breadcrumbs } from "@/components/layout";

import { AreaDirectory } from "@/features/area-profile";

import { AdSenseAd, RANKING_PAGE_FOOTER } from "@/lib/google-adsense";
import { generateOGMetadata } from "@/lib/metadata/og-generator";

import type { Metadata } from "next";

const title = "都道府県から統計を見る | Stats47";
const description =
    "47都道府県の全国順位、地域の強み・弱み、人口・産業・暮らしの統計を確認できます。都道府県名の検索・地方別の一覧・タイル地図から、目的の県のプロフィールへ移動できます。";

export const metadata: Metadata = {
    title,
    description,
    alternates: {
        canonical: "/areas",
    },
    ...generateOGMetadata({ title, description, imageUrl: "/og-image.jpg" }),
};

export default function AreasPage() {
    const prefectures = fetchPrefectures();

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://stats47.jp";
    const structuredData = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "都道府県一覧",
        url: `${baseUrl}/areas`,
        itemListElement: prefectures.map((pref, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: pref.prefName,
            url: `${baseUrl}/areas/${pref.prefCode}`,
        })),
    };

    return (
        <PageShell>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
            />
            <Breadcrumbs
                items={[{ label: "ホーム", href: "/" }, { label: "都道府県" }]}
            />
            <PageHeader
                eyebrow="エリア"
                title="都道府県から統計を見る"
                description="47都道府県の全国順位、地域の強み・弱み、人口・産業・暮らしの統計を確認できます。"
            />

            <AreaDirectory prefectures={prefectures} />

            <div className="flex justify-center mt-8">
                <AdSenseAd
                    format={RANKING_PAGE_FOOTER.format}
                    slotId={RANKING_PAGE_FOOTER.slotId}
                />
            </div>
        </PageShell>
    );
}
