import { Region } from "../types";

/**
 * 地域ブロック定義
 * 都道府県コードは5桁形式（末尾000）を使用
 */
export const REGIONS: readonly Region[] = [
  {
    regionCode: "hokkaido",
    regionName: "北海道",
    prefectures: ["01000"],
  },
  {
    regionCode: "tohoku",
    regionName: "東北地方",
    prefectures: ["02000", "03000", "04000", "05000", "06000", "07000"],
  },
  {
    regionCode: "kanto",
    regionName: "関東地方",
    prefectures: [
      "08000",
      "09000",
      "10000",
      "11000",
      "12000",
      "13000",
      "14000",
    ],
  },
  {
    regionCode: "chubu",
    regionName: "中部地方",
    prefectures: [
      "15000",
      "16000",
      "17000",
      "18000",
      "19000",
      "20000",
      "21000",
      "22000",
      "23000",
    ],
  },
  {
    regionCode: "kinki",
    regionName: "近畿地方",
    prefectures: [
      "24000",
      "25000",
      "26000",
      "27000",
      "28000",
      "29000",
      "30000",
    ],
  },
  {
    regionCode: "chugoku",
    regionName: "中国地方",
    prefectures: ["31000", "32000", "33000", "34000", "35000"],
  },
  {
    regionCode: "shikoku",
    regionName: "四国地方",
    prefectures: ["36000", "37000", "38000", "39000"],
  },
  {
    regionCode: "kyushu",
    regionName: "九州・沖縄地方",
    prefectures: [
      "40000",
      "41000",
      "42000",
      "43000",
      "44000",
      "45000",
      "46000",
      "47000",
    ],
  },
] as const;

/**
 * 都道府県コードから地域キーへの逆引きマップ（パフォーマンス用）
 * 2桁または5桁の都道府県コードに対応
 */
export const PREFECTURE_TO_REGION_MAP: Record<string, string> = REGIONS.reduce(
  (map, region) => {
    region.prefectures.forEach((prefCode) => {
      // 5桁コード（例: "01000"）
      map[prefCode] = region.regionCode;
      // 2桁コード（例: "01"）も対応
      map[prefCode.substring(0, 2)] = region.regionCode;
    });
    return map;
  },
  {} as Record<string, string>
);

/**
 * 地域コードから地域情報を取得
 */
export function getRegionByCode(code: string): Region | undefined {
  return REGIONS.find((region) => region.regionCode === code);
}
