import { lookupArea } from "@stats47/area";
import { fetchMunicipalityTopology } from "@stats47/gis/server";
import { listRankingItemsByAreaType, listRankingValuesByPrefecture } from "@stats47/ranking/server";
import { unwrap, type TopoJSONTopology } from "@stats47/types";

import { CityRankingSection } from "./CityRankingSection";

interface Props {
    areaCode: string;
    prefName: string;
    categoryKey: string;
    selectedRankingKey?: string;
}

export async function CityRankingPreview({ areaCode, prefName, categoryKey, selectedRankingKey }: Props) {
    const categoryItems = unwrap(await listRankingItemsByAreaType("city", { categoryKey }));

    if (categoryItems.length === 0) return null;

    // 選択指標の決定
    const activeItem = selectedRankingKey
        ? categoryItems.find((item) => item.rankingKey === selectedRankingKey) ?? categoryItems[0]
        : categoryItems[0];

    const latestYear = activeItem.latestYear?.yearCode;
    if (!latestYear) return null;

    // DB レベルで都道府県フィルタ + TopoJSON 取得を並列実行
    const prefCode2 = areaCode.slice(0, 2);
    const [prefValuesResult, topology] = await Promise.all([
        listRankingValuesByPrefecture(activeItem.rankingKey, latestYear, areaCode),
        fetchMunicipalityTopology(prefCode2).catch(() => null as TopoJSONTopology | null),
    ]);

    const prefValues = unwrap(prefValuesResult)
        .map((v) => {
            const cityArea = lookupArea(v.areaCode);
            return {
                areaCode: v.areaCode,
                areaName: cityArea?.areaName ?? v.areaName,
                value: v.value,
                unit: v.unit,
            };
        });

    if (prefValues.length === 0) return null;

    const itemsForClient = categoryItems.map((item) => ({
        rankingKey: item.rankingKey,
        title: item.title,
        unit: item.unit,
    }));

    return (
        <CityRankingSection
            areaCode={areaCode}
            prefName={prefName}
            categoryKey={categoryKey}
            categoryItems={itemsForClient}
            selectedRankingKey={activeItem.rankingKey}
            rankingValues={prefValues}
            topology={topology}
        />
    );
}
