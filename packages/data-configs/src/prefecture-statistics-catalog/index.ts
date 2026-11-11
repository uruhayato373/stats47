import { PREFECTURE_LIST_2DIGIT } from "@stats47/area";
import data from "../../../../data/open-data/prefecture-statistics/resources.json";
import type {
  PrefectureStatisticsCatalogEntry,
  PrefectureStatisticsResource,
} from "./types";

/** 2 桁コード → 都道府県名。名称の正本は @stats47/area の prefectures.json。 */
const PREFECTURE_NAME_BY_CODE = new Map(PREFECTURE_LIST_2DIGIT.map((p) => [p.code, p.name]));

function prefectureNameOf(prefectureCode: string): string {
  const name = PREFECTURE_NAME_BY_CODE.get(prefectureCode);
  if (!name) throw new Error(`prefecture-statistics-catalog: 未知の都道府県コード ${prefectureCode}`);
  return name;
}

type RawResource = PrefectureStatisticsResource & { readonly prefectureCode: string };

/**
 * 記録の正本は台帳 `open-data.prefecture-statistics` (data/open-data/prefecture-statistics/resources.json + Schema)。
 * 台帳は資料を 1 件 1 行で持ち、ここで県ごとにまとめて県名を県のマスタから結ぶ。県の並びは台帳の初出順。
 */
function groupByPrefecture(
  resources: readonly RawResource[],
): PrefectureStatisticsCatalogEntry[] {
  const byCode = new Map<string, PrefectureStatisticsResource[]>();
  for (const { prefectureCode, ...resource } of resources) {
    const list = byCode.get(prefectureCode) ?? [];
    list.push(resource);
    byCode.set(prefectureCode, list);
  }
  return [...byCode].map(([prefectureCode, entryResources]) => ({
    prefectureCode,
    prefectureName: prefectureNameOf(prefectureCode),
    resources: entryResources,
  }));
}

export const PREFECTURE_STATISTICS_CATALOG: PrefectureStatisticsCatalogEntry[] =
  groupByPrefecture(data.resources as unknown as RawResource[]);

export function getPrefectureStatisticsEntry(
  prefectureCode: string,
): PrefectureStatisticsCatalogEntry | undefined {
  return PREFECTURE_STATISTICS_CATALOG.find(
    (entry) => entry.prefectureCode === prefectureCode,
  );
}

export type {
  PrefectureStatisticsCatalogEntry,
  PrefectureStatisticsResource,
  PrefectureStatisticsResourceType,
  PrefectureStatisticsTopicKey,
} from "./types";
export {
  PREFECTURE_STATISTICS_RESOURCE_TYPES,
  PREFECTURE_STATISTICS_TOPIC_KEYS,
} from "./types";
