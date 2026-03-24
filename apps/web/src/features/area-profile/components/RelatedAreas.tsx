import {
    fetchPrefectures,
    PREFECTURE_TO_REGION_MAP,
    REGIONS,
} from "@stats47/area";
import Link from "next/link";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@stats47/components/atoms/ui/card";

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
        <Card className="border border-border shadow-sm overflow-hidden">
            <CardHeader className="py-3 px-3">
                <CardTitle className="text-base">
                    {region.regionName}の都道府県
                </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3 pt-0">
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
            </CardContent>
        </Card>
    );
}
