/**
 * e-Stat API Mock Data
 */

// Meta Info - Prefecture
import metaInfoPrefecture0000010101 from "./meta-info/0000010101.json";
import metaInfoPrefecture0003448099 from "./meta-info/0003448099.json";
import metaInfoPrefecture0003448100 from "./meta-info/0003448100.json";
import metaInfoPrefecture0003457791 from "./meta-info/0003457791.json";
import metaInfoPrefecture0003457854 from "./meta-info/0003457854.json";

// Meta Info - City
import metaInfoCity0000020201 from "./meta-info/0000020201.json";

// Stats Data - Prefecture
import statsDataPrefecture0000010101A1101 from "./stats-data/0000010101.json";

// Stats Data - City
import statsDataCity0000020201A1101 from "./stats-data/0000020201.json";

export const metaInfo = {
  prefecture: {
    "0000010101": metaInfoPrefecture0000010101,
    "0003448099": metaInfoPrefecture0003448099,
    "0003448100": metaInfoPrefecture0003448100,
    "0003457791": metaInfoPrefecture0003457791,
    "0003457854": metaInfoPrefecture0003457854,
  },
  city: {
    "0000020201": metaInfoCity0000020201,
  },
} as const;

export const statsData = {
  prefecture: {
    "0000010101_A1101": statsDataPrefecture0000010101A1101,
  },
  city: {
    "0000020201_A1101": statsDataCity0000020201A1101,
  },
} as const;

// 既存テスト互換用の統合マップ
export const mockStatsDataMap = {
  ...statsData.prefecture,
  ...statsData.city,
} as Record<string, any>;

export const mockMetaInfoMap = {
  ...metaInfo.prefecture,
  ...metaInfo.city,
} as Record<string, any>;

/**
 * 統計データのモックを取得（互換用）
 */
export function getMockStatsData(statsDataId: string, categoryFilter?: string): any {
  const key = categoryFilter ? `${statsDataId}_${categoryFilter}` : statsDataId;
  return (statsData.prefecture as any)[key] || (statsData.city as any)[key] || null;
}

// 個別エクスポート
export {
    metaInfoCity0000020201, metaInfoPrefecture0000010101,
    metaInfoPrefecture0003448099,
    metaInfoPrefecture0003448100,
    metaInfoPrefecture0003457791,
    metaInfoPrefecture0003457854, statsDataCity0000020201A1101, statsDataPrefecture0000010101A1101
};

