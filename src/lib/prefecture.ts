import prefecturesData from "@/config/prefectures.json";

export interface Prefecture {
  prefCode: string;
  prefName: string;
}

export interface Region {
  name: string;
  prefectures: string[];
}

// JSONデータからインポート
export const prefList: Prefecture[] = prefecturesData.prefectures;

// 都道府県コードと名前のマッピング
export const PREFECTURE_MAP: Record<string, string> = Object.fromEntries(
  prefList.map((pref) => [pref.prefCode.substring(0, 2), pref.prefName])
);

// 都道府県名と都道府県コードのマッピング（逆引き用）
export const PREFECTURE_NAME_TO_CODE: Record<string, string> =
  Object.fromEntries(
    prefList.map((pref) => [pref.prefName, pref.prefCode.substring(0, 2)])
  );

// 地域定義（JSONデータから読み込み）
export const REGIONS: Record<string, Region> = prefecturesData.regions;

// 5桁の都道府県コードから都道府県名を取得する関数
export function getPrefectureNameFromCode(code: string): string {
  if (!code || code.length < 2) {
    return "不明な地域";
  }

  // 全国の場合
  if (code === "00000") {
    return "日本";
  }

  // 最初の2桁を取得して都道府県コードとして使用
  const prefCode = code.substring(0, 2);
  return PREFECTURE_MAP[prefCode] || "不明な地域";
}
