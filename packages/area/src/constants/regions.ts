import type { Region } from "../types";

/**
 * 7地方区分定義（北海道・東北を統合）
 * 都道府県コードは5桁形式（末尾000）を使用
 */
export const REGIONS: readonly Region[] = [
  {
    regionCode: "hokkaido_tohoku",
    regionName: "北海道・東北",
    prefectures: ["01000", "02000", "03000", "04000", "05000", "06000", "07000"],
    color: "#3b82f6",
  },
  {
    regionCode: "kanto",
    regionName: "関東",
    prefectures: ["08000", "09000", "10000", "11000", "12000", "13000", "14000"],
    color: "#10b981",
  },
  {
    regionCode: "chubu",
    regionName: "中部",
    prefectures: ["15000", "16000", "17000", "18000", "19000", "20000", "21000", "22000", "23000"],
    color: "#6366f1",
  },
  {
    regionCode: "kinki",
    regionName: "近畿",
    prefectures: ["24000", "25000", "26000", "27000", "28000", "29000", "30000"],
    color: "#f59e0b",
  },
  {
    regionCode: "chugoku",
    regionName: "中国",
    prefectures: ["31000", "32000", "33000", "34000", "35000"],
    color: "#ef4444",
  },
  {
    regionCode: "shikoku",
    regionName: "四国",
    prefectures: ["36000", "37000", "38000", "39000"],
    color: "#06b6d4",
  },
  {
    regionCode: "kyushu",
    regionName: "九州・沖縄",
    prefectures: ["40000", "41000", "42000", "43000", "44000", "45000", "46000", "47000"],
    color: "#a855f7",
  },
] as const;

/**
 * 都道府県コード（5桁）→ regionCode の逆引きマップ
 */
export const PREFECTURE_TO_REGION_MAP: Record<string, string> = REGIONS.reduce(
  (map, region) => {
    region.prefectures.forEach((prefCode) => {
      map[prefCode] = region.regionCode;
    });
    return map;
  },
  {} as Record<string, string>
);

/**
 * 2桁都道府県コード → regionCode マップ
 * BoxplotChart 等、areaCode 先頭2桁で地方を判定するケース用
 */
export const PREFECTURE_SHORT_TO_REGION_MAP: Record<string, string> =
  REGIONS.reduce(
    (map, region) => {
      for (const code of region.prefectures) {
        map[code.substring(0, 2)] = region.regionCode;
      }
      return map;
    },
    {} as Record<string, string>
  );
