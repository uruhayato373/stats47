import Link from "next/link";

import {
    fetchPrefectures,
    PREFECTURE_TO_REGION_MAP,
    REGIONS,
} from "@stats47/area";

import { SurfaceCard } from "@/components/surface";

interface Props {
    areaCode: string;
}

export function RelatedAreas({ areaCode }: Props) {
    const regionCode = PREFECTURE_TO_REGION_MAP[areaCode];
    if (!regionCode) return null;

    const region = REGIONS.find((r) => r.regionCode === regionCode);
    if (!region) return null;

    const prefectures = fetchPrefectures();
    const relatedPrefs = region.prefectures
        .filter((code) => code !== areaCode)
        .map((code) => {
            const pref = prefectures.find((p) => p.prefCode === code);
            return pref ? { code, name: pref.prefName } : null;
        })
        .filter(Boolean) as { code: string; name: string }[];

    if (relatedPrefs.length === 0) return null;

    return (
        <SurfaceCard className="overflow-hidden p-0">
            <div className="border-b border-border px-3 py-3">
                <h3 className="text-base font-semibold">
                    {region.regionName}の都道府県
                </h3>
            </div>
            <div className="px-3 pb-3 pt-3">
                <nav className="flex flex-col gap-0.5">
                    {relatedPrefs.map((pref) => (
                        <Link
                            key={pref.code}
                            href={`/areas/${pref.code}`}
                            className="px-2 py-1.5 text-xs rounded-md hover:bg-accent/50 transition-colors"
                        >
                            {pref.name}
                        </Link>
                    ))}
                </nav>
            </div>
        </SurfaceCard>
    );
}
