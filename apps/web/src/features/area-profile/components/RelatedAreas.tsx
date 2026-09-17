import {
    fetchPrefectures,
    PREFECTURE_TO_REGION_MAP,
    REGIONS,
} from "@stats47/area";

import { RailCard, RailLinkList, RailNavRow } from "@/components/surface";

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
        <RailCard title={`${region.regionName}の都道府県`}>
            <RailLinkList>
                {relatedPrefs.map((pref) => (
                    <RailNavRow key={pref.code} href={`/areas/${pref.code}`} chevron={false}>
                        {pref.name}
                    </RailNavRow>
                ))}
            </RailLinkList>
        </RailCard>
    );
}
