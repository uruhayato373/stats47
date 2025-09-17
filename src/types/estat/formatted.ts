/**
 * CSV形式に変換されたメタデータ
 */
export interface EstatMetaCategoryData {
  stats_data_id: string;
  stat_name: string;
  title: string;
  cat01: string;
  item_name: string;
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
  value: string;
  numericValue: number | null;
  displayValue: string;
  unit: string | null;
  areaCode: string;
  areaName: string;
  categoryCode: string;
  categoryName: string;
  timeCode: string;
  timeName: string;
}

/**
 * 整形されたe-STATデータ
 */
export interface FormattedEstatData {
  tableInfo: {
    id: string;
    title: string;
    statName: string;
    govOrg: string;
    statisticsName: string;
    totalNumber: number;
    fromNumber: number;
    toNumber: number;
  };
  areas: FormattedArea[];
  categories: FormattedCategory[];
  years: FormattedYear[];
  values: FormattedValue[];
  metadata: {
    processedAt: string;
    totalRecords: number;
    validValues: number;
    nullValues: number;
  };
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
