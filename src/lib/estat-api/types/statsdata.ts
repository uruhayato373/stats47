/**
 * CSV形式に変換されたメタデータ
 */
export interface EstatMetaCategoryData {
  stats_data_id: string;
  stat_name: string;
  title: string;
  cat01: string;
  item_name: string | null;
  unit: string | null;
}

/**
 * 整形された地域情報
 */
export interface FormattedArea {
  areaCode: string;
  areaName: string;
  level: string;
  parentCode?: string;
}

/**
 * 整形されたカテゴリ情報
 */
export interface FormattedCategory {
  categoryCode: string;
  categoryName: string;
  displayName: string;
  unit: string | null;
}

/**
 * 整形された年情報
 */
export interface FormattedYear {
  timeCode: string;
  timeName: string;
}

/**
 * 整形された値情報
 */
export interface FormattedValue {
  value: number;
  unit: string | null;
  areaCode: string;
  areaName: string;
  categoryCode: string;
  categoryName: string;
  timeCode: string;
  timeName: string;
  rank?: number;
}

/**
 * データ注記
 */
export interface DataNote {
  char: string; // 注記文字（***, -, X など）
  description: string; // 説明
}

/**
 * 拡張版テーブル情報
 */
export interface FormattedTableInfo {
  // 既存フィールド
  id: string; // 統計表ID
  title: string; // 統計表題名
  statName: string; // 政府統計名
  govOrg: string; // 作成機関名
  statisticsName: string; // 提供統計名
  totalNumber: number; // 総データ件数
  fromNumber: number; // 開始番号
  toNumber: number; // 終了番号

  // 追加: 統計コード
  statCode: string; // 政府統計コード
  govOrgCode: string; // 作成機関コード

  // 追加: 日付情報（ネスト）
  dates: {
    surveyDate: number | string; // 調査年月
    openDate: string; // 公開日
    updatedDate: string; // 更新日（重要）
  };

  // 追加: データ特性（ネスト）
  characteristics: {
    cycle: string; // 提供周期（年度次、月次など）
    smallArea: number; // 小地域属性（0,1,2）
    collectArea: string; // 集計地域区分
  };

  // 追加: 分類情報（ネスト）
  classification: {
    mainCategory: {
      code: string;
      name: string;
    };
    subCategory?: {
      code: string;
      name: string;
    };
  };

  // 追加: 提供統計名詳細
  statisticsNameSpec?: {
    tabulationCategory: string; // 集計カテゴリ
    tabulationSubCategory1?: string; // 集計サブカテゴリ1
    tabulationSubCategory2?: string; // 集計サブカテゴリ2
    tabulationSubCategory3?: string; // 集計サブカテゴリ3
  };

  // 追加: 説明
  description?: {
    tabulationCategoryExplanation?: string; // 集計カテゴリの説明
    general?: string; // 一般的な説明
  };
}

/**
 * 拡張版メタデータ
 */
export interface FormattedMetadata {
  // 処理情報
  processedAt: string; // 処理日時
  dataSource: "e-stat"; // データソース
  apiVersion?: string; // APIバージョン

  // データ統計
  stats: {
    totalRecords: number; // 総レコード数
    validValues: number; // 有効な値の数
    nullValues: number; // NULL値の数
    nullPercentage: number; // NULL値の割合
  };

  // データ範囲
  range?: {
    years: {
      min: string; // 最古の年度
      max: string; // 最新の年度
      count: number; // 年度数
    };
    areas: {
      count: number; // 地域数
      prefectureCount: number; // 都道府県数（level=2）
      hasNational: boolean; // 全国データの有無
    };
    categories: {
      count: number; // カテゴリ数
    };
  };

  // データ品質
  quality?: {
    completenessScore: number; // 完全性スコア（0-100）
    lastVerified?: string; // 最終検証日時
  };
}

/**
 * 整形されたe-STATデータ（拡張版）
 */
export interface FormattedEstatData {
  tableInfo: FormattedTableInfo;
  areas: FormattedArea[];
  categories: FormattedCategory[];
  years: FormattedYear[];
  values: FormattedValue[];
  metadata: FormattedMetadata;
  notes?: DataNote[];
}

/**
 * 統計データ一覧の項目
 */
export interface FormattedStatListItem {
  id: string;
  statName: string;
  title: string;
  govOrg: string;
  statisticsName: string;
  surveyDate: string;
  updatedDate: string;
  description?: string;
}
