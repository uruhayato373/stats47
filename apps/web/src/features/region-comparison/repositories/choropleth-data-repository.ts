import type { ChoroplethMapData, PrefChoroplethData } from "../components/MunicipalityChoroplethSection";

const R2_PUBLIC_URL =
  process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "https://storage.stats47.jp";

/** エリアコード (e.g. "13000") → 2桁都道府県コード (e.g. "13") */
export function areaCodeToPrefCode(areaCode: string): string {
  return areaCode.slice(0, 2);
}

/** 都道府県コード → IPSS データファイル名 */
export const PREF_CODE_TO_ROMAJI: Record<string, string> = {
  "01":"hokkaido","02":"aomori","03":"iwate","04":"miyagi","05":"akita",
  "06":"yamagata","07":"fukushima","08":"ibaraki","09":"tochigi","10":"gunma",
  "11":"saitama","12":"chiba","13":"tokyo","14":"kanagawa","15":"niigata",
  "16":"toyama","17":"ishikawa","18":"fukui","19":"yamanashi","20":"nagano",
  "21":"gifu","22":"shizuoka","23":"aichi","24":"mie","25":"shiga",
  "26":"kyoto","27":"osaka","28":"hyogo","29":"nara","30":"wakayama",
  "31":"tottori","32":"shimane","33":"okayama","34":"hiroshima","35":"yamaguchi",
  "36":"tokushima","37":"kagawa","38":"ehime","39":"kochi","40":"fukuoka",
  "41":"saga","42":"nagasaki","43":"kumamoto","44":"oita","45":"miyazaki",
  "46":"kagoshima","47":"okinawa",
};

async function readJson(key: string): Promise<unknown> {
  if (process.env.NODE_ENV === "development") {
    const fs = await import("fs");
    const path = await import("path");
    const filePath = path.resolve(process.cwd(), `../../.local/r2/${key}`);
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  }
  const res = await fetch(`${R2_PUBLIC_URL}/${key}`);
  if (!res.ok) throw new Error(`Failed to fetch ${key}: ${res.status}`);
  return res.json();
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
    const prefCode = areaCodeToPrefCode(areaCode);
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
  } catch (e) {
    console.error("[choropleth] Failed to load map data:", e);
    return null;
  }
}
