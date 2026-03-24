import { fetchPrefectures, REGIONS } from "@stats47/area";
import { generateOGMetadata } from "@/lib/metadata/og-generator";
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
        <div className="container mx-auto px-4 py-6 text-foreground">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
            />
            <div className="mb-8">
                <h1 className="text-2xl font-bold mb-1">都道府県一覧</h1>
                <p className="text-sm text-muted-foreground">
                    47都道府県の統計プロファイルを閲覧できます。各都道府県をクリックして、地域の特性や強み・弱みを確認しましょう。
                </p>
            </div>

            <div className="space-y-8">
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
                                className="text-lg font-bold mb-3 pl-3 border-l-2"
                                style={{ borderColor: region.color }}
                            >
                                {region.regionName}
                            </h2>
                            <div
                                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
                                role="list"
                                aria-label={`${region.regionName}の都道府県`}
                            >
                                {regionPrefs.map((pref) => (
                                    <Link
                                        key={pref.prefCode}
                                        href={`/areas/${pref.prefCode}`}
                                        role="listitem"
                                        className="group block rounded-lg border border-border bg-card p-4 text-center transition-all duration-200 hover:shadow-md hover:-translate-y-1 hover:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                                    >
                                        <span className="text-sm font-medium text-card-foreground group-hover:text-primary group-focus-visible:text-primary transition-colors">
                                            {pref.prefName}
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    );
                })}
            </div>
        </div>
    );
}
