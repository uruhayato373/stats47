import { fetchPrefectures, REGIONS } from "@stats47/area";
import { generateOGMetadata } from "@/lib/metadata/og-generator";
import { AreaSelectorMap } from "@/features/area-profile/components/AreaSelectorMap";
import { AdSenseAd, RANKING_PAGE_FOOTER } from "@/lib/google-adsense";
import type { Metadata } from "next";
import Link from "next/link";

const title = "都道府県一覧 | Stats47";
const description =
    "47都道府県の統計プロファイル。各都道府県の強み・弱みを統計データから分析し、全国ランキングに基づく地域特性を表示します。";

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
    const prefMap = new Map(prefectures.map((p) => [p.prefCode, p]));

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
        <div className="container mx-auto px-4 py-4 text-foreground">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
            />
            <h1 className="text-lg font-bold mb-1">都道府県一覧</h1>
            <p className="text-sm text-muted-foreground mb-4">
                地図をクリックして都道府県の特徴を見る
            </p>

            <div className="flex flex-col lg:flex-row lg:gap-8">
              {/* 左: タイルグリッドマップ */}
              <div className="lg:w-1/2">
                <AreaSelectorMap />
              </div>

              {/* 右: 地方ブロック別リンク */}
              <div className="mt-6 lg:mt-0 lg:w-1/2 space-y-4">
                {REGIONS.map((region) => {
                    const regionPrefs = region.prefectures
                        .map((code) => prefMap.get(code))
                        .filter((p): p is NonNullable<typeof p> => p != null);
                    const headingId = `region-${region.regionCode}`;

                    return (
                        <section
                            key={region.regionCode}
                            aria-labelledby={headingId}
                        >
                            <h2
                                id={headingId}
                                className="text-sm font-semibold text-muted-foreground mb-1"
                            >
                                {region.regionName}
                            </h2>
                            <div className="flex flex-wrap gap-x-3 gap-y-1">
                                {regionPrefs.map((pref) => (
                                    <Link
                                        key={pref.prefCode}
                                        href={`/areas/${pref.prefCode}`}
                                        className="text-sm text-foreground hover:text-primary transition-colors"
                                    >
                                        {pref.prefName}
                                    </Link>
                                ))}
                            </div>
                        </section>
                    );
                })}
              </div>
            </div>

            <div className="flex justify-center mt-8">
              <AdSenseAd
                format={RANKING_PAGE_FOOTER.format}
                slotId={RANKING_PAGE_FOOTER.slotId}
              />
            </div>
        </div>
    );
}
