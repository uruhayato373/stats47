/**
 * e-Statランキングマッピング型定義
 */

/**
 * ランキングデータポイント（値のみ）
 */
export interface RankingDataPointValueOnly {
  /** 地域コード */
  areaCode: string;
  /** 地域名 */
  areaName: string;
  /** 値 */
  value: number;
}

/**
 * ランキングエクスポートペイロード
 * R2に保存するランキングデータ形式
 */
export interface RankingExportPayload {
  /** ランキングデータポイント配列（値のみ） */
  values: RankingDataPointValueOnly[];
  /** 統計量 */
  statistics: {
    /** 最小値 */
    min: number;
    /** 最大値 */
    max: number;
    /** 平均値 */
    mean: number;
    /** 中央値 */
    median: number;
  };
  /** メタデータ */
  metadata: {
    /** ランキングキー（item_codeを使用） */
    rankingKey: string;
    /** 時間コード */
    timeCode: string;
    /** 単位 */
    unit: string;
    /** データソースID（常に"estat"） */
    dataSourceId: "estat";
  };
}

/**
 * e-Statランキングマッピング
 * estat_ranking_mappingsテーブルの行型
 */
export interface EstatRankingMapping {
  /** e-Stat統計表ID（主キーの一部） */
  stats_data_id: string;
  /** e-Stat分類コード（cdCat01パラメータに対応、主キーの一部） */
  cat01: string;
  /** 項目名（日本語） */
  item_name: string;
  /** 項目コード（ranking_items.ranking_keyとは別管理） */
  item_code: string;
  /** 単位 */
  unit: string | null;
  /** 地域タイプ（'prefecture' | 'city' | 'national'） */
  area_type: "prefecture" | "city" | "national";
  /** ランキング変換対象フラグ（trueの場合、ランキング変換を実行） */
  is_ranking: boolean;
  /** 作成日時 */
  created_at: string;
  /** 更新日時 */
  updated_at: string;
}

/**
 * e-Statランキングマッピング入力型
 * CSVインポートまたは作成時に使用
 */
export interface EstatRankingMappingInput {
  /** e-Stat統計表ID */
  stats_data_id: string;
  /** e-Stat分類コード */
  cat01: string;
  /** 項目名 */
  item_name: string;
  /** 項目コード */
  item_code: string;
  /** 単位 */
  unit?: string | null;
  /** 地域タイプ（'prefecture' | 'city' | 'national'） */
  area_type?: "prefecture" | "city" | "national";
  /** ランキング変換対象フラグ */
  is_ranking?: boolean;
}

/**
 * CSV行パース結果
 */
export interface CsvRow {
  stats_data_id: string;
  cat01: string;
  item_name: string;
  item_code: string;
  unit: string;
  dividing_value?: string;
  new_unit?: string;
  ascending?: string;
  area_type?: string;
}

/**
 * ランキングメタデータJSONの年度情報
 */
export interface RankingMetadataTime {
  /** 年度コード（4桁、例: "2020"） */
  timeCode: string;
  /** 年度名（例: "2020年度"） */
  timeName: string;
}

/**
 * ランキングメタデータJSON
 * ranking/{areaType}/{rankingKey}/metadata.json の形式
 */
export interface RankingMetadata {
  /** 項目コード（item_code） */
  itemCode: string;
  /** 項目名 */
  item_name: string;
  /** 単位 */
  unit: string | null;
  /** e-Stat統計表ID */
  stats_data_id: string;
  /** e-Stat分類コード */
  cat01: string;
  /** 地域タイプ */
  area_type: "prefecture" | "city" | "national";
  /** 保存日時（ISO 8601） */
  saved_at: string;
  /** データソース（常に"estat"） */
  data_source: "estat";
  /** 年度情報配列 */
  times: RankingMetadataTime[];
}

