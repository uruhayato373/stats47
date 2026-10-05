import { fetchPrefectures, to2DigitPrefCode } from "@stats47/area";
import { fetchFromR2AsJson } from "@stats47/r2-storage/server";

import type { ChoroplethMapData, PrefChoroplethData } from "../components/MunicipalityChoroplethSection";

/** 都道府県コード → IPSS データファイル名 */
export const PREF_CODE_TO_ROMAJI: Record<string, string> = Object.fromEntries(
  fetchPrefectures().map((pref) => [to2DigitPrefCode(pref.prefCode), pref.romaji]),
);

// 共通の R2 reader を使う (dev=ローカル FS / Workers binding / S3 / 公開 URL の
// フォールバックを一元化)。手書きの dev FS 分岐 + 公開 URL fetch を置き換え。
// 呼び出し側 (loadPrefData) は throw を外側 try/catch で null に畳むため、
// 不在時は throw する従来契約を維持する。
async function readJson(key: string): Promise<unknown> {
  const data = await fetchFromR2AsJson<unknown>(key);
  if (data == null) throw new Error(`Failed to fetch ${key}`);
  return data;
}

/**
 * 市区町村コロプレスマップ用データをサーバーサイドで取得。
 * population カテゴリ かつ 2 地域選択時にのみデータを返す。
 */
export async function fetchChoroplethMapData(
  categoryKey: string,
  areaCodes: string[],
): Promise<ChoroplethMapData | null> {
  if (categoryKey !== "population") return null;
  if (areaCodes.length !== 2) return null;

  const loadPrefData = async (areaCode: string): Promise<[string, PrefChoroplethData] | null> => {
    const prefCode = to2DigitPrefCode(areaCode);
    const prefRomaji = PREF_CODE_TO_ROMAJI[prefCode];
    if (!prefRomaji) return null;
    const [topo, ratios] = await Promise.all([
      readJson(`gis/mlit/20240101/${prefCode}/${prefCode}_city.topojson`),
      readJson(`blog/population-choropleth/data/population-ratio-${prefRomaji}.json`),
    ]);
    return [areaCode, { topo, ratios } as PrefChoroplethData];
  };

  try {
    const results = await Promise.all(areaCodes.map(loadPrefData));
    const mapData: ChoroplethMapData = {};
    for (const result of results) {
      if (!result) return null;
      mapData[result[0]] = result[1];
    }
    return mapData;
  } catch {
    return null;
  }
}
