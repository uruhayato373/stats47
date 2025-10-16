/**
 * 地域コード関連ユーティリティ
 */

import type { AreaType, TargetAreaLevel } from "@/types/ranking";

/**
 * 地域コードから地域タイプを判定
 */
export function getAreaType(areaCode: string): AreaType {
  if (!areaCode || typeof areaCode !== "string") {
    throw new Error("Invalid area code: must be a non-empty string");
  }
  
  // 国レベル
  if (areaCode === "00000") return "country";
  
  // 都道府県レベル（末尾が000）
  if (areaCode.endsWith("000")) return "prefecture";
  
  // 市区町村レベル
  return "municipality";
}

/**
 * 市区町村コードから親都道府県コードを取得
 */
export function getParentPrefectureCode(areaCode: string): string {
  if (!areaCode || areaCode.length < 5) {
    throw new Error("Invalid area code: must be at least 5 characters");
  }
  
  const prefCode = areaCode.substring(0, 2);
  return `${prefCode}000`;
}

/**
 * 地域コードの妥当性を検証
 */
export function validateAreaCode(areaCode: string): boolean {
  if (!areaCode || typeof areaCode !== "string") {
    return false;
  }
  
  // 5桁または6桁の数字
  if (!/^\d{5,6}$/.test(areaCode)) {
    return false;
  }
  
  // 都道府県コード（最初の2桁）が1-47の範囲
  const prefCode = parseInt(areaCode.substring(0, 2));
  if (prefCode < 1 || prefCode > 47) {
    return false;
  }
  
  return true;
}

/**
 * 都道府県コードから都道府県名を取得
 */
export function getPrefectureName(prefCode: string): string {
  const prefMap: Record<string, string> = {
    "01": "北海道", "02": "青森県", "03": "岩手県", "04": "宮城県", "05": "秋田県",
    "06": "山形県", "07": "福島県", "08": "茨城県", "09": "栃木県", "10": "群馬県",
    "11": "埼玉県", "12": "千葉県", "13": "東京都", "14": "神奈川県", "15": "新潟県",
    "16": "富山県", "17": "石川県", "18": "福井県", "19": "山梨県", "20": "長野県",
    "21": "岐阜県", "22": "静岡県", "23": "愛知県", "24": "三重県", "25": "滋賀県",
    "26": "京都府", "27": "大阪府", "28": "兵庫県", "29": "奈良県", "30": "和歌山県",
    "31": "鳥取県", "32": "島根県", "33": "岡山県", "34": "広島県", "35": "山口県",
    "36": "徳島県", "37": "香川県", "38": "愛媛県", "39": "高知県", "40": "福岡県",
    "41": "佐賀県", "42": "長崎県", "43": "熊本県", "44": "大分県", "45": "宮崎県",
    "46": "鹿児島県", "47": "沖縄県"
  };
  
  return prefMap[prefCode] || "不明";
}

/**
 * 地域レベルに応じたフィルタリング関数を生成
 */
export function createAreaFilter(level: TargetAreaLevel, parentCode?: string) {
  return (areaCode: string): boolean => {
    const areaType = getAreaType(areaCode);
    
    switch (level) {
      case "prefecture":
        return areaType === "prefecture";
        
      case "municipality":
        if (areaType !== "municipality") return false;
        
        // 特定都道府県内のみ
        if (parentCode) {
          const prefCode = getParentPrefectureCode(areaCode);
          return prefCode === parentCode;
        }
        
        return true;
        
      case "both":
        return areaType === "prefecture" || areaType === "municipality";
        
      default:
        return false;
    }
  };
}

/**
 * 地域コードの正規化（5桁に統一）
 */
export function normalizeAreaCode(areaCode: string): string {
  if (!validateAreaCode(areaCode)) {
    throw new Error(`Invalid area code: ${areaCode}`);
  }
  
  // 6桁の場合は5桁に変換（末尾のチェックディジットを除去）
  if (areaCode.length === 6) {
    return areaCode.substring(0, 5);
  }
  
  return areaCode;
}

/**
 * 地域コードのグループ化（都道府県別）
 */
export function groupByPrefecture(areaCodes: string[]): Record<string, string[]> {
  const groups: Record<string, string[]> = {};
  
  for (const areaCode of areaCodes) {
    const prefCode = getParentPrefectureCode(areaCode);
    
    if (!groups[prefCode]) {
      groups[prefCode] = [];
    }
    
    groups[prefCode].push(areaCode);
  }
  
  return groups;
}
