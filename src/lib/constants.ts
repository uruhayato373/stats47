// e-STAT API設定
export const ESTAT_API = {
  BASE_URL: 'https://api.e-stat.go.jp/rest/3.0',
  VERSION: '3.0',
  DATA_FORMAT: 'json',
  DEFAULT_LANG: 'J',
} as const;

// 環境変数からAPIキーを取得（実際の実装では.envファイルから取得）
export const ESTAT_APP_ID = process.env.NEXT_PUBLIC_ESTAT_APP_ID || 'YOUR_API_KEY_HERE';

// API endpoints
export const ESTAT_ENDPOINTS = {
  GET_STATS_DATA: '/app/json/getStatsData',
  GET_META_INFO: '/app/json/getMetaInfo', 
  GET_STATS_LIST: '/app/json/getStatsList',
  GET_DATA_CATALOG: '/app/json/getDataCatalog',
} as const;

// サンプル統計表ID（人口統計など）
export const SAMPLE_STATS_DATA_IDS = {
  POPULATION: '0003448237', // 人口推計
  HOUSEHOLD: '0003348237', // 世帯数
  ECONOMY: '0003160000',   // 県民経済計算
} as const;